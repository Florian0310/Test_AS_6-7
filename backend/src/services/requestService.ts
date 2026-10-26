import { z } from 'zod'
import type { Payload, PayloadRequest } from 'payload'
import type { MailResult } from './emailService'
import { buildRequestMail, sendRequestNotification } from './emailService'
import { calculatePricingForProduct, extractProductPricing, findProductForRequest } from './pricingService'
import { PricingValidationError } from '../utils/pricing'

const requestSchema = z
  .object({
    productId: z.string().min(1).max(120).optional(),
    productSlug: z.string().min(1).max(120).optional(),
    name: z.string().trim().min(2).max(140),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().max(80).optional(),
    consentPrivacy: z.literal(true),
    locale: z.enum(['de', 'en']).default('de'),
    quantity: z.literal(1).default(1),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    rentalDays: z.number().int().positive().optional(),
    message: z.string().max(2000).optional(),
  })
  .refine((value) => value.productId || value.productSlug, {
    message: 'Produkt-ID oder Produkt-Slug ist erforderlich.',
    path: ['productId'],
  })

const toDateField = (value?: string): string | undefined => {
  if (!value) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  return `${value}T00:00:00.000Z`
}

export type CreateRequestResult = {
  request: any
  pricing: any
  emailResult: MailResult | { mode: 'error'; message: string }
}

export const createRequestWithPricing = async (args: {
  payload: Payload
  req: PayloadRequest
  body: unknown
  notifyByEmail?: typeof sendRequestNotification
}): Promise<CreateRequestResult> => {
  const { payload, req, body } = args
  const notifyByEmail = args.notifyByEmail || sendRequestNotification

  const parsedInput = requestSchema.safeParse(body)

  if (!parsedInput.success) {
    throw new PricingValidationError(parsedInput.error.issues.map((issue) => issue.message).join(' | '))
  }

  const input = parsedInput.data

  const product = await findProductForRequest(payload, req, {
    productId: input.productId,
    productSlug: input.productSlug,
  })
  if ((product as { availabilityStatus?: string }).availabilityStatus === 'unavailable') {
    throw new PricingValidationError('Produkt ist aktuell nicht verfügbar.')
  }

  const pricing = await calculatePricingForProduct({
    payload,
    req,
    product,
    rentalInput: {
      startDate: input.startDate,
      endDate: input.endDate,
      rentalDays: input.rentalDays,
    },
  })

  const productPricing = extractProductPricing(product)

  const requestDoc = await (payload as any).create({
    collection: 'requests',
    req,
    overrideAccess: true,
    depth: 0,
    data: {
      status: 'new',
      product: product.id as any,
      productSnapshot: {
        title: productPricing.title,
        slug: productPricing.slug,
        articleNumber: productPricing.articleNumber,
        prices: {
          dailyPrice: productPricing.dailyPrice,
          threeDayPrice: productPricing.threeDayPrice,
          weeklyPrice: productPricing.weeklyPrice,
        },
      },
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
      rentalStart: toDateField(input.startDate),
      rentalEnd: toDateField(input.endDate),
      rentalDays: pricing.rentalDays,
      pricingSummary: pricing,
      message: input.message,
    },
  })

  const mail = buildRequestMail({
    locale: input.locale,
    customerName: input.name,
    customerEmail: input.email,
    customerPhone: input.phone,
    message: input.message,
    productTitle: productPricing.title,
    productArticleNumber: productPricing.articleNumber,
    rentalDays: pricing.rentalDays,
    rentalStart: input.startDate,
    rentalEnd: input.endDate,
    totalWithDeposit: pricing.subtotals.totalWithDeposit,
  })

  let emailResult: MailResult | { mode: 'error'; message: string }

  try {
    emailResult = await notifyByEmail(mail)
  } catch (error) {
    emailResult = {
      mode: 'error',
      message: error instanceof Error ? error.message : 'Unbekannter E-Mail-Fehler',
    }
  }

  try { await (payload as any).update({
    collection: 'requests',
    id: requestDoc.id,
    req,
    overrideAccess: true,
    depth: 0,
    data: {
      emailResult,
    },
  }) } catch {
    // The inquiry is already durable. Do not invite duplicate submissions on a mail-status error.
    payload.logger?.error('Could not persist inquiry notification status')
  }

  return {
    request: {
      ...requestDoc,
      emailResult,
    },
    pricing,
    emailResult,
  }
}
