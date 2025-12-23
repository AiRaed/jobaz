'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/button'
import { useAiAccess } from '@/lib/use-ai-access'
import { setAiAccess } from '@/lib/ai-access'
import { trackEvent } from '@/lib/analytics'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()
  const { remainingFormatted, setAccess } = useAiAccess()
  const [error, setError] = useState<string | null>(null)
  const [accessSet, setAccessSet] = useState(false)

  useEffect(() => {
    // Set AI access on page load (only once)
    if (accessSet) return
    
    try {
      setAccess('stripe')
      trackEvent('checkout_success')
      trackEvent('unlock_activated_24h')
      setAccessSet(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[Success Page] Error setting AI access:', err)
      setAccessSet(true) // Mark as attempted to avoid retries
    }
  }, [setAccess, accessSet])

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-platinum to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-heading font-bold mb-4 bg-gradient-to-r from-violet-accent to-purple-600 bg-clip-text text-transparent">
          ✅ Payment successful
        </h1>
        
        {error ? (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        ) : (
          <>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Your AI access is unlocked for the next 24 hours.
            </p>

            {/* Timer display */}
            <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
              <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span className="text-2xl font-mono font-bold text-violet-600 dark:text-violet-400">
                {remainingFormatted || '24:00'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">remaining</span>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cv-builder-v2">
            <Button size="lg" variant="primary" className="w-full sm:w-auto">
              <Sparkles className="w-5 h-5 mr-2" />
              Open CV Builder
            </Button>
          </Link>
          <Link href="/cover">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto">
              Open Cover Letter
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
