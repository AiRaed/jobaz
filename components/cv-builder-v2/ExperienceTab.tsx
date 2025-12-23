import { useState } from 'react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'
import ExperienceAIModal from './ExperienceAIModal'

interface ExperienceTabProps {
  experience: CvData['experience']
  onUpdate: (experience: CvData['experience']) => void
}

export default function ExperienceTab({ experience, onUpdate }: ExperienceTabProps) {
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null)
  const addExperience = () => {
    onUpdate([
      ...experience,
      {
        id: Date.now().toString(),
        jobTitle: '',
        company: '',
        bullets: [''],
      },
    ])
  }

  const updateExperience = (index: number, updates: Partial<CvData['experience'][0]>) => {
    const updated = experience.map((exp, i) => (i === index ? { ...exp, ...updates } : exp))
    onUpdate(updated)
  }

  const removeExperience = (index: number) => {
    onUpdate(experience.filter((_, i) => i !== index))
  }

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const exp = experience[expIndex]
    const bullets = [...exp.bullets]
    bullets[bulletIndex] = value
    updateExperience(expIndex, { bullets })
  }

  const addBullet = (expIndex: number) => {
    const exp = experience[expIndex]
    updateExperience(expIndex, { bullets: [...exp.bullets, ''] })
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const exp = experience[expIndex]
    const bullets = exp.bullets.filter((_, i) => i !== bulletIndex)
    updateExperience(expIndex, { bullets: bullets.length > 0 ? bullets : [''] })
  }

  const handleAIGenerate = (expIndex: number, result: { responsibilities?: string[]; achievements?: string[] }) => {
    const exp = experience[expIndex]
    const existingBullets = exp.bullets.filter((b) => b.trim().length > 0)
    const newBullets: string[] = []

    // If both sections are present, add them with labels
    if (result.responsibilities && result.responsibilities.length > 0 && result.achievements && result.achievements.length > 0) {
      // Add responsibilities
      newBullets.push(...result.responsibilities)
      // Add achievements
      newBullets.push(...result.achievements)
    } else if (result.responsibilities && result.responsibilities.length > 0) {
      newBullets.push(...result.responsibilities)
    } else if (result.achievements && result.achievements.length > 0) {
      newBullets.push(...result.achievements)
    }

    // Merge with existing bullets
    if (existingBullets.length === 0) {
      // If field is empty, replace with new bullets
      updateExperience(expIndex, { bullets: newBullets.length > 0 ? newBullets : [''] })
    } else {
      // If field has content, append new bullets
      updateExperience(expIndex, { bullets: [...existingBullets, ...newBullets] })
    }
  }

  return (
    <div className="space-y-6">
      {experience.map((exp, expIndex) => (
        <div key={exp.id} className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Experience #{expIndex + 1}</h3>
            {experience.length > 1 && (
              <button
                onClick={() => removeExperience(expIndex)}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Job Title *</label>
              <input
                type="text"
                value={exp.jobTitle}
                onChange={(e) => updateExperience(expIndex, { jobTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company *</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(expIndex, { company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(expIndex, { location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                <input
                  type="text"
                  value={exp.startDate || ''}
                  onChange={(e) => updateExperience(expIndex, { startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="Jan 2020"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                <input
                  type="text"
                  value={exp.endDate || ''}
                  onChange={(e) => updateExperience(expIndex, { endDate: e.target.value })}
                  disabled={exp.isCurrent}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm disabled:opacity-50"
                  placeholder="Present"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={exp.isCurrent || false}
                onChange={(e) => updateExperience(expIndex, { isCurrent: e.target.checked, endDate: e.target.checked ? undefined : exp.endDate })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs md:text-sm text-slate-200">
                Currently working here
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Responsibilities & Achievements</label>
              <div className="space-y-2">
                {exp.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                      placeholder="Achieved X by doing Y, resulting in Z..."
                    />
                    {exp.bullets.length > 1 && (
                      <button
                        onClick={() => removeBullet(expIndex, bulletIndex)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addBullet(expIndex)}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add bullet point
                </button>
              </div>
              {/* AI Generate Button */}
              <div className="mt-2">
                <button
                  onClick={() => setOpenModalIndex(expIndex)}
                  disabled={!exp.jobTitle.trim()}
                  className={`
                    rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5
                    ${exp.jobTitle.trim()
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50'
                      : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                    }
                  `}
                  title={!exp.jobTitle.trim() ? "Add a Job Title first so I can suggest relevant bullet points." : undefined}
                >
                  <Sparkles className="w-3 h-3" />
                  AI Generate Bullet Points
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* AI Modal */}
      {openModalIndex !== null && experience[openModalIndex] && (
        <ExperienceAIModal
          isOpen={true}
          onClose={() => setOpenModalIndex(null)}
          onApply={(result) => {
            handleAIGenerate(openModalIndex, result)
            setOpenModalIndex(null)
          }}
          jobTitle={experience[openModalIndex].jobTitle}
          company={experience[openModalIndex].company}
        />
      )}

      <button
        onClick={addExperience}
        data-jaz-action="cv_add_experience"
        data-cv-section="experience"
        className="w-full py-2.5 px-4 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 hover:border-violet-500/50 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </button>
    </div>
  )
}

