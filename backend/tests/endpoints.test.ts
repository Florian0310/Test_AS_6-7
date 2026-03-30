import { describe, expect, it, vi } from 'vitest'
import {
  calculatePricingHandler,
  getProductBySlugHandler,
  listCategoriesHandler,
  listProductsHandler,
  submitRequestHandler,
} from '../src/endpoints/publicEndpoints'

const productDoc = {
  id: 'prod-1',
  title: 'Hilti SF 6-A22',
  slug: 'hilti-sf-6-a22',
  articleNumber: 'AS-1001',
  shortDescription: 'Test',
  longDescription: null,
  availabilityStatus: 'available',
  isActive: true,
  category: {
    id: 'cat-1',
    name: 'Bohren & Stemmen',
    slug: 'bohren-stemmen',
  },
  pricing: {
    dailyPrice: 50,
    threeDayPrice: 120,
    weeklyPrice: 250,
    minimumRentalDays: 1,
    deposit: 100,
    cleaningFee: 0,
    insuranceRequired: true,
  },
  images: [],
}

const makePayload = () => {
  const find = vi.fn(async (args: any) => {
    if (args.collection === 'products') {
      if (args.where?.slug?.equals === 'missing') {
        return { docs: [], totalDocs: 0 }
      }
      if (args.limit === 100) {
        return { docs: [productDoc], totalDocs: 1 }
      }
      return { docs: [productDoc], totalDocs: 1 }
    }

    if (args.collection === 'categories') {
      return {
        docs: [
          {
            id: 'cat-1',
            name: 'Bohren & Stemmen',
            slug: 'bohren-stemmen',
            description: 'Beschreibung',
            sortOrder: 10,
          },
        ],
      }
    }

    if (args.collection === 'users') {
      return { docs: [] }
    }

    return { docs: [] }
  })

  return {
    find,
    findByID: vi.fn(async () => productDoc),
    findGlobal: vi.fn(async () => ({ defaultInsuranceRate: 0.1 })),
    create: vi.fn(async (args: any) => ({ id: 'req-1', requestNumber: 'ANF-1', ...args.data })),
    update: vi.fn(async (args: any) => ({ id: 'req-1', ...args.data })),
  }
}

describe('API Endpoints', () => {
  it('liefert Produktliste', async () => {
    const payload = makePayload()
    const res = await listProductsHandler({ payload } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
  })

  it('liefert Produkt per Slug', async () => {
    const payload = makePayload()
    const res = await getProductBySlugHandler({ payload, routeParams: { slug: 'hilti-sf-6-a22' } } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.slug).toBe('hilti-sf-6-a22')
  })

  it('liefert Kategorien', async () => {
    const payload = makePayload()
    const res = await listCategoriesHandler({ payload } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data[0].slug).toBe('bohren-stemmen')
  })

  it('liefert Preisstruktur fuer Pricing-Endpoint', async () => {
    const payload = makePayload()

    const res = await calculatePricingHandler({
      payload,
      json: async () => ({
        productId: 'prod-1',
        rentalDays: 10,
      }),
    } as any)

    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.pricing.blocks).toEqual({ weeks: 1, threeDayBlocks: 1, dayBlocks: 0 })
  })

  it('validiert Anfrage im Anfrage-Endpoint', async () => {
    const payload = makePayload()

    const res = await submitRequestHandler({
      payload,
      json: async () => ({
        productId: 'prod-1',
        email: 'max@example.com',
      }),
    } as any)

    expect(res.status).toBe(400)
  })

  it('speichert gueltige Anfrage ueber Anfrage-Endpoint', async () => {
    const payload = makePayload()

    const res = await submitRequestHandler({
      payload,
      json: async () => ({
        productId: 'prod-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        rentalDays: 4,
      }),
    } as any)

    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(payload.create).toHaveBeenCalledOnce()
  })
})