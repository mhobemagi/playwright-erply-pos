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

test.describe("Waybill tests", () => {
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
    test(`User can create a fully paid waybill with ${payment.type}`, async ({
      home,
      paymentModal,
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

      await home.clickSaveAsWaybill()

      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
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
      payment.paymentTypeAssertion(saleDoc)
      expect(saleDoc.type).toBe("WAYBILL")
      expect(saleDoc.invoiceState).toBe("READY")
      expect(saleDoc.paymentStatus).toBe("PAID")

      await paymentModal.closeSaleConfirmation()
    })
  }

  test("User cannot save waybill without a customer", async ({
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

    await home.clickSaveAsWaybill()
    await expect(paymentModal.paymentModal).toBeHidden()
    await expect(home.alertMessage).toContainText(
      "Can not create to POS default customer"
    )
  })
})
