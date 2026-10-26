import { describe, expect, it, vi } from 'vitest'
import {
  calculatePricingHandler,
  getProductBySlugHandler,
  listCategoriesHandler,
  listProductsHandler,
  siteConfigHandler,
  submitContactInquiryHandler,
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
    findGlobal: vi.fn(async (args: any) => {
      if (args?.slug === 'site-settings') {
        return {
          siteName: 'Alles Saniert',
          websiteUrl: 'https://www.allessaniert.at',
          defaultLocale: 'de',
          seo: {},
          tracking: {},
          catalog: {
            headlineDe: 'Werkzeuge & Maschinen',
            introDe: 'Alle Inhalte werden aus Payload geladen.',
          },
        }
      }

      if (args?.slug === 'contact-settings') {
        return {
          legalCompanyName: 'Schroeder - Alles Saniert',
          brandName: 'Alles Saniert',
          street: 'Fotzebenweg 3',
          postalCode: '2763',
          city: 'Pernitz',
          country: 'Oesterreich',
          phone: '+43 650 3021328',
          email: 'office@allessaniert.at',
          inquiryRecipientEmail: 'office@allessaniert.at',
        }
      }

      if (args?.slug === 'rental-settings') {
        return {
          defaultInsuranceRate: 0.1,
          requestNotificationEmail: 'office@allessaniert.at',
          priceDisclaimer: 'Test',
        }
      }

      return { defaultInsuranceRate: 0.1 }
    }),
    create: vi.fn(async (args: any) => ({ id: 'req-1', requestNumber: 'ANF-1', ...args.data })),
    update: vi.fn(async (args: any) => ({ id: 'req-1', ...args.data })),
  }
}

describe('catalog refactoring contracts', () => {
  it('whitelists sort fields and floors pagination', async () => {
    for (const [sort,expected] of [['price-asc','pricing.dailyPrice'],['price-desc','-pricing.dailyPrice'],['users.password','title']]) {
      const payload = makePayload()
      await listProductsHandler({payload,query:{sort,page:'2.8',limit:'12.7'}} as any)
      expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({collection:'products',page:2,limit:12,sort:[expected]}))
    }
  })
  it('combines category and accent-insensitive description search before pagination', async () => {
    const payload = makePayload()
    const docs = [3,1,2].map(price => ({...productDoc,id:String(price),title:`Gerät ${price}`,shortDescription:'ÖL für SÄGEN',pricing:{dailyPrice:price}}))
    payload.find.mockImplementation(async (args:any) => args.collection === 'categories'
      ? {docs:[{id:'cat-1'}],totalDocs:1} as any : {docs,totalDocs:3} as any)
    const response = await listProductsHandler({payload,query:{category:'bohren-stemmen',search:'oel sagen',sort:'price-asc',page:'2',limit:'1'}} as any)
    const body = await response.json()
    expect(body.total).toBe(3)
    expect(body.data.map((doc:any) => doc.id)).toEqual(['2'])
    expect(body.hasNextPage).toBe(true)
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({collection:'products',where:{isActive:{equals:true},category:{equals:'cat-1'}}}))
  })
  it('keeps media originals separate from small card and thumbnail variants', async () => {
    const payload = makePayload()
    payload.find.mockResolvedValue({docs:[{...productDoc,images:[{id:1,url:'/original.png',filesize:100000,sizes:{card:{url:'/card.webp',filesize:10000},thumb:{url:'/thumb.webp'}},alt:'Drill'}]}],totalDocs:1} as any)
    const result = await listProductsHandler({payload,query:{}} as any)
    expect((await result.json()).data[0].images[0]).toMatchObject({url:'/card.webp',originalUrl:'/original.png',thumbnailUrl:'/thumb.webp',alt:'Drill'})
  })
})

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
        consentPrivacy: true,
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
        consentPrivacy: true,
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
        consentPrivacy: true,
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

  it('liefert oeffentliche Site-Konfiguration', async () => {
    const payload = makePayload()
    const res = await siteConfigHandler({ payload } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.site.siteName).toBe('Alles Saniert')
    expect(body.data.site.catalog.headlineDe).toBe('Werkzeuge & Maschinen')
  })

  it('validiert Kontaktanfrage ohne Einwilligung', async () => {
    const payload = makePayload()
    const res = await submitContactInquiryHandler({
      payload,
      json: async () => ({
        name: 'Max',
        email: 'max@example.com',
        subject: 'Test',
        message: 'Das ist eine gueltige Nachricht.',
        consentPrivacy: false,
      }),
      headers: new Headers(),
    } as any)

    expect(res.status).toBe(400)
  })

  it('nimmt Honeypot-Kontaktanfrage still an', async () => {
    const payload = makePayload()
    const res = await submitContactInquiryHandler({
      payload,
      json: async () => ({
        name: 'Max',
        email: 'max@example.com',
        subject: 'Test',
        message: 'Das ist eine gueltige Nachricht.',
        consentPrivacy: true,
        website: 'spam-field-filled',
      }),
      headers: new Headers(),
    } as any)

    expect(res.status).toBe(202)
  })
})
