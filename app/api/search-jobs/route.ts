import { NextRequest, NextResponse } from 'next/server'
import { mockJobs } from '@/lib/jobs/mock-jobs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, location, type } = body

    // If no filters are provided, return the full list
    const hasFilters = (title && title.trim()) || (location && location.trim()) || (type && type.trim())
    
    if (!hasFilters) {
      return NextResponse.json({ jobs: mockJobs })
    }

    // Filter mock jobs based on search criteria
    let filteredJobs = [...mockJobs]

    if (title && title.trim()) {
      const titleLower = title.toLowerCase().trim()
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(titleLower) ||
          job.company.toLowerCase().includes(titleLower)
      )
    }

    if (location && location.trim()) {
      const locationLower = location.toLowerCase().trim()
      filteredJobs = filteredJobs.filter((job) =>
        job.location.toLowerCase().includes(locationLower)
      )
    }

    if (type && type.trim()) {
      filteredJobs = filteredJobs.filter((job) => job.type === type)
    }

    // If nothing matches, return the full list instead of an empty array
    if (filteredJobs.length === 0) {
      return NextResponse.json({ jobs: mockJobs })
    }

    return NextResponse.json({ jobs: filteredJobs })
  } catch (error) {
    console.error('Error searching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    )
  }
}

