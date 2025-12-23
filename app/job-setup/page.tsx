'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { saveJobInfo, type JobInfo } from '@/lib/job-store'

export default function JobSetupPage() {
  const router = useRouter()
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | ''>('')
  const [skills, setSkills] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required field
    if (!jobTitle.trim()) {
      alert('Please enter a job title')
      return
    }

    setIsSubmitting(true)

    try {
      // Save job information
      const jobInfo: JobInfo = {
        jobTitle: jobTitle.trim(),
        location: location.trim() || undefined,
        experienceLevel: experienceLevel || undefined,
        skills: skills.trim() || undefined,
      }

      saveJobInfo(jobInfo)

      // Redirect to interview coach
      router.push('/interview-coach')
    } catch (error) {
      console.error('Error saving job info:', error)
      alert('Failed to save job information. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-platinum to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-large p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            What job are you applying for?
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Tell us about the position you're targeting so we can personalize your interview preparation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="jobTitle"
                type="text"
                placeholder="Customer Service Advisor at Amazon"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {/* Country / City */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country / City <span className="text-gray-500 text-xs font-normal">(optional)</span>
              </label>
              <Input
                id="location"
                type="text"
                placeholder="London, UK"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experience Level
              </label>
              <Select
                id="experienceLevel"
                value={experienceLevel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExperienceLevel(e.target.value as 'entry' | 'mid' | 'senior' | '')}
                className="w-full"
              >
                <option value="">Select experience level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </Select>
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skills <span className="text-gray-500 text-xs font-normal">(optional)</span>
              </label>
              <Textarea
                id="skills"
                placeholder="e.g., Customer service, Communication, Problem-solving, CRM software"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || !jobTitle.trim()}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

