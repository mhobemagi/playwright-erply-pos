import { test as base, Page } from "@playwright/test"
import { LoginPage } from "../tests/pages/login"
import { Home } from "../tests/pages/home"
import { PaymentModal } from "../tests/pages/payment-modal"
import { RecentSales } from "../tests/pages/recent-sales"
import { Layaways } from "../tests/pages/layaways"
import { ProductInformation } from "../tests/pages/product-information"
import { Orders } from "../tests/pages/orders"
import { Offers } from "../tests/pages/offers"
import { AccountSales } from "../tests/pages/account-sales"
import { PendingSales } from "../tests/pages/pending-sales"
import { Discounts } from "../tests/pages/discounts"
import { ClockInOut } from "../tests/pages/clock-in-out"
import { PaymentConfiguration } from "../tests/pages/payment-configuration"

export type TestPages = {
  loginPage: LoginPage
  home: Home
  paymentModal: PaymentModal
  recentSales: RecentSales
  pendingSales: PendingSales
  orders: Orders
  layaways: Layaways
  discounts: Discounts
  clockInOut: ClockInOut
  offers: Offers
  accountSales: AccountSales
  productInformation: ProductInformation
  paymentConfiguration: PaymentConfiguration
}

export const test = base.extend<TestPages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  home: async ({ page }, use) => {
    await use(new Home(page))
  },
  paymentModal: async ({ page }, use) => {
    await use(new PaymentModal(page))
  },
  recentSales: async ({ page }, use) => {
    await use(new RecentSales(page))
  },
  pendingSales: async ({ page }, use) => {
    await use(new PendingSales(page))
  },
  orders: async ({ page }, use) => {
    await use(new Orders(page))
  },
  layaways: async ({ page }, use) => {
    await use(new Layaways(page))
  },
  discounts: async ({ page }, use) => {
    await use(new Discounts(page))
  },
  clockInOut: async ({ page }, use) => {
    await use(new ClockInOut(page))
  },
  offers: async ({ page }, use) => {
    await use(new Offers(page))
  },
  accountSales: async ({ page }, use) => {
    await use(new AccountSales(page))
  },
  productInformation: async ({ page }, use) => {
    await use(new ProductInformation(page))
  },
  paymentConfiguration: async ({ page }, use) => {
    await use(new PaymentConfiguration(page))
  },
})
