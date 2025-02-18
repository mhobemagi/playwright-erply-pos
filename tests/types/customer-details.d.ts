export interface CustomerDetails {
  id: number
  customerID: number
  fullName: string
  companyName: string
  companyTypeID: number
  firstName: string
  lastName: string
  personTitleID: number
  eInvoiceEmail: string
  eInvoiceReference: string
  emailEnabled: number
  eInvoiceEnabled: number
  docuraEDIEnabled: number
  mailEnabled: number
  operatorIdentifier: string
  EDI: string
  doNotSell: number
  partialTaxExemption: number
  groupID: number
  countryID: string
  payerID: number
  phone: string
  mobile: string
  email: string
  fax: string
  code: string
  birthday: string
  integrationCode: string
  flagStatus: number
  colorStatus: string
  credit: number
  salesBlocked: number
  referenceNumber: string
  customerCardNumber: string
  factoringContractNumber: string
  groupName: string
  customerType: string
  address: string
  street: string
  address2: string
  city: string
  postalCode: string
  country: string
  state: string
  addressTypeID: number
  addressTypeName: string
  isPOSDefaultCustomer: number
  euCustomerType: string
  ediType: string
  primaryStoreID: number | null // Allow null if no primary store ID
  secondaryStoreID: number | null // Allow null if no secondary store ID
  lastModifierUsername: string
  lastModifierEmployeeID: number
  actualBalance: number
  availableCredit: number
  creditAllowed: number
  creditLimit: number
  taxExempt: number
  paysViaFactoring: number
  rewardPoints: number
  twitterID: string
  facebookName: string
  creditCardLastNumbers: string
  GLN: string
  deliveryTypeID: number
  image: string
  customerBalanceDisabled: number
  rewardPointsDisabled: number
  posCouponsDisabled: number
  emailOptOut: number
  signUpStoreID: number
  homeStoreID: number
  gender: string
  PeppolID: string
  externalIDs: string[] // Array of external IDs
}

export interface Customer {
  testUser: CustomerDetails
}