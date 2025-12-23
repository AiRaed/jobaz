import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] transition",
        hover && "hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)]",
        className
      )}
    >
      {children}
    </div>
  )
}

