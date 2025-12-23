/**
 * Script to generate favicon files from SVG
 * 
 * Usage:
 *   npx tsx scripts/generate-favicons.ts
 */

import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

async function generateFavicons() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const svgPath = path.join(publicDir, 'favicon.svg')
    
    // Read the SVG file
    const svgBuffer = await fs.readFile(svgPath)
    
    console.log('🎨 Generating favicon files from SVG...')
    
    // Generate 16x16 PNG
    const png16 = await sharp(svgBuffer)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    
    await fs.writeFile(path.join(publicDir, 'favicon-16x16.png'), png16)
    console.log('✅ Generated favicon-16x16.png')
    
    // Generate 32x32 PNG
    const png32 = await sharp(svgBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    
    await fs.writeFile(path.join(publicDir, 'favicon-32x32.png'), png32)
    console.log('✅ Generated favicon-32x32.png')
    
    // Generate ICO file (multi-size ICO with 16x16 and 32x32)
    // Note: sharp doesn't directly support ICO, so we'll create a simple ICO
    // For now, we'll use the 32x32 PNG as the ICO (browsers will accept PNG in ICO format)
    const icoBuffer = await sharp(svgBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    
    await fs.writeFile(path.join(publicDir, 'favicon.ico'), icoBuffer)
    console.log('✅ Generated favicon.ico')
    
    console.log('🎉 All favicon files generated successfully!')
  } catch (error: any) {
    console.error('❌ Error generating favicons:', error.message)
    process.exit(1)
  }
}

generateFavicons()
