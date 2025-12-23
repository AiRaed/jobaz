'use client'
import React from "react";
import { useCoverStore } from "@/lib/cover-store";

interface CoverPreviewProps {
  aiPreview?: string;
}

export default function CoverPreview({ aiPreview = '' }: CoverPreviewProps) {
  // Get all form fields from store - this makes preview reactive to all input changes
  const { 
    recipientName, 
    letterBody, 
    applicantName
  } = useCoverStore();

  // Normalize letterBody to a safe string - handle cases where it might be non-string after hydration
  const safeLetterBody =
    typeof letterBody === 'string'
      ? letterBody
      : (letterBody && typeof (letterBody as any).body === 'string'
          ? (letterBody as any).body
          : '');

  // Prefer aiPreview if it's present and non-empty, otherwise fall back to letterBody
  const raw =
    (typeof aiPreview === 'string' && aiPreview.trim())
      ? aiPreview
      : safeLetterBody;

  // Build normalized string - handle string, object with letter property, or other types
  const src = typeof raw === 'string'
    ? raw
    : (raw && typeof raw === 'object' && 'letter' in raw && typeof (raw as any).letter === 'string'
        ? (raw as any).letter
        : '');
  
  let text = String(src || '').trim();
  
  // ALWAYS strip any closing/signature from AI body before rendering
  // Remove anything starting with common sign-offs and any name lines after them
  const signOffWords = [
    'Sincerely',
    'Kind regards',
    'Best regards',
    'Regards',
    'Yours sincerely',
    'Yours faithfully',
    'Respectfully',
    'Thank you',
    'Cordially',
    'With appreciation',
  ];

  // Remove sign-off patterns from text
  for (const word of signOffWords) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    // Remove sign-off word with optional comma, optional whitespace, and optional name
    const regex = new RegExp(`\\b${escapedWord},?\\s*(?:\\n\\s*[A-Za-z\\s]+)?`, 'gim');
    text = text.replace(regex, '');
  }

  // Process line by line to remove signature blocks
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line.length === 0) {
      if (i < lines.length - 1) {
        cleanedLines.push('');
      }
      continue;
    }
    
    // Check if line is only a sign-off
    let isSignOffOnly = false;
    for (const word of signOffWords) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`^${escapedWord},?\\s*$`, 'i');
      if (regex.test(line)) {
        isSignOffOnly = true;
        // Skip next line if it looks like a name
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}$/;
          if (namePattern.test(nextLine)) {
            i++; // Skip next iteration
          }
        }
        break;
      }
    }
    
    if (isSignOffOnly) {
      continue;
    }
    
    // Check if line starts with sign-off
    for (const word of signOffWords) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`^${escapedWord},?\\s+`, 'i');
      if (regex.test(line)) {
        line = line.replace(regex, '').trim();
        const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}$/;
        if (namePattern.test(line)) {
          continue; // Skip if it's just a name
        }
        break;
      }
    }
    
    // Skip if line looks like a name at the end
    const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}$/;
    if (namePattern.test(line) && i >= lines.length - 2) {
      continue;
    }
    
    if (line.length > 0) {
      cleanedLines.push(line);
    }
  }

  text = cleanedLines.join('\n').trim();
  
  // Build greeting from recipientName (reactive to input changes)
  const greetName = recipientName?.trim() || "Hiring Manager";
  
  // Build signature from applicantName (reactive to input changes)
  const signatureName = applicantName?.trim() || "Your Name";

  // Check if we have any body content (after cleaning)
  const hasBodyContent = text.length > 0;

  return (
    <div className="cover-page text-slate-900">
      <div className="whitespace-pre-wrap leading-relaxed">
        {/* Letter Content */}
        <>
          {/* Greeting - reactive to recipientName (recipient name only inside salutation) */}
          <p className="mb-4 text-slate-900">Dear {greetName},</p>
          
          {/* Body - shows placeholder if empty, otherwise shows content (closing/signature already removed) */}
          <div className="whitespace-pre-wrap break-words text-slate-900 mb-6">
            {hasBodyContent ? (
              text
            ) : (
              <span className="text-slate-500 italic">
                Your cover letter body will appear here. Use AI Generate or type your content.
              </span>
            )}
          </div>
          
          {/* Signature - ALWAYS render ONE closing from Recipient/Applicant Name fields */}
          <div className="mt-8">
            <p className="mb-2 text-slate-900">Sincerely,</p>
            <p className="text-slate-900">{signatureName}</p>
          </div>
        </>
      </div>
    </div>
  );
}
