export type RentalBasisInput = {
  startDate?: string
  endDate?: string
  rentalDays?: number
}

export type ProductPricing = {
  dailyPrice: number
  threeDayPrice: number
  weeklyPrice: number
  deposit?: number
  minimumRentalDays?: number
  cleaningFee?: number
  insuranceRateOverride?: number | null
  insuranceRequired?: boolean
  title: string
  articleNumber: string
  slug: string
}

export type PricingCalculationInput = RentalBasisInput & {
  productPricing: ProductPricing
  globalInsuranceRate: number
}

export type PricingBreakdown = {
  rentalDays: number
  blocks: {
    weeks: number
    threeDayBlocks: number
    dayBlocks: number
  }
  unitPrices: {
    weeklyPrice: number
    threeDayPrice: number
    dailyPrice: number
  }
  subtotals: {
    weeklySubtotal: number
    threeDaySubtotal: number
    dailySubtotal: number
    rentalSubtotal: number
    insuranceSubtotal: number
    cleaningFee: number
    deposit: number
    totalWithoutDeposit: number
    totalWithDeposit: number
  }
  insurance: {
    required: boolean
    rate: number
  }
}

export type RequestCustomerInput = {
  name: string
  email: string
  phone?: string
  message?: string
}

export type RequestCreateInput = RentalBasisInput &
  RequestCustomerInput & {
    productId?: string
    productSlug?: string
  }

export type PreparedMail = {
  to: string
  subject: string
  text: string
  html?: string
}