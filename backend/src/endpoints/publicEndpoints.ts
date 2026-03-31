import type { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'

import { createRequestWithPricing } from '../services/requestService'
import { sendRequestNotification } from '../services/emailService'
import { calculatePricingForProduct, findProductForRequest } from '../services/pricingService'
import { verifyTurnstileToken } from '../services/turnstileService'
import { createInMemoryRateLimiter } from '../utils/rateLimit'
import { PricingValidationError } from '../utils/pricing'

const parseBody = async <T = Record<string, unknown>>(req: PayloadRequest): Promise<T> => {
  if (typeof req.json === 'function') {
    return (await req.json()) as T
  }

  const fallbackBody = (req as { body?: unknown; data?: unknown }).body || (req as { data?: unknown }).data
  return (fallbackBody || {}) as T
}

const toFiniteNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const contactRateLimiter = createInMemoryRateLimiter({
  windowMs: Math.max(toFiniteNumber(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000), 60_000),
  maxRequests: Math.max(toFiniteNumber(process.env.CONTACT_RATE_LIMIT_MAX, 8), 1),
})

const contactInquirySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().max(80).optional().or(z.literal('')),
    subject: z.string().trim().min(2).max(160),
    message: z.string().trim().min(10).max(4000),
    consentPrivacy: z.boolean(),
    turnstileToken: z.string().trim().max(4000).optional(),
    locale: z.enum(['de', 'en']).optional(),
    website: z.string().trim().max(200).optional().or(z.literal('')),
  })
  .refine((value) => value.consentPrivacy, {
    message: 'Datenschutz-Einwilligung ist erforderlich.',
    path: ['consentPrivacy'],
  })

const getHeaderValue = (req: PayloadRequest, key: string): string => {
  const headers = (req as { headers?: unknown }).headers

  if (!headers) return ''

  if (typeof (headers as Headers).get === 'function') {
    return String((headers as Headers).get(key) || '')
  }

  if (typeof headers === 'object') {
    const source = headers as Record<string, string | string[] | undefined>
    const direct = source[key] || source[key.toLowerCase()]
    if (Array.isArray(direct)) return String(direct[0] || '')
    return String(direct || '')
  }

  return ''
}

const getClientIp = (req: PayloadRequest): string => {
  const forwarded = getHeaderValue(req, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = getHeaderValue(req, 'x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

const formatProduct = (doc: any) => ({
  id: doc.id,
  title: doc.title,
  slug: doc.slug,
  articleNumber: doc.articleNumber,
  shortDescription: doc.shortDescription,
  longDescription: doc.longDescription,
  availabilityStatus: doc.availabilityStatus,
  isActive: doc.isActive,
  category:
    doc.category && typeof doc.category === 'object'
      ? {
          id: doc.category.id,
          name: doc.category.name,
          slug: doc.category.slug,
        }
      : doc.category,
  pricing: doc.pricing,
  images: Array.isArray(doc.images)
    ? doc.images
        .map((image: any) =>
          image && typeof image === 'object'
            ? {
                id: image.id,
                url: image.url,
                alt: image.alt,
              }
            : null,
        )
        .filter(Boolean)
    : [],
  specifications: doc.specifications || [],
  seo: doc.seo || null,
})

const errorResponse = (error: unknown, fallbackMessage: string) => {
  const status = error instanceof PricingValidationError ? 400 : 500
  const message = error instanceof Error ? error.message : fallbackMessage
  return Response.json({ success: false, message }, { status })
}

export const listProductsHandler: Endpoint['handler'] = async (req) => {
  try {
    const categorySlug = typeof req.query?.category === 'string' ? req.query.category.trim() : ''
    const searchTerm = typeof req.query?.search === 'string' ? req.query.search.trim() : ''

    let categoryID: number | string | undefined

    if (categorySlug) {
      const categoryResult = await req.payload.find({
        collection: 'categories',
        depth: 0,
        limit: 1,
        req,
        where: {
          slug: {
            equals: categorySlug,
          },
          isActive: {
            equals: true,
          },
        },
      })

      categoryID = categoryResult.docs?.[0]?.id
      if (!categoryID) {
        return Response.json({ success: true, data: [], total: 0 })
      }
    }

    const where: any = {
      isActive: {
        equals: true,
      },
    }

    if (categoryID) {
      where.category = {
        equals: categoryID,
      }
    }

    if (searchTerm) {
      where.or = [
        { title: { like: searchTerm } },
        { shortDescription: { like: searchTerm } },
        { articleNumber: { like: searchTerm } },
      ]
    }

    const products = await req.payload.find({
      collection: 'products',
      depth: 1,
      limit: 100,
      req,
      where,
      sort: ['title'],
    })

    return Response.json({
      success: true,
      data: products.docs.map(formatProduct),
      total: products.totalDocs,
    })
  } catch (error) {
    return errorResponse(error, 'Produkte konnten nicht geladen werden.')
  }
}

export const getProductBySlugHandler: Endpoint['handler'] = async (req) => {
  try {
    const slug = String(req.routeParams?.slug || '').trim()

    if (!slug) {
      return Response.json({ success: false, message: 'Produkt-Slug fehlt.' }, { status: 400 })
    }

    const product = await findProductForRequest(req.payload, req, { productSlug: slug })
    return Response.json({ success: true, data: formatProduct(product) })
  } catch (error) {
    if (error instanceof PricingValidationError) {
      return Response.json({ success: false, message: error.message }, { status: 404 })
    }

    return errorResponse(error, 'Produkt konnte nicht geladen werden.')
  }
}

export const listCategoriesHandler: Endpoint['handler'] = async (req) => {
  try {
    const categories = await req.payload.find({
      collection: 'categories',
      depth: 0,
      limit: 200,
      req,
      where: {
        isActive: {
          equals: true,
        },
      },
      sort: ['sortOrder', 'name'],
    })

    const categoryData = await Promise.all(
      categories.docs.map(async (category: any) => {
        let toolCount = 0

        if (typeof (req.payload as { count?: unknown }).count === 'function') {
          const countResult = await (req.payload as any).count({
            collection: 'products',
            req,
            where: {
              isActive: {
                equals: true,
              },
              category: {
                equals: category.id,
              },
            },
          })

          toolCount = Number(countResult?.totalDocs || 0)
        } else {
          const docsResult = await req.payload.find({
            collection: 'products',
            depth: 0,
            limit: 0,
            req,
            where: {
              isActive: {
                equals: true,
              },
              category: {
                equals: category.id,
              },
            },
          })

          toolCount = Number(docsResult?.totalDocs || 0)
        }

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          toolCount,
        }
      }),
    )

    return Response.json({
      success: true,
      data: categoryData,
    })
  } catch (error) {
    return errorResponse(error, 'Kategorien konnten nicht geladen werden.')
  }
}

export const calculatePricingHandler: Endpoint['handler'] = async (req) => {
  try {
    const body = await parseBody<{
      productId?: string
      productSlug?: string
      startDate?: string
      endDate?: string
      rentalDays?: number
    }>(req)

    const product = await findProductForRequest(req.payload, req, {
      productId: body.productId,
      productSlug: body.productSlug,
    })

    const pricing = await calculatePricingForProduct({
      payload: req.payload,
      req,
      product,
      rentalInput: {
        startDate: body.startDate,
        endDate: body.endDate,
        rentalDays: body.rentalDays,
      },
    })

    return Response.json({
      success: true,
      data: {
        product: formatProduct(product),
        pricing,
      },
    })
  } catch (error) {
    return errorResponse(error, 'Preis konnte nicht berechnet werden.')
  }
}

export const submitRequestHandler: Endpoint['handler'] = async (req) => {
  try {
    const body = await parseBody(req)
    const result = await createRequestWithPricing({
      payload: req.payload,
      req,
      body,
    })

    return Response.json(
      {
        success: true,
        data: {
          requestId: result.request.id,
          requestNumber: result.request.requestNumber,
          status: result.request.status,
          pricing: result.pricing,
          emailResult: result.emailResult,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return errorResponse(error, 'Anfrage konnte nicht angelegt werden.')
  }
}

export const siteConfigHandler: Endpoint['handler'] = async (req) => {
  try {
    const [siteSettings, contactSettings, rentalSettings, legalSettings] = await Promise.all([
      req.payload.findGlobal({
        slug: 'site-settings',
        depth: 0,
        req,
        overrideAccess: true,
      }),
      req.payload.findGlobal({
        slug: 'contact-settings',
        depth: 0,
        req,
        overrideAccess: true,
      }),
      req.payload.findGlobal({
        slug: 'rental-settings',
        depth: 0,
        req,
        overrideAccess: true,
      }),
      req.payload.findGlobal({
        slug: 'legal-settings',
        depth: 0,
        req,
        overrideAccess: true,
      }),
    ])

    return Response.json({
      success: true,
      data: {
        site: {
          siteName: siteSettings?.siteName || 'Alles Saniert',
          websiteUrl: siteSettings?.websiteUrl || 'https://www.allessaniert.at',
          defaultLocale: siteSettings?.defaultLocale || 'de',
          seo: {
            metaTitleDe: siteSettings?.seo?.metaTitleDe || '',
            metaDescriptionDe: siteSettings?.seo?.metaDescriptionDe || '',
            metaTitleEn: siteSettings?.seo?.metaTitleEn || '',
            metaDescriptionEn: siteSettings?.seo?.metaDescriptionEn || '',
            robotsPolicy: siteSettings?.seo?.robotsPolicy || 'index_follow',
          },
          tracking: {
            gtmId: siteSettings?.tracking?.gtmId || '',
            ga4MeasurementId: siteSettings?.tracking?.ga4MeasurementId || '',
          },
        },
        contact: {
          legalCompanyName: contactSettings?.legalCompanyName || '',
          brandName: contactSettings?.brandName || '',
          street: contactSettings?.street || '',
          postalCode: contactSettings?.postalCode || '',
          city: contactSettings?.city || '',
          country: contactSettings?.country || '',
          phone: contactSettings?.phone || '',
          email: contactSettings?.email || '',
        },
        rental: {
          priceDisclaimer: rentalSettings?.priceDisclaimer || '',
        },
        legal: {
          impressumDe: legalSettings?.impressumDe || '',
          impressumEn: legalSettings?.impressumEn || '',
          privacyDe: legalSettings?.privacyDe || '',
          privacyEn: legalSettings?.privacyEn || '',
        },
      },
    })
  } catch (error) {
    return errorResponse(error, 'Website-Einstellungen konnten nicht geladen werden.')
  }
}

export const submitContactInquiryHandler: Endpoint['handler'] = async (req) => {
  try {
    const body = await parseBody(req)
    const parsed = contactInquirySchema.safeParse(body)

    if (!parsed.success) {
      throw new PricingValidationError(parsed.error.issues.map((issue) => issue.message).join(' | '))
    }

    const input = parsed.data

    if (input.website) {
      return Response.json(
        {
          success: true,
          message: 'Vielen Dank fuer Ihre Anfrage.',
          mode: 'honeypot',
        },
        { status: 202 },
      )
    }

    const clientIp = getClientIp(req)
    const rateLimit = contactRateLimiter.consume(clientIp)

    if (!rateLimit.allowed) {
      return Response.json(
        {
          success: false,
          message: 'Zu viele Anfragen in kurzer Zeit. Bitte spaeter erneut versuchen.',
        },
        { status: 429 },
      )
    }

    const turnstileResult = await verifyTurnstileToken({
      token: input.turnstileToken,
      remoteIp: clientIp === 'unknown' ? undefined : clientIp,
    })

    if (!turnstileResult.success) {
      return Response.json(
        {
          success: false,
          message: turnstileResult.message || 'Sicherheitspruefung fehlgeschlagen.',
        },
        { status: 400 },
      )
    }

    const [contactSettings, rentalSettings] = await Promise.all([
      req.payload.findGlobal({
        slug: 'contact-settings',
        depth: 0,
        req,
        overrideAccess: true,
      }),
      req.payload.findGlobal({
        slug: 'rental-settings',
        depth: 0,
        req,
        overrideAccess: true,
      }),
    ])

    const recipient =
      contactSettings?.inquiryRecipientEmail ||
      rentalSettings?.requestNotificationEmail ||
      process.env.REQUEST_NOTIFICATION_EMAIL ||
      'office@allessaniert.at'

    const locale = input.locale || 'de'
    const subjectPrefix = locale === 'en' ? 'Website Contact Inquiry' : 'Kontaktanfrage Website'

    const mailText = [
      `${subjectPrefix}`,
      '',
      `Name: ${input.name}`,
      `E-Mail: ${input.email}`,
      `Telefon: ${input.phone || 'nicht angegeben'}`,
      `Betreff: ${input.subject}`,
      '',
      'Nachricht:',
      input.message,
      '',
      `IP (zur Missbrauchspraevention): ${clientIp}`,
    ].join('\n')

    const mailResult = await sendRequestNotification({
      to: recipient,
      subject: `${subjectPrefix} - ${input.subject}`,
      text: mailText,
    })

    return Response.json(
      {
        success: true,
        message: locale === 'en' ? 'Your request has been sent.' : 'Ihre Anfrage wurde gesendet.',
        data: {
          emailResult: mailResult,
          security: {
            turnstile: turnstileResult.mode,
            rateLimitRemaining: rateLimit.remaining,
            rateLimitResetAt: rateLimit.resetAt,
          },
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return errorResponse(error, 'Kontaktanfrage konnte nicht verarbeitet werden.')
  }
}

export const publicEndpoints: Endpoint[] = [
  {
    path: '/catalog/products',
    method: 'get',
    handler: listProductsHandler,
  },
  {
    path: '/catalog/products/slug/:slug',
    method: 'get',
    handler: getProductBySlugHandler,
  },
  {
    path: '/catalog/categories',
    method: 'get',
    handler: listCategoriesHandler,
  },
  {
    path: '/catalog/pricing/calculate',
    method: 'post',
    handler: calculatePricingHandler,
  },
  {
    path: '/catalog/requests',
    method: 'post',
    handler: submitRequestHandler,
  },
  {
    path: '/public/site-config',
    method: 'get',
    handler: siteConfigHandler,
  },
  {
    path: '/public/contact',
    method: 'post',
    handler: submitContactInquiryHandler,
  },
]
