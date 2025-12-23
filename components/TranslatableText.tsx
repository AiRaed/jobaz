'use client'

import { ReactNode } from 'react'

interface TranslatableTextProps {
  children: ReactNode
  text?: string
  className?: string
}

/**
 * TranslatableText component - kept for backward compatibility.
 * Hover translation is now handled globally by HoverTranslateLayer.
 * This component simply renders its children.
 */
export default function TranslatableText({ children, className = '' }: TranslatableTextProps) {
  // Hover translation is now handled globally, so this component just renders children
  return <span className={className}>{children}</span>
}

