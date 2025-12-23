/**
 * Adzuna Job Provider
 * Fetches jobs from Adzuna UK API and normalizes the response
 */

export interface AdzunaJob {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  description?: string
  applyUrl: string
  source: 'adzuna'
}

export interface AdzunaSearchParams {
  keyword: string
  location?: string
  page?: number
}

export interface AdzunaApiResponse {
  results: Array<{
    id: string
    title: string
    company: {
      display_name: string
    }
    location: {
      display_name: string
    }
    description: string
    redirect_url: string
    salary_min?: number
    salary_max?: number
    salary_is_predicted?: string
    created?: string
    category?: {
      label: string
    }
  }>
  count: number
}

/**
 * Normalize Adzuna salary information to a readable string
 */
function formatSalary(
  min?: number,
  max?: number,
  isPredicted?: string
): string | undefined {
  if (!min && !max) return undefined

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (min && max) {
    return `${formatAmount(min)} - ${formatAmount(max)}`
  } else if (min) {
    return `From ${formatAmount(min)}`
  } else if (max) {
    return `Up to ${formatAmount(max)}`
  }

  return undefined
}

/**
 * Normalize Adzuna API response to our standard Job format
 */
function normalizeAdzunaJob(adzunaJob: AdzunaApiResponse['results'][0]): AdzunaJob {
  const salary = formatSalary(
    adzunaJob.salary_min,
    adzunaJob.salary_max,
    adzunaJob.salary_is_predicted
  )

  return {
    id: adzunaJob.id,
    title: adzunaJob.title || 'Untitled Job',
    company: adzunaJob.company?.display_name || 'Unknown Company',
    location: adzunaJob.location?.display_name || 'Location not specified',
    salary,
    description: adzunaJob.description || '',
    applyUrl: adzunaJob.redirect_url || '',
    source: 'adzuna',
  }
}

/**
 * Fetch jobs from Adzuna UK API
 */
export async function fetchJobsFromAdzuna(
  params: AdzunaSearchParams
): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  const apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'

  if (!appId || !appKey) {
    throw new Error('Missing Adzuna API credentials (ADZUNA_APP_ID or ADZUNA_APP_KEY)')
  }

  // Default to UK if no location specified
  const location = params.location || 'UK'
  const page = params.page || 1
  const keyword = params.keyword.trim()

  if (!keyword) {
    throw new Error('Keyword is required')
  }

  // Build Adzuna API URL for UK jobs
  // Adzuna UK endpoint: /jobs/gb/search/{page}
  const url = new URL(`${apiBase}/jobs/gb/search/${page}`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('what', keyword)
  url.searchParams.set('where', location)
  url.searchParams.set('results_per_page', '20')
  url.searchParams.set('content-type', 'application/json')

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Adzuna API error:', response.status, response.statusText, errorText)
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
    }

    const data: AdzunaApiResponse = await response.json()

    // Normalize all jobs to our standard format
    const normalizedJobs = (data.results || []).map(normalizeAdzunaJob)

    return normalizedJobs
  } catch (error) {
    console.error('Error fetching jobs from Adzuna:', error)
    throw error
  }
}

