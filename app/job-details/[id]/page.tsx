import { notFound } from 'next/navigation'
import JobDetailsClient from './JobDetailsClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function fetchJobData(jobId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000')
    const apiUrl = `${baseUrl}/api/jobs/${encodeURIComponent(jobId)}`
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      return null
    }

    const data = await response.json()
    return data.job || null
  } catch (error) {
    console.error('Error fetching job:', error)
    return null
  }
}

export default async function JobDetailsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const jobId = resolvedParams?.id

  if (!jobId) {
    notFound()
  }

  const job = await fetchJobData(jobId)

  return <JobDetailsClient job={job} jobId={jobId} searchParams={resolvedSearchParams} />
}
