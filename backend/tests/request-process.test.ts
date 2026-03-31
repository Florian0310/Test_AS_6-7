import { describe, expect, it, vi } from 'vitest'
import { createRequestWithPricing } from '../src/services/requestService'

const makePayload = () => {
  const createdDocs: any[] = []

  return {
    createdDocs,
    api: {
      findByID: vi.fn(async () => ({
        id: 'prod-1',
        title: 'Hilti SF 6-A22',
        slug: 'hilti-sf-6-a22',
        articleNumber: 'AS-1001',
        isActive: true,
        pricing: {
          dailyPrice: 50,
          threeDayPrice: 120,
          weeklyPrice: 250,
          minimumRentalDays: 1,
          deposit: 100,
          cleaningFee: 0,
          insuranceRequired: true,
        },
      })),
      findGlobal: vi.fn(async () => ({
        defaultInsuranceRate: 0.1,
      })),
      create: vi.fn(async (args: any) => {
        const doc = {
          id: 'req-1',
          requestNumber: 'ANF-20260330010101',
          ...args.data,
        }
        createdDocs.push(doc)
        return doc
      }),
      update: vi.fn(async ({ data }: any) => ({
        id: 'req-1',
        ...data,
      })),
    },
  }
}

describe('Anfrageprozess', () => {
  it('speichert gueltige Anfrage', async () => {
    const payloadMock = makePayload()

    const emailMock = vi.fn(async () => ({
      mode: 'prepared' as const,
      preview: {
        to: 'office@allessaniert.at',
        subject: 'Test',
        text: 'Test',
      },
    }))

    const result = await createRequestWithPricing({
      payload: payloadMock.api as any,
      req: { payload: payloadMock.api } as any,
      body: {
        productId: 'prod-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        rentalDays: 3,
      },
      notifyByEmail: emailMock,
    })

    expect(payloadMock.api.create).toHaveBeenCalledOnce()
    expect(result.request.id).toBe('req-1')
  })

  it('lehnt Anfrage ohne Pflichtfelder ab', async () => {
    const payloadMock = makePayload()

    await expect(
      createRequestWithPricing({
        payload: payloadMock.api as any,
        req: { payload: payloadMock.api } as any,
        body: {
          productId: 'prod-1',
          email: 'max@example.com',
          rentalDays: 3,
        },
      }),
    ).rejects.toThrow()
  })

  it('haengt berechneten Preis an Anfrage an', async () => {
    const payloadMock = makePayload()

    await createRequestWithPricing({
      payload: payloadMock.api as any,
      req: { payload: payloadMock.api } as any,
      body: {
        productId: 'prod-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        rentalDays: 10,
      },
      notifyByEmail: vi.fn(async () => ({ mode: 'prepared', preview: { to: 'x', subject: 'y', text: 'z' } })),
    })

    const createArgs = payloadMock.api.create.mock.calls[0][0]
    expect(createArgs.data.pricingSummary.subtotals.rentalSubtotal).toBe(370)
  })

  it('speichert Produktreferenz korrekt', async () => {
    const payloadMock = makePayload()

    await createRequestWithPricing({
      payload: payloadMock.api as any,
      req: { payload: payloadMock.api } as any,
      body: {
        productId: 'prod-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        rentalDays: 2,
      },
      notifyByEmail: vi.fn(async () => ({ mode: 'prepared', preview: { to: 'x', subject: 'y', text: 'z' } })),
    })

    const createArgs = payloadMock.api.create.mock.calls[0][0]
    expect(createArgs.data.product).toBe('prod-1')
    expect(createArgs.data.productSnapshot.articleNumber).toBe('AS-1001')
  })

  it('setzt Status standardmaessig auf neu', async () => {
    const payloadMock = makePayload()

    await createRequestWithPricing({
      payload: payloadMock.api as any,
      req: { payload: payloadMock.api } as any,
      body: {
        productId: 'prod-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        rentalDays: 1,
      },
      notifyByEmail: vi.fn(async () => ({ mode: 'prepared', preview: { to: 'x', subject: 'y', text: 'z' } })),
    })

    const createArgs = payloadMock.api.create.mock.calls[0][0]
    expect(createArgs.data.status).toBe('new')
  })

  it('triggert E-Mail-Logik', async () => {
    const payloadMock = makePayload()
    const emailMock = vi.fn(async () => ({ mode: 'prepared', preview: { to: 'x', subject: 'y', text: 'z' } }))

    await createRequestWithPricing({
      payload: payloadMock.api as any,
      req: { payload: payloadMock.api } as any,
      body: {
        productId: 'prod-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        rentalDays: 4,
      },
      notifyByEmail: emailMock,
    })

    expect(emailMock).toHaveBeenCalledOnce()
    expect(payloadMock.api.update).toHaveBeenCalledOnce()
  })
})
