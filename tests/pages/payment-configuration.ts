import { type Locator, type Page } from "@playwright/test"
import { localUser } from "../../playwright.config"

export class PaymentConfiguration {
  readonly page: Page
  readonly saveBtn: Locator
  readonly allowedTendersOnSaleType: Record<string, Locator>
  readonly allowedTendersOnSaleLimit: Record<string, Locator>
  readonly allowedTendersOnReturnWithReceiptType: Record<string, Locator>
  readonly allowedTendersOnReturnWithReceiptLimit: Record<string, Locator>
  readonly allowedTendersOnReturnWithoutReceiptType: Record<string, Locator>
  readonly allowedTendersOnReturnWithoutReceiptLimit: Record<string, Locator>

  constructor(page: Page) {
    this.page = page
    this.saveBtn = page.locator(
      'div.modal-header:has-text("Payment Configuration") >> button.btn.btn-POS'
    )
    // Allowed tenders on sale
    this.allowedTendersOnSaleType = {
      cash: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_sale_cash"]'
      ),
      card: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_sale_card"]'
      ),
      storecredit: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_sale_storecredit"]'
      ),
      check: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_sale_check"]'
      ),
      tip: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_sale_tip"]'
      ),
    }
    this.allowedTendersOnSaleLimit = {
      cash: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_sale_cash_limit"]'
      ),
      card: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_sale_card_limit"]'
      ),
      storecredit: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_sale_storecredit_limit"]'
      ),
      check: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_sale_check_limit"]'
      ),
      tip: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_sale_tip_limit"]'
      ),
    }
    // Allowed tenders on return with receipt
    this.allowedTendersOnReturnWithReceiptType = {
      cash: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_receipt_cash"]'
      ),
      card: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_receipt_card"]'
      ),
      storecredit: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_receipt_storecredit"]'
      ),
      check: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_receipt_check"]'
      ),
    }
    this.allowedTendersOnReturnWithReceiptLimit = {
      cash: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_receipt_cash_limit"]'
      ),
      card: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_receipt_card_limit"]'
      ),
      storecredit: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_receipt_storecredit_limit"]'
      ),
      check: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_receipt_check_limit"]'
      ),
    }
    // Allowed tenders on return without receipt
    this.allowedTendersOnReturnWithoutReceiptType = {
      cash: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_cash"]'
      ),
      card: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_card"]'
      ),
      storecredit: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_storecredit"]'
      ),
      check: page.locator(
        '[data-testid="ctxinput-checkbox"][data-test-key="pos_allow_return_check"]'
      ),
    }
    this.allowedTendersOnReturnWithoutReceiptLimit = {
      cash: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_cash_limit"]'
      ),
      card: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_card_limit"]'
      ),
      storecredit: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_storecredit_limit"]'
      ),
      check: page.locator(
        '[data-testid="ctxinput-text"][data-test-key="pos_allow_return_check_limit"]'
      ),
    }
  }

  // Allowed tenders on sale
  async setAllowedTenderTypeOnSale(tender: string) {
    const tenderField = this.allowedTendersOnSaleType[tender]
    await tenderField.click()
    await this.saveBtn.click()
  }

  async setTenderLimitOnSale(tender: string, tenderLimit: string) {
    const tenderField = this.allowedTendersOnSaleLimit[tender]
    await tenderField.fill(tenderLimit)
    await this.saveBtn.click()
  }

  // Allowed tenders on return with receipt
  async setAllowedTenderTypeOnReturnWithReceipt(tender: string) {
    const tenderField = this.allowedTendersOnReturnWithReceiptType[tender]
    await tenderField.click()
    await this.saveBtn.click()
  }


  async setTenderLimitOnReturnWithReceipt(tender: string, tenderLimit: string) {
    const tenderField = this.allowedTendersOnReturnWithReceiptLimit[tender]
    await tenderField.fill(tenderLimit)
    await this.saveBtn.click()
  }

  // Allowed tenders on return without receipt
  async setAllowedTenderTypeOnReturnWithoutReceipt(tender: string) {
    const tenderField = this.allowedTendersOnReturnWithoutReceiptType[tender]
    await tenderField.click()
    await this.saveBtn.click()
  }

  async setTenderLimitOnReturnWithoutReceipt(
    tender: string,
    tenderLimit: string
  ) {
    const tenderField = this.allowedTendersOnReturnWithoutReceiptLimit[tender]
    await tenderField.fill(tenderLimit)
    await this.saveBtn.click()
  }
}
