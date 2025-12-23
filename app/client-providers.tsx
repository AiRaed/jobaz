'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/toast'
import { TranslationSettingsProvider } from '@/contexts/TranslationSettingsContext'
import { JazContextProvider } from '@/contexts/JazContextContext'
import JazAssistant from '@/components/JazAssistant'
import HoverTranslateLayer from '@/components/HoverTranslateLayer'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TranslationSettingsProvider>
          <JazContextProvider>
            {children}
            <JazAssistant />
            <HoverTranslateLayer />
          </JazContextProvider>
        </TranslationSettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
