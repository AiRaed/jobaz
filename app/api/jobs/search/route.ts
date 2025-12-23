import { NextRequest, NextResponse } from 'next/server'
import { fetchAdzunaJobs } from '@/lib/jobs/adzuna'
import { fetchReedJobs } from '@/lib/jobs/reed'
import { normalizeAdzunaJob, normalizeReedJob, removeDuplicates } from '@/lib/jobs/normalize'
import type { UnifiedJob } from '@/lib/jobs/types'

export const dynamic = 'force-dynamic'

/**
 * Format salary from min/max to readable string
 */
function formatSalary(min?: number, max?: number): string | undefined {
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
 * GET /api/jobs/search
 * 
 * Query parameters:
 * - keyword: Search keyword (required)
 * - location: Location filter (default: 'UK')
 * - page: Page number (default: 1)
 * 
 * Returns unified job results from both Adzuna and Reed UK APIs
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || ''
    const location = searchParams.get('location') || 'UK'
    const page = parseInt(searchParams.get('page') || '1', 10)

    // Validate keyword
    if (!keyword.trim()) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      )
    }

    const searchParamsObj = {
      keyword: keyword.trim(),
      location: location.trim() || 'UK',
      page,
    }

    // Fetch jobs from both providers in parallel
    const [adzunaJobsRaw, reedJobsRaw] = await Promise.allSettled([
      fetchAdzunaJobs(searchParamsObj),
      fetchReedJobs(searchParamsObj),
    ])

    // Normalize jobs from both providers
    const allJobs: UnifiedJob[] = []

    // Process Adzuna jobs
    if (adzunaJobsRaw.status === 'fulfilled') {
      const normalized = adzunaJobsRaw.value.map(normalizeAdzunaJob)
      allJobs.push(...normalized)
    } else {
      console.error('Adzuna API error:', adzunaJobsRaw.reason)
    }

    // Process Reed jobs
    if (reedJobsRaw.status === 'fulfilled') {
      const normalized = reedJobsRaw.value.map(normalizeReedJob)
      allJobs.push(...normalized)
    } else {
      console.error('Reed API error:', reedJobsRaw.reason)
    }

    // Remove duplicates (based on title + company + location)
    const uniqueJobs = removeDuplicates(allJobs)

    // Map to the format expected by the frontend
    const mappedResults = uniqueJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      type: 'Full-time', // Default type for compatibility
      link: job.url,
      salary: formatSalary(job.salaryMin, job.salaryMax),
      source: job.source,
    }))

    return NextResponse.json({ results: mappedResults }, { status: 200 })
  } catch (error) {
    console.error('Error in jobs/search route:', error)
    
    // Provide user-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Missing') && errorMessage.includes('API credentials')) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing API credentials' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('Keyword is required')) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search jobs', details: errorMessage },
      { status: 500 }
    )
  }
}

