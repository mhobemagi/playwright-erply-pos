import { expect, type Locator, type Page } from "@playwright/test"

export class ProductInformation {
  readonly page: Page
  readonly productInformationModal: Locator
  readonly productDetailsBtn: Locator
  readonly editProductBtn: Locator
  readonly closeBtn: Locator
  // Product quantity
  readonly decreaseQuantityBtn: Locator
  readonly productQuantity: Locator

  constructor(page: Page) {
    this.page = page
    this.productInformationModal = page.getByTestId("product-order-form")
    this.productDetailsBtn = page.locator(
      '[data-testid="action"][data-test-key="Product details"]'
    )
    this.editProductBtn = page.locator(
      '[data-testid="action"][data-test-key="Edit product"]'
    )
    this.closeBtn = page.getByTestId("custom-close-button")
    // Product quantity
    this.decreaseQuantityBtn = page.getByTestId("decrease-btn")
    this.productQuantity = page.getByTestId("amount")
  }

  async closeProductInformation() {
    await this.closeBtn.click()
  }
  // Product quantity
  async decreaseQty() {
    await this.decreaseQuantityBtn.click()
  }
}
