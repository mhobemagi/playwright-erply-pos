import { type Locator, type Page } from "@playwright/test"

export class AccountSales {
  readonly page: Page
  readonly accountSalesModal: Locator
  readonly prepaymentPercentage: Locator
  readonly saveBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.accountSalesModal = page.getByTestId("account-sales-modal")
    this.prepaymentPercentage = page.locator(
      '[data-testid="input-field"][data-test-key="prepaymentPercent"]'
    )
    this.saveBtn = page.getByTestId("save-btn")
  }

  async applyFullPrepayment() {
    await this.prepaymentPercentage.fill("100")
    await this.saveBtn.click()
  }

  async applyPartialPrepayment() {
    await this.prepaymentPercentage.fill("50")
    await this.saveBtn.click()
  }
}
