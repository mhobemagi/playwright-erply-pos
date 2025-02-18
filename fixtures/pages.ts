import { test as base, Page } from "@playwright/test"
import { LoginPage } from "../tests/pages/login"
import { Home } from "../tests/pages/home"
import { PaymentModal } from "../tests/pages/payment-modal"
import { RecentSales } from "../tests/pages/recent-sales"
import { Layaways } from "../tests/pages/layaways"
import { ProductInformation } from "../tests/pages/product-information"
import { Orders } from "../tests/pages/orders"
import { Offers } from "../tests/pages/offers"

export type TestPages = {
  loginPage: LoginPage
  home: Home
  paymentModal: PaymentModal
  recentSales: RecentSales
  orders: Orders
  layaways: Layaways
  offers: Offers
  productInformation: ProductInformation
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
  orders: async ({ page }, use) => {
    await use(new Orders(page))
  },
  layaways: async ({ page }, use) => {
    await use(new Layaways(page))
  },
  offers: async ({ page }, use) => {
    await use(new Offers(page))
  },
  productInformation: async ({ page }, use) => {
    await use(new ProductInformation(page))
  }
})
