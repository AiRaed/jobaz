import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Fetch a single Reed job by ID
 */
async function fetchReedJobById(rawId: string) {
  const apiKey = process.env.REED_API_KEY
  const base = process.env.REED_API_BASE || 'https://www.reed.co.uk/api/1.0'

  if (!apiKey) {
    throw new Error('Missing Reed API config')
  }

  const url = `${base}/jobs/${rawId}`
  const response = await fetch(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`Reed API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Fetch a single Adzuna job by ID
 * Uses Adzuna Job Details endpoint: /jobs/gb/{jobId}.json
 * IMPORTANT: The .json suffix is REQUIRED
 */
async function fetchAdzunaJobById(rawId: string) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  const apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'

  if (!appId || !appKey) {
    throw new Error('Missing Adzuna API credentials')
  }

  try {
    // Adzuna Job Details endpoint: /jobs/gb/{jobId}.json
    // IMPORTANT: The .json suffix is REQUIRED
    // Use "gb" to match the country code used in search endpoint (NOT "uk")
    const url = new URL(`${apiBase}/jobs/gb/${rawId}.json`)
    url.searchParams.set('app_id', appId)
    url.searchParams.set('app_key', appKey)

    const fullUrl = url.toString()
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Log full URL in dev mode only
        if (process.env.NODE_ENV === 'development') {
          console.error(`Adzuna job not found. Full URL used: ${fullUrl}`)
        }
        return null
      }
      const errorText = await response.text()
      console.error(`Adzuna API error for job ${rawId}:`, response.status, response.statusText, errorText)
      // Log full URL in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.error(`Adzuna API URL used: ${fullUrl}`)
      }
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching Adzuna job ${rawId}:`, error)
    throw error
  }
}

/**
 * Normalize Reed job to common format
 */
function normalizeReedJobForDetails(reedJob: any, fullId: string) {
  return {
    id: fullId,
    title: reedJob.jobTitle || 'Untitled Job',
    company: reedJob.employerName || 'Unknown Company',
    location: reedJob.locationName || 'Location not specified',
    description: reedJob.fullDescription || reedJob.jobDescription || '',
    type: reedJob.contractType || (reedJob.fullTime ? 'Full-time' : reedJob.partTime ? 'Part-time' : undefined),
    link: reedJob.jobUrl || undefined,
    salary: reedJob.minimumSalary && reedJob.maximumSalary
      ? `£${reedJob.minimumSalary.toLocaleString()} - £${reedJob.maximumSalary.toLocaleString()}`
      : reedJob.minimumSalary
      ? `From £${reedJob.minimumSalary.toLocaleString()}`
      : reedJob.maximumSalary
      ? `Up to £${reedJob.maximumSalary.toLocaleString()}`
      : undefined,
    provider: 'reed',
    source: 'reed',
    // Store full Reed job object for compatibility
    _reedJob: reedJob,
  }
}

/**
 * Normalize Adzuna job to common format
 */
function normalizeAdzunaJobForDetails(adzunaJob: any, fullId: string) {
  return {
    id: fullId,
    title: adzunaJob.title || 'Untitled Job',
    company: adzunaJob.company?.display_name || 'Unknown Company',
    location: adzunaJob.location?.display_name || 'Location not specified',
    description: adzunaJob.description || '',
    type: adzunaJob.contract_type || 'Full-time',
    link: adzunaJob.redirect_url || undefined,
    salary: adzunaJob.salary_min && adzunaJob.salary_max
      ? `£${adzunaJob.salary_min.toLocaleString()} - £${adzunaJob.salary_max.toLocaleString()}`
      : adzunaJob.salary_min
      ? `From £${adzunaJob.salary_min.toLocaleString()}`
      : adzunaJob.salary_max
      ? `Up to £${adzunaJob.salary_max.toLocaleString()}`
      : undefined,
    contract_time: adzunaJob.contract_time,
    salary_min: adzunaJob.salary_min,
    salary_max: adzunaJob.salary_max,
    category: adzunaJob.category?.label,
    provider: 'adzuna',
    source: 'adzuna',
    // Store full Adzuna job object for compatibility
    _adzunaJob: adzunaJob,
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Parse id from request URL searchParams
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // 2. Determine provider strictly
    let provider: 'adzuna' | 'reed'
    let rawId: string

    if (id.startsWith('adzuna_')) {
      provider = 'adzuna'
      // 3. Strip prefix to get raw id
      rawId = id.replace(/^adzuna_/, '')
    } else if (id.startsWith('reed_')) {
      provider = 'reed'
      // 3. Strip prefix to get raw id
      rawId = id.replace(/^reed_/, '')
    } else {
      // 2. Return 400 if provider is unknown
      return NextResponse.json(
        { error: 'Unknown provider', id },
        { status: 400 }
      )
    }

    console.log(`[jobs/details] Fetching ${provider} job with rawId: ${rawId}, fullId: ${id}`)

    let job: any = null

    // 4. Call ONLY the matching provider fetch function
    if (provider === 'adzuna') {
      try {
        const adzunaJob = await fetchAdzunaJobById(rawId)
        if (adzunaJob) {
          job = normalizeAdzunaJobForDetails(adzunaJob, id)
        } else {
          // Job not found
          return NextResponse.json(
            { error: 'Adzuna job not found', id, rawId },
            { status: 404 }
          )
        }
      } catch (error) {
        // 5. Clear error JSON for Adzuna
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[jobs/details] Adzuna API error for job ${rawId}:`, errorMessage)
        return NextResponse.json(
          { error: 'Adzuna API error', details: errorMessage },
          { status: 502 }
        )
      }
    } else if (provider === 'reed') {
      try {
        const reedJob = await fetchReedJobById(rawId)
        if (reedJob) {
          job = normalizeReedJobForDetails(reedJob, id)
        } else {
          // Job not found
          return NextResponse.json(
            { error: 'Reed job not found', id, rawId },
            { status: 404 }
          )
        }
      } catch (error) {
        // 5. Clear error JSON for Reed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[jobs/details] Reed API error for job ${rawId}:`, errorMessage)
        return NextResponse.json(
          { error: 'Reed API error', details: errorMessage },
          { status: 502 }
        )
      }
    }

    // 6. Keep response shape consistent with provider
    return NextResponse.json(
      { job, provider },
      { status: 200 }
    )
  } catch (error) {
    console.error('[jobs/details] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch job details', details: errorMessage },
      { status: 500 }
    )
  }
}
