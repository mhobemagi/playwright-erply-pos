import {
  APIRequestContext,
  BrowserContext,
  Page,
  request,
} from "@playwright/test"
import { localUser, erplyApi, URLs } from "../playwright.config"
import * as path from "path"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { CustomerDetails } from "../tests/types/customer-details"
import { ProductDetails } from "../tests/types/product-details"
import {
  CalculateShoppingCartResponseBody,
  CalculateShoppingCartResponseRow,
} from "../tests/types/calculate-shopping-cart"

const getSessionKeyFromFile = async () => {
  const sessionKeyFilePath = path.resolve(
    __dirname,
    "../storage/sessionKey.json"
  )
  const { sessionKey } = JSON.parse(readFileSync(sessionKeyFilePath, "utf-8"))
  return sessionKey
}

export const createGetRequest = async (
  endpoint: string,
  params: { [key: string]: string | number | boolean },
  requestContext: APIRequestContext
) => {
  const sessionKey = await getSessionKeyFromFile()
  // Send the GET request with query parameters
  const response = await requestContext.get(endpoint, {
    headers: {
      clientcode: localUser.clientcode,
      sessionKey: sessionKey,
      "Content-Type": "application/json",
    },
    params: params,
  })

  return response
}

export const createPostRequest = async (
  endpoint: string,
  params: { [key: string]: string | number | boolean },
  requestContext: APIRequestContext
) => {
  const sessionKey = await getSessionKeyFromFile()
  // Send the GET request with query parameters
  const response = await requestContext.post(endpoint, {
    headers: {
      clientcode: localUser.clientcode,
      sessionKey: sessionKey,
      "Content-Type": "application/json",
    },
    params: params,
  })

  return response
}

export const fetchProductDetails = async (
  productIDs: number[],
  requestContext: APIRequestContext
) => {
  const params = {
    productIDs: productIDs.join(","),
  }

  const apiUrl = erplyApi.PIM

  const response = await createGetRequest(
    `${apiUrl}/v1/matrix/product`,
    params,
    requestContext
  )

  if (!response.ok()) {
    throw new Error(`Failed to fetch product details: ${response.statusText()}`)
  }

  const responseBody = await response.json()
  return responseBody
}

export const fetchAndSaveProductDetails = async (page: Page) => {
  const productIDs = [1, 2] // Product IDs to fetch
  const productDetails = await fetchProductDetails(productIDs, page.request)

  if (!Array.isArray(productDetails)) {
    console.error("Product details response is not an array:", productDetails)
    throw new Error(
      "Failed to fetch product details. Response is not an array."
    )
  }

  const productDetailsMap: any = {}

  productDetails.forEach((product: any) => {
    if (product && product.name && product.name.en) {
      productDetailsMap[product.name.en] = product
    } else {
      console.warn("Invalid product data:", product)
    }
  })

  const filePath = path.resolve(__dirname, "../fixtures/productDetails.json")

  writeFileSync(filePath, JSON.stringify(productDetailsMap, null, 2))
}

export const getProductDetailsFromFile = (): ProductDetails => {
  const filePath = path.resolve(__dirname, "../fixtures/productDetails.json")

  const data = readFileSync(filePath, "utf-8")
  return JSON.parse(data) as ProductDetails
}

export const fetchCustomerDetails = async (
  customerID: number,
  requestContext: APIRequestContext
) => {
  const params = {
    clientCode: localUser.clientcode,
    request: "getCustomers",
    customerID: customerID.toString(),
    getBalanceWithoutPrepayments: 1,
    getBalanceInfo: 1,
  }

  const response = await createGetRequest(URLs.API_URL, params, requestContext)

  const responseBody = await response.json()

  return responseBody
}

export const fetchAndSaveCustomerDetails = async (page: Page) => {
  const customerIDs = [5]
  const customerDetailsMap: Record<string, CustomerDetails> = {}

  for (const customerID of customerIDs) {
    const response = await fetchCustomerDetails(customerID, page.request)

    if (response.records && response.records.length > 0) {
      response.records.forEach((customer: CustomerDetails) => {
        customerDetailsMap[customer.id] = customer
      })
    }
  }

  const filePath = path.resolve(__dirname, "../fixtures/customerDetails.json")

  writeFileSync(filePath, JSON.stringify(customerDetailsMap, null, 2))
}

export const getCustomerDetailsFromFile = (): Record<
  string,
  CustomerDetails
> => {
  const filePath = path.resolve(__dirname, "../fixtures/customerDetails.json")

  const data = readFileSync(filePath, "utf-8")
  return JSON.parse(data) as Record<string, CustomerDetails>
}

export const getSalesDocuments = async (
  invoiceId: string,
  invoiceType: string,
  requestContext: APIRequestContext
) => {
  const sessionKey = await getSessionKeyFromFile()
  // Send the GET request with query parameters
  const response = await requestContext.post(URLs.API_URL, {
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      clientCode: localUser.clientcode,
      sessionKey: sessionKey,
      request: "getSalesDocuments",
      number: invoiceId,
      type: invoiceType,
    },
  })
  const responseBody = await response.json()
  return responseBody
}

export const calculateShoppingCart = async (
  shoppingCartBody: { [key: string]: string | number },
  requestContext: APIRequestContext
): Promise<CalculateShoppingCartResponseBody> => {
  const params: { [key: string]: string | number | boolean } = {
    ...shoppingCartBody,
    clientCode: localUser.clientcode,
    request: "calculateShoppingCart",
    warehouseID: localUser.warehouseid!,
  }

  const response = await createGetRequest(URLs.API_URL, params, requestContext)

  if (!response.ok()) {
    const responseText = await response.text()
    throw new Error(
      `Failed to calculate shopping cart: ${response.statusText()} - ${responseText}`
    )
  }

  const responseBody = await response.json()

  return responseBody.records ? responseBody.records[0] : responseBody[0]
}
