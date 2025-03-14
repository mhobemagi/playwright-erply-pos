import { expect, type Locator, type Page } from "@playwright/test"
import { localUser } from "../../playwright.config"

export class ClockInOut {
  readonly page: Page
  readonly clockInModal: Locator
  readonly clockOutModal: Locator
  readonly clockInOutBtn: Locator
  readonly closeBtn: Locator
  readonly employeeSelect: Locator
  readonly passwordInput: Locator
  readonly noClockedInEmployees: Locator
  readonly clockedInEmployees: Locator

  constructor(page: Page) {
    this.page = page
    this.clockInModal = page.getByTestId("clock-in-modal")
    this.clockOutModal = page.getByTestId("clock-out-modal")
    this.clockInOutBtn = page.getByTestId("save-btn")
    this.closeBtn = page.getByTestId("custom-close-button")
    this.employeeSelect = page.getByTestId("employee-select")
    this.passwordInput = page.getByTestId("password")
    this.noClockedInEmployees = page.getByTestId("no-clocked-in-employees")
    this.clockedInEmployees = page.getByTestId("employee-container")
  }

  async clickClockInButton() {
    await this.clockInOutBtn.click()
  }

  async clickClockOutButton() {
    const clockOutBtn = this.clockOutModal.locator(this.clockInOutBtn)
    await clockOutBtn.click()
  }

  async closeClockOutModal() {
    const closeClockOutBtn = this.clockOutModal.locator(this.closeBtn)
    await closeClockOutBtn.click()
  }

  async clockIn() {
    await this.passwordInput.locator("input").fill(localUser.password)
    await this.clockInOutBtn.click()
  }

  async clockInWithPin(employeePin: string) {
    await this.passwordInput.locator("input").fill(employeePin)
    await this.clockInOutBtn.click()
  }

  async openClockOutModal(employee: string) {
    await this.page.locator(`[data-test-key="${employee}"]`).click()
  }

  async clockOutEmployee(employee: string) {
    const passwordField = this.clockOutModal.locator(this.passwordInput);
    const clockOutBtn = this.clockOutModal.locator(this.clockInOutBtn)
    await this.page.locator(`[data-test-key="${employee}"]`).click()
    await passwordField.fill(localUser.password)
    await clockOutBtn.click()
  }

  async clockOutEmployeewithPin(employee: string, employeePin: string) {
    const passwordField = this.clockOutModal.locator(this.passwordInput);
    const clockOutBtn = this.clockOutModal.locator(this.clockInOutBtn)
    await this.page.locator(`[data-test-key="${employee}"]`).click()
    await passwordField.fill(employeePin)
    await clockOutBtn.click()
  }
}