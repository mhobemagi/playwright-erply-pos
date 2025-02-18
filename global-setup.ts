import { chromium, type FullConfig } from "@playwright/test"
import { localUser, URLs } from "./playwright.config"
import { authenticateUrl, authenticateUser } from "./utils/authentication"
import { fetchAndSaveCustomerDetails, fetchAndSaveProductDetails } from "./utils/api-helpers"
import { existsSync } from "fs"
import path = require("path")

async function globalSetup(config: FullConfig) {
  const { storageState } = config.projects[0].use
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  const storageStatePath = path.resolve('./storage/545455-user.json');
  
  if (existsSync(storageStatePath)) {
    console.log("Storage state already exists. Skipping authentication.");
    return;
  }
  // Here we authenticate the user in order to get the session key
  await authenticateUser()
  // Then we log in, so we are already logged in before every test
  await authenticateUrl(page)
  // Before we start the tests, we fetch product data using the session key...
  await fetchAndSaveProductDetails(page)
  // ...Then we fetch the customer data, both are saved in fixtures folder
  await fetchAndSaveCustomerDetails(page)
  // And we save the session in storage folder
  await page.context().storageState({ path: storageState as string })
  console.log(`storage state saved at: ${storageState}`)
  await browser.close()
}

export default globalSetup
