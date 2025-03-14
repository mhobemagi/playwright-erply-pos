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
import exp = require("constants")
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
    returnPaymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CASH"),
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("UNPAID"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.cash).toBeVisible()
      expect(paymentModal.originalTenderContainers.cash).toBeVisible()
    },
  },
  {
    type: "CARD",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CARD", paymentAmount)
      await expect(paymentModal.tenderContainers.card).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CARD"),
    returnPaymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CARD"),
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("UNPAID"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.card).toBeVisible()
      expect(paymentModal.originalTenderContainers.card).toBeVisible()
    },
  },
  {
    type: "STORE CREDIT",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("STORE_CREDIT", paymentAmount)
      await expect(paymentModal.tenderContainers.storecredit).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe(null),
    returnPaymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CASH"),
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("PAID"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.cash).toBeVisible()
      expect(paymentModal.originalTenderContainers.cash).toBeVisible()
    },
  },
  {
    type: "CHECK",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CHECK", paymentAmount)
      await expect(paymentModal.tenderContainers.check).toBeVisible()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CHECK"),
    returnPaymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CHECK"),
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("UNPAID"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.check).toBeVisible()
      expect(paymentModal.originalTenderContainers.check).toBeVisible()
    },
  },
]

test.describe("Layaways tests", () => {
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
    test(`User can finalize a fully prepaid layaway with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      layaways,
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

      await home.clickSaveAsLayaway()
      await expect(layaways.layawayModal).toBeVisible()
      await layaways.applyFullPrepayment()
      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
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
      payment.paymentTypeAssertion(layawayDoc)
      expect(layawayDoc.type).toBe("PREPAYMENT")
      expect(layawayDoc.invoiceState).toBe("READY")
      expect(layawayDoc.paymentStatus).toBe("PAID")

      await paymentModal.closeSaleConfirmation()

      await home.clickLayaways()
      await expect(layaways.layawayList).toBeVisible()
      await layaways.retrieveLayaway(String(layawayId))
      await expect(layaways.layawayActionSelection).toBeVisible()
      await layaways.clickFullyPayLayaway()

      await expect(paymentModal.paymentModal).toBeVisible()
      await expect(paymentModal.tenderContainers.paid).toBeVisible()
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
      expect(saleDoc.type).toBe("CASHINVOICE")
      expect(saleDoc.invoiceState).toBe("READY")
      expect(saleDoc.paymentType).toBe(null)
      expect(saleDoc.paymentStatus).toBe("PAID")
      expect(saleDoc.baseDocuments[0].number).toBe(layawayId)
      expect(saleDoc.baseDocuments[0].type).toBe("PREPAYMENT")

      await paymentModal.closeSaleConfirmation()
    })
  }

  for (const payment of paymentMethods) {
    test(`User can finalize a partially prepaid layaway with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      layaways,
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

      await home.clickSaveAsLayaway()
      await expect(layaways.layawayModal).toBeVisible()
      await layaways.applyPartialPrepayment()
      await expect(paymentModal.paymentModal).toBeVisible()
      const { paymentTotal } = await paymentModal.getPaymentTotal()
      await payment.addPayment(paymentModal, String(paymentTotal))
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
      payment.paymentTypeAssertion(layawayDoc)
      payment.paymentStatusAssertion(layawayDoc)
      expect(layawayDoc.type).toBe("PREPAYMENT")
      expect(layawayDoc.invoiceState).toBe("READY")

      await paymentModal.closeSaleConfirmation()

      await home.clickLayaways()
      await expect(layaways.layawayList).toBeVisible()
      await layaways.retrieveLayaway(String(layawayId))
      await expect(layaways.layawayActionSelection).toBeVisible()
      await layaways.clickFullyPayLayaway()

      await expect(paymentModal.paymentModal).toBeVisible()
      await expect(paymentModal.tenderContainers.paid).toBeVisible()
      await expect(paymentModal.tenderContainers.paid).toContainText(
        String(paymentTotal)
      )
      const { remainingBalance } = await paymentModal.getRemainingBalance()
      await payment.addPayment(paymentModal, String(remainingBalance))
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
      expect(HelperBase.formatCurrency(saleDoc.paid)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(saleDoc)
      expect(saleDoc.type).toBe("CASHINVOICE")
      expect(saleDoc.invoiceState).toBe("READY")
      expect(saleDoc.baseDocuments[0].number).toBe(layawayId)
      expect(saleDoc.baseDocuments[0].type).toBe("PREPAYMENT")

      await paymentModal.closeSaleConfirmation()
    })
  }

  for (const payment of paymentMethods) {
    test(`User can cancel a layaway that was fully paid with 100%${payment.type}`, async ({
      home,
      paymentModal,
      layaways,
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

      await home.clickSaveAsLayaway()
      await expect(layaways.layawayModal).toBeVisible()
      await layaways.applyFullPrepayment()
      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
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
      payment.paymentTypeAssertion(layawayDoc)
      expect(layawayDoc.type).toBe("PREPAYMENT")
      expect(layawayDoc.invoiceState).toBe("READY")
      expect(layawayDoc.paymentStatus).toBe("PAID")

      await paymentModal.closeSaleConfirmation()

      await home.clickLayaways()
      await expect(layaways.layawayList).toBeVisible()
      await layaways.retrieveLayaway(String(layawayId))
      await expect(layaways.layawayActionSelection).toBeVisible()
      await layaways.clickCancelLayaway()

      await expect(paymentModal.paymentModal).toBeVisible()
      await payment.paymentTenderAssertion(paymentModal)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceId = await paymentModal.retrieveInvoiceId()
      const response = await getSalesDocuments(
        String(invoiceId),
        String(layawayInvoiceType),
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
      payment.returnPaymentTypeAssertion(saleDoc)
      expect(saleDoc.type).toBe("PREPAYMENT")
      expect(saleDoc.invoiceState).toBe("CANCELLED")
      expect(saleDoc.paymentStatus).toBe("UNPAID")

      await paymentModal.closeSaleConfirmation()
    })
  }

  for (const payment of paymentMethods) {
    test(`User can cancel a layaway that was partially paid with 100%${payment.type}`, async ({
      home,
      paymentModal,
      layaways,
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

      await home.clickSaveAsLayaway()
      await expect(layaways.layawayModal).toBeVisible()
      await layaways.applyPartialPrepayment()
      await expect(paymentModal.paymentModal).toBeVisible()
      const { paymentTotal } = await paymentModal.getPaymentTotal()
      await payment.addPayment(paymentModal, String(paymentTotal))
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
      payment.paymentTypeAssertion(layawayDoc)
      payment.paymentStatusAssertion(layawayDoc)
      expect(layawayDoc.type).toBe("PREPAYMENT")
      expect(layawayDoc.invoiceState).toBe("READY")

      await paymentModal.closeSaleConfirmation()

      await home.clickLayaways()
      await expect(layaways.layawayList).toBeVisible()
      await layaways.retrieveLayaway(String(layawayId))
      await expect(layaways.layawayActionSelection).toBeVisible()
      await layaways.clickCancelLayaway()

      await expect(paymentModal.paymentModal).toBeVisible()
      await payment.paymentTenderAssertion(paymentModal)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceId = await paymentModal.retrieveInvoiceId()
      const response = await getSalesDocuments(
        String(invoiceId),
        String(layawayInvoiceType),
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
      payment.returnPaymentTypeAssertion(saleDoc)
      expect(saleDoc.type).toBe("PREPAYMENT")
      expect(saleDoc.invoiceState).toBe("CANCELLED")
      expect(saleDoc.paymentStatus).toBe("UNPAID")

      await paymentModal.closeSaleConfirmation()
    })
  }

  test("User cannot save layaway without a customer", async ({
    home,
    paymentModal,
    layaways,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
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

    await home.clickSaveAsLayaway()
    await expect(layaways.layawayModal).toBeHidden()
    await expect(home.alertMessage).toContainText(
      "Can not create to POS default customer"
    )
  })
})
