import { expect } from "@playwright/test"
import { URLs } from "../../playwright.config"
import { test } from "../../fixtures/pages"

test.describe("Login tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URLs.BASE_URL)
    await page.locator("text=Location #1").click()
    await page.waitForLoadState("load")
  })

  test("User can sign out using the user menu and sign in again", async ({
    home,
    loginPage,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userSignOutUserMenu()
    await expect(loginPage.signInModal).toBeVisible()
    await loginPage.signIn()
    await loginPage.selectPosStore()
  })

  test("User can use PIN to sign in after locking POS", async ({
    home,
    loginPage,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
    await home.userLocksPos()
    await expect(loginPage.lockPosPinLogin).toBeVisible()
    await loginPage.insertPin()
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()
  })
})
