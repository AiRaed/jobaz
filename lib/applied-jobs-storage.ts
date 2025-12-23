// Applied jobs storage utility
// Stores jobs that the user has applied for

import { getUserScopedKeySync, getCurrentUserIdSync } from './user-storage'

export interface AppliedJob {
  id: string              // internal JobAZ id or the external job ID from the API
  title: string
  company: string
  location?: string
  sourceSite?: string     // e.g. Adzuna, Reed, etc.
  jobUrl?: string         // external job link
  createdAt: string       // ISO date string
  status?: 'submitted' | 'in-progress' | 'not-started'
  hasCv?: boolean
  hasCover?: boolean
}

const BASE_STORAGE_KEY = 'applied-jobs'

/**
 * Get the storage key for applied jobs (user-scoped)
 * Uses cached user ID for synchronous access
 */
function getStorageKey(): string {
  if (typeof window === 'undefined') return BASE_STORAGE_KEY
  
  const userId = getCurrentUserIdSync()
  if (userId) {
    return getUserScopedKeySync(BASE_STORAGE_KEY, userId)
  }
  
  // Fallback to legacy key for backward compatibility (when no user logged in)
  return 'jobaz-applied-jobs'
}

/**
 * Get all applied jobs from localStorage (user-scoped)
 */
export function getAppliedJobs(): AppliedJob[] {
  if (typeof window === 'undefined') return []

  try {
    const storageKey = getStorageKey()
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []

    const jobs = JSON.parse(stored) as AppliedJob[]
    // Validate that it's an array
    if (!Array.isArray(jobs)) {
      console.error('Stored applied jobs is not an array, resetting...')
      localStorage.removeItem(storageKey)
      return []
    }
    return jobs
  } catch (error) {
    console.error('Error parsing applied jobs from localStorage:', error)
    // Clear corrupted data
    try {
      const storageKey = getStorageKey()
      localStorage.removeItem(storageKey)
    } catch (clearError) {
      console.error('Error clearing corrupted applied jobs data:', clearError)
    }
    return []
  }
}

/**
 * Add a job to the applied jobs list (prevents duplicates by id)
 */
export function addAppliedJob(job: AppliedJob): void {
  if (typeof window === 'undefined') return

  try {
    const storageKey = getStorageKey()
    const existingJobs = getAppliedJobs()
    
    // Check if job with this id already exists
    const existingIndex = existingJobs.findIndex(j => j.id === job.id)
    
    if (existingIndex >= 0) {
      // Update existing job instead of duplicating
      existingJobs[existingIndex] = job
    } else {
      // Add new job
      existingJobs.push(job)
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingJobs))
    
    // Dispatch custom event for JAZ to detect state changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jobaz-job-state-changed'))
    }
  } catch (error) {
    console.error('Error saving applied job to localStorage:', error)
  }
}

/**
 * Remove a job from the applied jobs list by id
 */
export function removeAppliedJob(jobId: string): void {
  if (typeof window === 'undefined') return

  try {
    const storageKey = getStorageKey()
    const existingJobs = getAppliedJobs()
    const filteredJobs = existingJobs.filter(j => j.id !== jobId)
    localStorage.setItem(storageKey, JSON.stringify(filteredJobs))
    
    // Dispatch custom event for JAZ to detect state changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jobaz-job-state-changed'))
    }
  } catch (error) {
    console.error('Error removing applied job from localStorage:', error)
  }
}

/**
 * Clear all applied jobs
 */
export function clearAppliedJobs(): void {
  if (typeof window === 'undefined') return

  try {
    const storageKey = getStorageKey()
    localStorage.removeItem(storageKey)
  } catch (error) {
    console.error('Error clearing applied jobs from localStorage:', error)
  }
}

/**
 * Check if a job has been applied for
 */
export function isJobApplied(jobId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const appliedJobs = getAppliedJobs()
  return appliedJobs.some(job => job.id === jobId)
}

