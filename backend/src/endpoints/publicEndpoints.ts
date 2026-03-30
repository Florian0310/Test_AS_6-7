import type { Endpoint, PayloadRequest } from 'payload'
import { createRequestWithPricing } from '../services/requestService'
import { calculatePricingForProduct, findProductForRequest } from '../services/pricingService'
import { PricingValidationError } from '../utils/pricing'

const parseBody = async <T = Record<string, unknown>>(req: PayloadRequest): Promise<T> => {
  if (typeof req.json === 'function') {
    return (await req.json()) as T
  }

  const fallbackBody = (req as { body?: unknown; data?: unknown }).body || (req as { data?: unknown }).data
  return (fallbackBody || {}) as T
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
]
