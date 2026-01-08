/* global console */
/**
 * Generate PNG versions of the logo from SVG
 * Run with: node scripts/generate-logo-pngs.mjs
 */

import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const publicDir = join(__dirname, '..', 'public')

const sizes = [
  { name: 'logo-512.png', size: 512 },
  { name: 'logo-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
]

async function generatePNGs() {
  const svgPath = join(publicDir, 'logo.svg')

  console.log('Generating PNG versions of logo...\n')

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name)

    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath)

    console.log(`  Created: ${name} (${size}x${size})`)
  }

  console.log('\nDone!')
}

generatePNGs().catch(console.error)
