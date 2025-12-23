/**
 * Script to generate the interviewer avatar using DALL-E and save it to public folder
 * 
 * Usage:
 *   npx tsx scripts/generate-avatar.ts
 * 
 * Or compile and run:
 *   npm run build:avatar (if you add it to package.json)
 */

import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateAvatar() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    console.log('🎨 Generating interviewer avatar with DALL-E...')

    // Detailed prompt matching the specifications
    const prompt = `A friendly female interviewer avatar for a job interview application. Medium shot portrait from chest up, facing the viewer. Age around 30-40 years old, professional, confident and kind appearance. Wearing a smart casual blazer over a simple top. Subtle smile, attentive expression, not exaggerated. Semi-realistic illustration style with clean lines and soft shading. Transparent background. Color palette should work well on dark purple and navy UI backgrounds. High quality, professional illustration, no text, no logos.`

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      n: 1,
      response_format: 'url',
    })

    const imageUrl = response.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('Failed to generate avatar image')
    }

    console.log('✅ Avatar generated successfully')
    console.log('📥 Downloading image...')

    // Download the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`)
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public')
    await fs.mkdir(publicDir, { recursive: true })

    // Save to public folder
    const outputPath = path.join(publicDir, 'interviewer-avatar.png')
    await fs.writeFile(outputPath, imageBuffer)

    console.log(`✅ Avatar saved to: ${outputPath}`)
    console.log('🎉 Avatar generation complete!')
    console.log(`\nThe avatar is now available at: /interviewer-avatar.png`)
  } catch (error: any) {
    console.error('❌ Error generating avatar:', error.message)
    process.exit(1)
  }
}

// Run the script
generateAvatar()

