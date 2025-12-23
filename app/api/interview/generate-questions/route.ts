import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Accept job context: jobTitle, company, and jobType (for backward compatibility)
    const { jobTitle, company, jobType } = await req.json()

    // Use jobTitle if provided, otherwise fall back to jobType
    const finalJobTitle = jobTitle || jobType || ''
    const finalCompany = company || ''

    // If no job context is provided, return error
    if (!finalJobTitle || finalJobTitle.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Job title or job type is required' },
        { status: 400 }
      )
    }

    // Return 8 base questions as objects with id and question properties
    const questions = [
      {
        id: '1',
        question: `Tell me about yourself and why you're interested in the ${finalJobTitle || 'this'} position at ${finalCompany || 'this company'}.`,
      },
      {
        id: '2',
        question: `What relevant experience do you have that prepares you for the ${finalJobTitle || 'role'}?`,
      },
      {
        id: '3',
        question: `Describe a time you faced a challenge similar to what you expect in this ${finalJobTitle || 'role'}.`,
      },
      {
        id: '4',
        question: `Tell me about a time you worked in a team on a project relevant to ${finalJobTitle || 'this position'}.`,
      },
      {
        id: '5',
        question: `What do you see as the most important skills for a successful ${finalJobTitle || 'candidate'} at ${finalCompany || 'this company'}?`,
      },
      {
        id: '6',
        question: `Describe an achievement you are proud of that shows you are a good fit for ${finalJobTitle || 'this role'}.`,
      },
      {
        id: '7',
        question: `How do you handle pressure, deadlines or targets in a role like ${finalJobTitle || 'this'}?`,
      },
      {
        id: '8',
        question: `Why should ${finalCompany || 'the employer'} choose you for the ${finalJobTitle || 'position'} over other candidates?`,
      },
    ]

    return NextResponse.json({ ok: true, questions })
  } catch (error: any) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

