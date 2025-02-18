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
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("PAID"),
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
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("PAID"),
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
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("UNPAID"),
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
    paymentStatusAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentStatus).toBe("PAID"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.check).toBeVisible()
      expect(paymentModal.originalTenderContainers.check).toBeVisible()
    },
  },
]

test.describe("Returns tests", () => {
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
    test(`User can make a referenced return with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      recentSales,
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

      await paymentModal.closeSaleConfirmation()
      await home.clickRecentSales()
      await recentSales.retrieveInvoice(String(invoiceId))

      await expect(recentSales.productReturnView).toBeVisible()
      await expect(recentSales.productReturnTitle).toContainText(
        String(invoiceId)
      )
      await recentSales.addReturnToCart()

      const shoppingCartBodyReturn = {
        productID1: cakeDetails.id,
        amount1: -1,
      }

      const cartReturn = await calculateShoppingCart(
        shoppingCartBodyReturn,
        context.request
      )

      const cartTotalsReturn = await home.getCartTotals()

      expect(cartTotalsReturn.cartTotalSum).toBe(
        HelperBase.formatCurrency(cartReturn.total)
      )
      expect(cartTotalsReturn.cartNetSum).toBe(
        HelperBase.formatCurrency(cartReturn.netTotal)
      )
      expect(cartTotalsReturn.cartTaxSum).toBe(
        HelperBase.formatCurrency(cartReturn.vatTotal)
      )

      await home.clickPayBtn()

      await expect(paymentModal.paymentModal).toBeVisible()
      await payment.paymentTenderAssertion(paymentModal)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const creditInvoiceId = await paymentModal.retrieveInvoiceId()
      const creditInvoiceType = "CREDITINVOICE"
      const returnResponse = await getSalesDocuments(
        String(creditInvoiceId),
        String(creditInvoiceType),
        context.request
      )
      const returnDoc = returnResponse.records[0]

      expect(returnDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(returnDoc.netTotal)).toBe(
        cartTotalsReturn.cartNetSum
      )
      expect(HelperBase.formatCurrency(returnDoc.vatTotal)).toBe(
        cartTotalsReturn.cartTaxSum
      )
      expect(HelperBase.formatCurrency(returnDoc.total)).toBe(
        cartTotalsReturn.cartTotalSum
      )
      payment.paymentTypeAssertion(saleDoc)
      expect(returnDoc.type).toBe("CREDITINVOICE")
      expect(returnDoc.invoiceState).toBe("READY")
      expect(returnDoc.paymentStatus).toBe("PAID")
      expect(returnDoc.baseDocuments[0].number).toBe(invoiceId)
      expect(returnDoc.baseDocuments[0].type).toBe("CASHINVOICE")
    })
  }

  for (const payment of paymentMethods) {
    test(`User can make a unreferenced return with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      productInformation,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()
      await home.userSearchesForCustomer(testCustomer)
      await home.userSearchesForProduct(cakeDetails.name.en)

      await home.openProductInformation()
      await expect(productInformation.productInformationModal).toBeVisible()
      await productInformation.decreaseQty()
      await expect(home.productRowQty.locator("input")).toHaveValue("-1")
      await productInformation.closeProductInformation()

      const shoppingCartBody = {
        productID1: cakeDetails.id,
        amount1: -1,
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

      await home.clickPayBtn()

      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const creditInvoiceId = await paymentModal.retrieveInvoiceId()
      const creditInvoiceType = "CREDITINVOICE"
      const returnResponse = await getSalesDocuments(
        String(creditInvoiceId),
        String(creditInvoiceType),
        context.request
      )
      const returnDoc = returnResponse.records[0]

      expect(returnDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(returnDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(returnDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(returnDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(returnDoc)
      payment.paymentStatusAssertion(returnDoc)
      expect(returnDoc.type).toBe("CREDITINVOICE")
      expect(returnDoc.invoiceState).toBe("READY")
    })
  }
})
