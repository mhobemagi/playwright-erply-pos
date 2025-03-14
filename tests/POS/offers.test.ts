import { expect } from "playwright/test"
import { test } from "../../fixtures/pages"
import { URLs } from "../../playwright.config"
import {
  getProductDetailsFromFile,
  getCustomerDetailsFromFile,
  getSalesDocuments,
  calculateShoppingCart,
} from "../../utils/api-helpers"
import { CustomerDetails } from "../types/customer-details"
import { Product, ProductDetails } from "../types/product-details"
import { HelperBase } from "../pages/helper-base"

let cakeDetails: Product
let testUser: CustomerDetails
let testCustomer: string

const paymentMethods = [
  {
    type: "CASH",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CASH", paymentAmount)
      await expect(paymentModal.tenderContainers.cash).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CASH"),
  },
  {
    type: "CARD",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CARD", paymentAmount)
      await expect(paymentModal.tenderContainers.card).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CARD"),
  },
  {
    type: "STORE CREDIT",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("STORE_CREDIT", paymentAmount)
      await expect(paymentModal.tenderContainers.storecredit).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe(null),
  },
  {
    type: "CHECK",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CHECK", paymentAmount)
      await expect(paymentModal.tenderContainers.check).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CHECK"),
  },
]

test.describe("Offers tests", () => {
  test.beforeAll(() => {
    const productDetails: ProductDetails = getProductDetailsFromFile()
    cakeDetails = productDetails.Cake

    const customerDetails: Record<string, CustomerDetails> =
      getCustomerDetailsFromFile()
    const customer = customerDetails["5"]
    testCustomer = `${customer.firstName} ${customer.lastName}`
    testUser = customerDetails["5"]
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(URLs.BASE_URL)
    await page.locator("text=Location #1").click()
    await page.waitForLoadState("load")
  })

  for (const payment of paymentMethods) {
    test(`User can finalize a saved offer with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      offers,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()
      await home.userSearchesForCustomer(testCustomer)
      await home.userSearchesForProduct(cakeDetails.name.en)

      const shoppingCartBody = {
        productID1: cakeDetails.id,
        amount1: 1,
      }

      const cart = await calculateShoppingCart(
        shoppingCartBody,
        context.request
      )

      const cartTotals = await home.getCartTotals()

      expect(cartTotals.cartTotalSum).toBe(
        HelperBase.formatCurrency(cart.total)
      )
      expect(cartTotals.cartNetSum).toBe(
        HelperBase.formatCurrency(cart.netTotal)
      )
      expect(cartTotals.cartTaxSum).toBe(
        HelperBase.formatCurrency(cart.vatTotal)
      )

      await home.clickSaveAsOffer()
      await page.waitForLoadState("networkidle")
      await home.clickMainViewBtn()
      await home.clickOffers()

      await expect(offers.offersModal).toBeVisible()
      const offerId = await offers.retrieveOfferId()
      const offerType = "OFFER"
      const offerResponse = await getSalesDocuments(
        String(offerId),
        String(offerType),
        context.request
      )
      const offerDoc = offerResponse.records[0]

      expect(offerDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(offerDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(offerDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(offerDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      expect(offerDoc.type).toBe("OFFER")
      expect(offerDoc.invoiceState).toBe("READY")
      expect(offerDoc.paymentType).toBe(null)
      expect(offerDoc.paymentStatus).toBe("UNPAID")

      await offers.pickUpOffer()

      const offerCartTotals = await home.getCartTotals()

      expect(offerCartTotals.cartTotalSum).toBe(
        HelperBase.formatCurrency(cart.total)
      )
      expect(offerCartTotals.cartNetSum).toBe(
        HelperBase.formatCurrency(cart.netTotal)
      )
      expect(offerCartTotals.cartTaxSum).toBe(
        HelperBase.formatCurrency(cart.vatTotal)
      )

      await home.clickPayBtn()

      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = offerCartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceId = await paymentModal.retrieveInvoiceId()
      const invoiceType = "CASHINVOICE"
      const response = await getSalesDocuments(
        String(invoiceId),
        String(invoiceType),
        context.request
      )
      const saleDoc = response.records[0]

      expect(saleDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(saleDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(saleDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(saleDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(saleDoc)
      expect(saleDoc.type).toBe("CASHINVOICE")
      expect(saleDoc.invoiceState).toBe("READY")
      expect(saleDoc.paymentStatus).toBe("PAID")
      expect(saleDoc.baseDocuments[0].number).toBe(offerId)
      expect(saleDoc.baseDocuments[0].type).toBe("OFFER")

      await paymentModal.closeSaleConfirmation()
    })
  }

  for (const payment of paymentMethods) {
    test(`User can finalize a saved offer with applied promotion with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      offers,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()
      await home.userSearchesForCustomer(testCustomer)
      await home.userSearchesForProduct(cakeDetails.name.en)

      await home.clickPromotions()
      await home.applyManualPromotion()
      await home.closePromotions()
      await expect(home.productRowDiscount).toContainText("Manual Promotion")
      await expect(home.cartDiscountSum).toBeVisible()

      const shoppingCartBody = {
        manualPromotionIDs: 1,
        productID1: cakeDetails.id,
        amount1: 1,
      }

      const cart = await calculateShoppingCart(
        shoppingCartBody,
        context.request
      )

      const cartTotals = await home.getCartTotals()

      expect(cartTotals.cartTotalSum).toBe(
        HelperBase.formatCurrency(cart.total)
      )
      expect(cartTotals.cartNetSum).toBe(
        HelperBase.formatCurrency(cart.netTotal)
      )
      expect(cartTotals.cartTaxSum).toBe(
        HelperBase.formatCurrency(cart.vatTotal)
      )

      await home.clickSaveAsOffer()
      await page.waitForLoadState("networkidle")
      await home.clickMainViewBtn()
      await home.clickOffers()

      await expect(offers.offersModal).toBeVisible()
      const offerId = await offers.retrieveOfferId()
      const offerType = "OFFER"
      const offerResponse = await getSalesDocuments(
        String(offerId),
        String(offerType),
        context.request
      )
      const offerDoc = offerResponse.records[0]

      expect(offerDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(offerDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(offerDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(offerDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      expect(offerDoc.type).toBe("OFFER")
      expect(offerDoc.invoiceState).toBe("READY")
      expect(offerDoc.paymentType).toBe(null)
      expect(offerDoc.paymentStatus).toBe("UNPAID")

      await offers.pickUpOffer()

      const offerCartTotals = await home.getCartTotals()

      expect(offerCartTotals.cartTotalSum).toBe(
        HelperBase.formatCurrency(cart.total)
      )
      expect(offerCartTotals.cartNetSum).toBe(
        HelperBase.formatCurrency(cart.netTotal)
      )
      expect(offerCartTotals.cartTaxSum).toBe(
        HelperBase.formatCurrency(cart.vatTotal)
      )

      await home.clickPayBtn()

      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = offerCartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceId = await paymentModal.retrieveInvoiceId()
      const invoiceType = "CASHINVOICE"
      const response = await getSalesDocuments(
        String(invoiceId),
        String(invoiceType),
        context.request
      )
      const saleDoc = response.records[0]

      expect(saleDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(saleDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(saleDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(saleDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(saleDoc)
      expect(saleDoc.type).toBe("CASHINVOICE")
      expect(saleDoc.invoiceState).toBe("READY")
      expect(saleDoc.paymentStatus).toBe("PAID")
      expect(saleDoc.baseDocuments[0].number).toBe(offerId)
      expect(saleDoc.baseDocuments[0].type).toBe("OFFER")

      await paymentModal.closeSaleConfirmation()
    })
  }

  test("User can save document as layaway from the offer using 100% cash", async ({
    home,
    paymentModal,
    layaways,
    offers,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSearchesForCustomer(testCustomer)
    await home.userSearchesForProduct(cakeDetails.name.en)

    const shoppingCartBody = {
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveAsOffer()
    await page.waitForLoadState("networkidle")
    await home.clickMainViewBtn()
    await home.clickOffers()

    await expect(offers.offersModal).toBeVisible()
    const offerId = await offers.retrieveOfferId()
    const offerType = "OFFER"
    const offerResponse = await getSalesDocuments(
      String(offerId),
      String(offerType),
      context.request
    )
    const offerDoc = offerResponse.records[0]

    expect(offerDoc.clientName).toBe(testUser.fullName)
    expect(HelperBase.formatCurrency(offerDoc.netTotal)).toBe(
      cartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(offerDoc.vatTotal)).toBe(
      cartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(offerDoc.total)).toBe(
      cartTotals.cartTotalSum
    )
    expect(offerDoc.type).toBe("OFFER")
    expect(offerDoc.invoiceState).toBe("READY")
    expect(offerDoc.paymentType).toBe(null)
    expect(offerDoc.paymentStatus).toBe("UNPAID")

    await offers.pickUpOffer()

    const offerCartTotals = await home.getCartTotals()

    expect(offerCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(offerCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(offerCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickSaveAsLayaway()
    await expect(layaways.layawayModal).toBeVisible()
    await layaways.applyPartialPrepayment()
    await expect(paymentModal.paymentModal).toBeVisible()
    const { paymentTotal } = await paymentModal.getPaymentTotal()
    await paymentModal.addPaymentTender("CASH", String(paymentTotal))
    await paymentModal.confirmPayment()

    await paymentModal.saleConfirmationIsVisible()

    const layawayId = await paymentModal.retrieveInvoiceId()
    const layawayInvoiceType = "PREPAYMENT"
    const layawayResponse = await getSalesDocuments(
      String(layawayId),
      String(layawayInvoiceType),
      context.request
    )
    const layawayDoc = layawayResponse.records[0]

    expect(layawayDoc.clientName).toBe(testUser.fullName)
    expect(HelperBase.formatCurrency(layawayDoc.netTotal)).toBe(
      cartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(layawayDoc.vatTotal)).toBe(
      cartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(layawayDoc.total)).toBe(
      cartTotals.cartTotalSum
    )
    expect(HelperBase.formatCurrency(layawayDoc.paid)).toBe(
      HelperBase.formatCurrency(paymentTotal)
    )
    expect(layawayDoc.type).toBe("PREPAYMENT")
    expect(layawayDoc.invoiceState).toBe("READY")
    expect(offerDoc.paymentType).toBe(null)
    expect(offerDoc.paymentStatus).toBe("UNPAID")
    expect(layawayDoc.baseDocuments[0].number).toBe(offerId)
    expect(layawayDoc.baseDocuments[0].type).toBe("OFFER")

    await paymentModal.closeSaleConfirmation()
  })

  test("User can save document as order from the offer using 100% cash", async ({
    home,
    paymentModal,
    offers,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSearchesForCustomer(testCustomer)
    await home.userSearchesForProduct(cakeDetails.name.en)

    const shoppingCartBody = {
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveAsOffer()
    await page.waitForLoadState("networkidle")
    await home.clickMainViewBtn()
    await home.clickOffers()

    await expect(offers.offersModal).toBeVisible()
    const offerId = await offers.retrieveOfferId()
    const offerType = "OFFER"
    const offerResponse = await getSalesDocuments(
      String(offerId),
      String(offerType),
      context.request
    )
    const offerDoc = offerResponse.records[0]

    expect(offerDoc.clientName).toBe(testUser.fullName)
    expect(HelperBase.formatCurrency(offerDoc.netTotal)).toBe(
      cartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(offerDoc.vatTotal)).toBe(
      cartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(offerDoc.total)).toBe(
      cartTotals.cartTotalSum
    )
    expect(offerDoc.type).toBe("OFFER")
    expect(offerDoc.invoiceState).toBe("READY")
    expect(offerDoc.paymentType).toBe(null)
    expect(offerDoc.paymentStatus).toBe("UNPAID")

    await offers.pickUpOffer()

    const offerCartTotals = await home.getCartTotals()

    expect(offerCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(offerCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(offerCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickSaveAsOrder()
    await expect(paymentModal.paymentModal).toBeVisible()
    const paymentAmount: string = cartTotals.cartTotalSum!
    await paymentModal.addPaymentTender("CASH", paymentAmount)
    await paymentModal.confirmPayment()

    await paymentModal.saleConfirmationIsVisible()

    const orderId = await paymentModal.retrieveInvoiceId()
    const orderInvoiceType = "ORDER"
    const orderResponse = await getSalesDocuments(
      String(orderId),
      String(orderInvoiceType),
      context.request
    )
    const orderDoc = orderResponse.records[0]

    expect(orderDoc.clientName).toBe(testUser.fullName)
    expect(HelperBase.formatCurrency(orderDoc.netTotal)).toBe(
      cartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(orderDoc.vatTotal)).toBe(
      cartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(orderDoc.total)).toBe(
      cartTotals.cartTotalSum
    )
    expect(orderDoc.type).toBe("ORDER")
    expect(orderDoc.invoiceState).toBe("READY")
    expect(orderDoc.paymentType).toBe("CASH")
    expect(orderDoc.paymentStatus).toBe("PAID")
    expect(orderDoc.baseDocuments[0].number).toBe(offerId)
    expect(orderDoc.baseDocuments[0].type).toBe("OFFER")

    await paymentModal.closeSaleConfirmation()
  })

  test("User can save document as waybill from the offer using 100% cash", async ({
    home,
    paymentModal,
    offers,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSearchesForCustomer(testCustomer)
    await home.userSearchesForProduct(cakeDetails.name.en)

    const shoppingCartBody = {
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveAsOffer()
    await page.waitForLoadState("networkidle")
    await home.clickMainViewBtn()
    await home.clickOffers()

    await expect(offers.offersModal).toBeVisible()
    const offerId = await offers.retrieveOfferId()
    const offerType = "OFFER"
    const offerResponse = await getSalesDocuments(
      String(offerId),
      String(offerType),
      context.request
    )
    const offerDoc = offerResponse.records[0]

    expect(offerDoc.clientName).toBe(testUser.fullName)
    expect(HelperBase.formatCurrency(offerDoc.netTotal)).toBe(
      cartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(offerDoc.vatTotal)).toBe(
      cartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(offerDoc.total)).toBe(
      cartTotals.cartTotalSum
    )
    expect(offerDoc.type).toBe("OFFER")
    expect(offerDoc.invoiceState).toBe("READY")
    expect(offerDoc.paymentType).toBe(null)
    expect(offerDoc.paymentStatus).toBe("UNPAID")

    await offers.pickUpOffer()

    const offerCartTotals = await home.getCartTotals()

    expect(offerCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(offerCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(offerCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickSaveAsWaybill()

    await expect(paymentModal.paymentModal).toBeVisible()
    const paymentAmount: string = cartTotals.cartTotalSum!
    await paymentModal.addPaymentTender("CASH", paymentAmount)
    await paymentModal.confirmPayment()

    await paymentModal.saleConfirmationIsVisible()

    const invoiceId = await paymentModal.retrieveInvoiceId()
    const invoiceType = "WAYBILL"
    const response = await getSalesDocuments(
      String(invoiceId),
      String(invoiceType),
      context.request
    )
    const saleDoc = response.records[0]

    expect(saleDoc.clientName).toBe(testUser.fullName)
    expect(HelperBase.formatCurrency(saleDoc.netTotal)).toBe(
      cartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(saleDoc.vatTotal)).toBe(
      cartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(saleDoc.total)).toBe(
      cartTotals.cartTotalSum
    )
    expect(saleDoc.type).toBe("WAYBILL")
    expect(saleDoc.invoiceState).toBe("READY")
    expect(saleDoc.paymentType).toBe("CASH")
    expect(saleDoc.paymentStatus).toBe("PAID")
    expect(saleDoc.baseDocuments[0].number).toBe(offerId)
    expect(saleDoc.baseDocuments[0].type).toBe("OFFER")

    await paymentModal.closeSaleConfirmation()
  })
})
