// app/preview/page.tsx
"use client";
import React from "react";
import { useCoverStore } from "@/lib/cover-store";

export default function CoverPreview() {
  const { recipientName, company, role, letterBody, applicantName } = useCoverStore();

  // Build greeting from recipientName
  const greetName = recipientName?.trim() || "Hiring Manager";
  
  // Build signature from applicantName
  const signatureName = applicantName?.trim() || "Your Name";

  // Check if letterBody already contains a complete letter
  // (both greeting starting with "Dear" and closing with "Sincerely,")
  const letterBodyText = letterBody || "Your AI-generated letter will appear here...";
  const hasFullLetter =
    letterBodyText.trim().toLowerCase().includes("dear ") &&
    letterBodyText.toLowerCase().includes("sincerely,");

  return (
    <div className="p-6 bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 min-h-[60vh]">
      <h2 className="text-xl font-bold mb-2">
        {role || "Cover Letter"}
      </h2>
      <p className="text-sm opacity-80 mb-4">
        {company ? `Company: ${company}` : "No company specified"}
      </p>
      <div className="whitespace-pre-wrap leading-relaxed">
        {hasFullLetter ? (
          <div className="mb-6">
            {letterBodyText}
          </div>
        ) : (
          <>
            <p className="mb-4">Dear {greetName},</p>
            <div className="mb-6">
              {letterBodyText}
            </div>
            <div className="mt-8">
              <p className="mb-2">Sincerely,</p>
              <p>{signatureName}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
