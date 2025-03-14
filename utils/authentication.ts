import test, { APIRequestContext, Page, request } from "@playwright/test"
import { localUser, URLs } from "../playwright.config"
import { writeFileSync } from "fs"
import path = require("path")

export const authenticateUrl = async (page: Page) => {
  await page.goto(URLs.BASE_URL)
  await page.getByTestId("clientCode").fill(localUser.clientcode)
  await page.getByTestId("username").fill(localUser.username)
  await page.getByTestId("password").fill(localUser.password)
  await page.getByTestId("login-clockin-button").click()
}

export const authenticateUser = async () => {
  const apiRequestContext: APIRequestContext = await request.newContext()
  const response = await apiRequestContext.post(URLs.API_URL, {
    params: {
      request: "verifyUser",
      clientCode: localUser.clientcode,
      username: localUser.username,
      password: localUser.password,
      sessionLength: "86400",
      sendContentType: "1",
    },
  })

  if (!response.ok()) {
    throw new Error(`Authentication failed: ${response.statusText()}`);
  }

  const responseBody = await response.json()
  const record = responseBody.records[0]
  const sessionKey = record.sessionKey

  const filePath = path.resolve(__dirname, "../storage/sessionKey.json")
  writeFileSync(filePath, JSON.stringify({ sessionKey }, null, 2))
}
