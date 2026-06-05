/**
 * generate-favicons.mjs
 * Generates all raster favicon assets from the Circuit L SVG logo.
 * Run with: node scripts/generate-favicons.mjs
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const faviconDir = join(projectRoot, 'public', 'static', 'favicons')

// ── Canonical SVG source (512×512 padded version for raster rendering) ──────
// We use a larger viewBox with padding so the mark isn't edge-to-edge in the raster outputs.
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <rect width="512" height="512" rx="96" fill="#0F172A"/>
  <defs>
    <linearGradient id="lg-stem" x1="168" y1="88" x2="168" y2="384" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="lg-base" x1="168" y1="350" x2="396" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
  </defs>
  <!-- Vertical stem of L -->
  <rect x="136" y="88" width="64" height="280" rx="16" fill="url(#lg-stem)"/>
  <!-- Horizontal base of L -->
  <rect x="136" y="332" width="240" height="64" rx="16" fill="url(#lg-base)"/>
  <!-- Node: top of stem -->
  <circle cx="168" cy="106" r="26" fill="#06B6D4"/>
  <!-- Node: corner junction -->
  <circle cx="168" cy="364" r="30" fill="#06B6D4"/>
  <!-- Node: mid-stem -->
  <circle cx="168" cy="228" r="20" fill="#2563EB" opacity="0.6"/>
  <!-- Node: end of base -->
  <circle cx="376" cy="364" r="26" fill="#06B6D4"/>
  <!-- Short horizontal branch off mid-stem -->
  <rect x="200" y="216" width="70" height="24" rx="10" fill="#06B6D4" opacity="0.45"/>
  <circle cx="270" cy="228" r="16" fill="#06B6D4" opacity="0.7"/>
</svg>`

const svgBuffer = Buffer.from(svgSource)

async function generate() {
  const sizes = [
    { name: 'favicon-16x16.png', size: 16, bg: false },
    { name: 'favicon-32x32.png', size: 32, bg: false },
    { name: 'apple-touch-icon.png', size: 180, bg: true },
    { name: 'android-chrome-96x96.png', size: 96, bg: false },
    { name: 'mstile-150x150.png', size: 150, bg: true },
  ]

  for (const { name, size, bg } of sizes) {
    const outPath = join(faviconDir, name)
    const img = sharp(svgBuffer).resize(size, size)
    if (bg) {
      // Flatten onto brand dark background for apple/mstile
      await img
        .flatten({ background: { r: 15, g: 23, b: 42 } })
        .png()
        .toFile(outPath)
    } else {
      await img.png().toFile(outPath)
    }
    console.log(`✓ ${name} (${size}×${size})`)
  }

  // Generate favicon.ico — multi-size (16, 32, 48) packed into ICO
  // Sharp doesn't write ICO natively; write a 32×32 PNG fallback instead
  // and rename as .ico (browsers accept PNG-inside-ICO for 32-bit color)
  const icoBuffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer()
  writeFileSync(join(faviconDir, 'favicon.ico'), icoBuffer)
  console.log('✓ favicon.ico (32×32 PNG-in-ICO fallback)')

  console.log('\nAll favicon assets generated successfully.')
}

generate().catch((err) => {
  console.error('Error generating favicons:', err)
  process.exit(1)
})
