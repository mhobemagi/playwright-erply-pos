import { expect, type Locator, type Page } from "@playwright/test"

export class Layaways {
  readonly page: Page
  // Layaways list modal
  readonly layawayList: Locator
  readonly layawayActionSelection: Locator
  readonly layawayFullyPay: Locator
  readonly layawayPartiallyPay: Locator
  readonly layawayCancel: Locator
  // Save as Layaway modal
  readonly layawayModal: Locator
  readonly saveBtn: Locator
  readonly prepaymentPercentage: Locator

  constructor(page: Page) {
    this.page = page
    // Layaways list modal
    this.layawayList = page.getByTestId("layaway-container")
    this.layawayActionSelection = page.getByTestId(
      "layaway-action-selection-modal"
    )
    this.layawayFullyPay = page.getByTestId(
      "layaway-action-selection-fullyPay-button"
    )
    this.layawayPartiallyPay = page.getByTestId(
      "layaway-action-selection-partiallyPay-button"
    )
    this.layawayCancel = page.getByTestId(
      "layaway-action-selection-cancel-button"
    )
    // Save as Layaway modal
    this.layawayModal = page.getByTestId("layaway-sales")
    this.saveBtn = page.getByTestId("save-layaway-btn")
    this.prepaymentPercentage = page.locator(
      '[data-testid="layaway-field"][data-test-key="layaway-prepaymentPercent"]'
    )
  }

  // Layaway list modal
  async retrieveLayaway(layawayId: string) {
    const invoiceLocator = this.layawayList.locator(
      `[data-test-key="${layawayId}"]`
    )

    if (await invoiceLocator.isVisible()) {
      await invoiceLocator.click()
    } else {
      throw new Error(`Invoice with ID ${layawayId} not found`)
    }
  }

  async clickFullyPayLayaway() {
    await this.layawayFullyPay.click()
  }

  async clickCancelLayaway() {
    await this.layawayCancel.click()
  }

  // Save as layaway modal
  async applyFullPrepayment() {
    await this.prepaymentPercentage.fill("100")
    await this.saveBtn.click()
  }

  async applyPartialPrepayment() {
    await this.prepaymentPercentage.fill("50")
    await this.saveBtn.click()
  }
}
