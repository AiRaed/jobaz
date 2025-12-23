'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/button'
import { startCheckout } from '@/lib/checkout'
import Link from 'next/link'
import { useState } from 'react'

export default function CancelPage() {
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleTryAgain = async () => {
    setCheckoutLoading(true)
    try {
      const success = await startCheckout()
      // If checkout succeeded, redirect will happen in startCheckout
      // If it failed (returned false), reset loading state
      if (!success) {
        setCheckoutLoading(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutLoading(false)
    }
  }

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
          className="w-20 h-20 mx-auto mb-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center"
        >
          <XCircle className="w-12 h-12 text-gray-600 dark:text-gray-300" />
        </motion.div>
        
        <h1 className="text-2xl font-heading font-bold mb-4 text-gray-800 dark:text-gray-200">
          Payment was cancelled
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          You can try again anytime.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="primary"
            onClick={handleTryAgain}
            disabled={checkoutLoading}
            isLoading={checkoutLoading}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Try again
          </Button>
          <Link href="/cv-builder-v2">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Builder
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}



