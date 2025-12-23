// Job information storage utility
// Uses localStorage for now, will be replaced with Supabase when accounts are built

export interface JobInfo {
  jobTitle: string
  location?: string // Country / City
  experienceLevel?: 'entry' | 'mid' | 'senior'
  skills?: string
}

const STORAGE_KEY = 'jobaz_job_info'

export function saveJobInfo(jobInfo: JobInfo): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobInfo))
  }
}

export function getJobInfo(): JobInfo | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as JobInfo
      } catch (error) {
        console.error('Error parsing job info from localStorage:', error)
        return null
      }
    }
  }
  return null
}

export function clearJobInfo(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Helper to format job info for API calls
export function getJobContextForAPI(jobInfo: JobInfo | null): string {
  if (!jobInfo) return ''
  
  // Build a comprehensive job context string
  let context = jobInfo.jobTitle
  
  if (jobInfo.location) {
    context += ` in ${jobInfo.location}`
  }
  
  if (jobInfo.experienceLevel) {
    const levelMap = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level'
    }
    context += ` (${levelMap[jobInfo.experienceLevel]})`
  }
  
  if (jobInfo.skills) {
    context += ` - Skills: ${jobInfo.skills}`
  }
  
  return context
}

