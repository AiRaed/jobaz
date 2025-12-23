export async function exportToPDF(elementId: string, filename: string) {
  if (typeof window === 'undefined') return
  
  const html2pdf = (await import('html2pdf.js')).default
  
  // Wait for DOM to be ready and content to be rendered
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve(undefined)
    } else {
      window.addEventListener('load', () => resolve(undefined))
    }
  })
  
  // Find the element by ID first (for cv-builder-v2, this is 'cv-preview-v2')
  let element: HTMLElement | null = document.getElementById(elementId) as HTMLElement
  
  // If found by ID, check if it's inside an .a4-paper container
  if (element) {
    const paperContainer = element.closest('.a4-paper') as HTMLElement
    if (paperContainer) {
      element = paperContainer
    }
  }
  
  // If not found, try finding .a4-paper container
  if (!element) {
    element = document.querySelector('.a4-paper') as HTMLElement
  }
  
  // Last resort: try finding .cv-page or .cv-preview-miniature
  if (!element) {
    const cvPage = document.querySelector('.cv-page') as HTMLElement
    if (cvPage) {
      const paperContainer = cvPage.closest('.a4-paper') as HTMLElement
      if (paperContainer) {
        element = paperContainer
      } else {
        element = cvPage
      }
    } else {
      // Try finding cv-preview-miniature (used in cv-builder-v2)
      const previewMiniature = document.querySelector('.cv-preview-miniature') as HTMLElement
      if (previewMiniature) {
        element = previewMiniature
      }
    }
  }
  
  if (!element) {
    throw new Error(`Preview element not found. Tried: .a4-paper, #${elementId}, .cv-page`)
  }
  
  // Ensure element has content before exporting
  if (!element || !element.innerHTML || element.innerHTML.trim() === '') {
    throw new Error('Preview element has no content to export')
  }

  // Calculate A4 dimensions in pixels (210mm x 297mm at 96 DPI)
  const A4_WIDTH_MM = 210
  const A4_HEIGHT_MM = 297
  const PADDING_MM = 20
  const DPI = 96
  const MM_TO_PX = DPI / 25.4
  
  const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX // ~794px
  const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX // ~1123px
  const CONTENT_WIDTH_PX = (A4_WIDTH_MM - PADDING_MM * 2) * MM_TO_PX // ~669px

  // Exclude elements marked for exclusion
  const excludedElements = element.querySelectorAll('[data-export-exclude="true"]')
  excludedElements.forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.display = 'none'
    }
  })

  // Store original styles for restoration
  const originalPadding = element.style.padding
  const originalMargin = element.style.margin
  const originalMinHeight = element.style.minHeight
  const originalTransform = element.style.transform
  const originalPosition = element.style.position
  const originalWidth = element.style.width
  const originalHeight = element.style.height
  const originalTop = element.style.top
  const originalLeft = element.style.left
  const originalOverflow = element.style.overflow
  
  // Temporarily remove transform scale and position absolute for PDF export
  // This ensures html2canvas can properly capture the text
  element.style.transform = 'none'
  element.style.position = 'relative'
  element.style.width = 'auto'
  element.style.height = 'auto'
  element.style.top = 'auto'
  element.style.left = 'auto'
  element.style.overflow = 'visible'
  
  // Temporarily remove padding/margin for PDF export - html2pdf will handle margins
  element.style.padding = '0'
  element.style.margin = '0'
  element.style.minHeight = 'auto'
  
  // Force all text to be visible and black for PDF export
  const allTextElements = element.querySelectorAll('*')
  const originalTextColors: Map<HTMLElement, string> = new Map()
  allTextElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(el)
      const color = computedStyle.color
      originalTextColors.set(el, color)
      // Ensure text is visible - if it's too light, make it darker
      if (color && (color === 'rgba(0, 0, 0, 0)' || color === 'transparent' || color.includes('255, 255, 255'))) {
        el.style.color = '#000000'
      } else if (color && !color.includes('0, 0, 0') && !color.includes('26, 26, 26') && !color.includes('74, 74, 74')) {
        // If text is not black or dark gray, ensure it's at least dark enough to be visible
        const rgbMatch = color.match(/\d+/g)
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0])
          const g = parseInt(rgbMatch[1])
          const b = parseInt(rgbMatch[2])
          // If text is too light (close to white), make it darker
          if (r > 200 && g > 200 && b > 200) {
            el.style.color = '#1a1a1a'
          }
        }
      }
    }
  })

  const opt = {
    margin: [18, 20, 18, 20], // top, right, bottom, left in mm
    filename: `${filename || 'CV'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: false,
      printColorAdjust: 'exact',
      allowTaint: false,
      windowWidth: element.scrollWidth || A4_WIDTH_PX,
      windowHeight: element.scrollHeight || A4_HEIGHT_PX,
      onclone: (clonedDoc: Document) => {
        // Ensure all text is visible in the cloned document
        const clonedElement = clonedDoc.getElementById(elementId) || clonedDoc.querySelector('.a4-paper') || clonedDoc.querySelector('.cv-preview-miniature')
        if (clonedElement) {
          // Remove transform scale from cloned element
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.transform = 'none'
            clonedElement.style.position = 'relative'
            clonedElement.style.width = 'auto'
            clonedElement.style.height = 'auto'
            clonedElement.style.top = 'auto'
            clonedElement.style.left = 'auto'
            clonedElement.style.overflow = 'visible'
          }
          
          // Force all text to be black and visible in the cloned document
          const allElements = clonedElement.querySelectorAll('*')
          allElements.forEach((el: Element) => {
            if (el instanceof HTMLElement) {
              // Get computed style from the cloned document's window
              try {
                const clonedWindow = clonedDoc.defaultView || (clonedDoc as any).parentWindow || window
                if (clonedWindow && clonedWindow.getComputedStyle) {
                  const computedStyle = clonedWindow.getComputedStyle(el)
                  const color = computedStyle.color
                  // If text is transparent or white, make it black
                  if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent' || color.includes('255, 255, 255')) {
                    el.style.color = '#000000'
                    el.style.setProperty('color', '#000000', 'important')
                  }
                  // Ensure background is white
                  if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && computedStyle.backgroundColor !== 'transparent') {
                    const bgColor = computedStyle.backgroundColor
                    if (bgColor.includes('255, 255, 255')) {
                      el.style.backgroundColor = '#ffffff'
                      el.style.setProperty('background-color', '#ffffff', 'important')
                    }
                  }
                } else {
                  // Fallback: directly set text color to black
                  el.style.color = '#000000'
                  el.style.setProperty('color', '#000000', 'important')
                }
              } catch (e) {
                // Fallback: directly set text color to black if there's an error
                el.style.color = '#000000'
                el.style.setProperty('color', '#000000', 'important')
              }
            }
          })
          
          // Also ensure the cloned element itself has proper styles
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.backgroundColor = '#ffffff'
            clonedElement.style.setProperty('background-color', '#ffffff', 'important')
            clonedElement.style.color = '#000000'
            clonedElement.style.setProperty('color', '#000000', 'important')
          }
        }
      },
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      avoid: ['.cv-bullet-item', '.ai-preview-bullet-item', 'li', '.cv-description-line', 'p', '.cv-text-content', '.cv-description-text', '.cv-bullet-content', '.ai-preview-text', '.ai-preview-line'],
      before: [],
      after: []
    }
  }

  try {
    // Ensure element is still valid
    if (!element || !element.parentNode) {
      throw new Error('Preview element is no longer available in the DOM')
    }
    
    await html2pdf().set(opt).from(element).save()
    
    // Restore original styles
    element.style.padding = originalPadding
    element.style.margin = originalMargin
    element.style.minHeight = originalMinHeight
    element.style.transform = originalTransform
    element.style.position = originalPosition
    element.style.width = originalWidth
    element.style.height = originalHeight
    element.style.top = originalTop
    element.style.left = originalLeft
    element.style.overflow = originalOverflow
    
    // Restore original text colors
    originalTextColors.forEach((color, el) => {
      el.style.color = color
    })
    
    // Restore excluded elements
    excludedElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = ''
      }
    })
  } catch (error) {
    // Restore original styles even if export fails
    element.style.padding = originalPadding
    element.style.margin = originalMargin
    element.style.minHeight = originalMinHeight
    element.style.transform = originalTransform
    element.style.position = originalPosition
    element.style.width = originalWidth
    element.style.height = originalHeight
    element.style.top = originalTop
    element.style.left = originalLeft
    element.style.overflow = originalOverflow
    
    // Restore original text colors even if export fails
    originalTextColors.forEach((color, el) => {
      el.style.color = color
    })
    
    // Restore excluded elements even if export fails
    excludedElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = ''
      }
    })
    console.error('PDF export failed:', error)
    throw error instanceof Error ? error : new Error('PDF export failed: ' + String(error))
  }
}
