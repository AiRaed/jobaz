import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Avatar Generation API Route
 * 
 * Generates a friendly female interviewer avatar using DALL-E.
 * Returns the image URL or base64 data.
 * 
 * Request body:
 * - regenerate?: boolean (optional) - Force regeneration even if exists
 * 
 * Response:
 * - { url: string, imageUrl?: string } - Image URL or base64 data
 * - { error: string } - Error message on failure
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { regenerate } = body

    // Detailed prompt for the avatar based on specifications
    const prompt = `A friendly female interviewer avatar for a job interview application. Medium shot portrait from chest up, facing the viewer. Age around 30-40 years old, professional, confident and kind appearance. Wearing a smart casual blazer over a simple top. Subtle smile, attentive expression, not exaggerated. Semi-realistic illustration style with clean lines and soft shading. Transparent background. Color palette should work well on dark purple and navy UI backgrounds. High quality, professional illustration, no text, no logos.`

    console.log('[Avatar] Generating avatar with DALL-E...')

    // Generate image using DALL-E
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

    console.log('[Avatar] Avatar generated successfully')

    return NextResponse.json({
      url: imageUrl,
      imageUrl: imageUrl, // Alias for convenience
    })
  } catch (error: any) {
    console.error('[Avatar] Error generating avatar', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate avatar' },
      { status: 500 }
    )
  }
}

