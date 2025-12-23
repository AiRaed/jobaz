import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import SkillsAIModal from './SkillsAIModal'

interface SkillsTabProps {
  skills: string[]
  onUpdate: (skills: string[]) => void
  targetRole?: string
  summaryText?: string
  experiencePreview?: string
  onToast?: (type: 'success' | 'error', message: string) => void
}

export default function SkillsTab({ 
  skills, 
  onUpdate, 
  targetRole,
  summaryText,
  experiencePreview,
  onToast,
}: SkillsTabProps) {
  const [inputValue, setInputValue] = useState('')
  const [showAIModal, setShowAIModal] = useState(false)

  const addSkill = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !skills.includes(trimmed)) {
      onUpdate([...skills, trimmed])
      setInputValue('')
    }
  }

  const removeSkill = (index: number) => {
    onUpdate(skills.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  // Check if we have any context for AI suggestions
  const hasContext = !!(targetRole?.trim() || summaryText?.trim() || experiencePreview?.trim())

  const handleApplyAISkills = (aiSkills: string[]) => {
    const existingLower = new Set(skills.map(s => s.toLowerCase().trim()))
    const merged = [...skills]
    let addedCount = 0

    for (const skill of aiSkills) {
      const cleaned = skill.trim()
      if (!cleaned) continue
      if (!existingLower.has(cleaned.toLowerCase())) {
        merged.push(cleaned)
        existingLower.add(cleaned.toLowerCase())
        addedCount++
      }
    }

    onUpdate(merged)
    
    if (onToast && addedCount > 0) {
      onToast('success', `Added ${addedCount} AI-suggested skill${addedCount > 1 ? 's' : ''}.`)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-300">Add Skills</label>
          <div className="relative group">
            <button
              onClick={() => setShowAIModal(true)}
              disabled={!hasContext}
              data-jaz-action="cv_suggest_skills"
              className={`
                rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5
                ${hasContext
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                }
              `}
              title={!hasContext ? "Add at least a target job title or a short summary first." : undefined}
            >
              <Sparkles className="w-3 h-3" />
              ⚡ AI Suggest Skills
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Type a skill and press Enter"
          />
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm font-medium"
          >
            Add
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Press Enter or click Add to add a skill</p>
      </div>

      {skills.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Your Skills ({skills.length})</label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  className="hover:text-red-300 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <SkillsAIModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onApply={handleApplyAISkills}
          targetRole={targetRole}
          summaryText={summaryText}
          experiencePreview={experiencePreview}
        />
      )}
    </div>
  )
}

