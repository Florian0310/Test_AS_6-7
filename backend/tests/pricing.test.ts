import { describe, expect, it } from 'vitest'
import { calculateRentalPricing, PricingValidationError, resolveRentalDays } from '../src/utils/pricing'

const baseProduct = {
  title: 'Testgeraet',
  articleNumber: 'AS-TEST',
  slug: 'testgeraet',
  dailyPrice: 50,
  threeDayPrice: 120,
  weeklyPrice: 250,
  deposit: 100,
  cleaningFee: 20,
  minimumRentalDays: 1,
  insuranceRequired: true,
}

describe('Preisberechnung', () => {
  it('berechnet 1 Tag als Tagespreis', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 1,
    })

    expect(result.blocks).toEqual({ weeks: 0, threeDayBlocks: 0, dayBlocks: 1 })
    expect(result.subtotals.rentalSubtotal).toBe(50)
  })

  it('berechnet mehrere Tagespreise korrekt', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 2,
    })

    expect(result.subtotals.rentalSubtotal).toBe(100)
  })

  it('nutzt fuer 3 Tage den 3-Tages-Preis', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 3,
    })

    expect(result.blocks.threeDayBlocks).toBe(1)
    expect(result.subtotals.rentalSubtotal).toBe(120)
  })

  it('nutzt fuer 7 Tage den Wochenpreis', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 7,
    })

    expect(result.blocks.weeks).toBe(1)
    expect(result.subtotals.rentalSubtotal).toBe(250)
  })

  it('nutzt bei 10 Tagen Wochenpreis + 3-Tages-Preis', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 10,
    })

    expect(result.blocks).toEqual({ weeks: 1, threeDayBlocks: 1, dayBlocks: 0 })
    expect(result.subtotals.rentalSubtotal).toBe(370)
  })

  it('nutzt bei 8 Tagen Wochenpreis + Tagespreis', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 8,
    })

    expect(result.blocks).toEqual({ weeks: 1, threeDayBlocks: 0, dayBlocks: 1 })
    expect(result.subtotals.rentalSubtotal).toBe(300)
  })

  it('nutzt bei 11 Tagen Wochenpreis + 3-Tages-Preis + Tagespreis', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 11,
    })

    expect(result.blocks).toEqual({ weeks: 1, threeDayBlocks: 1, dayBlocks: 1 })
    expect(result.subtotals.rentalSubtotal).toBe(420)
  })

  it('beruecksichtigt Pflichtversicherung mit 10%', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 7,
    })

    expect(result.subtotals.insuranceSubtotal).toBe(25)
  })

  it('addiert Kaution korrekt', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 7,
    })

    expect(result.subtotals.deposit).toBe(100)
    expect(result.subtotals.totalWithDeposit).toBe(395)
  })

  it('addiert Reinigungsgebuehr korrekt', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 3,
    })

    expect(result.subtotals.cleaningFee).toBe(20)
  })

  it('validiert Mindestmietdauer', () => {
    expect(() =>
      calculateRentalPricing({
        productPricing: {
          ...baseProduct,
          minimumRentalDays: 4,
        },
        globalInsuranceRate: 0.1,
        rentalDays: 3,
      }),
    ).toThrow(PricingValidationError)
  })

  it('faengt ungueltige Eingaben ab', () => {
    expect(() =>
      calculateRentalPricing({
        productPricing: baseProduct,
        globalInsuranceRate: 0.1,
        rentalDays: 0,
      }),
    ).toThrow(PricingValidationError)
  })

  it('liefert konsistente Struktur zurueck', () => {
    const result = calculateRentalPricing({
      productPricing: baseProduct,
      globalInsuranceRate: 0.1,
      rentalDays: 5,
    })

    expect(result).toMatchObject({
      rentalDays: 5,
      blocks: {
        weeks: 0,
        threeDayBlocks: 1,
        dayBlocks: 2,
      },
      subtotals: {
        rentalSubtotal: 220,
      },
    })
  })

  it('berechnet Miettage aus Zeitraum', () => {
    expect(resolveRentalDays({ startDate: '2026-03-01', endDate: '2026-03-03' })).toBe(3)
  })
})