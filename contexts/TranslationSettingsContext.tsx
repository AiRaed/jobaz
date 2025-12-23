'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react'

export type TranslationLanguage = 'EN' | 'AR' | 'FA' | 'KU' | 'ES' | 'PL'

interface TranslationSettings {
  hoverEnabled: boolean
  targetLanguage: TranslationLanguage
}

interface TranslationSettingsContextType {
  hoverEnabled: boolean
  targetLanguage: TranslationLanguage
  setHoverEnabled: (enabled: boolean) => void
  setTargetLanguage: (language: TranslationLanguage) => void
}

const TranslationSettingsContext = createContext<TranslationSettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'jobaz-translation-settings'

// Load settings from localStorage on initialization
function loadSettings(): TranslationSettings {
  if (typeof window === 'undefined') {
    return { hoverEnabled: false, targetLanguage: 'EN' }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        hoverEnabled: parsed.hoverEnabled ?? false,
        targetLanguage: parsed.targetLanguage ?? 'EN',
      }
    }
  } catch (error) {
    console.warn('Failed to load translation settings from localStorage:', error)
  }

  return { hoverEnabled: false, targetLanguage: 'EN' }
}

// Save settings to localStorage
function saveSettings(settings: TranslationSettings) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Failed to save translation settings to localStorage:', error)
  }
}

export function TranslationSettingsProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage once, preventing flicker
  const [settings, setSettings] = useState<TranslationSettings>(() => {
    // Only load from localStorage on client side
    if (typeof window === 'undefined') {
      return { hoverEnabled: false, targetLanguage: 'EN' }
    }
    return loadSettings()
  })
  
  // Track if settings are initialized to prevent duplicate initialization
  const isInitialized = useRef(false)
  
  // Initialize from localStorage on mount (only once)
  useEffect(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      const loaded = loadSettings()
      setSettings(loaded)
      isInitialized.current = true
    }
  }, [])

  const setHoverEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      // Prevent unnecessary updates if value hasn't changed
      if (prev.hoverEnabled === enabled) return prev
      const newSettings = { ...prev, hoverEnabled: enabled }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // Debounced language setter to prevent rapid switching
  const languageChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const setTargetLanguage = useCallback((language: TranslationLanguage) => {
    // Clear any pending language change
    if (languageChangeTimeoutRef.current) {
      clearTimeout(languageChangeTimeoutRef.current)
    }
    
    // Debounce the actual update to prevent rapid flickering
    languageChangeTimeoutRef.current = setTimeout(() => {
      setSettings((prev) => {
        // Prevent unnecessary updates if value hasn't changed
        if (prev.targetLanguage === language) return prev
        const newSettings = { ...prev, targetLanguage: language }
        saveSettings(newSettings)
        return newSettings
      })
    }, 150) // 150ms debounce
  }, [])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (languageChangeTimeoutRef.current) {
        clearTimeout(languageChangeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <TranslationSettingsContext.Provider
      value={{
        hoverEnabled: settings.hoverEnabled,
        targetLanguage: settings.targetLanguage,
        setHoverEnabled,
        setTargetLanguage,
      }}
    >
      {children}
    </TranslationSettingsContext.Provider>
  )
}

export function useTranslationSettings() {
  const context = useContext(TranslationSettingsContext)
  if (context === undefined) {
    throw new Error('useTranslationSettings must be used within a TranslationSettingsProvider')
  }
  return context
}

