# Acme — Payhook sample extension

A minimal Manifest V3 **cross-browser** sample extension showcasing the
[`@payhook/extension`](https://www.npmjs.com/package/@payhook/extension)
`UpgradeButton`. Acme is a tiny "text utilities" popup: a few free
tools, three Pro-locked tools, and the Payhook button at the bottom.

**Marketing page:** [payhook.link/acme-extension](https://payhook.link/acme-extension)

This repo is a reference implementation — it is not published to the Chrome Web Store.

One source tree builds for **Chrome**, **Firefox**, and **Safari**.

## What this demonstrates

- Background service worker (event page on Firefox) holds a
  `PayhookClient` and reflects the entitlement state as the extension
  action badge (`PRO` when active).
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
   npm run build                         # all three targets
   npm run build -- --target=chrome      # one target
   npm run build -- --target=firefox,safari
   ```

   Outputs go to `dist/chrome/`, `dist/firefox/`, and `dist/safari/`.

3. Load the appropriate `dist/<browser>/` folder:

   **Chrome / Chromium / Edge / Brave**
   - Visit `chrome://extensions`
   - Toggle **Developer mode** on
   - Click **Load unpacked** and pick `dist/chrome/`

   **Firefox** (developer / nightly / unbranded — signing is required
   for release Firefox)
   - Visit `about:debugging#/runtime/this-firefox`
   - Click **Load Temporary Add-on…** and pick any file inside
     `dist/firefox/` (e.g. `manifest.json`)
   - The add-on is unloaded when Firefox restarts; use `web-ext run`
     or sign via `web-ext sign` for a persistent install.

   **Safari** (macOS 13+ / Safari 16.4+)
   - Wrap the unpacked folder with Apple's converter:
     ```sh
     xcrun safari-web-extension-converter dist/safari --project-location ./safari-app --bundle-identifier link.payhook.acme
     ```
   - Xcode opens — press **Run** to install the host app.
   - Enable the extension: Safari → Settings → Extensions. You may
     need to turn on **Develop → Allow Unsigned Extensions** each
     session while iterating.

4. Click the Acme icon, paste some text, and click **Upgrade to Pro**.
   The hosted unlock page at [unlock.payhook.link](https://unlock.payhook.link) opens; complete checkout (use Stripe's test
   card `4242 4242 4242 4242` while in test mode). When you close it,
   the button flips to **Manage plan** and the Pro tools unlock.

## Iterating

```sh
npm run watch                       # watches all targets
npm run watch -- --target=chrome    # just one
```

esbuild rebuilds on save. Reload the extension in your browser after
each rebuild (Chrome: card's **Reload** button; Firefox: **Reload** on
`about:debugging`; Safari: re-run the host app).

## Cross-browser notes

- **Storage / windows / runtime APIs** — Firefox and Safari expose the
  same `chrome.*` namespace as Chrome, so `createChromeAdapters()`
  works unchanged on all three.
- **Identity** — `chrome.identity.getProfileUserInfo` only exists in
  Chromium. The adapter returns `null` on Firefox/Safari, and the
  build strips the `identity` permission from the Firefox manifest to
  avoid an install-time warning.
- **Background script** — Chrome and Safari use a module service
  worker. Firefox MV3 is loaded as an event page (`background.scripts`)
  bundled as an IIFE; the source stays the same.
- **`externally_connectable`** — Chromium-only; stripped from the
  Firefox manifest.
- **Safari popup** — `chrome.windows.create` opens a separate window
  for the hosted unlock page, which works in Safari but loses popup
  focus; that's expected.

## Files

```
src/
  manifest.json   shared MV3 manifest (Chrome shape)
  background.js   service worker / event page — PayhookClient + badge
  popup.html      popup markup
  popup.css       popup styles + inlined upgrade-button.css
  popup.js        popup logic — mounts UpgradeButton, gates Pro tools
  config.js       your account + product IDs
build.mjs         esbuild bundling + per-browser manifest patching
dist/
  chrome/         load in chrome://extensions
  firefox/        load in about:debugging
  safari/         feed to xcrun safari-web-extension-converter
```

Drop a 128×128 PNG at `src/icon.png` to give Acme its own toolbar icon.

## Related repos

| Repo | Role |
|------|------|
| [payhook/js](https://github.com/payhook/js) | `@payhook/extension` SDK |
| [payhook/unlock](https://github.com/payhook/unlock) | Hosted unlock pages |
| [payhook/docs](https://github.com/payhook/docs) | Integration guide |
| [payhook/mcp](https://github.com/payhook/mcp) | MCP server for AI-assisted integration |
