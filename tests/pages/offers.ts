import { type Locator, type Page } from "@playwright/test"

export class Offers {
  readonly page: Page
  readonly offersModal: Locator
  readonly offersSearch: Locator
  readonly offerRow: Locator
  readonly offerNumber: Locator
  readonly offerSum: Locator

  constructor(page: Page) {
    this.page = page
    this.offersModal = page.getByTestId("offers-modal")
    this.offersSearch = page.getByTestId("offer-input")
    this.offerRow = page.getByTestId("offer")
    this.offerNumber = page.getByTestId("offer-number")
    this.offerSum = page.getByTestId("total")
  }

  async retrieveOfferId() {
    const latestOffer = this.offerNumber.first()
    await latestOffer.waitFor({ state: "visible" })
    const offerId = await latestOffer.textContent()
    return offerId
  }

  async pickUpOffer() {
    await this.offerRow.first().click()
  }
}
