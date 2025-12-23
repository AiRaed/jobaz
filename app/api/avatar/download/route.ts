import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'

/**
 * Avatar Download API Route
 * 
 * Generates the interviewer avatar using DALL-E and saves it to the public folder.
 * This is a one-time operation to generate the static avatar file.
 * 
 * Request: GET /api/avatar/download
 * Response: { success: boolean, path?: string, error?: string }
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    console.log('[Avatar] Generating avatar with DALL-E...')

    // Detailed prompt matching specifications
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
      return NextResponse.json(
        { error: 'Failed to generate avatar image' },
        { status: 500 }
      )
    }

    console.log('[Avatar] Avatar generated, downloading...')

    // Download the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download image: ${imageResponse.statusText}` },
        { status: 500 }
      )
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Save to public folder
    const publicDir = path.join(process.cwd(), 'public')
    await fs.mkdir(publicDir, { recursive: true })
    
    const outputPath = path.join(publicDir, 'interviewer-avatar.png')
    await fs.writeFile(outputPath, imageBuffer)

    console.log('[Avatar] Avatar saved successfully')

    return NextResponse.json({
      success: true,
      path: '/interviewer-avatar.png',
      message: 'Avatar generated and saved successfully',
    })
  } catch (error: any) {
    console.error('[Avatar] Error generating avatar', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate avatar' },
      { status: 500 }
    )
  }
}

