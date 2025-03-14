import { expect, type Locator, type Page } from "@playwright/test"

export class Home {
  readonly page: Page
  // Header
  readonly header: Locator
  readonly settings: Locator
  readonly userMenu: Locator
  readonly userMenuSignOut: Locator
  // Alert
  readonly alertMessage: Locator
  // Settings
  readonly closeBtn: Locator
  readonly paymentConfiguration: Locator
  // Customer search
  readonly customerSearch: Locator
  readonly customerSearchResult: Locator
  // Product search
  readonly productSearch: Locator
  readonly productSearchResult: Locator
  // Customer information
  readonly customerInfo: Locator
  // Employee
  readonly employeeContainer: Locator
  readonly employeeClockInTime: Locator
  // Cart
  readonly shoppingCart: Locator
  readonly productRow: Locator
  readonly productRowName: Locator
  readonly productRowQty: Locator
  readonly productRowDiscount: Locator
  readonly cartTotal: Locator
  readonly cartTotalSum: Locator
  readonly cartDiscountSum: Locator
  readonly cartTaxSum: Locator
  readonly cartNetSum: Locator
  // Function buttons
  readonly addCustomer: Locator
  readonly recentSales: Locator
  readonly pendingSales: Locator
  readonly orders: Locator
  readonly layaways: Locator
  readonly clockInOut: Locator
  readonly offers: Locator
  readonly payAnInvoice: Locator
  // Sale option buttons
  readonly goToMainViewBtn: Locator
  readonly newSale: Locator
  readonly saveSale: Locator
  readonly saveAsOrder: Locator
  readonly saveAsLayaway: Locator
  readonly saveAsWaybill: Locator
  readonly discounts: Locator
  readonly promotions: Locator
  readonly saveAsOffer: Locator
  readonly accountSales: Locator
  readonly extendBtn: Locator
  // Promotions
  readonly manualPromotion: Locator
  readonly closePromotionsView: Locator
  // Switch User, Lock POS, Return, Pay
  readonly lockPos: Locator
  readonly binSale: Locator
  readonly returnBtn: Locator
  readonly payBtn: Locator
  // Confirmation Modal
  readonly confirmationModal: Locator
  readonly confirmButton: Locator

  constructor(page: Page) {
    this.page = page
    // Header
    this.header = page.getByTestId("erply-header")
    this.settings = page.getByTestId("header-settings")
    this.userMenu = page.getByTestId("header-user-menu")
    this.userMenuSignOut = page.locator("text=Sign out")
    // Alert
    this.alertMessage = page.getByTestId("alert")
    // Settings
    this.closeBtn = page.getByTestId("close")
    this.paymentConfiguration = page.locator('[data-testid="setting"][data-test-key="Payment Configuration"]')
    // Customer search
    this.customerSearch = page.getByPlaceholder("Customers")
    this.customerSearchResult = page.getByTestId("search-results-row")
    // Product search
    this.productSearch = page.getByPlaceholder("Products")
    this.productSearchResult = page.locator(
      '[data-testid="search-result-product"][data-test-key="1"]'
    )
    // Customer information
    this.customerInfo = page.getByTestId("customer-information-container")
    // Employee
    this.employeeContainer = page.getByTestId("employee-badge-container")
    this.employeeClockInTime = page.getByTestId("employee-clock-in-time")
    // Cart
    this.shoppingCart = page.locator(".bill-container")
    this.productRow = page.getByTestId("product-row")
    this.productRowName = page.getByTestId("product-name-cell")
    this.productRowQty = page.locator(
      '[data-testid="amount"][data-test-key="product-amount-1"]'
    )
    this.productRowDiscount = page.locator(
      '[data-testid="discount"]'
      // [data-test-key="product-discount-1"]'
    )
    this.cartTotal = page.getByTestId("table-total")
    this.cartTotalSum = page.getByTestId("table-total-sum")
    this.cartDiscountSum = page.getByTestId("bill-discount-sum")
    this.cartTaxSum = page.getByTestId("bill-tax-total-sum")
    this.cartNetSum = page.getByTestId("bill-net-total-sum")
    // Function buttons
    this.addCustomer = page.locator(
      '[data-testid="function-button"][data-test-key="addCustomer"]'
    )
    this.recentSales = page.locator(
      '[data-testid="function-button"][data-test-key="completedSales"]'
    )
    this.pendingSales = page.locator(
      '[data-testid="function-button"][data-test-key="pendingSales"]'
    )
    this.orders = page.locator(
      '[data-testid="function-button"][data-test-key="orderSales"]'
    )
    this.layaways = page.locator(
      '[data-testid="function-button"][data-test-key="layawaySales"]'
    )
    this.clockInOut = page.locator(
      '[data-testid="function-button"][data-test-key="clockInOut"]'
    )
    this.offers = page.locator(
      '[data-testid="function-button"][data-test-key="offers"]'
    )
    this.payAnInvoice = page.locator(
      '[data-testid="function-button"][data-test-key="payAnInvoice"]'
    )
    // Sale option buttons
    this.goToMainViewBtn = page.locator(
      '[data-testid="sale-option-button"][data-test-key="special-go-to-main-view"]'
    )
    this.newSale = page.locator(
      '[data-testid="sale-option-button"][data-test-key="newSale"]'
    )
    this.saveSale = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saveSale"]'
    )
    this.saveAsOrder = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saveAsOrder"]'
    )
    this.saveAsLayaway = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saveAsLayaway"]'
    )
    this.saveAsWaybill = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saveAsWaybill"]'
    )
    this.discounts = page.locator(
      '[data-testid="sale-option-button"][data-test-key="discount"]'
    )
    this.promotions = page.locator(
      '[data-testid="sale-option-button"][data-test-key="promotions"]'
    )
    this.saveAsOffer = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saveAsOffer"]'
    )
    this.accountSales = page.locator(
      '[data-testid="sale-option-button"][data-test-key="accountSales"]'
    )
    this.extendBtn = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saleoption-extend-btn"]'
    )
    // Promotions
    this.manualPromotion = page.getByTestId("promotion")
    this.closePromotionsView = page.getByTestId("custom-close-button")
    // Switch User, Lock POS, Return, Pay
    this.lockPos = page.getByTestId("hard-logout-btn")
    this.binSale = page.getByTestId("new-sale-btn")
    this.returnBtn = page.getByTestId("return-btn")
    this.payBtn = page.getByTestId("payment-button")
    // Confirmation Modal
    this.confirmationModal = page.getByTestId("confirmation-modal")
    this.confirmButton = page.getByTestId("confirm-btn")
  }

  // Header
  async openPaymentConfigurations() {
    await this.settings.click()
    await this.paymentConfiguration.click()
  }

  async userSignOutUserMenu() {
    await this.userMenu.click()
    await this.userMenuSignOut.click()
  }

  // Settings
  async closeSettings() {
    await this.closeBtn.click()
  }

  // Customer search
  async userSearchesForCustomer(customerName: string) {
    await this.customerSearch.click()
    await this.customerSearch.fill(customerName)
    await this.customerSearchResult.click()
  }

  // Product search
  async userSearchesForProduct(productName: string) {
    await this.productSearch.click()
    await this.productSearch.fill(productName)
    await this.productSearchResult.click()
  }

  // Cart
  async openProductInformation() {
    await this.productRowName.click()
  }

  async getCartTotals() {
    const cartTotalSum = await this.cartTotalSum.textContent()
    const cartTaxSum = await this.cartTaxSum.textContent()
    const cartNetSum = await this.cartNetSum.textContent()

    return {
      cartTotalSum,
      cartTaxSum,
      cartNetSum,
    }
  }

  async getDiscountTotals() {
    const cartDiscountSum = await this.cartDiscountSum.textContent()
  }

  // Function buttons
  async clickAddCustomer() {
    await this.addCustomer.click()
  }

  async clickRecentSales() {
    await this.recentSales.click()
  }

  async clickPendingSales() {
    await this.pendingSales.click()
  }

  async clickPickupOrders() {
    await this.orders.click()
  }

  async clickLayaways() {
    await this.layaways.click()
  }

  async clickClockInOut() {
    await this.clockInOut.click()
  }

  async clickOffers() {
    await this.offers.click()
  }

  async clickPayAnInvoice() {
    await this.payAnInvoice.click()
  }

  // Sale options buttons
  async clickMainViewBtn() {
    await this.goToMainViewBtn.click()
  }

  async clickNewSale() {
    await this.newSale.click()
  }

  async clickSaveSale() {
    await this.saveSale.click()
  }

  async clickSaveAsOrder() {
    await this.saveAsOrder.click()
  }

  async clickSaveAsLayaway() {
    await this.saveAsLayaway.click()
  }

  async clickSaveAsWaybill() {
    await this.saveAsWaybill.click()
  }

  async clickDiscounts() {
    await this.discounts.click()
  }

  async clickPromotions() {
    await this.promotions.click()
  }

  async clickSaveAsOffer() {
    await this.extendBtn.click()
    await this.saveAsOffer.click()
  }

  async clickAccountSales() {
    await this.extendBtn.click()
    await this.accountSales.click()
  }

  // Promotions
  async applyManualPromotion() {
    await this.manualPromotion.click()
  }

  async closePromotions() {
    await this.closePromotionsView.click()
  }

  // Switch User, Lock POS
  async userLocksPos() {
    await this.lockPos.click()
  }

  async clickBinSale() {
    await this.binSale.click()
  }

  async clickPayBtn() {
    await this.payBtn.click()
  }

  // Confirmation Modal
  async clickOk() {
    await this.confirmButton.click()
  }
}
