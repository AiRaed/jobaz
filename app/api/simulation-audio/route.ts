import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { jobId, questionIndex, questionText, jobTitle, company } = await req.json()

    if (typeof questionIndex !== 'number' || questionIndex < 0 || questionIndex > 7) {
      return NextResponse.json(
        { ok: false, error: 'Invalid questionIndex. Must be 0-7.' },
        { status: 400 }
      )
    }

    // Use provided questionText if available, otherwise fall back to generating it
    let finalQuestionText = questionText
    if (!finalQuestionText) {
      // Fallback: Generate question text using the same logic as generate-questions API
      const finalJobTitle = jobTitle || 'this position'
      const finalCompany = company || 'this company'

      const questions = [
        `Tell me about yourself and why you're interested in the ${finalJobTitle} position at ${finalCompany}.`,
        `What relevant experience do you have that prepares you for the ${finalJobTitle}?`,
        `Describe a time you faced a challenge similar to what you expect in this ${finalJobTitle} role.`,
        `Tell me about a time you worked in a team on a project relevant to ${finalJobTitle}.`,
        `What do you see as the most important skills for a successful ${finalJobTitle} at ${finalCompany}?`,
        `Describe an achievement you are proud of that shows you are a good fit for ${finalJobTitle}.`,
        `How do you handle pressure, deadlines or targets in a role like ${finalJobTitle}?`,
        `Why should ${finalCompany} choose you for the ${finalJobTitle} over other candidates?`,
      ]

      finalQuestionText = questions[questionIndex]
    }

    if (!finalQuestionText) {
      return NextResponse.json(
        { ok: false, error: 'Question text is required.' },
        { status: 400 }
      )
    }

    // Build file path
    const fileName = `${jobId}-q${questionIndex + 1}.mp3`
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'simulation')
    const filePath = path.join(audioDir, fileName)

    // Ensure directory exists
    try {
      await fs.mkdir(audioDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore
    }

    // Check if file already exists
    try {
      await fs.access(filePath)
      // File exists, return its public URL
      return NextResponse.json({
        ok: true,
        audioUrl: `/audio/simulation/${fileName}`,
      })
    } catch {
      // File doesn't exist, need to generate it
    }

    // Check if ElevenLabs API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'ELEVENLABS_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    // Generate audio using ElevenLabs TTS API
    try {
      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, // Rachel voice ID
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: finalQuestionText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      )

      if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text()
        console.error('ElevenLabs API error:', errorText)
        return NextResponse.json(
          { ok: false, error: 'Failed to generate audio from ElevenLabs.' },
          { status: 500 }
        )
      }

      // Get audio buffer
      const audioBuffer = await elevenLabsResponse.arrayBuffer()

      // Save to file
      await fs.writeFile(filePath, Buffer.from(audioBuffer))

      // Return public URL
      return NextResponse.json({
        ok: true,
        audioUrl: `/audio/simulation/${fileName}`,
      })
    } catch (error: any) {
      console.error('Error generating audio:', error)
      return NextResponse.json(
        { ok: false, error: error.message || 'Failed to generate audio.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Simulation audio API error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to process request.' },
      { status: 500 }
    )
  }
}

