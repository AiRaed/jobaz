/**
 * User-scoped localStorage utilities
 * All storage keys are scoped by user ID to ensure data isolation between accounts
 */

import { supabase } from './supabase'

// Cache for current user ID (updated on auth state changes)
let cachedUserId: string | null = null

/**
 * Initialize user ID cache by listening to auth state changes
 * Call this once in your app (e.g., in a root component or layout)
 */
export function initUserStorageCache() {
  if (typeof window === 'undefined') return
  
  // Get initial user ID
  supabase.auth.getUser().then(({ data: { user } }) => {
    cachedUserId = user?.id || null
  })
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id || null
  })
}

/**
 * Get the current user ID from cache (synchronous)
 * Returns null if no user is logged in
 */
export function getCurrentUserIdSync(): string | null {
  return cachedUserId
}

/**
 * Get the current user ID from Supabase auth (async)
 * Returns null if no user is logged in
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    cachedUserId = user?.id || null
    return cachedUserId
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

/**
 * Get a user-scoped storage key
 * Format: jobaz_${baseKey}_${userId}
 * If no user is logged in, returns the base key (for backward compatibility during migration)
 */
export async function getUserScopedKey(baseKey: string): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    // No user logged in - return base key for backward compatibility
    // This should only happen during migration or if user is not logged in
    return baseKey
  }
  return `jobaz_${baseKey}_${userId}`
}

/**
 * Get a user-scoped storage key synchronously (for cases where user ID is already known)
 * Format: jobaz_${baseKey}_${userId}
 * 
 * IMPORTANT: For protected pages, always check userId exists before calling this.
 * Fallback to baseKey is only for backward compatibility during migration.
 */
export function getUserScopedKeySync(baseKey: string, userId: string | null): string {
  if (!userId) {
    // Fallback to baseKey for backward compatibility (should not happen in protected pages)
    console.warn(`getUserScopedKeySync: No userId provided for key '${baseKey}'. Using fallback key. This should not happen in protected pages.`)
    return baseKey
  }
  return `jobaz_${baseKey}_${userId}`
}

/**
 * Get all localStorage keys for a specific user
 */
export function getUserStorageKeys(userId: string): string[] {
  if (typeof window === 'undefined') return []
  
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes(`_${userId}`)) {
      keys.push(key)
    }
  }
  return keys
}

/**
 * Clear all localStorage keys for a specific user
 */
export async function clearUserStorage(userId: string | null): Promise<void> {
  if (typeof window === 'undefined' || !userId) return
  
  try {
    // Clear all user-scoped keys (format: jobaz_*_${userId})
    const userKeys = getUserStorageKeys(userId)
    userKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clear all job-specific keys for this user (jobaz_job_*_${userId})
    const jobKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('jobaz_job_') && key.endsWith(`_${userId}`)) {
        jobKeys.push(key)
      }
    }
    jobKeys.forEach(key => localStorage.removeItem(key))
    
    // Clear interview training flags for this user
    const interviewKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('_interview_trained') && key.includes(`_${userId}`)) {
        interviewKeys.push(key)
      }
    }
    interviewKeys.forEach(key => localStorage.removeItem(key))
    
    // Also clear any legacy keys that might not be user-scoped yet
    // This is a safety measure during migration - only clear if user is logged out
    // (We check this by verifying userId is provided, meaning we're clearing for a specific user)
    const legacyKeys = [
      'jobaz-applied-jobs',
      'jobaz-cvs',
      'jobaz_baseCv',
      'jobaz_hasCV',
      'jobaz_cvLastUpdated',
      'jobaz_baseCoverLetter',
      'jobaz_hasCoverLetter',
      'jobaz_coverLastUpdated',
      'jobaz-saved-jobs',
      'jobaz_job_info',
      'jobaz_lastJobId',
      'jobaz-cover-draft',
      'jobaz_prefill_summary',
    ]
    
    // Clear legacy keys only if they exist (during migration period)
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear all legacy job keys (jobaz_job_* without user ID suffix)
    // Only if they don't have a user ID suffix (to avoid clearing other users' data)
    const legacyJobKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('jobaz_job_')) {
        // Check if it's a legacy key (doesn't match user-scoped pattern)
        // Legacy format: jobaz_job_${jobId} (3 parts)
        // User-scoped format: jobaz_job_${jobId}_${userId} (4+ parts)
        const parts = key.split('_')
        if (parts.length <= 3) { // jobaz_job_${jobId} format (legacy)
          legacyJobKeys.push(key)
        }
      }
    }
    legacyJobKeys.forEach(key => localStorage.removeItem(key))
    
  } catch (error) {
    console.error('Error clearing user storage:', error)
  }
}

/**
 * Clear all user storage for the current logged-in user
 */
export async function clearCurrentUserStorage(): Promise<void> {
  const userId = await getCurrentUserId()
  await clearUserStorage(userId)
}

/**
 * Get all storage keys that match a pattern (for a specific user)
 */
export function getUserStorageKeysByPattern(pattern: string, userId: string | null): string[] {
  if (typeof window === 'undefined') return []
  
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      // Check if key matches pattern and belongs to user (if userId provided)
      if (userId) {
        if (key.includes(pattern) && key.includes(`_${userId}`)) {
          keys.push(key)
        }
      } else {
        // If no userId, match pattern only (for backward compatibility)
        if (key.includes(pattern)) {
          keys.push(key)
        }
      }
    }
  }
  return keys
}

