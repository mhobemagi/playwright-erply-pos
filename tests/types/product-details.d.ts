export interface Product {
  id: number
  status: string
  name: {
    en: string
  }
  code: string
  code2: string
  code3: string
  code5: string
  code6: string
  code7: string
  code8: string
  price: number
  price_with_tax: number
  tax_rate_id: number
}

export interface ProductDetails {
  Cake: Product
  Ball: Product
}
