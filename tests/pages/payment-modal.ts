import { expect, type Locator, type Page } from "@playwright/test"

export class PaymentModal {
  readonly page: Page
  readonly paymentModal: Locator
  readonly paymentTotal: Locator
  readonly remainingBalance: Locator
  readonly fullCardBtn: Locator
  readonly fullCashBtn: Locator
  readonly cancelPaymentBtn: Locator
  readonly confirmPaymentBtn: Locator
  // Numberpad
  readonly numberPad: Record<string, Locator>
  // Payment tender buttons
  readonly tenderButtons: Record<string, Locator>
  // Payment tender containers
  readonly tenderContainers: Record<string, Locator>
  readonly originalTenderContainers: Record<string, Locator>
  // Check tender removal
  readonly confirmCheckRemoval: Locator
  // Sale confirmation
  readonly saleConfirmation: Locator
  readonly invoiceId: Locator
  readonly closeConfirmation: Locator

  constructor(page: Page) {
    this.page = page
    this.paymentModal = page.getByTestId("payment-desktop")
    this.paymentTotal = page.getByTestId("payment-total-value")
    this.remainingBalance = page.getByTestId("payment-balance-value")
    this.fullCardBtn = page.getByTestId("full-card-payment-button")
    this.fullCashBtn = page.getByTestId("full-cash-payment-button")
    this.cancelPaymentBtn = page.getByTestId("cancel-payment-button")
    this.confirmPaymentBtn = page.getByTestId("confirm-payment-button")
    // Numberpad
    this.numberPad = {
      one: page.locator('[data-test-key="1"]'),
      two: page.locator('[data-test-key="2"]'),
      three: page.locator('[data-test-key="3"]'),
      four: page.locator('[data-test-key="4"]'),
      five: page.locator('[data-test-key="5"]'),
      six: page.locator('[data-test-key="6"]'),
      seven: page.locator('[data-test-key="7"]'),
      eight: page.locator('[data-test-key="8"]'),
      nine: page.locator('[data-test-key="9"]'),
      zero: page.locator('[data-test-key="0"]'),
      decimalButton: page.getByTestId("decimal-button"),
      ok: page.getByTestId("enter-button"),
    }
    // Payment tender buttons
    this.tenderButtons = {
      cash: page.getByTestId("cash-payment-button"),
      card: page.getByTestId("card-payment-button"),
      tip: page.getByTestId("payment-tip"),
      check: page.getByTestId("payment-check"),
      storecredit: page.getByTestId("payment-store-credit"),
      regulargiftcard: page.getByTestId("payment-giftcard"),
      serializedgiftcard: page.getByTestId("payment-giftcard"),
    }
    // Payment tender containers
    this.tenderContainers = {
      cash: page.locator('[data-testid="payment-item"][data-test-type="CASH"]'),
      card: page.locator('[data-testid="payment-item"][data-test-type="CARD"]'),
      tip: page.locator('[data-testid="payment-item"][data-test-type="TIP"]'),
      check: page.locator(
        '[data-testid="payment-item"][data-test-type="CHECK"]'
      ),
      storecredit: page.locator(
        '[data-testid="payment-item"][data-test-type="STORECREDIT"]'
      ),
      regulargiftcard: page.locator(
        '[data-testid="payment-item"][data-test-type="GIFTCARD"][data-test-serial="false"]'
      ),
      serializedgiftcard: page.locator(
        '[data-testid="payment-item"][data-test-type="GIFTCARD"][data-test-serial="true"]'
      ),
      paid: page.locator('[data-testid="payment-item"][data-test-type="PAID"]'),
    }
    this.originalTenderContainers = {
      cash: page.locator(
        '[data-testid="original-payment-item"][data-test-type="CASH"]'
      ),
      card: page.locator(
        '[data-testid="original-payment-item"][data-test-type="CARD"]'
      ),
      tip: page.locator(
        '[data-testid="original-payment-item"][data-test-type="TIP"]'
      ),
      check: page.locator(
        '[data-testid="original-payment-item"][data-test-type="CHECK"]'
      ),
      storecredit: page.locator(
        '[data-testid="original-payment-item"][data-test-type="STORECREDIT"]'
      ),
      regulargiftcard: page.locator(
        '[data-testid="original-payment-item"][data-test-type="GIFTCARD"][data-test-serial="false"]'
      ),
      serializedgiftcard: page.locator(
        '[data-testid="original-payment-item"][data-test-type="GIFTCARD"][data-test-serial="true"]'
      ),
      paid: page.locator(
        '[data-testid="original-payment-item"][data-test-type="PAID"]'
      ),
    }
    // Check tender removal
    this.confirmCheckRemoval = page.getByTestId("confirm-btn")
    // Sale confirmation
    this.saleConfirmation = page.getByTestId("confirmation")
    this.invoiceId = page.getByTestId("invoice-nr")
    this.closeConfirmation = page.getByTestId("new-sale-button")
  }

  async paymentModalIsVisible() {
    await expect(this.paymentModal).toBeVisible()
  }

  async getPaymentTotal() {
    const paymentTotal = await this.paymentTotal.textContent()

    return {
      paymentTotal,
    }
  }

  async getPaidTenderTotal() {
    const paymentTotalElement = await this.tenderContainers.paid.locator(
      '[data-testid="payment-amount"]'
    )
    const paymentTotal = await paymentTotalElement.textContent()

    return {
      paymentTotal,
    }
  }

  async getRemainingBalance() {
    const remainingBalance = await this.remainingBalance.textContent()

    return {
      remainingBalance: remainingBalance?.replace("-", "").trim(),
    }
  }

  // Numberpad
  async enterCartTotal(payment: string) {
    const cleanValue = payment.replace(/[^0-9.]/g, "")

    const total = cleanValue.toString()

    for (const char of total) {
      if (char === ".") {
        await this.numberPad.decimalButton.click()
      } else {
        const buttonName = {
          "1": this.numberPad.one,
          "2": this.numberPad.two,
          "3": this.numberPad.three,
          "4": this.numberPad.four,
          "5": this.numberPad.five,
          "6": this.numberPad.six,
          "7": this.numberPad.seven,
          "8": this.numberPad.eight,
          "9": this.numberPad.nine,
          "0": this.numberPad.zero,
        }[char]

        if (buttonName) {
          await buttonName.click()
        }
      }
    }

    // Finally, press the OK button
    await this.numberPad.ok.click()
  }

  // Add tenders
  async addPaymentTender(paymentType: string, paymentAmount?: string) {
    switch (paymentType.toUpperCase()) {
      case "CASH":
        await this.tenderButtons.cash.click()
        if (paymentAmount) {
          await this.enterCartTotal(paymentAmount)
        }
        break
      case "CARD":
        await this.tenderButtons.card.click()
        if (paymentAmount) {
          await this.enterCartTotal(paymentAmount)
        }
        break
      case "STORE_CREDIT":
        await this.tenderButtons.storecredit.click()
        await this.tenderContainers.storecredit.click()
        if (paymentAmount) {
          await this.enterCartTotal(paymentAmount)
        }
        break
      case "CHECK":
        await this.tenderButtons.check.click()
        if (paymentAmount) {
          await this.enterCartTotal(paymentAmount)
        }
        break
      case "TIP":
        await this.tenderButtons.tip.click()
        if (paymentAmount) {
          await this.enterCartTotal(paymentAmount)
        }
        break
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`)
    }
  }

  async addFullCardPaymentTender() {
    await this.fullCardBtn.click()
  }

  async addFullCashPaymentTender() {
    await this.fullCashBtn.click()
  }

  async addFullStoreCreditTender() {
    await this.tenderButtons.storecredit.click()
    await this.numberPad.ok.click()
  }

  async addFullCheckPaymentTender(payment: string) {
    await this.tenderButtons.check.click()
    await this.enterCartTotal(payment)
  }

  // Remove tender
  async removeReturnTender(paymentType: string) {
    switch (paymentType.toUpperCase()) {
      case "CASH":
        await this.tenderContainers.cash.click()
        await this.numberPad.ok.click()
        break
      case "CARD":
        await this.tenderContainers.card.click()
        await this.numberPad.ok.click()
        break
      case "STORE_CREDIT":
        await this.tenderContainers.cash.click()
        await this.numberPad.ok.click()
        break
      case "CHECK":
        await this.tenderContainers.check.click()
        await this.confirmCheckRemoval.click()
        break
      case "TIP":
        await this.tenderContainers.tip.click()
        await this.numberPad.ok.click()
        break
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`)
    }
  }

  // Cancel payment/close payment modal
  async cancelPayment() {
    await this.cancelPaymentBtn.click()
  }

  // Confirm payment
  async confirmPayment() {
    await this.confirmPaymentBtn.click()
  }
  // Sale confirmation
  async saleConfirmationIsVisible() {
    await expect(this.saleConfirmation).toBeVisible()
  }

  async retrieveInvoiceId() {
    const invoiceNumberText = await this.invoiceId.textContent()

    const cleanInvoiceNumber = invoiceNumberText?.endsWith("K")
      ? invoiceNumberText.slice(0, -1)
      : invoiceNumberText

    const invoiceId = cleanInvoiceNumber?.match(/\d+/)?.[0]
    return invoiceId
  }

  async closeSaleConfirmation() {
    await this.closeConfirmation.click()
  }
}
