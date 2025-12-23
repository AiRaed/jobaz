import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'

interface MoreTabProps {
  projects: CvData['projects']
  languages: CvData['languages']
  certifications: CvData['certifications']
  onUpdate: (updates: Partial<Pick<CvData, 'projects' | 'languages' | 'certifications'>>) => void
}

export default function MoreTab({ projects, languages, certifications, onUpdate }: MoreTabProps) {
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '' })
  const [newLanguage, setNewLanguage] = useState('')
  const [newCertification, setNewCertification] = useState('')

  const addProject = () => {
    if (newProject.name.trim()) {
      onUpdate({ projects: [...(projects || []), { ...newProject }] })
      setNewProject({ name: '', description: '', url: '' })
    }
  }

  const removeProject = (index: number) => {
    onUpdate({ projects: (projects || []).filter((_, i) => i !== index) })
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !languages?.includes(newLanguage.trim())) {
      onUpdate({ languages: [...(languages || []), newLanguage.trim()] })
      setNewLanguage('')
    }
  }

  const removeLanguage = (index: number) => {
    onUpdate({ languages: (languages || []).filter((_, i) => i !== index) })
  }

  const addCertification = () => {
    if (newCertification.trim() && !certifications?.includes(newCertification.trim())) {
      onUpdate({ certifications: [...(certifications || []), newCertification.trim()] })
      setNewCertification('')
    }
  }

  const removeCertification = (index: number) => {
    onUpdate({ certifications: (certifications || []).filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      {/* Projects */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Projects</h3>
        <div className="space-y-3 mb-4">
          {(projects || []).map((project, index) => (
            <div key={index} className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-slate-200">{project.name}</span>
                <button
                  onClick={() => removeProject(index)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-1">{project.description}</p>
              {project.url && <p className="text-xs text-violet-400">{project.url}</p>}
            </div>
          ))}
        </div>
        <div className="space-y-2 p-3 bg-slate-900/20 rounded-lg border border-slate-700/30">
          <input
            type="text"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="Project name"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <input
            type="text"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <input
            type="url"
            value={newProject.url}
            onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
            placeholder="URL (optional)"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={addProject}
            className="w-full py-1.5 px-3 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded hover:bg-violet-600/30 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Project
          </button>
        </div>
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Languages</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
            placeholder="e.g., English (Native), Spanish (Fluent)"
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={addLanguage}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm"
          >
            Add
          </button>
        </div>
        {(languages || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(languages || []).map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 text-slate-300 border border-slate-700 rounded-lg text-sm"
              >
                {lang}
                <button onClick={() => removeLanguage(index)} className="hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Certifications</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCertification()}
            placeholder="e.g., AWS Certified Solutions Architect"
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={addCertification}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm"
          >
            Add
          </button>
        </div>
        {(certifications || []).length > 0 && (
          <div className="space-y-2">
            {(certifications || []).map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-900/30 rounded border border-slate-700/50"
              >
                <span className="text-sm text-slate-300">{cert}</span>
                <button onClick={() => removeCertification(index)} className="p-1 text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

