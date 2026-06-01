import { PayhookClient, createChromeAdapters } from '@payhook/extension'
import { ACCOUNT_ID, PRODUCT_IDS, TEST_MODE } from './config.js'

// MV3 service workers must register synchronously — no top-level await.
// We construct the client immediately and kick off init() without blocking.

const adapters = createChromeAdapters()
const payhook = new PayhookClient({
  accountId: ACCOUNT_ID,
  productIds: PRODUCT_IDS,
  testMode: TEST_MODE,
  ...adapters
})

payhook.onEntitlementChange(({ active }) => {
  chrome.action.setBadgeText({ text: active ? 'PRO' : '' })
  chrome.action.setBadgeBackgroundColor({ color: '#3a5678' })
})

payhook.init().catch((error) => {
  console.error('Payhook init failed', error)
})

self.payhook = payhook
