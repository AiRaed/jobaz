/**
 * Site URL helper with dev-safe fallback
 * Use this instead of process.env.NEXT_PUBLIC_SITE_URL directly
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

