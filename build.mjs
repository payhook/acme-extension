import * as esbuild from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src')
const distDir = path.join(__dirname, 'dist')
const watch = process.argv.includes('--watch')

const argTargets = process.argv
  .filter((a) => a.startsWith('--target='))
  .flatMap((a) => a.slice('--target='.length).split(','))
const TARGETS = argTargets.length ? argTargets : ['chrome', 'firefox', 'safari']

const STATIC_FILES = ['popup.html', 'popup.css', 'icon.png']

// Per-browser manifest patches. Chrome/Safari use the MV3 service worker;
// Firefox MV3 background is most reliable via the `scripts` array.
const MANIFEST_PATCHES = {
  chrome: (m) => m,
  safari: (m) => ({
    ...m,
    browser_specific_settings: {
      ...(m.browser_specific_settings || {}),
      safari: { strict_min_version: '16.4' }
    }
  }),
  firefox: (m) => {
    // `externally_connectable` is Chromium-only — strip it for Firefox.
    const { background, permissions = [], externally_connectable, ...rest } = m
    return {
      ...rest,
      // Firefox doesn't implement chrome.identity.getProfileUserInfo —
      // the adapter already returns null when it's missing, so we drop
      // the permission here to avoid an install-time warning.
      permissions: permissions.filter((p) => !p.startsWith('identity')),
      background: {
        scripts: ['background.js']
      },
      browser_specific_settings: {
        ...(m.browser_specific_settings || {}),
        gecko: {
          id: 'acme-payhook@example.com',
          strict_min_version: '115.0'
        }
      }
    }
  }
}

// popup.html loads popup.js as a module — keep ESM for all browsers.
// Background differs: Chrome/Safari use a module service worker (ESM),
// Firefox MV3 loads `background.scripts` as classic scripts (IIFE).
const BACKGROUND_FORMAT = { chrome: 'esm', safari: 'esm', firefox: 'iife' }
const ESBUILD_TARGET = { chrome: 'chrome120', safari: 'safari16', firefox: 'firefox115' }

async function buildTarget (target) {
  const outDir = path.join(distDir, target)
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  for (const file of STATIC_FILES) {
    await cp(path.join(srcDir, file), path.join(outDir, file)).catch(() => {})
  }

  const baseManifest = JSON.parse(await readFile(path.join(srcDir, 'manifest.json'), 'utf8'))
  const manifest = MANIFEST_PATCHES[target](baseManifest)
  await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const common = {
    bundle: true,
    target: ESBUILD_TARGET[target],
    outdir: outDir,
    logLevel: 'info'
  }

  const backgroundOptions = {
    ...common,
    entryPoints: { background: path.join(srcDir, 'background.js') },
    format: BACKGROUND_FORMAT[target]
  }
  const popupOptions = {
    ...common,
    entryPoints: { popup: path.join(srcDir, 'popup.js') },
    format: 'esm'
  }

  if (watch) {
    const [bgCtx, popupCtx] = await Promise.all([
      esbuild.context(backgroundOptions),
      esbuild.context(popupOptions)
    ])
    await Promise.all([bgCtx.watch(), popupCtx.watch()])
    return [bgCtx, popupCtx]
  }

  await Promise.all([esbuild.build(backgroundOptions), esbuild.build(popupOptions)])
  return null
}

if (watch) {
  await Promise.all(TARGETS.map(buildTarget))
  console.log(`Watching ${TARGETS.join(', ')}… reload the extension after each rebuild.`)
} else {
  for (const target of TARGETS) {
    console.log(`\n→ building ${target}`)
    await buildTarget(target)
  }
}
