import { PayhookClient, createChromeAdapters } from '@payhook/extension'
import { ACCOUNT_ID, PRODUCT_IDS, TEST_MODE } from './config.js'

const adapters = createChromeAdapters()
export const payhook = new PayhookClient({
  accountId: ACCOUNT_ID,
  productIds: PRODUCT_IDS,
  testMode: TEST_MODE,
  ...adapters
})

await payhook.init()

payhook.onEntitlementChange(({ active }) => {
  chrome.action.setBadgeText({ text: active ? 'PRO' : '' })
  chrome.action.setBadgeBackgroundColor({ color: '#3a5678' })
})
