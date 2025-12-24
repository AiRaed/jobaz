import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Get job ID from query parameters
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')?.trim()

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      )
    }

    // Parse query id. Accept formats: adzuna_123, reed_123, or raw numeric
    let provider: 'adzuna' | 'reed'
    let rawId: string

    // Determine provider strictly
    if (id.startsWith('adzuna_')) {
      provider = 'adzuna'
      rawId = id.replace(/^adzuna_/, '')
    } else if (id.startsWith('reed_')) {
      provider = 'reed'
      rawId = id.replace(/^reed_/, '')
    } else if (/^\d+$/.test(id)) {
      // Numeric ID - default to adzuna
      provider = 'adzuna'
      rawId = id
    } else {
      return NextResponse.json(
        { error: 'Invalid job ID format. Expected: adzuna_123, reed_123, or numeric ID' },
        { status: 400 }
      )
    }

    // Route to appropriate provider
    if (provider === 'adzuna') {
      // Fetch from Adzuna API
      const appId = process.env.ADZUNA_APP_ID
      const appKey = process.env.ADZUNA_APP_KEY
      let apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'

      if (!appId || !appKey) {
        console.error('[Adzuna] Missing API credentials')
        return NextResponse.json(
          { error: 'Missing Adzuna API config. Please set ADZUNA_APP_ID and ADZUNA_APP_KEY environment variables.' },
          { status: 500 }
        )
      }

      // Ensure there is exactly ONE /v1/api in the final URL (avoid double)
      // Remove trailing slashes and normalize
      apiBase = apiBase.replace(/\/+$/, '')
      // Check if /v1/api is already in the base URL
      if (apiBase.includes('/v1/api')) {
        // Remove any duplicate /v1/api and keep only one
        apiBase = apiBase.replace(/\/v1\/api.*$/, '') + '/v1/api'
      } else {
        // Add /v1/api if missing
        apiBase = apiBase + '/v1/api'
      }

      // Adzuna fetch MUST call: /jobs/gb/job/${rawId}
      const url = new URL(`${apiBase}/jobs/gb/job/${rawId}`)
      url.searchParams.set('app_id', appId)
      url.searchParams.set('app_key', appKey)

      const finalUrl = url.toString()
      console.log('[Adzuna] Fetching job:', { provider: 'adzuna', rawId, url: finalUrl.replace(/app_key=[^&]+/, 'app_key=***') })

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          // If Adzuna returns 404, return JSON with provider, rawId, url
          return NextResponse.json(
            { 
              error: 'Adzuna job not found', 
              provider: 'adzuna', 
              rawId, 
              url: finalUrl.replace(/app_key=[^&]+/, 'app_key=***') 
            },
            { status: 404 }
          )
        }
        if (response.status === 400) {
          const errorText = await response.text().catch(() => 'Bad Request')
          console.error('[Adzuna] API 400 error:', errorText)
          return NextResponse.json(
            { error: 'Adzuna API error: Bad Request', details: errorText },
            { status: 400 }
          )
        }
        const errorText = await response.text().catch(() => response.statusText)
        console.error('[Adzuna] API error:', response.status, errorText)
        return NextResponse.json(
          { error: 'Adzuna API error', details: errorText },
          { status: response.status }
        )
      }

      const job = await response.json()
      return NextResponse.json({ job }, { status: 200 })
    } else if (provider === 'reed') {
      // Fetch from Reed API
      const apiKey = process.env.REED_API_KEY
      const base = process.env.REED_API_BASE || 'https://www.reed.co.uk/api/1.0'

      if (!apiKey) {
        console.error('[Reed] Missing API key')
        return NextResponse.json(
          { error: 'Missing Reed API config. Please set REED_API_KEY environment variable.' },
          { status: 500 }
        )
      }

      const url = `${base}/jobs/${rawId}`
      console.log('[Reed] Fetching job:', { provider: 'reed', rawId, url: url.replace(/\/\/[^\/]+@/, '//***@') })

      const response = await fetch(url, {
        headers: {
          Authorization: 'Basic ' + Buffer.from(apiKey).toString('base64'),
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Reed job not found', provider: 'reed', rawId, url },
            { status: 404 }
          )
        }
        if (response.status === 400) {
          const errorText = await response.text().catch(() => 'Bad Request')
          console.error('[Reed] API 400 error:', errorText)
          return NextResponse.json(
            { error: 'Reed API error: Bad Request', details: errorText },
            { status: 400 }
          )
        }
        const errorText = await response.text().catch(() => response.statusText)
        console.error('[Reed] API error:', response.status, errorText)
        return NextResponse.json(
          { error: 'Reed API error', details: errorText },
          { status: response.status }
        )
      }

      const job = await response.json()
      return NextResponse.json({ job }, { status: 200 })
    }
  } catch (error) {
    console.error('Error in jobs/details route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

