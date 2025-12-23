"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useAiAccess } from "@/lib/use-ai-access"
import { startCheckout } from "@/lib/checkout"
import { LAUNCH_PRICE_GBP } from "@/lib/funnelConfig"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const { valid, remainingFormatted } = useAiAccess()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const priceLabel = `£${LAUNCH_PRICE_GBP.toFixed(2)}`

  const handleCheckout = async () => {
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
    <header className="border-b border-foreground/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50" data-no-translate>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-400" />
          <span className="font-semibold text-lg tracking-wide">AI CV Generator Pro</span>
        </Link>
        <div className="flex items-center gap-4">
          {valid && remainingFormatted ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                AI access:
              </span>
              <span className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                {remainingFormatted}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">left</span>
            </div>
          ) : (
            <Button
  variant="default"
  size="sm"
  onClick={handleCheckout}
  disabled={checkoutLoading}
>
  {checkoutLoading ? (
    <>Processing…</>
  ) : (
    <>
      <Sparkles className="w-4 h-4 mr-2" />
      Unlock AI — {priceLabel}
    </>
  )}
</Button>

          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
