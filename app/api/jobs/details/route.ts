import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Get job ID from query parameters
    const searchParams = req.nextUrl.searchParams
    const rawId = searchParams.get('id')?.trim()

    if (!rawId) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      )
    }

    // Provider detection must happen before stripping prefixes
    const isAdzuna = rawId.startsWith('adzuna_')
    const isReed = rawId.startsWith('reed_')

    // Only after provider detection, strip the prefix
    const cleanId = rawId.replace(/^adzuna_/, '').replace(/^reed_/, '')

    // Route to appropriate provider
    if (isAdzuna) {
      // Fetch from Adzuna API
      const appId = process.env.ADZUNA_APP_ID
      const appKey = process.env.ADZUNA_APP_KEY
      const apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'

      if (!appId || !appKey) {
        return NextResponse.json(
          { error: 'Missing Adzuna API config' },
          { status: 500 }
        )
      }

      // Adzuna Job Details endpoint: /jobs/gb/{jobId}.json
      // IMPORTANT: The .json suffix is REQUIRED
      const url = new URL(`${apiBase}/jobs/gb/${cleanId}.json`)
      url.searchParams.set('app_id', appId)
      url.searchParams.set('app_key', appKey)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Adzuna job not found', jobId: rawId },
            { status: 404 }
          )
        }
        if (response.status === 400) {
          const errorText = await response.text().catch(() => 'Bad Request')
          console.error('Adzuna API 400 error:', errorText)
          return NextResponse.json(
            { error: 'Adzuna API error: Bad Request', details: errorText },
            { status: 400 }
          )
        }
        const errorText = await response.text().catch(() => response.statusText)
        console.error('Adzuna API error:', response.status, errorText)
        return NextResponse.json(
          { error: 'Adzuna API error', details: errorText },
          { status: response.status }
        )
      }

      const job = await response.json()
      return NextResponse.json({ job }, { status: 200 })
    } else if (isReed) {
      // Fetch from Reed API
      const apiKey = process.env.REED_API_KEY
      const base = process.env.REED_API_BASE || 'https://www.reed.co.uk/api/1.0'

      if (!apiKey) {
        return NextResponse.json(
          { error: 'Missing Reed API config' },
          { status: 500 }
        )
      }

      // Build the Reed API URL for job details
      const url = `${base}/jobs/${cleanId}`

      // Make request to Reed API with Basic Auth
      // Reed API uses API KEY ONLY (no username/password, no colon)
      const response = await fetch(url, {
        headers: {
          Authorization: 'Basic ' + Buffer.from(apiKey).toString('base64'),
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Reed job not found', jobId: rawId },
            { status: 404 }
          )
        }
        if (response.status === 400) {
          const errorText = await response.text().catch(() => 'Bad Request')
          console.error('Reed API 400 error:', errorText)
          return NextResponse.json(
            { error: 'Reed API error: Bad Request', details: errorText },
            { status: 400 }
          )
        }
        const errorText = await response.text().catch(() => response.statusText)
        console.error('Reed API error:', response.status, errorText)
        return NextResponse.json(
          { error: 'Reed API error', details: errorText },
          { status: response.status }
        )
      }

      const job = await response.json()
      return NextResponse.json({ job }, { status: 200 })
    } else {
      // Unknown provider prefix
      return NextResponse.json(
        { error: 'Unknown job source. Expected id to start with adzuna_ or reed_.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in jobs/details route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

