import type { PricingBreakdown, PricingCalculationInput, RentalBasisInput } from '../types/rental'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export class PricingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PricingValidationError'
  }
}

const parseISODateOnly = (value: string, fieldName: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new PricingValidationError(`${fieldName} muss im Format YYYY-MM-DD vorliegen.`)
  }

  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new PricingValidationError(`${fieldName} ist kein gueltiges Datum.`)
  }

  return parsed
}

const toMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

export const resolveRentalDays = (input: RentalBasisInput): number => {
  const { startDate, endDate, rentalDays } = input

  if (startDate && endDate) {
    const start = parseISODateOnly(startDate, 'Mietbeginn')
    const end = parseISODateOnly(endDate, 'Mietende')

    if (end < start) {
      throw new PricingValidationError('Mietende darf nicht vor Mietbeginn liegen.')
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1
    if (diffDays <= 0) {
      throw new PricingValidationError('Mietdauer muss mindestens 1 Tag betragen.')
    }

    return diffDays
  }

  if (typeof rentalDays !== 'number' || !Number.isFinite(rentalDays)) {
    throw new PricingValidationError('Bitte Mietdauer in Tagen oder einen gueltigen Zeitraum angeben.')
  }

  const normalizedDays = Math.floor(rentalDays)

  if (normalizedDays <= 0) {
    throw new PricingValidationError('Mietdauer muss mindestens 1 Tag betragen.')
  }

  return normalizedDays
}

export const calculateRentalPricing = (input: PricingCalculationInput): PricingBreakdown => {
  const { productPricing, globalInsuranceRate } = input

  const requiredPrices = [
    ['Tagespreis', productPricing.dailyPrice],
    ['3-Tages-Preis', productPricing.threeDayPrice],
    ['Wochenpreis', productPricing.weeklyPrice],
  ] as const

  for (const [label, value] of requiredPrices) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new PricingValidationError(`${label} ist ungueltig.`)
    }
  }

  const rentalDays = resolveRentalDays(input)
  const minimumRentalDays = Math.max(1, Math.floor(productPricing.minimumRentalDays || 1))

  if (rentalDays < minimumRentalDays) {
    throw new PricingValidationError(`Mindestmietdauer ist ${minimumRentalDays} Tag(e).`)
  }

  const weeks = Math.floor(rentalDays / 7)
  const remainingAfterWeeks = rentalDays % 7
  const threeDayBlocks = Math.floor(remainingAfterWeeks / 3)
  const dayBlocks = remainingAfterWeeks % 3

  const weeklySubtotal = toMoney(weeks * productPricing.weeklyPrice)
  const threeDaySubtotal = toMoney(threeDayBlocks * productPricing.threeDayPrice)
  const dailySubtotal = toMoney(dayBlocks * productPricing.dailyPrice)
  const rentalSubtotal = toMoney(weeklySubtotal + threeDaySubtotal + dailySubtotal)

  const insuranceRequired = productPricing.insuranceRequired !== false
  const insuranceRateRaw =
    typeof productPricing.insuranceRateOverride === 'number'
      ? productPricing.insuranceRateOverride
      : globalInsuranceRate

  const insuranceRate = insuranceRequired ? Math.max(0, insuranceRateRaw || 0) : 0
  const insuranceSubtotal = toMoney(rentalSubtotal * insuranceRate)

  const cleaningFee = toMoney(Math.max(0, productPricing.cleaningFee || 0))
  const deposit = toMoney(Math.max(0, productPricing.deposit || 0))

  const totalWithoutDeposit = toMoney(rentalSubtotal + insuranceSubtotal + cleaningFee)
  const totalWithDeposit = toMoney(totalWithoutDeposit + deposit)

  return {
    rentalDays,
    blocks: {
      weeks,
      threeDayBlocks,
      dayBlocks,
    },
    unitPrices: {
      weeklyPrice: toMoney(productPricing.weeklyPrice),
      threeDayPrice: toMoney(productPricing.threeDayPrice),
      dailyPrice: toMoney(productPricing.dailyPrice),
    },
    subtotals: {
      weeklySubtotal,
      threeDaySubtotal,
      dailySubtotal,
      rentalSubtotal,
      insuranceSubtotal,
      cleaningFee,
      deposit,
      totalWithoutDeposit,
      totalWithDeposit,
    },
    insurance: {
      required: insuranceRequired,
      rate: toMoney(insuranceRate),
    },
  }
}