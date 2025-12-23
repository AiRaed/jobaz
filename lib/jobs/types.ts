/**
 * Unified Job Type
 * Standard format for all job providers
 */

export type UnifiedJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
  salaryMin?: number
  salaryMax?: number
  url: string
  source: 'adzuna' | 'reed'
}

/**
 * Search parameters for job providers
 */
export interface JobSearchParams {
  keyword: string
  location?: string
  page?: number
}

