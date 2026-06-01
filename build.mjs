import * as esbuild from 'esbuild'
import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src')
const distDir = path.join(__dirname, 'dist')
const watch = process.argv.includes('--watch')

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

const staticFiles = ['manifest.json', 'popup.html', 'popup.css', 'icon.png']
for (const file of staticFiles) {
  await cp(path.join(srcDir, file), path.join(distDir, file)).catch(() => {})
}

const buildOptions = {
  entryPoints: {
    background: path.join(srcDir, 'background.js'),
    popup: path.join(srcDir, 'popup.js')
  },
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  outdir: distDir,
  logLevel: 'info'
}

if (watch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  console.log('Watching… reload the extension after each rebuild.')
} else {
  await esbuild.build(buildOptions)
}
