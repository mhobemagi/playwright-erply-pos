import { defineConfig } from "@playwright/test"
import { User } from "./tests/types/user"

export const localUser: User = {
  clientcode: "545455",
  username: "pw test",
  password: "Posuitests123",
  warehouseid: "1",
}

export const URLs = {
  BASE_URL: "https://epos.erply.com/latest/",
  API_URL: `https://${localUser.clientcode}.erply.com/api`,
}

export const erplyApi = {
  PIM: "https://api-pim-us.erply.com",
}

export default defineConfig({
  globalSetup: require.resolve("./global-setup.ts"),
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: URLs.BASE_URL || "http://localhost:9323/",
    trace: process.env.CI ? "on" : "on-first-retry",
    headless: false,
    storageState: "./storage/545455-user.json",
    actionTimeout: 70000,
    navigationTimeout: 80000,
    viewport: { width: 1920, height: 1080 },
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
})
