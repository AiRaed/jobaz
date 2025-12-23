/**
 * Server-side Supabase utilities
 * This file should ONLY be imported in Server Components or API routes
 * DO NOT import this in client components ('use client')
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Creates a Supabase client for server components using SSR.
 * This properly handles cookies for authentication in server components.
 * 
 * IMPORTANT: This function can ONLY be used in Server Components or API routes.
 * Do NOT use this in client components.
 * 
 * @example
 * // In a Server Component
 * import { createServerComponentClient } from '@/lib/supabase-server'
 * 
 * export default async function MyServerComponent() {
 *   const supabase = await createServerComponentClient()
 *   const { data } = await supabase.auth.getUser()
 *   // ...
 * }
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

