import { type Locator, type Page } from "@playwright/test"

export class Orders {
  readonly page: Page
  readonly orderActionSelection: Locator
  readonly pickUpOrder: Locator
  readonly cancelOrder: Locator

  constructor(page: Page) {
    this.page = page
    this.orderActionSelection = page.getByTestId(
      "pickup-orders-action-selection-modal"
    )
    this.pickUpOrder = page.getByTestId("order-action-selection-pickup-button")
    this.cancelOrder = page.getByTestId("order-action-selection-cancel-button")
  }

  async retrieveOrder(orderId: string) {
    const invoiceLocator = this.page.locator(`[data-test-key="${orderId}"]`)

    await invoiceLocator.waitFor({ state: "visible" })
    if (await invoiceLocator.isVisible()) {
      await invoiceLocator.click()
    } else {
      throw new Error(`Invoice with ID ${orderId} not found`)
    }
  }

  async clickPickUpOrder() {
    await this.pickUpOrder.click()
  }
}
