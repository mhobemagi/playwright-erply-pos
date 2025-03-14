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

test.describe("Pending sales tests", () => {
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
    test(`User can finalize pending sale with 100% ${payment.type}`, async ({
      home,
      pendingSales,
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

      await home.clickSaveSale()
      await expect(home.cartTotal).not.toBeVisible()
      await home.clickPendingSales()
      await expect(pendingSales.pendingSalesModal).toBeVisible()
      await pendingSales.getLatestPendingSale(String(cartTotals.cartTotalSum))
      await expect(home.cartTotalSum).toHaveText(
        String(cartTotals.cartTotalSum)
      )

      const pendingSaleCartTotals = await home.getCartTotals()

      expect(pendingSaleCartTotals.cartTotalSum).toBe(
        HelperBase.formatCurrency(cart.total)
      )
      expect(pendingSaleCartTotals.cartNetSum).toBe(
        HelperBase.formatCurrency(cart.netTotal)
      )
      expect(pendingSaleCartTotals.cartTaxSum).toBe(
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
    })
  }

  test("User should be able to save and finalize pending sale with manual promotion and 100% CASH", async ({
    home,
    pendingSales,
    paymentModal,
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

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveSale()
    await expect(home.cartTotal).not.toBeVisible()
    await home.clickPendingSales()
    await expect(pendingSales.pendingSalesModal).toBeVisible()
    await pendingSales.getLatestPendingSale(String(cartTotals.cartTotalSum))
    await expect(home.cartTotalSum).toHaveText(String(cartTotals.cartTotalSum))
    await expect(home.productRowDiscount).toBeVisible()
    await expect(home.productRowDiscount).toContainText("Manual Promotion")
    await expect(home.cartDiscountSum).toBeVisible()

    const pendingSaleCartTotals = await home.getCartTotals()

    expect(pendingSaleCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(pendingSaleCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(pendingSaleCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickPayBtn()

    await expect(paymentModal.paymentModal).toBeVisible()
    const paymentAmount: string = cartTotals.cartTotalSum!
    await paymentModal.addPaymentTender("CASH", paymentAmount)
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
    expect(saleDoc.paymentType).toBe("CASH")
    expect(saleDoc.paymentStatus).toBe("PAID")

    await paymentModal.closeSaleConfirmation()
  })

  test("User should be able to apply different discounts and finalize pending sale with 100% CASH", async ({
    home,
    discounts,
    pendingSales,
    paymentModal,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSearchesForCustomer(testCustomer)
    await home.userSearchesForProduct(cakeDetails.name.en)

    await home.clickDiscounts()
    await expect(discounts.discountsModal).toBeVisible()
    await discounts.addPercentDiscount("15")
    await discounts.saveDiscount()
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    const shoppingCartBody = {
      discount1: 15,
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveSale()
    await expect(home.cartTotal).not.toBeVisible()
    await home.clickPendingSales()
    await expect(pendingSales.pendingSalesModal).toBeVisible()
    await pendingSales.getLatestPendingSale(String(cartTotals.cartTotalSum))
    await expect(home.cartTotalSum).toHaveText(String(cartTotals.cartTotalSum))
    await expect(home.productRowDiscount).toBeVisible()
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    const pendingSaleCartTotals = await home.getCartTotals()

    expect(pendingSaleCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(pendingSaleCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(pendingSaleCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickDiscounts()
    await expect(discounts.discountsModal).toBeVisible()
    await discounts.addPercentDiscount("50")
    await discounts.saveDiscount()
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    const newShoppingCartBody = {
      discount1: 50,
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const newCart = await calculateShoppingCart(
      newShoppingCartBody,
      context.request
    )

    const newCartTotals = await home.getCartTotals()

    expect(newCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(newCart.total)
    )
    expect(newCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(newCart.netTotal)
    )
    expect(newCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(newCart.vatTotal)
    )

    await home.clickPayBtn()

    await expect(paymentModal.paymentModal).toBeVisible()
    const paymentAmount: string = newCartTotals.cartTotalSum!
    await paymentModal.addPaymentTender("CASH", paymentAmount)
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
      newCartTotals.cartNetSum
    )
    expect(HelperBase.formatCurrency(saleDoc.vatTotal)).toBe(
      newCartTotals.cartTaxSum
    )
    expect(HelperBase.formatCurrency(saleDoc.total)).toBe(
      newCartTotals.cartTotalSum
    )
    expect(saleDoc.type).toBe("CASHINVOICE")
    expect(saleDoc.invoiceState).toBe("READY")
    expect(saleDoc.paymentType).toBe("CASH")
    expect(saleDoc.paymentStatus).toBe("PAID")

    await paymentModal.closeSaleConfirmation()
  })

  test("User should be able to save and finalize pending sale with manual promotion, discount and 100% CASH", async ({
    home,
    discounts,
    pendingSales,
    paymentModal,
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

    await home.clickDiscounts()
    await expect(discounts.discountsModal).toBeVisible()
    await discounts.addPercentDiscount("15")
    await discounts.saveDiscount()
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    const shoppingCartBody = {
      discount1: 15,
      manualPromotionIDs: 1,
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveSale()
    await expect(home.cartTotal).not.toBeVisible()
    await home.clickPendingSales()
    await expect(pendingSales.pendingSalesModal).toBeVisible()
    await pendingSales.getLatestPendingSale(String(cartTotals.cartTotalSum))
    await expect(home.cartTotalSum).toHaveText(String(cartTotals.cartTotalSum))
    await expect(home.productRowDiscount).toBeVisible()
    await expect(home.productRowDiscount).toContainText("Manual Promotion")
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    const pendingSaleCartTotals = await home.getCartTotals()

    expect(pendingSaleCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(pendingSaleCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(pendingSaleCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickPayBtn()

    await expect(paymentModal.paymentModal).toBeVisible()
    const paymentAmount: string = cartTotals.cartTotalSum!
    await paymentModal.addPaymentTender("CASH", paymentAmount)
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
    expect(saleDoc.paymentType).toBe("CASH")
    expect(saleDoc.paymentStatus).toBe("PAID")

    await paymentModal.closeSaleConfirmation()
  })

  test("User can finalize the pending sale with negative quantity, promotion and 100% CASH", async ({
    home,
    pendingSales,
    paymentModal,
    discounts,
    productInformation,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSearchesForCustomer(testCustomer)
    await home.userSearchesForProduct(cakeDetails.name.en)

    await home.clickDiscounts()
    await expect(discounts.discountsModal).toBeVisible()
    await discounts.addPercentDiscount("5")
    await discounts.saveDiscount()
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    await home.openProductInformation()
    await productInformation.decreaseQty()
    await productInformation.closeProductInformation()

    const shoppingCartBody = {
      discount1: 5,
      productID1: cakeDetails.id,
      amount1: -1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveSale()
    await expect(home.cartTotal).not.toBeVisible()
    await home.clickPendingSales()
    await expect(pendingSales.pendingSalesModal).toBeVisible()
    await pendingSales.getLatestPendingSale(String(cartTotals.cartTotalSum))
    await expect(home.cartTotalSum).toHaveText(String(cartTotals.cartTotalSum))

    const pendingSaleCartTotals = await home.getCartTotals()

    expect(pendingSaleCartTotals.cartTotalSum).toBe(
      HelperBase.formatCurrency(cart.total)
    )
    expect(pendingSaleCartTotals.cartNetSum).toBe(
      HelperBase.formatCurrency(cart.netTotal)
    )
    expect(pendingSaleCartTotals.cartTaxSum).toBe(
      HelperBase.formatCurrency(cart.vatTotal)
    )

    await home.clickPayBtn()

    await expect(paymentModal.paymentModal).toBeVisible()
    const paymentAmount: string = cartTotals.cartTotalSum!
    await paymentModal.addPaymentTender("CASH", paymentAmount)
    await paymentModal.confirmPayment()

    await paymentModal.saleConfirmationIsVisible()

    const invoiceId = await paymentModal.retrieveInvoiceId()
    const invoiceType = "CREDITINVOICE"
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
    expect(saleDoc.type).toBe("CREDITINVOICE")
    expect(saleDoc.invoiceState).toBe("READY")
    expect(saleDoc.paymentType).toBe("CASH")
    expect(saleDoc.paymentStatus).toBe("PAID")

    await paymentModal.closeSaleConfirmation()
  })

  test("User can delete a pending sale", async ({
    home,
    discounts,
    pendingSales,
    context,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSearchesForCustomer(testCustomer)
    await home.userSearchesForProduct(cakeDetails.name.en)

    await home.clickDiscounts()
    await expect(discounts.discountsModal).toBeVisible()
    await discounts.inputPercentage("99")
    await expect(home.productRowDiscount).toContainText("Adjustment")
    await expect(home.cartDiscountSum).toBeVisible()

    const shoppingCartBody = {
      discount1: 99,
      productID1: cakeDetails.id,
      amount1: 1,
    }

    const cart = await calculateShoppingCart(shoppingCartBody, context.request)

    const cartTotals = await home.getCartTotals()

    expect(cartTotals.cartTotalSum).toBe(HelperBase.formatCurrency(cart.total))
    expect(cartTotals.cartNetSum).toBe(HelperBase.formatCurrency(cart.netTotal))
    expect(cartTotals.cartTaxSum).toBe(HelperBase.formatCurrency(cart.vatTotal))

    await home.clickSaveSale()
    await expect(home.cartTotal).not.toBeVisible()
    await home.clickPendingSales()
    await expect(pendingSales.pendingSalesModal).toBeVisible()
    await pendingSales.deletePendingSale(String(cartTotals.cartTotalSum))
    await expect(
      page.locator(`tr:has-text("${cartTotals.cartTotalSum}")`)
    ).not.toBeVisible()
  })
})
