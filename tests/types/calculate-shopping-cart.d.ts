export interface CalculateShoppingCartResponseRow {
  rowNumber: number
  productID: string
  amount: string
  vatrateID: number
  vatRate: string
  originalPrice: number
  originalPriceWithVAT: number
  manualDiscountPrice: number
  manualDiscountPriceWithVAT: number
  manualDiscountReasonCodeID: number
  promotionPrice: number
  promotionPriceWithVAT: number
  promotionDiscount: number
  originalDiscount: number
  manualDiscount: number
  discount: number
  finalPrice: number
  finalPriceWithVAT: number
  rowNetTotal: number
  rowVAT: number
  rowTotal: number
  priceBasedTaxThreshold: null | number
  priceBasedTaxRate: null | number
  nonDiscountable: number
  promotionRule1totalDiscount1: number
  promotionRule2totalDiscount1: number
  promotionRule1totalDiscount2: number
  promotionRule2totalDiscount2: number
}

export interface CalculateShoppingCartResponseBody {
  rows: CalculateShoppingCartResponseRow[]
  netTotal: number
  vatTotal: number
  rounding: number
  total: number
  usedCouponIdentifiers: string
  appliedPromotions: string[]
  automaticCoupons: string
  printAutomaticCoupons: string[]
}
