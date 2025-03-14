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

test.describe("Orders tests", () => {
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
    test(`User can pick up order which has no previous payments with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      orders,
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

      await home.clickSaveAsOrder()
      await expect(paymentModal.paymentModal).toBeVisible()
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
      expect(orderDoc.paymentType).toBe(null)
      expect(orderDoc.paymentStatus).toBe("UNPAID")

      await paymentModal.closeSaleConfirmation()

      await home.clickPickupOrders()
      await orders.retrieveOrder(String(orderId))
      await expect(orders.orderActionSelection).toBeVisible()
      await orders.clickPickUpOrder()

      await home.clickPayBtn()
      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
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
      expect(saleDoc.baseDocuments[0].number).toBe(orderId)
      expect(saleDoc.baseDocuments[0].type).toBe("ORDER")

      await paymentModal.closeSaleConfirmation()
    })
  }

  for (const payment of paymentMethods) {
    test(`User can pick up order which has been paid with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      orders,
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

      await home.clickSaveAsOrder()
      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
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
      payment.paymentTypeAssertion(orderDoc)
      expect(orderDoc.type).toBe("ORDER")
      expect(orderDoc.invoiceState).toBe("READY")
      expect(orderDoc.paymentStatus).toBe("PAID")

      await paymentModal.closeSaleConfirmation()

      await home.clickPickupOrders()
      await orders.retrieveOrder(String(orderId))
      await expect(orders.orderActionSelection).toBeVisible()
      await orders.clickPickUpOrder()

      await home.clickPayBtn()
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
      expect(saleDoc.baseDocuments[0].number).toBe(orderId)
      expect(saleDoc.baseDocuments[0].type).toBe("ORDER")

      await paymentModal.closeSaleConfirmation()
    })
  }
})
