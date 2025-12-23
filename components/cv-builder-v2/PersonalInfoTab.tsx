import { CvData } from '@/app/cv-builder-v2/page'

interface PersonalInfoTabProps {
  personalInfo: CvData['personalInfo']
  onUpdate: (updates: Partial<CvData['personalInfo']>) => void
}

export default function PersonalInfoTab({ personalInfo, onUpdate }: PersonalInfoTabProps) {
  const safePersonalInfo = personalInfo ?? { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
        <input
          type="text"
          value={safePersonalInfo.fullName}
          onChange={(e) => onUpdate({ fullName: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
        <input
          type="email"
          value={safePersonalInfo.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="john.doe@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
        <input
          type="tel"
          value={safePersonalInfo.phone || ''}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
        <input
          type="text"
          value={safePersonalInfo.location || ''}
          onChange={(e) => onUpdate({ location: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="City, Country"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">LinkedIn</label>
        <input
          type="url"
          value={safePersonalInfo.linkedin || ''}
          onChange={(e) => onUpdate({ linkedin: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Website / Portfolio</label>
        <input
          type="url"
          value={safePersonalInfo.website || ''}
          onChange={(e) => onUpdate({ website: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="yourwebsite.com"
        />
      </div>
    </div>
  )
}

