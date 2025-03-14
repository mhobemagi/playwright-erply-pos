import { type Locator, type Page } from "@playwright/test"

export class Discounts {
  readonly page: Page
  readonly saveBtn: Locator
  readonly discountsModal: Locator
  readonly percentageInput: Locator
  readonly discounts: Record<string, Locator>

  constructor(page: Page) {
    this.page = page
    this.saveBtn = page.getByTestId("save-btn")
    this.discountsModal = page.getByTestId("sale-discount-modal")
    this.percentageInput = page.getByTestId("percentage-input")
    this.discounts = {
      zero: page.locator('[data-testid="percentage"][data-test-key="0"]'),
      five: page.locator('[data-testid="percentage"][data-test-key="5"]'),
      ten: page.locator('[data-testid="percentage"][data-test-key="10"]'),
      fifteen: page.locator('[data-testid="percentage"][data-test-key="15"]'),
      twenty: page.locator('[data-testid="percentage"][data-test-key="20"]'),
      twentyfive: page.locator('[data-testid="percentage"]"[data-test-key="25"]'),
      fifty: page.locator('[data-testid="percentage"][data-test-key="50"]'),
    }
  }

  async saveDiscount() {
    await this.saveBtn.click()
  }

  async inputPercentage(percentage: string) {
    await this.percentageInput.fill(percentage)
    await this.saveBtn.click()
  }

  async addPercentDiscount(percentage: string) {
    switch (percentage) {
      case "0":
        await this.discounts.zero.click()
        break
      case "5":
        await this.discounts.five.click()
        break
      case "10":
        await this.discounts.ten.click()
        break
      case "15":
        await this.discounts.fifteen.click()
        break
      case "20":
        await this.discounts.twenty.click()
        break
      case "25":
        await this.discounts.twentyfive.click()
        break
      case "50":
        await this.discounts.fifty.click()
        break
      default:
        throw new Error("Percentage doesn't exist")
    }
  }
}
