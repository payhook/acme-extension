# Acme — Payhook sample extension

A minimal Manifest V3 Chrome extension showcasing the
[`@payhook/extension`](https://www.npmjs.com/package/@payhook/extension)
`UpgradeButton`. Acme is a tiny "text utilities" popup: a few free
tools, three Pro-locked tools, and the Payhook button at the bottom.

## What this demonstrates

- Background service worker holds a `PayhookClient` and reflects the
  entitlement state as the extension action badge (`PRO` when active).
- Popup mounts the Payhook `UpgradeButton` — it cycles through
  `Loading… → Upgrade → Opening… → Manage plan` as the user pays.
- Pro tools (`Base64`, `Slug`, `Title Case`) are gated client-side by
  `client.getEntitlement().active` and refresh on
  `client.onEntitlementChange(...)`.

## Setup

1. Set your Payhook values in `src/config.js`:

   ```js
   export const ACCOUNT_ID = 'acct_xxx'
   export const PRODUCT_IDS = ['prod_xxx']
   export const TEST_MODE = true
   ```

   Get these from [dashboard.payhook.link](https://dashboard.payhook.link).
   Use **test-mode** Stripe product IDs while `TEST_MODE` is `true`.

2. Build:

   ```sh
   npm install
   npm run build
   ```

   Outputs to `dist/`.

3. Load `dist/` in Chrome:

   - Visit `chrome://extensions`
   - Toggle **Developer mode** on
   - Click **Load unpacked** and pick the `dist/` folder

4. Click the Acme icon, paste some text, and click **Upgrade to Pro**.
   The hosted unlock page opens; complete checkout (use Stripe's test
   card `4242 4242 4242 4242` while in test mode). When you close it,
   the button flips to **Manage plan** and the Pro tools unlock.

## Iterating

```sh
npm run watch
```

esbuild rebuilds on save. Click **Reload** on the extension card in
`chrome://extensions` after each rebuild.

## Files

```
src/
  manifest.json   MV3 manifest
  background.js   service worker — PayhookClient + badge
  popup.html      popup markup
  popup.css       popup styles + inlined upgrade-button.css
  popup.js        popup logic — mounts UpgradeButton, gates Pro tools
  config.js       your account + product IDs
build.mjs         esbuild bundling
```

Drop a 128×128 PNG at `src/icon.png` to give Acme its own toolbar icon.
