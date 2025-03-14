import { type Locator, type Page } from "@playwright/test"

export class PendingSales {
  readonly page: Page
  readonly pendingSalesModal: Locator
  readonly confirmDeleteBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.pendingSalesModal = page.getByTestId("pending-sales-modal")
    this.confirmDeleteBtn = page.getByTestId("confirm-btn")
  }

  async getLatestPendingSale(cartTotalSum: string) {
    const matchCorrectCartTotal = this.page.locator("td", {
      hasText: `${cartTotalSum}`,
    })
    await matchCorrectCartTotal.first().waitFor({ state: "visible" })
    await matchCorrectCartTotal.first().click()
  }

  async deletePendingSale(cartTotalSum: string) {
    const matchCorrectPendingSale = this.page.locator(
      `tr:has-text("${cartTotalSum}")`
    )
    await matchCorrectPendingSale.locator("i.icon_trash").click()
    await this.confirmDeleteBtn.click()
  }
}
