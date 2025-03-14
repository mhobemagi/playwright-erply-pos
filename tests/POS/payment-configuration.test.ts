import { expect } from "@playwright/test"
import { URLs } from "../../playwright.config"
import { test } from "../../fixtures/pages"
import {
  calculateShoppingCart,
  getCustomerDetailsFromFile,
  getProductDetailsFromFile,
  getSalesDocuments,
} from "../../utils/api-helpers"
import { CustomerDetails } from "../types/customer-details"
import { Product, ProductDetails } from "../types/product-details"
import { HelperBase } from "../pages/helper-base"
import { PaymentModal } from "../pages/payment-modal"
import exp = require("constants")

let cakeDetails: Product
let testUser: CustomerDetails
let testCustomer: string

const paymentMethods = [
  {
    type: "CASH",
    tender: "cash",
    alertmessage: "Reached cash limit",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CASH", paymentAmount)
      await expect(paymentModal.tenderContainers.cash).toBeVisible()
    },
    removeTender: async (paymentModal: any) => {
      if ((await paymentModal.tenderContainers.cash.count()) > 0) {
        if (paymentModal.tenderContainers.cash.isVisible()) {
          await paymentModal.removeReturnTender("CASH")
        }
      }
    },
    tenderTypeAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderButtons.cash).not.toBeVisible()
      expect(paymentModal.confirmPaymentBtn).toBeDisabled()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CASH"),
    tenderValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.cash).toContainText("5.00"),
    tenderReturnValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.cash).toContainText("-5.00"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.cash).toBeVisible()
      expect(paymentModal.originalTenderContainers.cash).toBeVisible()
    },
  },
  {
    type: "CARD",
    tender: "card",
    alertmessage: "Reached card limit",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CARD", paymentAmount)
      await expect(paymentModal.tenderContainers.card).toBeVisible()
    },
    removeTender: async (paymentModal: any) => {
      if ((await paymentModal.tenderContainers.card.count()) > 0) {
        if (paymentModal.tenderContainers.card.isVisible()) {
          await paymentModal.removeReturnTender("CARD")
        }
      }
    },
    tenderTypeAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderButtons.card).not.toBeVisible()
      expect(paymentModal.confirmPaymentBtn).toBeDisabled()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CARD"),
    tenderValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.card).toContainText("5.00"),
    tenderReturnValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.card).toContainText("-5.00"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.card).toBeVisible()
      expect(paymentModal.originalTenderContainers.card).toBeVisible()
    },
  },
  {
    type: "STORE CREDIT",
    tender: "storecredit",
    alertmessage: "Reached storecredit limit",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("STORE_CREDIT", paymentAmount)
      await expect(paymentModal.tenderContainers.storecredit).toBeVisible()
    },
    removeTender: async (paymentModal: any) => {
      if ((await paymentModal.tenderContainers.cash.count()) > 0) {
        if (paymentModal.tenderContainers.cash.isVisible()) {
          await paymentModal.removeReturnTender("STORE_CREDIT")
        }
      }
    },
    tenderTypeAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderButtons.storecredit).not.toBeVisible()
      expect(paymentModal.confirmPaymentBtn).toBeDisabled()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe(null),
    tenderValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.storecredit).toContainText("5.00"),
    tenderReturnValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.storecredit).toContainText("-5.00"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.cash).toBeVisible()
      expect(paymentModal.originalTenderContainers.cash).toBeVisible()
    },
  },
  {
    type: "CHECK",
    tender: "check",
    alertmessage: "Reached check limit",
    addPayment: async (paymentModal: any, paymentAmount: string) => {
      await paymentModal.addPaymentTender("CHECK", paymentAmount)
      await expect(paymentModal.tenderContainers.check).toBeVisible()
    },
    removeTender: async (paymentModal: any) => {
      if ((await paymentModal.tenderContainers.check.count()) > 0) {
        if (paymentModal.tenderContainers.check.isVisible()) {
          await paymentModal.removeReturnTender("CHECK")
        }
      }
    },
    tenderTypeAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderButtons.check).not.toBeVisible()
      expect(paymentModal.confirmPaymentBtn).toBeDisabled()
    },
    paymentTypeAssertion: (saleDoc: any) =>
      expect(saleDoc.paymentType).toBe("CHECK"),
    tenderValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.check).toContainText("5.00"),
    tenderReturnValueAssertion: (paymentModal: any) =>
      expect(paymentModal.tenderContainers.check).toContainText("-5.00"),
    paymentTenderAssertion: (paymentModal: any) => {
      expect(paymentModal.tenderContainers.check).toBeVisible()
      expect(paymentModal.originalTenderContainers.check).toBeVisible()
    },
  },
]

test.describe("Payment configuration tests", () => {
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
    test(`User can set limit to tenders on sale for ${payment.type}`, async ({
      home,
      paymentConfiguration,
      paymentModal,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()

      const tenderLimit = "5"

      await home.openPaymentConfigurations()
      await paymentConfiguration.setTenderLimitOnSale(
        payment.tender,
        tenderLimit
      )
      await home.closeSettings()
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
      await expect(home.alertMessage).toContainText(payment.alertmessage)
      await payment.tenderValueAssertion(paymentModal)
      await expect(paymentModal.confirmPaymentBtn).toBeDisabled()
      await paymentModal.cancelPayment()

      // Reset tender limit
      await home.openPaymentConfigurations()
      await paymentConfiguration.setTenderLimitOnSale(payment.tender, "")
    })
  }

  for (const payment of paymentMethods) {
    test(`User can set limit to tenders on return with receipt for ${payment.type}`, async ({
      home,
      paymentConfiguration,
      paymentModal,
      recentSales,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()

      const tenderLimit = "5"

      await home.openPaymentConfigurations()
      await paymentConfiguration.setTenderLimitOnReturnWithReceipt(
        payment.tender,
        tenderLimit
      )
      await home.closeSettings()
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
      await payment.removeTender(paymentModal)
      await payment.addPayment(paymentModal, paymentAmount)
      await expect(home.alertMessage).toContainText(payment.alertmessage)
      await payment.tenderReturnValueAssertion(paymentModal)
      await expect(paymentModal.confirmPaymentBtn).toBeDisabled()
      await paymentModal.cancelPayment()

      // Reset tender limit
      await home.openPaymentConfigurations()
      await paymentConfiguration.setTenderLimitOnReturnWithReceipt(
        payment.tender,
        ""
      )
    })
  }

  for (const payment of paymentMethods) {
    test(`User can set limit to tenders on return without receipt for ${payment.type}`, async ({
      home,
      paymentConfiguration,
      paymentModal,
      productInformation,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()

      const tenderLimit = "5"

      await home.openPaymentConfigurations()
      await paymentConfiguration.setTenderLimitOnReturnWithoutReceipt(
        payment.tender,
        tenderLimit
      )
      await home.closeSettings()
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
      await expect(home.alertMessage).toContainText(payment.alertmessage)
      await payment.tenderReturnValueAssertion(paymentModal)
      await expect(paymentModal.confirmPaymentBtn).toBeDisabled()
      await paymentModal.cancelPayment()

      // Reset tender limit
      await home.openPaymentConfigurations()
      await paymentConfiguration.setTenderLimitOnReturnWithoutReceipt(
        payment.tender,
        ""
      )
    })
  }

  for (const payment of paymentMethods) {
    test(`User can hide tenders on sale for ${payment.type}`, async ({
      home,
      paymentConfiguration,
      paymentModal,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()

      await home.openPaymentConfigurations()
      await paymentConfiguration.setAllowedTenderTypeOnSale(payment.tender)
      await home.closeSettings()
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
      await payment.tenderTypeAssertion(paymentModal)
      await paymentModal.cancelPayment()

      // Reset tender limit
      await home.openPaymentConfigurations()
      await paymentConfiguration.setAllowedTenderTypeOnSale(payment.tender)
    })
  }

  for (const payment of paymentMethods) {
    test(`User can hide tenders on return with receipt for ${payment.type}`, async ({
      home,
      paymentConfiguration,
      paymentModal,
      recentSales,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()

      await home.openPaymentConfigurations()
      await paymentConfiguration.setAllowedTenderTypeOnReturnWithReceipt(
        payment.tender
      )
      await home.closeSettings()
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
      await payment.removeTender(paymentModal)
      await payment.tenderTypeAssertion(paymentModal)
      await paymentModal.cancelPayment()

      // Reset tender limit
      await home.openPaymentConfigurations()
      await paymentConfiguration.setAllowedTenderTypeOnReturnWithReceipt(
        payment.tender
      )
    })
  }

  for (const payment of paymentMethods) {
    test(`User can hide tenders on return without receipt for ${payment.type}`, async ({
      home,
      paymentConfiguration,
      paymentModal,
      productInformation,
      context,
      page,
    }) => {
      await expect(home.userMenu).toBeVisible()
      await expect(home.customerInfo).toBeVisible()

      await home.openPaymentConfigurations()
      await paymentConfiguration.setAllowedTenderTypeOnReturnWithoutReceipt(
        payment.tender
      )
      await home.closeSettings()
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
      await payment.tenderTypeAssertion(paymentModal)
      await paymentModal.cancelPayment()

      // Reset tender limit
      await home.openPaymentConfigurations()
      await paymentConfiguration.setAllowedTenderTypeOnReturnWithoutReceipt(
        payment.tender
      )
    })
  }
})
