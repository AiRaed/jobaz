import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobTitle, company, location, baseText } = body

    // Simple mock cover letter generation
    const baseCoverLetter = baseText || `Dear Hiring Manager,

I am excited to apply for ${jobTitle || 'this position'} at ${company || 'your company'}.`

    const generatedCoverLetter = `${baseCoverLetter}

I am particularly drawn to this opportunity because of [Company]'s reputation for innovation and excellence. My background in [relevant experience] aligns perfectly with the requirements for this role, and I am confident that I can contribute meaningfully to your team.

I would welcome the opportunity to discuss how my skills and experience can benefit ${company || 'your organization'}.

Sincerely,
[Your Name]`

    return NextResponse.json({
      ok: true,
      coverLetter: generatedCoverLetter
    })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}

