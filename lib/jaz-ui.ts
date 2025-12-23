/**
 * JAZ UI Helper Functions
 * Utilities for scroll, highlight, and interaction with Job Details buttons
 */

/**
 * Scrolls to an element by ID and highlights it for a specified duration
 * @param elementId - The ID of the element to scroll to and highlight
 * @param highlightDuration - Duration in milliseconds to keep the highlight (default: 1500ms)
 */
export function scrollAndHighlight(elementId: string, highlightDuration: number = 1500): boolean {
  if (typeof window === 'undefined') return false

  const element = document.getElementById(elementId)
  if (!element) {
    return false
  }

  // Scroll to element smoothly, centered in viewport
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Add highlight class
  element.classList.add('jaz-highlight')

  // Remove highlight class after duration
  setTimeout(() => {
    element.classList.remove('jaz-highlight')
  }, highlightDuration)

  return true
}

