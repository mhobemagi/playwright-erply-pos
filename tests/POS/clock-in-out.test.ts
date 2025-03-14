import { expect } from "@playwright/test"
import { URLs } from "../../playwright.config"
import { test } from "../../fixtures/pages"

const employee = "pw test pw test"
const employeePin = "112233"

test.describe("Clock-in/out tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URLs.BASE_URL)
    await page.locator("text=Location #1").click()
    await page.waitForLoadState("load")
  })

  test("User can clock employee in and clock out in POS using password", async ({
    home,
    clockInOut,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()

    await home.clickClockInOut()
    await expect(clockInOut.clockInModal).toBeVisible()
    await expect(clockInOut.noClockedInEmployees).toBeVisible()
    await expect(clockInOut.employeeSelect).toHaveValue("pw test, pw test")
    await clockInOut.clockIn()

    await expect(home.employeeClockInTime).toBeVisible()
    await expect(clockInOut.clockedInEmployees).toBeVisible()
    await expect(clockInOut.clockedInEmployees).toContainText(employee)

    await clockInOut.clockOutEmployee(employee)
    await expect(clockInOut.noClockedInEmployees).toBeVisible()
    await expect(home.employeeClockInTime).not.toBeVisible()
  })

  test("User can clock employee in and clock out in POS using PIN", async ({
    home,
    clockInOut,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()

    await home.clickClockInOut()
    await expect(clockInOut.clockInModal).toBeVisible()
    await expect(clockInOut.noClockedInEmployees).toBeVisible()
    await expect(clockInOut.employeeSelect).toHaveValue("pw test, pw test")
    await clockInOut.clockInWithPin(employeePin)

    await expect(home.employeeClockInTime).toBeVisible()
    await expect(clockInOut.clockedInEmployees).toBeVisible()
    await expect(clockInOut.clockedInEmployees).toContainText(employee)

    await clockInOut.clockOutEmployeewithPin(employee, employeePin)
    await expect(clockInOut.noClockedInEmployees).toBeVisible()
    await expect(home.employeeClockInTime).not.toBeVisible()
  })

  test("User cannot clock in and out without filling password", async ({
    home,
    clockInOut,
    page,
  }) => {
    await expect(home.userMenu).toBeVisible()
    await expect(home.customerInfo).toBeVisible()

    await home.clickClockInOut()
    await expect(clockInOut.clockInModal).toBeVisible()
    await expect(clockInOut.noClockedInEmployees).toBeVisible()
    await expect(clockInOut.employeeSelect).toHaveValue("pw test, pw test")
    await clockInOut.clickClockInButton()
    await expect(home.alertMessage).toContainText("Username/Password invalid")

    await clockInOut.clockIn()

    await expect(home.employeeClockInTime).toBeVisible()
    await expect(clockInOut.clockedInEmployees).toBeVisible()
    await expect(clockInOut.clockedInEmployees).toContainText(employee)
    await clockInOut.openClockOutModal(employee)
    await clockInOut.clickClockOutButton()
    await expect(home.alertMessage).toContainText("Username/Password invalid")
    await clockInOut.closeClockOutModal()

    await clockInOut.clockOutEmployee(employee)
    await expect(clockInOut.noClockedInEmployees).toBeVisible()
    await expect(home.employeeClockInTime).not.toBeVisible()
  })
})
