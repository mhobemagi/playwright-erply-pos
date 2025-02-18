import { expect, type Locator, type Page } from "@playwright/test"

export class Home {
  readonly page: Page
  // Header
  readonly header: Locator
  readonly userMenu: Locator
  readonly userMenuSignOut: Locator
  // Alert
  readonly alertMessage: Locator
  // Customer search
  readonly customerSearch: Locator
  readonly customerSearchResult: Locator
  // Product search
  readonly productSearch: Locator
  readonly productSearchResult: Locator
  // Customer information
  readonly customerInfo: Locator
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
  readonly orders: Locator
  readonly layaways: Locator
  readonly offers: Locator
  // Sale option buttons
  readonly goToMainViewBtn: Locator
  readonly saveAsOrder: Locator
  readonly saveAsLayaway: Locator
  readonly saveAsWaybill: Locator
  readonly promotions: Locator
  readonly saveAsOffer: Locator
  readonly extendBtn: Locator
  // Promotions
  readonly manualPromotion: Locator
  readonly closePromotionsView: Locator
  // Switch User, Lock POS, Return, Pay
  readonly lockPos: Locator
  readonly returnBtn: Locator
  readonly payBtn: Locator

  constructor(page: Page) {
    this.page = page
    // Header
    this.header = page.getByTestId("erply-header")
    this.userMenu = page.getByTestId("header-user-menu")
    this.userMenuSignOut = page.locator("text=Sign out")
    // Alert
    this.alertMessage = page.getByTestId("alert")
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
    // Cart
    this.shoppingCart = page.locator(".bill-container")
    this.productRow = page.getByTestId("product-row")
    this.productRowName = page.getByTestId("product-name-cell")
    this.productRowQty = page.locator(
      '[data-testid="amount"][data-test-key="product-amount-1"]'
    )
    this.productRowDiscount = page.locator(
      '[data-testid="discount"][data-test-key="product-discount-1"]'
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
    this.orders = page.locator(
      '[data-testid="function-button"][data-test-key="orderSales"]'
    )
    this.layaways = page.locator(
      '[data-testid="function-button"][data-test-key="layawaySales"]'
    )
    this.offers = page.locator(
      '[data-testid="function-button"][data-test-key="offers"]'
    )
    // Sale option buttons
    this.goToMainViewBtn = page.locator(
      '[data-testid="sale-option-button"][data-test-key="special-go-to-main-view"]'
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
    this.promotions = page.locator(
      '[data-testid="sale-option-button"][data-test-key="promotions"]'
    )
    this.saveAsOffer = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saveAsOffer"]'
    )
    this.extendBtn = page.locator(
      '[data-testid="sale-option-button"][data-test-key="saleoption-extend-btn"]'
    )
    // Promotions
    this.manualPromotion = page.getByTestId("promotion")
    this.closePromotionsView = page.getByTestId("custom-close-button")
    // Switch User, Lock POS, Return, Pay
    this.lockPos = page.getByTestId("hard-logout-btn")
    this.returnBtn = page.getByTestId("return-btn")
    this.payBtn = page.getByTestId("payment-button")
  }

  // Header
  async userSignOutUserMenu() {
    await this.userMenu.click()
    await this.userMenuSignOut.click()
  }

  // Main view

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

  async clickPickupOrders() {
    await this.orders.click()
  }

  async clickLayaways() {
    await this.layaways.click()
  }

  async clickOffers() {
    await this.offers.click()
  }

  // Sale options buttons
  async clickMainViewBtn() {
    await this.goToMainViewBtn.click()
  }

  async clickSaveAsOrder() {
    await this.saveAsOrder.click()
  }

  async clickSaveAsLayaway() {
    await this.saveAsLayaway.click()
  }

  async clickPromotions() {
    await this.promotions.click()
  }

  async clickSaveAsWaybill() {
    await this.saveAsWaybill.click()
  }

  async clickSaveAsOffer() {
    await this.extendBtn.click()
    await this.saveAsOffer.click()
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

  async clickPayBtn() {
    await this.payBtn.click()
  }
}
