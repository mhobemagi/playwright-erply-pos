import { expect, type Locator, type Page } from "@playwright/test"

export class RecentSales {
  readonly page: Page
  // Recent sales
  readonly recentSalesView: Locator
  readonly invoiceList: Locator
  // Product return
  readonly saveBtn: Locator
  readonly productReturnView: Locator
  readonly productReturnTitle: Locator
  readonly productRowCheckbox: Locator

  constructor(page: Page) {
    this.page = page
    // Recent sales
    this.recentSalesView = page.getByTestId("recent-sales")
    this.invoiceList = page.getByTestId("previous-purchases")
    // Product return
    this.saveBtn = page.getByTestId("save-return-btn")
    this.productReturnView = page.getByTestId("product-return")
    this.productReturnTitle = page.getByTestId("return-title")
    this.productRowCheckbox = page.getByTestId("product-row-toggle")
  }

  // Recent sales
  async retrieveInvoice(invoiceId: string) {
    const startReturnBtn = this.page.locator(
      `[data-test-key="start-return-${invoiceId}"]`
    )
    await startReturnBtn.waitFor({ state: "visible" })
    if (await startReturnBtn.isVisible()) {
      await startReturnBtn.click()
    } else {
      throw new Error(`Invoice with ID ${invoiceId} not found`)
    }
  }

  // Product return
  async addReturnToCart() {
    await this.productRowCheckbox.click()
    await this.saveBtn.click()
  }
}
