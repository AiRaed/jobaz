import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summary, jobTitle, company, location } = body

    // Simple mock transformation - prefix with tailored message
    const tailoredSummary = `Tailored for ${jobTitle || 'this role'} at ${company || 'this company'}: ${summary || 'Motivated professional with relevant experience and skills.'}`

    return NextResponse.json({
      ok: true,
      tailoredSummary
    })
  } catch (error) {
    console.error('Error tailoring CV:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to tailor CV' },
      { status: 500 }
    )
  }
}

