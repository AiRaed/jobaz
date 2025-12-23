/**
 * Strip placeholders and unwanted prefixes from AI-generated text
 * Enhanced to remove all preface lines and leading blank lines
 */
export const stripPlaceholders = (t: string) => {
  if (!t || t.trim().length === 0) return t
  
  // Split into lines first to process line-by-line
  let lines = t.split('\n')
  
  // Remove leading blank lines
  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift()
  }
  
  // Remove common preface lines at the start - more aggressive patterns
  const prefacePatterns = [
    /^Enhanced\s+Content:?\s*$/i,
    /^Revised\s+Content:?\s*$/i,
    /^AI\s+Preview\s+Available:?\s*$/i,
    /^AI\s+Generated:?\s*$/i,
    /^Generated\s+Content:?\s*$/i,
    /^Content:?\s*$/i,
    /^Certainly![\s\n]*/i,
    /^Certainly\s+[\s\n]*/i,
    /^Here'?s?\s+(?:an?\s+)?(?:enhanced|polished|improved|rewritten|refined|revised)\s+(?:and\s+)?(?:polished|enhanced|version|content)[\s:\.]*/i,
    /^(?:Here'?s?\s+)?(?:is|are)\s+(?:an?\s+)?(?:enhanced|polished|improved|rewritten|refined|revised)\s+(?:version|content)[\s:\.]*/i,
    /^Here'?s?\s+a\s+revised\s+version:?\s*$/i,
    /^Revised\s+version:?\s*$/i,
    /^Enhanced\s+version:?\s*$/i,
    /^AI\s+Preview:?\s*$/i,
    /^Preview:?\s*$/i,
    /^Here'?s?\s+(?:an?\s+)?enhanced\s+version:?\s*$/i,
    /^Here'?s\s+(?:an?\s+)?enhanced\s+version[\s:\.]*/i,
  ]
  
  // Remove preface lines and any blank lines that follow them
  let startIndex = 0
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim()
    if (prefacePatterns.some(pattern => pattern.test(line))) {
      startIndex = i + 1
      // Also skip blank lines after preface
      while (startIndex < lines.length && lines[startIndex].trim().length === 0) {
        startIndex++
      }
      break
    }
    // If we hit a bullet or regular content, stop looking for prefaces
    if (line.match(/^[\s]*[•\-\*\u2022\u2023\u2043\u2219]/) || line.length > 0) {
      break
    }
  }
  
  lines = lines.slice(startIndex)
  
  // Join and apply remaining cleanups
  let result = lines.join('\n')
    .replace(/\[.*?Your.*?]/gi, '')
    .replace(/^\s*[-–—_*]+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return result
}

/**
 * Remove duplicate greeting and signature from CV summary text
 */
export const removeDuplicateGreetingAndSignature = (t: string) => {
  // Common greeting patterns at the start
  const greetingPattern = /^(Dear|Hello|Hi|Greetings).*?,\s*/gi
  // Common signature patterns at the end
  const signaturePattern = /\s*(Sincerely|Best regards|Regards|Thank you|Thank you very much|Cordially),?\s*$/gi
  
  let cleaned = t
  
  // Find first greeting
  const greetingMatch = cleaned.match(greetingPattern)
  if (greetingMatch) {
    // Remove all greetings
    cleaned = cleaned.replace(greetingPattern, '')
  }
  
  // Find first signature
  const signatureMatch = cleaned.match(signaturePattern)
  if (signatureMatch) {
    // Remove all signatures
    cleaned = cleaned.replace(signaturePattern, '')
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n')
  
  return cleaned
}

/**
 * Normalize CV text by stripping placeholders and removing duplicate greetings/signatures
 */
export function normalizeCVText(t: string) {
  const step1 = stripPlaceholders(t)
  const step2 = removeDuplicateGreetingAndSignature(step1)
  return step2
}

/**
 * Normalize summary text to continuous paragraph format:
 * - Removes all bullet markers (•, -, *, etc.)
 * - Strips headings, markdown formatting, prefixes, labels, marketing fluff
 * - Removes candidate names and honorifics
 * - Converts to a continuous paragraph
 * - Preserves natural line breaks only if they're part of sentence flow
 * - Joins sentences with spaces
 * - Example: "I am a motivated designer with a passion for learning and teamwork."
 */
export function normalizeSummaryParagraph(text: string): string {
  if (!text || text.trim().length === 0) {
    return ''
  }

  // Step 1: Strip markdown formatting (**bold**, *italic*, etc.)
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1') // Remove *italic* (but not bullet markers)
    .replace(/__(.*?)__/g, '$1') // Remove __underline__
    .replace(/_(.*?)_/g, '$1') // Remove _underline_
    .replace(/~~(.*?)~~/g, '$1') // Remove ~~strikethrough~~
    .replace(/`(.*?)`/g, '$1') // Remove `code`
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [link](url) - keep text only

  // Step 2: Strip markdown headings (#, ##, ###, etc.)
  cleaned = cleaned
    .replace(/^#{1,6}\s+/gm, '') // Remove # headings
    .trim()

  // Step 3: Strip prefixes and labels (Executive Summary:, Professional Overview:, etc.)
  const prefixPatterns = [
    /^(?:Executive\s+Summary|Professional\s+Overview|Summary|Overview|Profile|Introduction|About|CV\s+Summary|Resume\s+Summary)[:：]\s*/i,
    /^(?:Modern,?\s+results-driven,?\s+innovation-focused)[\s,\.]+\s*/i,
    /^(?:Results-driven|Innovation-focused|Strategic|Executive|Professional)[\s,\.]+\s*/i,
  ]
  
  for (const pattern of prefixPatterns) {
    cleaned = cleaned.replace(pattern, '').trim()
  }

  // Step 4: Strip prefaces and remove leading blank lines
  cleaned = stripPlaceholders(cleaned)
  if (!cleaned || cleaned.trim().length === 0) {
    return ''
  }

  // Step 5: Remove common honorifics and name patterns (Mr/Ms/Mrs/Dr + name)
  // Remove lines that start with honorifics
  cleaned = cleaned
    .replace(/^(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Miss|Prof\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*[,:]?\s*/gmi, '')
    .trim()

  // Step 6: Remove all bullet markers and normalize to sentences
  const bulletPattern = /^[\s]*[•●·\-\*\u2022\u2023\u2043\u2219\u2013\u2014]\s+/
  const lines = cleaned.split('\n')
  const sentences: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      continue
    }

    // Skip lines that are just labels or section headers (common patterns)
    if (/^(?:Key\s+(?:Points|Strengths|Skills|Achievements)|Core\s+(?:Competencies|Skills)|Professional\s+(?:Highlights|Strengths))[:：]?\s*$/i.test(trimmed)) {
      continue
    }

    if (bulletPattern.test(line)) {
      // Remove bullet marker and extract content
      const match = line.match(bulletPattern)
      if (match) {
        const content = line.slice(match[0].length).trim()
        if (content.length > 0) {
          sentences.push(content)
        }
      }
    } else {
      // Regular line - keep as is if it's part of natural sentence flow
      sentences.push(trimmed)
    }
  }

  // Step 7: Join all sentences into continuous paragraph
  // Remove line breaks within sentences, but preserve sentence-ending punctuation
  let paragraph = sentences.join(' ').trim()

  // Step 8: Final cleanup - remove any remaining marketing fluff phrases
  paragraph = paragraph
    .replace(/\b(?:Modern,?\s+results-driven,?\s+innovation-focused)\b[\s,\.]+/gi, '')
    .replace(/\b(?:Results-driven|Innovation-focused)\s+(?:professional|designer|developer)\b[\s,\.]+/gi, '')
    .trim()

  // Step 9: Clean up spacing
  // Remove multiple spaces
  paragraph = paragraph.replace(/\s+/g, ' ')
  
  // Ensure proper spacing after sentence-ending punctuation
  paragraph = paragraph.replace(/([.!?])\s*([A-Z])/g, '$1 $2')
  
  // Ensure proper spacing around punctuation
  paragraph = paragraph.replace(/\s+([,.!?;:])/g, '$1')
  paragraph = paragraph.replace(/([,.!?;:])([a-zA-Z])/g, '$1 $2')

  return paragraph.trim()
}

/**
 * Normalize cover letter text for BODY-ONLY output.
 * Removes any greetings (e.g., "Dear …,") and any sign-offs (e.g., "Sincerely,").
 * Collapses extra blank lines and trims whitespace.
 */

export function normalizeCoverLetter(text: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  // Common greeting patterns
  const greetings = [
    /^Dear\s+.+,\s*/gim,
    /^Hello\s+.+,\s*/gim,
    /^Hi\s+.+,\s*/gim,
    /^Greetings\s+.+,\s*/gim,
  ]

  // Common signature patterns
  const signatures = [
    /\s*Sincerely,\s*$/gim,
    /\s*Best regards,\s*$/gim,
    /\s*Regards,\s*$/gim,
    /\s*Respectfully,\s*$/gim,
    /\s*Thank you,\s*$/gim,
    /\s*Cordially,\s*$/gim,
    /\s*With appreciation,\s*$/gim,
  ]

  // Extract first greeting if any
  let firstGreeting = ''
  for (const pattern of greetings) {
    const match = text.match(pattern)
    if (match && match.length > 0) {
      firstGreeting = match[0]
      break
    }
  }

  // Extract first signature if any
  let firstSignature = ''
  for (const pattern of signatures) {
    const match = text.match(pattern)
    if (match && match.length > 0) {
      firstSignature = match[0].trim()
      break
    }
  }

  // Remove all greetings and signatures
  let body = text
  greetings.forEach(pattern => {
    body = body.replace(pattern, '')
  })
  signatures.forEach(pattern => {
    body = body.replace(pattern, '')
  })

  // Clean up the body
  body = body.trim().replace(/\n{3,}/g, '\n\n')

  // Return body-only text
  return body
}

/**
 * Extract the first greeting from the text, or return default
 */
export function extractGreeting(text: string): string {
  const greetings = [
    /^Dear\s+.+,\s*/gim,
    /^Hello\s+.+,\s*/gim,
    /^Hi\s+.+,\s*/gim,
    /^Greetings\s+.+,\s*/gim,
  ]

  for (const pattern of greetings) {
    const match = text.match(pattern)
    if (match && match.length > 0) {
      return match[0].trim()
    }
  }

  return 'Dear Hiring Manager,'
}

/**
 * Extract the first signature from the text, or return default
 */
export function extractSignature(text: string): string {
  const signatures = [
    /\s*Sincerely,\s*$/gim,
    /\s*Best regards,\s*$/gim,
    /\s*Regards,\s*$/gim,
    /\s*Respectfully,\s*$/gim,
    /\s*Thank you,\s*$/gim,
    /\s*Cordially,\s*$/gim,
    /\s*With appreciation,\s*$/gim,
  ]

  for (const pattern of signatures) {
    const match = text.match(pattern)
    if (match && match.length > 0) {
      return match[0].trim()
    }
  }

  return 'Sincerely,'
}

/**
 * Clean cover letter text by normalizing and ensuring proper signature
 */
export function cleanCoverLetterText(text: string, applicantName: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  // Normalize the text
  const cleaned = normalizeCoverLetter(text)

  // Body-only requirement: do not add any greeting or signature here
  return cleaned
}

/**
 * Clean cover letter text from Job Details page:
 * - Removes "Tailored cover letter for..." heading
 * - Returns clean letter text that can be displayed or saved
 * Note: Does not remove "Dear Hiring Manager," - the Preview component handles duplicate prevention
 */
export function cleanJobDetailsCoverLetter(text: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  let cleaned = text.trim()

  // Remove "Tailored cover letter for..." heading (case-insensitive)
  // This pattern matches the heading line and any following blank lines
  cleaned = cleaned.replace(/^Tailored\s+cover\s+letter\s+for\s+.*?:\s*\n?\n?/i, '')

  // Clean up extra blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  return cleaned
}

/**
 * Remove titles and honorifics (Mr, Ms, Mrs, MR, etc.) from a name.
 * 
 * @param name - The name that may contain titles
 * @returns The name without any titles/honorifics
 */
export function removeTitleFromName(name: string): string {
  if (!name || name.trim().length === 0) {
    return name
  }

  let cleaned = name.trim()

  // List of common titles/honorifics (case-insensitive matching)
  // Patterns to match: "MR", "Mr", "Mr.", "Ms", "Ms.", "Mrs", "Mrs.", "Miss", "Dr", "Dr.", "Prof", "Prof.", etc.
  const titlePatterns = [
    /^(?:MR|Mr|Mr\.|MS|Ms|Ms\.|MRS|Mrs|Mrs\.|Miss|MISS|DR|Dr|Dr\.|PROF|Prof|Prof\.|PROFESSOR|Professor)\s+/i,
  ]

  // Remove title prefixes
  for (const pattern of titlePatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Also handle titles in ALL CAPS format like "MR RAED MAHFOUD"
  cleaned = cleaned.replace(/^(MR|MS|MRS|DR|PROF)\s+/i, '')

  // Clean up extra spaces and normalize capitalization
  cleaned = cleaned.trim().replace(/\s+/g, ' ')

  // Capitalize properly: First letter of each word
  if (cleaned.length > 0) {
    cleaned = cleaned
      .split(' ')
      .map(word => {
        if (word.length === 0) return word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }

  return cleaned
}

/**
 * Clean cover letter closing section to avoid duplicate sign-offs.
 * Removes duplicate "Sincerely" blocks, replaces placeholders like [Your Name],
 * and ensures only one clean closing exists.
 * 
 * @param text - The cover letter text to clean
 * @param userName - The user's full name to use in the signature (will be cleaned to remove titles)
 * @returns Cleaned cover letter text with a single closing
 */
export function cleanCoverLetterClosing(text: string, userName: string): string {
  if (!text) return ""

  let cleaned = text

  // Remove titles from the user name before using it in the signature
  const cleanUserName = removeTitleFromName(userName)

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n")

  // First, remove any titles from names that appear after "Sincerely," in the existing text
  // This handles cases where AI generated text with titles like "MR RAED MAHFOUD"
  // Match patterns like "Sincerely,\nMR RAED MAHFOUD" or "Sincerely,\nMr. John Doe"
  // Match "Sincerely," followed by newline and then a name (words with letters)
  cleaned = cleaned.replace(/Sincerely,?\s*\n\s*([A-Za-z][A-Za-z\s]*[A-Za-z]|[A-Za-z]+)/g, (match, namePart) => {
    // Remove the title from the name part
    const nameWithoutTitle = removeTitleFromName(namePart.trim())
    return "Sincerely,\n" + nameWithoutTitle
  })

  // 1) Remove duplicate closings such as repeated "Sincerely" blocks
  // Match patterns like "Sincerely,\n[Your Name]" or "Sincerely,\nYour Name" repeated multiple times
  cleaned = cleaned.replace(
    /(Sincerely,?\s*\n\s*(?:\[?Your Name\]?|Your Name|[\w\s]+)[\s\n]*){2,}/gi,
    "Sincerely,\n" + cleanUserName + "\n"
  )

  // 2) If the text contains placeholders like [Your Name], replace them with cleaned name
  cleaned = cleaned.replace(/\[?Your Name\]?/gi, cleanUserName)

  // 3) Remove any trailing repeated "Sincerely" lines and normalize to single closing
  // Match "Sincerely," followed by name (with various formats) at the end
  const closingPattern = /\s*(Sincerely,?\s*\n\s*(?:\[?Your Name\]?|Your Name|[\w\s]+))[\s\n]*$/i
  if (closingPattern.test(cleaned)) {
    // Replace any existing closing with a clean one (remove titles from existing names)
    cleaned = cleaned.replace(closingPattern, (match) => {
      // Extract the name part and clean it
      const nameMatch = match.match(/Sincerely,?\s*\n\s*(.+?)[\s\n]*$/i)
      if (nameMatch && nameMatch[1]) {
        const existingName = nameMatch[1].trim()
        const cleanedExistingName = removeTitleFromName(existingName)
        return "\n\nSincerely,\n" + cleanedExistingName
      }
      return "\n\nSincerely,\n" + cleanUserName
    })
  } else {
    // 4) If the text does NOT contain "Sincerely" at all, append a clean closing
    cleaned = cleaned.trim() + "\n\nSincerely,\n" + cleanUserName
  }

  return cleaned.trim()
}

/**
 * Normalize experience bullets:
 * - Convert lines starting with "- " to proper bullets
 * - Remove leading/trailing blank lines
 * - Normalize spacing between bullets
 * - Standardize bullet markers to "- "
 */
export function normalizeExperienceBullets(text: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  // Bullet marker patterns (supports: •, -, *, etc.)
  const bulletPattern = /^[\s]*[•\-\*\u2022\u2023\u2043\u2219]\s+/
  
  let lines = text.split('\n')
  
  // Remove leading blank lines
  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift()
  }
  
  // Remove trailing blank lines
  while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
    lines.pop()
  }
  
  const normalized: string[] = []
  let inBulletList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isBullet = bulletPattern.test(line)
    const isEmpty = line.trim().length === 0
    const nextLine = lines[i + 1]
    const nextIsBullet = nextLine ? bulletPattern.test(nextLine) : false
    
    if (isBullet) {
      // Normalize bullet marker to "- " format
      const match = line.match(bulletPattern)
      if (match) {
        const content = line.slice(match[0].length)
        normalized.push(`- ${content.trimStart()}`)
      } else {
        normalized.push(line)
      }
      
      if (!inBulletList) {
        inBulletList = true
      }
    } else if (isEmpty && inBulletList && nextIsBullet) {
      // Skip empty line between bullets (normalize double newline to single)
      continue
    } else if (isEmpty && inBulletList && !nextIsBullet) {
      // Empty line after bullet list ends - keep it (separates job entries)
      normalized.push(line)
      inBulletList = false
    } else {
      // Regular line - preserve as is
      normalized.push(line)
      if (isEmpty || !isBullet) {
        inBulletList = false
      }
    }
  }
  
  return normalized.join('\n')
}

/**
 * Fix grammar and formatting issues in text:
 * - Capitalize first letter of sentences
 * - Fix spacing issues (multiple spaces to single)
 * - Ensure proper punctuation
 * - Fix common grammar mistakes
 * - Ensure each bullet starts with a capital letter
 */
function fixGrammarAndFormatting(text: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }
  
  // Fix multiple spaces to single space (but preserve intentional spacing)
  let fixed = text.replace(/\s+/g, ' ')
  
  // Capitalize first letter if needed (after bullet marker)
  if (fixed.length > 0) {
    // If text starts with "- ", capitalize the letter after the space
    if (fixed.match(/^-\s+/)) {
      const afterBullet = fixed.slice(2)
      if (afterBullet.length > 0) {
        const firstChar = afterBullet.charAt(0)
        // Only capitalize if it's a lowercase letter
        if (/^[a-z]/.test(firstChar)) {
          fixed = `- ${firstChar.toUpperCase()}${afterBullet.slice(1)}`
        }
      }
    }
  }
  
  // Fix spacing around punctuation
  fixed = fixed.replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
  fixed = fixed.replace(/([,.!?;:])([a-zA-Z])/g, '$1 $2') // Ensure space after punctuation before letter
  
  // Fix double punctuation
  fixed = fixed.replace(/\.\.+/g, '.')
  fixed = fixed.replace(/!!+/g, '!')
  fixed = fixed.replace(/\?\?+/g, '?')
  
  // Fix spacing around parentheses and quotes
  fixed = fixed.replace(/\s+\(\s*/g, ' (')
  fixed = fixed.replace(/\s+\)\s*/g, ') ')
  fixed = fixed.replace(/\s+"\s*/g, ' "')
  fixed = fixed.replace(/\s+"\s*/g, '" ')
  
  // Remove trailing spaces before punctuation (should already be handled, but ensure)
  fixed = fixed.replace(/\s+([,.!?;:])/g, '$1')
  
  // Remove leading/trailing spaces
  fixed = fixed.trim()
  
  // Ensure proper spacing between words (fix any remaining issues)
  fixed = fixed.replace(/\s{2,}/g, ' ')
  
  return fixed
}

/**
 * Normalize text for Stable Formatting Mode:
 * - Removes prefaces/intro lines (e.g., "Enhanced Content", "Revised Content", "Certainly")
 * - Removes leading blank lines
 * - Converts all bullet markers (•, ●, ·, –, —, *, multiple spaces + dash, etc.) to canonical "- " (ASCII dash + single space)
 * - Merges continuation lines (non-bullet lines following a bullet) into the previous bullet
 * - Fixes grammar and formatting (capitalization, spacing, punctuation)
 * - Removes leading/trailing spaces around text content
 * - Removes all blank lines between bullets (single line breaks only, no extra blank lines)
 * - Preserves line breaks exactly for plain text rendering
 * - Output is plain text with dashes "- " and single line breaks (no headers, no extra blank lines)
 * - Each bullet point starts neatly on one line with no unintended line breaks
 */
export function normalizeStableFormatting(text: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  // Step 1: Strip prefaces and remove leading blank lines
  let cleaned = stripPlaceholders(text)
  if (!cleaned || cleaned.trim().length === 0) {
    return ''
  }

  // Step 2: Split into lines and process
  const lines = cleaned.split('\n')
  const normalized: string[] = []
  
  // Bullet marker patterns (supports: •, ●, ·, -, –, —, *, etc.)
  // Also handles "  -" (multiple spaces + dash) and tab + dash patterns
  // Matches: optional leading whitespace, bullet marker, required space/tab after
  // Includes: • (bullet), – (en dash), — (em dash), * (asterisk), - (hyphen), and their Unicode variants
  const bulletPattern = /^[\s]*[•●·\-\*\u2022\u2023\u2043\u2219\u2013\u2014]\s+/
  
  let inBulletList = false
  let currentBullet: string | null = null
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const isEmpty = line.trim().length === 0
    const isBullet = bulletPattern.test(line)
    
    // Skip blank lines between bullets (remove extra blank lines)
    if (isEmpty) {
      // If we have a current bullet being built, finalize it
      if (currentBullet !== null) {
        const fixed = fixGrammarAndFormatting(currentBullet)
        normalized.push(fixed)
        currentBullet = null
      }
      // Only keep blank line if we're transitioning out of a bullet list
      if (inBulletList) {
        // Skip blank lines within bullet list
        inBulletList = false
        continue
      }
      // Skip leading blank lines
      if (normalized.length === 0) {
        continue
      }
      // Collapse multiple blank lines to single blank line
      // Only push if the last item is not already an empty line
      if (normalized[normalized.length - 1] !== '') {
        normalized.push('')
      }
      continue
    }
    
    // Convert bullet markers to canonical "- " (ASCII dash + single space)
    // Ensure each bullet line begins exactly with "- " (trim any stray leading/trailing spaces)
    if (isBullet) {
      // Finalize previous bullet if any
      if (currentBullet !== null) {
        const fixed = fixGrammarAndFormatting(currentBullet)
        normalized.push(fixed)
        currentBullet = null
      }
      
      inBulletList = true
      const match = line.match(bulletPattern)
      if (match) {
        // Extract content after bullet marker, trim leading/trailing spaces
        // This ensures each bullet line begins exactly with "- " with no extra spaces
        const content = line.slice(match[0].length).trim()
        if (content.length > 0) {
          // Start a new bullet
          currentBullet = `- ${content}`
        } else {
          currentBullet = '-'
        }
      }
    } else if (currentBullet !== null && inBulletList) {
      // This is a continuation line - merge it with the current bullet
      // (non-bullet line that follows a bullet should be part of that bullet)
      const trimmed = line.trim()
      if (trimmed.length > 0) {
        // Add space and merge continuation line
        currentBullet = `${currentBullet} ${trimmed}`
      }
    } else {
      // Non-bullet line that doesn't follow a bullet - we're no longer in a bullet list
      // Finalize previous bullet if any
      if (currentBullet !== null) {
        const fixed = fixGrammarAndFormatting(currentBullet)
        normalized.push(fixed)
        currentBullet = null
      }
      
      inBulletList = false
      // Trim any leading/trailing whitespace from non-bullet lines for consistency
      line = line.trim()
      // Fix grammar for non-bullet lines too
      line = fixGrammarAndFormatting(line)
      
      if (line.length > 0) {
        normalized.push(line)
      }
    }
  }
  
  // Finalize any remaining bullet
  if (currentBullet !== null) {
    const fixed = fixGrammarAndFormatting(currentBullet)
    normalized.push(fixed)
    currentBullet = null
  }
  
  // Remove trailing blank lines
  while (normalized.length > 0 && normalized[normalized.length - 1].trim().length === 0) {
    normalized.pop()
  }
  
  return normalized.join('\n')
}

/**
 * Normalize bullet list spacing in Experience descriptions
 * - Removes double newlines between bullet items (normalizes to single)
 * - Ensures consistent spacing between bullets while preserving spacing between job entries
 * - Normalizes all bullet markers to "• " format (bullet + one space)
 * - Only affects lines that start with bullet markers (•, -, *, etc.)
 */
export function normalizeBulletListSpacing(text: string): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  // Bullet marker patterns (supports: •, -, *, etc.)
  const bulletPattern = /^[\s]*[•\-\*\u2022\u2023\u2043\u2219\u2013\u2014]\s+/
  
  const lines = text.split('\n')
  const normalized: string[] = []
  let inBulletList = false
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const isBullet = bulletPattern.test(line)
    const isEmpty = line.trim().length === 0
    const nextLine = lines[i + 1]
    const nextIsBullet = nextLine ? bulletPattern.test(nextLine) : false
    
    if (isBullet) {
      // Normalize bullet marker to "• " format
      const match = line.match(bulletPattern)
      if (match) {
        const content = line.slice(match[0].length).trimStart()
        line = `• ${content}`
      }
      
      // Starting a bullet list
      if (!inBulletList) {
        inBulletList = true
      }
      normalized.push(line)
    } else if (isEmpty && inBulletList && nextIsBullet) {
      // Skip empty line between bullets (normalize double newline to single)
      continue
    } else if (isEmpty && inBulletList && !nextIsBullet) {
      // Empty line after bullet list ends - keep it (separates job entries)
      normalized.push(line)
      inBulletList = false
    } else {
      // Regular line - preserve as is
      normalized.push(line)
      if (isEmpty || !isBullet) {
        // If we have a significant gap (empty line that's not between bullets), 
        // we're likely between job entries or sections
        inBulletList = false
      }
    }
  }
  
  return normalized.join('\n')
}

/**
 * Trim text to the last full sentence if it exceeds the maxLength.
 * Preserves the entire text if it's shorter than maxLength.
 */
export function trimToLastFullSentence(text: string, maxLength: number = 2000): string {
  if (!text || text.length <= maxLength) {
    return text
  }
  
  // Take only the first maxLength characters
  const truncated = text.substring(0, maxLength)
  
  // Find the last sentence-ending punctuation (. ! ?) followed by space, newline, or end of string
  // We match sentence endings and capture the position
  const sentenceEndPattern = /[.!?](?:\s+|$)/g
  let lastMatch: RegExpMatchArray | null = null
  let match: RegExpMatchArray | null
  
  // Reset regex lastIndex
  sentenceEndPattern.lastIndex = 0
  
  // Find all sentence endings
  while ((match = sentenceEndPattern.exec(truncated)) !== null) {
    lastMatch = match
  }
  
  if (lastMatch && lastMatch.index !== undefined) {
    // Include the sentence ending punctuation and following space
    const cutPoint = lastMatch.index + lastMatch[0].length
    return truncated.substring(0, cutPoint).trim()
  }
  
  // If no sentence end found, trim at maxLength
  return truncated.trim()
}

/**
 * Count words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Split a long sentence into multiple bullets if it exceeds word limit
 */
function splitLongBullet(text: string, maxWords: number = 30): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) {
    return [text.trim()]
  }
  
  // Try to split at sentence boundaries first
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  const result: string[] = []
  
  let current = ''
  for (const sentence of sentences) {
    const test = current ? `${current} ${sentence}` : sentence
    if (countWords(test) <= maxWords) {
      current = test
    } else {
      if (current) {
        result.push(current.trim())
      }
      current = sentence
    }
  }
  
  if (current) {
    result.push(current.trim())
  }
  
  // If splitting by sentences didn't help enough, split by word count
  if (result.length === 0 || result.some(r => countWords(r) > maxWords)) {
    const chunks: string[] = []
    let chunk: string[] = []
    let chunkWordCount = 0
    
    for (const word of words) {
      if (chunkWordCount + 1 > maxWords && chunk.length > 0) {
        chunks.push(chunk.join(' '))
        chunk = []
        chunkWordCount = 0
      }
      chunk.push(word)
      chunkWordCount++
    }
    
    if (chunk.length > 0) {
      chunks.push(chunk.join(' '))
    }
    
    return chunks.length > 0 ? chunks : [text.trim()]
  }
  
  return result
}

/**
 * Comprehensive normalization for AI-generated Experience descriptions.
 * Handles all formatting requirements:
 * - Strips prefaces and unwanted intro text
 * - Normalizes bullets to "• " format
 * - Ensures proper indentation and alignment
 * - Adds periods to bullets that don't have them
 * - Limits to 5 bullets max, ~30 words per bullet
 * - Converts paragraphs without bullets to bullet format
 * - Removes duplicates and normalizes spacing
 * Returns null if empty or invalid
 */
export function normalizeAIExperienceText(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null
  }
  
  // Step 1: Strip prefaces and unwanted prefixes
  let cleaned = stripPlaceholders(text)
  if (!cleaned || cleaned.trim().length === 0) {
    return null
  }
  
  // Step 2: Detect if content has bullets or is paragraph format
  const bulletPattern = /^[\s]*[•\-\*\u2022\u2023\u2043\u2219\u2013\u2014]\s+/
  const allLines = cleaned.split('\n')
  
  // Remove leading/trailing empty lines
  let startIdx = 0
  while (startIdx < allLines.length && allLines[startIdx].trim().length === 0) {
    startIdx++
  }
  let endIdx = allLines.length - 1
  while (endIdx >= startIdx && allLines[endIdx].trim().length === 0) {
    endIdx--
  }
  const lines = allLines.slice(startIdx, endIdx + 1)
  
  const hasBullets = lines.some(line => bulletPattern.test(line))
  
  let bullets: string[] = []
  
  if (hasBullets) {
    // Extract bullets from existing list, handling continuation lines
    let currentBullet: string | null = null
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.length === 0) {
        // Empty line - finish current bullet if any
        if (currentBullet !== null) {
          bullets.push(currentBullet.trim())
          currentBullet = null
        }
        continue
      }
      
      if (bulletPattern.test(line)) {
        // Start of a new bullet
        // Finish previous bullet if any
        if (currentBullet !== null) {
          bullets.push(currentBullet.trim())
        }
        // Extract content after bullet marker
        const match = line.match(bulletPattern)
        if (match) {
          currentBullet = line.slice(match[0].length).trimStart()
        }
      } else if (currentBullet !== null) {
        // Continuation line - append to current bullet
        currentBullet += ' ' + trimmed
      }
    }
    // Don't forget the last bullet
    if (currentBullet !== null) {
      bullets.push(currentBullet.trim())
    }
  } else {
    // Convert paragraph to bullets by splitting at sentences
    const paragraph = cleaned.replace(/\n+/g, ' ').trim()
    const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length > 0) {
        bullets.push(trimmed)
      }
    }
  }
  
  if (bullets.length === 0) {
    return null
  }
  
  // Step 3: Process each bullet
  const processedBullets: string[] = []
  for (let bullet of bullets) {
    // Remove duplicate whitespace
    bullet = bullet.replace(/\s+/g, ' ').trim()
    
    // Remove duplicate bullets (compare normalized versions)
    const normalized = bullet.toLowerCase().replace(/\s+/g, ' ')
    if (processedBullets.some(b => b.toLowerCase().replace(/\s+/g, ' ') === normalized)) {
      continue
    }
    
    // Split long bullets if needed
    const splitBullets = splitLongBullet(bullet, 30)
    for (const split of splitBullets) {
      // Ensure bullet ends with period
      let finalBullet = split.trim()
      if (finalBullet && !/[.!?]$/.test(finalBullet)) {
        finalBullet = finalBullet + '.'
      }
      
      if (finalBullet.length > 0) {
        processedBullets.push(finalBullet)
      }
    }
  }
  
  // Step 4: Limit to 5 bullets (keep strongest ones)
  if (processedBullets.length > 5) {
    // Keep first 5 (assumed to be strongest/most important)
    processedBullets.splice(5)
  }
  
  if (processedBullets.length === 0) {
    return null
  }
  
  // Step 5: Normalize to "• " format and ensure proper alignment
  const normalized = processedBullets
    .map(bullet => `• ${bullet.trim()}`)
    .join('\n')
  
  return normalized
}

/**
 * Format Experience description with perfect bullet formatting.
 * - Keeps exact wording, punctuation, and capitalization
 * - Normalizes bullets to "• " (bullet + single space)
 * - Removes all blank lines (at top, between bullets, at bottom)
 * - Removes introductions like "Revised Content", "Enhanced version", "Certainly", or "Here's an enhanced version"
 * - Keeps only bullet list exactly as is (skips non-bullet standalone lines)
 * - One line per bullet only (no continuation lines, no hanging indent)
 * - No extra blank lines, no indentation issues
 * - Outputs plain, clean text ready to display exactly like in the AI box
 */
export function formatExperienceDescriptionPlainText(text: string): string {
  if (!text || text.trim().length === 0) {
    return ''
  }

  // Step 1: Strip headers and prefaces (like "Revised Content", "Enhanced Content", "Enhanced version", "Certainly", "Here's an enhanced version")
  let cleaned = stripPlaceholders(text)
  if (!cleaned || cleaned.trim().length === 0) {
    return ''
  }

  // Step 2: Split into lines and filter out blank lines (but keep original line structure for bullet detection)
  let lines = cleaned.split('\n').filter(line => line.trim().length > 0)

  // Step 3: Process lines and extract only bullet lines - keep exactly as they appear
  const bulletPattern = /^[\s]*[•\-\*\u2022\u2023\u2043\u2219\u2013\u2014]\s+/
  const bullets: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Only process lines that start with a bullet marker (test on original line for proper detection)
    if (bulletPattern.test(line)) {
      // Extract content after bullet marker, preserving exact wording, spacing, and capitalization
      const match = line.match(bulletPattern)
      if (match) {
        // Trim only leading whitespace after bullet marker, preserve rest of content exactly
        const content = line.slice(match[0].length).trimStart()
        if (content.length > 0) {
          bullets.push(content)
        }
      }
    }
    // Skip all non-bullet lines entirely - keep only bullet list exactly as is
  }

  // Step 4: Format bullets with "• " prefix - preserve exact content, spacing, capitalization
  if (bullets.length === 0) {
    return ''
  }

  const formatted = bullets
    .map(bullet => `• ${bullet}`)
    .join('\n') // Join with single newline - no extra blank lines

  return formatted
}
