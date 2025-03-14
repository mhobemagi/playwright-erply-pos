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

test.describe("Account Sales tests", () => {
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
    test(`User can finalize an account sale by fully prepaying with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      accountSales,
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

      await home.clickAccountSales()
      await expect(accountSales.accountSalesModal).toBeVisible()
      await accountSales.applyFullPrepayment()
      await expect(paymentModal.paymentModal).toBeVisible()
      const paymentAmount: string = cartTotals.cartTotalSum!
      await payment.addPayment(paymentModal, paymentAmount)
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceWaybillId = await paymentModal.retrieveInvoiceId()
      const invoiceWaybillType = "INVWAYBILL"
      const invoiceWaybillResponse = await getSalesDocuments(
        String(invoiceWaybillId),
        String(invoiceWaybillType),
        context.request
      )
      const invoiceWaybillDoc = invoiceWaybillResponse.records[0]

      expect(invoiceWaybillDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(invoiceWaybillDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(invoiceWaybillDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(invoiceWaybillDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(invoiceWaybillDoc)
      expect(invoiceWaybillDoc.type).toBe("INVWAYBILL")
      expect(invoiceWaybillDoc.invoiceState).toBe("READY")
      expect(invoiceWaybillDoc.paymentStatus).toBe("PAID")

      await paymentModal.closeSaleConfirmation()
      await home.clickMainViewBtn()
      await home.clickPayAnInvoice()

      const noInvoiceAlert = home.alertMessage.getByText("No invoices")
      const payAnInvoiceModal = page.locator("h5", {
        hasText: "Pay an invoice",
      })
      if (await noInvoiceAlert.isVisible()) {
        await expect(payAnInvoiceModal).not.toBeVisible()
      } else {
        const invoiceNumber = page.locator("td", {
          hasText: `${invoiceWaybillId}`,
        })
        await expect(invoiceNumber).not.toBeVisible()
        await expect(payAnInvoiceModal).toBeVisible()
      }
    })
  }

  for (const payment of paymentMethods) {
    test(`User can finalize an account sale after partially prepaying with 100% ${payment.type}`, async ({
      home,
      paymentModal,
      accountSales,
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

      await home.clickAccountSales()
      await expect(accountSales.accountSalesModal).toBeVisible()
      await accountSales.applyPartialPrepayment()
      await expect(paymentModal.paymentModal).toBeVisible()
      const { paymentTotal } = await paymentModal.getPaymentTotal()
      await payment.addPayment(paymentModal, String(paymentTotal))
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceWaybillId = await paymentModal.retrieveInvoiceId()
      const invoiceWaybillType = "INVWAYBILL"
      const invoiceWaybillResponse = await getSalesDocuments(
        String(invoiceWaybillId),
        String(invoiceWaybillType),
        context.request
      )
      const invoiceWaybillDoc = invoiceWaybillResponse.records[0]

      expect(invoiceWaybillDoc.clientName).toBe(testUser.fullName)
      expect(HelperBase.formatCurrency(invoiceWaybillDoc.netTotal)).toBe(
        cartTotals.cartNetSum
      )
      expect(HelperBase.formatCurrency(invoiceWaybillDoc.vatTotal)).toBe(
        cartTotals.cartTaxSum
      )
      expect(HelperBase.formatCurrency(invoiceWaybillDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(invoiceWaybillDoc)
      expect(invoiceWaybillDoc.type).toBe("INVWAYBILL")
      expect(invoiceWaybillDoc.invoiceState).toBe("READY")
      expect(invoiceWaybillDoc.paymentStatus).toBe("UNPAID")

      await paymentModal.closeSaleConfirmation()
      await home.clickMainViewBtn()
      await home.clickPayAnInvoice()

      const payAnInvoiceModal = page.locator("h5", {
        hasText: "Pay an invoice",
      })
      const invoiceWaybill = page.locator("td", {
        hasText: `${invoiceWaybillId}`,
      })
      await expect(payAnInvoiceModal).toBeVisible()
      await invoiceWaybill.click()

      await expect(paymentModal.paymentModal).toBeVisible()
      await payment.addPayment(paymentModal, String(paymentTotal))
      await paymentModal.confirmPayment()

      await paymentModal.saleConfirmationIsVisible()

      const invoiceWaybillCompleteResponse = await getSalesDocuments(
        String(invoiceWaybillId),
        String(invoiceWaybillType),
        context.request
      )
      const invoiceWaybillCompleteDoc =
        invoiceWaybillCompleteResponse.records[0]

      expect(invoiceWaybillCompleteDoc.clientName).toBe(testUser.fullName)
      expect(
        HelperBase.formatCurrency(invoiceWaybillCompleteDoc.netTotal)
      ).toBe(cartTotals.cartNetSum)
      expect(
        HelperBase.formatCurrency(invoiceWaybillCompleteDoc.vatTotal)
      ).toBe(cartTotals.cartTaxSum)
      expect(HelperBase.formatCurrency(invoiceWaybillCompleteDoc.total)).toBe(
        cartTotals.cartTotalSum
      )
      payment.paymentTypeAssertion(invoiceWaybillCompleteDoc)
      expect(invoiceWaybillCompleteDoc.type).toBe("INVWAYBILL")
      expect(invoiceWaybillCompleteDoc.invoiceState).toBe("READY")
      expect(invoiceWaybillCompleteDoc.paymentStatus).toBe("PAID")

      await paymentModal.closeSaleConfirmation()
      await home.clickPayAnInvoice()

      const noInvoiceAlert = home.alertMessage.getByText("No invoices")
      if (await noInvoiceAlert.isVisible()) {
        await expect(payAnInvoiceModal).not.toBeVisible()
      } else {
        await expect(invoiceWaybill).not.toBeVisible()
        await expect(payAnInvoiceModal).toBeVisible()
      }
    })
  }

  test("User cannot finalize account sale with store credit", async ({
    home,
    paymentModal,
    accountSales,
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

    await home.clickAccountSales()
    await expect(accountSales.accountSalesModal).toBeVisible()
    await accountSales.applyFullPrepayment()
    await expect(paymentModal.paymentModal).toBeVisible()
    await expect(paymentModal.tenderButtons.storecredit).not.toBeVisible()
  })

  // User cant finalize account sale if its over credit limit
})
