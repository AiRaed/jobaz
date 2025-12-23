import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.REED_API_KEY
    const base = process.env.REED_API_BASE || 'https://www.reed.co.uk/api/1.0'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing Reed API config' },
        { status: 500 }
      )
    }

    // Get job ID from query parameters
    const searchParams = req.nextUrl.searchParams
    const jobId = searchParams.get('id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Build the Reed API URL for job details
    const url = `${base}/jobs/${jobId}`

    // Make request to Reed API with Basic Auth
    const response = await fetch(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { job: null },
          { status: 404 }
        )
      }
      console.error('Reed API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Reed API error', details: response.statusText },
        { status: response.status }
      )
    }

    const job = await response.json()

    return NextResponse.json({ job }, { status: 200 })
  } catch (error) {
    console.error('Error in jobs/details route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

