import { expect, type Locator, type Page } from "@playwright/test"
import { localUser } from "../../playwright.config"

export class LoginPage {
  readonly page: Page
  readonly signInModal: Locator
  readonly clientCode: Locator
  readonly username: Locator
  readonly password: Locator
  readonly loginButton: Locator
  readonly selectPos: Locator
  readonly lockPosPinLogin: Locator
  readonly pinInput: Locator
  readonly pinSignIn: Locator

  constructor(page: Page) {
    this.page = page
    this.signInModal = page.getByTestId("login-container")
    this.clientCode = page.getByTestId("clientCode")
    this.username = page.getByTestId("username")
    this.password = page.getByTestId("password")
    this.loginButton = page.getByTestId("login-clockin-button")
    this.selectPos = page.locator("text=Location #1")
    this.lockPosPinLogin = page.locator("text=PIN login")
    this.pinInput = page.locator('input[name="pin"]')
    this.pinSignIn = page.locator("text=Sign in")
  }

  async signIn() {
    await this.clientCode.fill(localUser.clientcode)
    await this.username.fill(localUser.username)
    await this.password.fill(localUser.password)
    await this.loginButton.click()
  }

  async selectPosStore() {
    await this.selectPos.click()
  }

  async insertPin() {
    await this.pinInput.fill("112233")
    await this.pinSignIn.click()
  }
}
