import { useState } from 'react'
import { Sparkles, Loader2, Undo2, X } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'

interface SummaryTabProps {
  summary: string
  personalInfo: CvData['personalInfo']
  skills: string[]
  experience?: CvData['experience']
  onUpdate: (summary: string) => void
  onLoadingChange: (loading: boolean) => void
}

export default function SummaryTab({ summary, personalInfo, skills, experience, onUpdate, onLoadingChange }: SummaryTabProps) {
  const [previousSummary, setPreviousSummary] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [showKeywordModal, setShowKeywordModal] = useState(false)
  const [keywords, setKeywords] = useState('')

  // Extract latest role from experience for domain context
  const getLatestRole = (): string | undefined => {
    if (experience && experience.length > 0) {
      const latest = experience[0] // Assuming experience is sorted with most recent first
      return latest.jobTitle
    }
    return undefined
  }

  // Get experience preview (latest role's bullets) for context
  const getExperiencePreview = (): string | undefined => {
    if (experience && experience.length > 0) {
      const latest = experience[0]
      if (latest.bullets && latest.bullets.length > 0) {
        return latest.bullets.slice(0, 3).join(' ')
      }
    }
    return undefined
  }

  const handleAiAction = async (action: 'improve' | 'shorter' | 'longer' | 'impact') => {
    if (!summary.trim()) {
      alert('Please enter a summary first')
      return
    }

    setPreviousSummary(summary)
    setAiLoading(action)
    onLoadingChange(true)

    try {
      let prompt = ''
      switch (action) {
        case 'improve':
          prompt = `Improve and enhance the following CV summary. Make it more professional, impactful, and compelling while maintaining the core message. Keep it concise (60-100 words).`
          break
        case 'shorter':
          prompt = `Make the following CV summary shorter and more concise while keeping the most important points. Target 40-60 words.`
          break
        case 'longer':
          prompt = `Expand the following CV summary to be more detailed and comprehensive. Add more depth while maintaining professionalism. Target 100-150 words.`
          break
        case 'impact':
          prompt = `Rewrite the following CV summary to be more impactful and results-oriented. Use stronger action verbs and emphasize achievements and value. Keep it 60-100 words.`
          break
      }

      const response = await fetch('/api/cv/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          personalInfo,
          skills,
          instruction: prompt,
          latestRole: getLatestRole(),
          experiencePreview: getExperiencePreview(),
        }),
      })

      const data = await response.json()
      if (data.ok && data.summary) {
        onUpdate(data.summary)
      } else {
        throw new Error(data.error || 'Failed to generate summary')
      }
    } catch (error: any) {
      console.error('AI summary error:', error)
      alert(error.message || 'Failed to generate summary. Please try again.')
    } finally {
      setAiLoading(null)
      onLoadingChange(false)
    }
  }

  const handleUndo = () => {
    if (previousSummary) {
      onUpdate(previousSummary)
      setPreviousSummary('')
    }
  }

  const handleGenerateFromKeywords = async () => {
    if (!keywords.trim()) {
      alert('Please enter keywords')
      return
    }

    setPreviousSummary(summary)
    setAiLoading('keywords')
    onLoadingChange(true)

    try {
      const prompt = `Generate a professional CV summary using the following keywords: ${keywords.trim()}. Make it concise, strong, and ATS-friendly. Write it in a confident tone with 2–3 sentences maximum.`

      const response = await fetch('/api/cv/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: '', // Empty summary for keyword generation
          personalInfo,
          skills,
          instruction: prompt,
          latestRole: getLatestRole(),
          experiencePreview: getExperiencePreview(),
        }),
      })

      const data = await response.json()
      if (data.ok && data.summary) {
        onUpdate(data.summary)
        setShowKeywordModal(false)
        setKeywords('')
      } else {
        throw new Error(data.error || 'Failed to generate summary')
      }
    } catch (error: any) {
      console.error('AI keyword generation error:', error)
      alert(error.message || 'Failed to generate summary. Please try again.')
    } finally {
      setAiLoading(null)
      onLoadingChange(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Professional Summary</label>
        <textarea
          value={summary}
          onChange={(e) => onUpdate(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
          placeholder="Write a compelling summary of your professional experience, skills, and career goals..."
        />
        <p className="mt-1.5 text-xs text-slate-500">Recommended: 60-100 words</p>
      </div>

      {/* AI Summary Assistant */}
      <div className="pt-4 border-t border-slate-700/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">AI Summary Assistant</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAiAction('improve')}
            disabled={aiLoading !== null}
            data-jaz-action="cv_improve_summary"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'improve' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Improve Summary
          </button>
          <button
            onClick={() => handleAiAction('shorter')}
            disabled={aiLoading !== null}
            data-jaz-action="cv_make_shorter"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'shorter' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Make Shorter
          </button>
          <button
            onClick={() => handleAiAction('longer')}
            disabled={aiLoading !== null}
            data-jaz-action="cv_make_longer"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'longer' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Make Longer
          </button>
          <button
            onClick={() => handleAiAction('impact')}
            disabled={aiLoading !== null}
            data-jaz-action="cv_more_impact"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'impact' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            More Impact
          </button>
          <button
            onClick={() => setShowKeywordModal(true)}
            disabled={aiLoading !== null}
            data-jaz-action="cv_generate_from_keywords"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            Generate from Keywords
          </button>
          {previousSummary && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center gap-1.5"
            >
              <Undo2 className="w-3 h-3" />
              Undo
            </button>
          )}
        </div>

        {/* Keyword Generation Modal */}
        {showKeywordModal && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/60 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-300">Generate Summary from Keywords</h4>
              <button
                onClick={() => {
                  setShowKeywordModal(false)
                  setKeywords('')
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="animation, leadership, adobe after effects, problem solving"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleGenerateFromKeywords()
                  }
                }}
              />
              <button
                onClick={handleGenerateFromKeywords}
                disabled={aiLoading === 'keywords' || !keywords.trim()}
                data-jaz-action="cv_generate_from_keywords_modal"
                className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiLoading === 'keywords' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

