'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslationSettings } from '@/contexts/TranslationSettingsContext'
import { usePathname } from 'next/navigation'

// Translation cache: key is `${text}|${language}`
const translationCache = new Map<string, string>()

// Elements to ignore for translation
const IGNORED_TAGS = ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'SVG', 'NAV', 'FOOTER']
const IGNORED_SELECTORS = ['[data-no-translate]', 'button', 'input', 'textarea', 'select', 'svg', 'nav', 'footer']

// Extract text content from an element, ignoring ignored elements
function extractTextFromElement(element: HTMLElement | null): string | null {
  if (!element) return null

  // Check if element or any parent has data-no-translate
  let current: HTMLElement | null = element
  while (current) {
    if (current.hasAttribute('data-no-translate')) {
      return null
    }
    current = current.parentElement
  }

  // Check if element is in ignored tags
  if (IGNORED_TAGS.includes(element.tagName)) {
    return null
  }

  // Check if element matches ignored selectors
  for (const selector of IGNORED_SELECTORS) {
    if (element.matches(selector) || element.closest(selector)) {
      return null
    }
  }

  // Get text content, but exclude text from ignored child elements
  const clone = element.cloneNode(true) as HTMLElement
  
  // Remove ignored elements from clone
  IGNORED_SELECTORS.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove())
  })
  
  const text = clone.textContent?.trim() || ''
  
  // Only return text if it's meaningful (at least 3 characters, not just whitespace)
  if (text.length < 3) return null
  
  // Limit text length to avoid translating huge blocks
  return text.length > 500 ? text.substring(0, 500) : text
}

interface TooltipState {
  show: boolean
  x: number
  y: number
  originalText: string
  translatedText: string | null
  isLoading: boolean
  error: string | null
}

export default function HoverTranslateLayer() {
  const { hoverEnabled, targetLanguage } = useTranslationSettings()
  const pathname = usePathname()
  const [tooltip, setTooltip] = useState<TooltipState>({
    show: false,
    x: 0,
    y: 0,
    originalText: '',
    translatedText: null,
    isLoading: false,
    error: null,
  })

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentTextRef = useRef<string>('')
  const currentElementRef = useRef<HTMLElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const tooltipShowRef = useRef<boolean>(false)

  // Fetch translation
  const fetchTranslation = useCallback(async (text: string) => {
    if (!text || !text.trim()) return

    const cacheKey = `${text}|${targetLanguage}`
    
    // Check cache first
    const cached = translationCache.get(cacheKey)
    if (cached) {
      setTooltip(prev => ({
        ...prev,
        translatedText: cached,
        isLoading: false,
        error: null,
      }))
      return
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setTooltip(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const response = await fetch('/api/jaz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'translate',
          language: targetLanguage,
          userMessage: text,
          pathname,
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      if (response.ok && data.assistantMessage) {
        const translation = data.assistantMessage.trim()
        translationCache.set(cacheKey, translation)
        setTooltip(prev => ({
          ...prev,
          translatedText: translation,
          isLoading: false,
          error: null,
        }))
      } else {
        throw new Error(data.error || 'Translation failed')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      console.error('Translation error:', err)
      setTooltip(prev => ({
        ...prev,
        isLoading: false,
        error: 'Translation failed',
        translatedText: null,
      }))
    }
  }, [targetLanguage, pathname])

  // Handle mouse move with throttling
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!hoverEnabled) return

    // Update mouse position
    mousePositionRef.current = { x: e.clientX, y: e.clientY }

    // If tooltip is showing, update its position
    if (tooltipShowRef.current) {
      setTooltip(prev => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
      }))
    }

    const target = e.target as HTMLElement
    const text = extractTextFromElement(target)

    // If no valid text, clear any pending hover
    if (!text) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      currentTextRef.current = ''
      currentElementRef.current = null
      
      // Hide tooltip if showing
      if (tooltipShowRef.current) {
        tooltipShowRef.current = false
        setTooltip(prev => ({ ...prev, show: false }))
      }
      return
    }

    // If same text and element, do nothing (wait for timeout)
    if (text === currentTextRef.current && target === currentElementRef.current) {
      return
    }

    // Different text or element - reset timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    currentTextRef.current = text
    currentElementRef.current = target

    // Set timeout to show tooltip after 250ms
    hoverTimeoutRef.current = setTimeout(() => {
      // Double-check that we're still hovering the same text
      if (text === currentTextRef.current) {
        const pos = mousePositionRef.current
        tooltipShowRef.current = true
        setTooltip({
          show: true,
          x: pos.x,
          y: pos.y,
          originalText: text,
          translatedText: null,
          isLoading: false,
          error: null,
        })

        // Fetch translation
        fetchTranslation(text)
      }
    }, 250)
  }, [hoverEnabled, fetchTranslation])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    currentTextRef.current = ''
    currentElementRef.current = null
    
    if (tooltipShowRef.current) {
      tooltipShowRef.current = false
      setTooltip(prev => ({ ...prev, show: false }))
    }
  }, [])

  // Handle ESC key to close tooltip
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && tooltipShowRef.current) {
      tooltipShowRef.current = false
      setTooltip(prev => ({ ...prev, show: false }))
    }
  }, [])

  // Sync ref with tooltip state
  useEffect(() => {
    tooltipShowRef.current = tooltip.show
  }, [tooltip.show])

  // Set up event listeners
  useEffect(() => {
    if (!hoverEnabled) {
      // Clean up when disabled
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      tooltipShowRef.current = false
      setTooltip(prev => ({ ...prev, show: false }))
      return
    }

    // Use capture phase to catch events early
    document.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true })
    document.addEventListener('mouseleave', handleMouseLeave, { capture: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseleave', handleMouseLeave, { capture: true })
      document.removeEventListener('keydown', handleKeyDown)
      
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [hoverEnabled, handleMouseMove, handleMouseLeave, handleKeyDown])

  // Calculate tooltip position with offset and viewport bounds
  const getTooltipPosition = () => {
    const offset = 12
    const tooltipWidth = 320 // Approximate tooltip width
    const tooltipHeight = 150 // Approximate tooltip height
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = tooltip.x + offset
    let y = tooltip.y + offset

    // Flip horizontally if too close to right edge
    if (x + tooltipWidth > viewportWidth) {
      x = tooltip.x - tooltipWidth - offset
    }

    // Flip vertically if too close to bottom edge
    if (y + tooltipHeight > viewportHeight) {
      y = tooltip.y - tooltipHeight - offset
    }

    // Ensure tooltip stays within viewport
    x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10))
    y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10))

    return { x, y }
  }

  // Don't render anything if disabled or no tooltip
  if (!hoverEnabled || !tooltip.show) {
    return null
  }

  const position = getTooltipPosition()

  // Render tooltip via portal
  const tooltipContent = (
    <div
      className="fixed z-[99999] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="bg-slate-900 text-slate-100 rounded-lg px-4 py-3 shadow-2xl border border-slate-700/50 max-w-xs min-w-[280px]">
        {/* Title */}
        <div className="text-xs font-semibold text-violet-300 mb-2">Translation</div>
        
        {/* Original text (small) */}
        <div className="text-xs text-slate-400 mb-2 line-clamp-2">
          {tooltip.originalText}
        </div>
        
        {/* Divider */}
        <div className="h-px bg-slate-700/50 mb-2" />
        
        {/* Translated text or loading/error */}
        {tooltip.isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="animate-pulse">●</span>
            <span>Translating…</span>
          </div>
        )}
        
        {tooltip.error && (
          <div className="text-sm text-amber-400">{tooltip.error}</div>
        )}
        
        {!tooltip.isLoading && !tooltip.error && tooltip.translatedText && (
          <div className="text-sm text-slate-100 whitespace-pre-wrap break-words">
            {tooltip.translatedText}
          </div>
        )}
        
        {/* ESC hint */}
        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700/30">
          Press ESC to close
        </div>
      </div>
    </div>
  )

  // Render via portal to document.body
  if (typeof window !== 'undefined') {
    return createPortal(tooltipContent, document.body)
  }

  return null
}

