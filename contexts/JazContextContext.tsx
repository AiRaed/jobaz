'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { JazPageContext } from '@/components/JazAssistant'

interface JazContextContextType {
  context: JazPageContext
  setContext: (context: JazPageContext) => void
}

const JazContextContext = createContext<JazContextContextType | undefined>(undefined)

export function JazContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<JazPageContext>(null)

  return (
    <JazContextContext.Provider value={{ context, setContext }}>
      {children}
    </JazContextContext.Provider>
  )
}

export function useJazContext() {
  const context = useContext(JazContextContext)
  if (context === undefined) {
    throw new Error('useJazContext must be used within a JazContextProvider')
  }
  return context
}

