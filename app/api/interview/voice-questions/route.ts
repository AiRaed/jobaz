import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, company } = await req.json()

    // Generate job-specific voice questions dynamically
    const questions = [
      {
        id: "1",
        question: `Answer this as if you're interviewing for the ${jobTitle || 'position'} role at ${company || 'this company'}. Tell me about yourself and why you're a good fit.`,
      },
      {
        id: "2",
        question: `Why are you interested in the ${jobTitle || 'position'} role at ${company || 'this company'}?`,
      },
      {
        id: "3",
        question: `What makes you a strong candidate for the ${jobTitle || 'position'} position at ${company || 'this company'}?`,
      },
    ]

    return NextResponse.json({ ok: true, questions })
  } catch (error: any) {
    console.error('Fetch voice questions error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}
