import type { Payload, PayloadRequest } from 'payload'
import type { ProductPricing, PricingBreakdown, RentalBasisInput } from '../types/rental'
import { calculateRentalPricing, PricingValidationError } from '../utils/pricing'

export type ProductDocument = {
  id: number | string
  title?: string
  slug?: string
  articleNumber?: string
  isActive?: boolean
  pricing?: {
    dailyPrice?: number
    threeDayPrice?: number
    weeklyPrice?: number
    minimumRentalDays?: number
    deposit?: number
    cleaningFee?: number
    insuranceRateOverride?: number | null
    insuranceRequired?: boolean
  }
}

export const getGlobalInsuranceRate = async (payload: Payload, req: PayloadRequest): Promise<number> => {
  const settings = await payload.findGlobal({
    slug: 'rental-settings',
    depth: 0,
    req,
    overrideAccess: true,
  })

  const configuredRate = Number(settings?.defaultInsuranceRate)
  return Number.isFinite(configuredRate) && configuredRate >= 0 ? configuredRate : 0.1
}

export const extractProductPricing = (product: ProductDocument): ProductPricing => {
  const pricing = product.pricing || {}

  if (!product.title || !product.slug || !product.articleNumber) {
    throw new PricingValidationError('Produktdaten sind unvollstaendig (Titel/Slug/Artikelnummer).')
  }

  return {
    title: product.title,
    slug: product.slug,
    articleNumber: product.articleNumber,
    dailyPrice: Number(pricing.dailyPrice),
    threeDayPrice: Number(pricing.threeDayPrice),
    weeklyPrice: Number(pricing.weeklyPrice),
    minimumRentalDays: pricing.minimumRentalDays != null ? Number(pricing.minimumRentalDays) : undefined,
    deposit: pricing.deposit != null ? Number(pricing.deposit) : undefined,
    cleaningFee: pricing.cleaningFee != null ? Number(pricing.cleaningFee) : undefined,
    insuranceRateOverride:
      pricing.insuranceRateOverride != null ? Number(pricing.insuranceRateOverride) : undefined,
    insuranceRequired: pricing.insuranceRequired,
  }
}

export const findProductForRequest = async (
  payload: Payload,
  req: PayloadRequest,
  args: {
    productId?: string
    productSlug?: string
  },
): Promise<ProductDocument> => {
  const { productId, productSlug } = args

  if (!productId && !productSlug) {
    throw new PricingValidationError('Bitte Produkt-ID oder Produkt-Slug angeben.')
  }

  if (productId) {
    const product = (await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 1,
      req,
      overrideAccess: true,
    })) as ProductDocument

    if (!product || product.isActive === false) {
      throw new PricingValidationError('Produkt nicht gefunden oder inaktiv.')
    }

    return product
  }

  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 1,
    req,
    overrideAccess: true,
    where: {
      slug: {
        equals: productSlug,
      },
      isActive: {
        equals: true,
      },
    },
  })

  const product = (result.docs?.[0] || null) as ProductDocument | null

  if (!product) {
    throw new PricingValidationError('Produkt mit diesem Slug wurde nicht gefunden oder ist inaktiv.')
  }

  return product
}

export const calculatePricingForProduct = async (args: {
  payload: Payload
  req: PayloadRequest
  product: ProductDocument
  rentalInput: RentalBasisInput
}): Promise<PricingBreakdown> => {
  const { payload, req, product, rentalInput } = args
  const globalInsuranceRate = await getGlobalInsuranceRate(payload, req)
  const productPricing = extractProductPricing(product)

  return calculateRentalPricing({
    productPricing,
    globalInsuranceRate,
    ...rentalInput,
  })
}