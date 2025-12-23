/**
 * Parse provider-prefixed job IDs
 * Examples: reed_56185817, adzuna_123456789
 */

export type JobProvider = 'reed' | 'adzuna'

export interface ParsedJobId {
  provider: JobProvider
  rawId: string
  fullId: string
}

/**
 * Parse a job ID that may have a provider prefix
 * @param jobId - Job ID with or without prefix (e.g., "reed_56185817" or "56185817")
 * @returns Parsed job ID with provider and raw ID
 */
export function parseJobId(jobId: string): ParsedJobId {
  if (!jobId) {
    throw new Error('Job ID is required')
  }

  // Check if ID has provider prefix
  const reedMatch = jobId.match(/^reed_(.+)$/i)
  if (reedMatch) {
    return {
      provider: 'reed',
      rawId: reedMatch[1],
      fullId: jobId,
    }
  }

  const adzunaMatch = jobId.match(/^adzuna_(.+)$/i)
  if (adzunaMatch) {
    return {
      provider: 'adzuna',
      rawId: adzunaMatch[1],
      fullId: jobId,
    }
  }

  // No prefix found, default to reed for backward compatibility
  return {
    provider: 'reed',
    rawId: jobId,
    fullId: `reed_${jobId}`,
  }
}

