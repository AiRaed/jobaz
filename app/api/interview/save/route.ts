import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      user_id,
      question,
      answer,
      score,
      strengths,
      weaknesses,
      improved_answer,
    } = await req.json()

    if (!question || !answer) {
      return NextResponse.json(
        { ok: false, error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual Supabase integration
    // For now, this is a placeholder that simulates saving
    // When Supabase is configured, replace this with:
    /*
    import { createClient } from '@supabase/supabase-js'
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { error } = await supabase
      .from('interview_training')
      .insert({
        user_id: user_id || 'demo_user',
        question,
        answer,
        score,
        strengths: JSON.stringify(strengths || []),
        weaknesses: JSON.stringify(weaknesses || []),
        improved_answer,
        created_at: new Date().toISOString(),
      })
    
    if (error) {
      throw error
    }
    */

    // Mock save - logs to console for now
    console.log('[Interview Save]', {
      user_id: user_id || 'demo_user',
      question,
      answer,
      score,
      strengths,
      weaknesses,
      improved_answer,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, message: 'Saved successfully' })
  } catch (error: any) {
    console.error('Save error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save' },
      { status: 500 }
    )
  }
}

