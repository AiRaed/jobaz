'use client'

import { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  className?: string
  showHeader?: boolean
}

export default function AppShell({ children, className = '', showHeader = true }: AppShellProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-[#050617] via-[#0b0820] to-[#050814] text-white">
      {/* Glowing orbs for ambient effect */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      
      <div className={`relative max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 ${className}`}>
        {children}
      </div>
    </div>
  )
}
