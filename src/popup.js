import {
  PayhookClient,
  UpgradeButton,
  createChromeAdapters
} from '@payhook/extension'
import { ACCOUNT_ID, PRODUCT_IDS, TEST_MODE } from './config.js'

const adapters = createChromeAdapters()
const client = new PayhookClient({
  accountId: ACCOUNT_ID,
  productIds: PRODUCT_IDS,
  testMode: TEST_MODE,
  ...adapters
})

await client.init()

const version = chrome.runtime.getManifest().version

new UpgradeButton(client, {
  version,
  billing: { returnUrl: 'https://acme.example' },
  labels: { upgrade: 'Upgrade to Pro', manage: 'Manage plan', pro: "You're Pro" }
}).mount('#payhook-button')

const inputEl = document.getElementById('input')
const outputEl = document.getElementById('output')
const lockBadge = document.getElementById('lock-state')
const toolButtons = Array.from(document.querySelectorAll('.tool'))

const TOOLS = {
  upper: (s) => s.toUpperCase(),
  reverse: (s) => Array.from(s).reverse().join(''),
  base64: (s) => btoa(unescape(encodeURIComponent(s))),
  slug: (s) => s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
  title: (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

function refreshLockState () {
  const { active } = client.getEntitlement()
  if (lockBadge) lockBadge.hidden = active
  toolButtons.forEach((btn) => {
    if (btn.dataset.requiresPro !== undefined) {
      btn.dataset.locked = String(!active)
    }
  })
}

toolButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const requiresPro = btn.dataset.requiresPro !== undefined
    const { active } = client.getEntitlement()
    if (requiresPro && !active) return

    const fn = TOOLS[btn.dataset.tool]
    outputEl.value = fn ? fn(inputEl.value || '') : ''
  })
})

client.onEntitlementChange(refreshLockState)
refreshLockState()
