import { Page, Locator } from "@playwright/test"

export class HelperBase {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  static formatCurrency(value: any): string {
    const number = Number(value)
    return number < 0
      ? `$-${Math.abs(number).toFixed(2)}`
      : `$${number.toFixed(2)}`
  }
}
