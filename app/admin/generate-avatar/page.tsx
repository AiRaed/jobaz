'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react'

export default function GenerateAvatarPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    path?: string
  } | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/avatar/download')
      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: 'Avatar generated and saved successfully!',
          path: data.path,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to generate avatar',
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred while generating the avatar',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#0D0D0D] rounded-2xl border border-gray-800 p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-white">Generate Interviewer Avatar</h1>
        <p className="text-gray-400 mb-8">
          Generate a friendly female interviewer avatar for the job interview app using DALL-E.
        </p>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Avatar Specifications</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Medium shot, from chest up, facing the viewer</li>
              <li>• Age around 30-40, professional, confident and kind</li>
              <li>• Smart casual blazer over a simple top</li>
              <li>• Subtle smile, attentive expression</li>
              <li>• Semi-realistic illustration with clean lines and soft shading</li>
              <li>• Transparent background, optimized for dark purple/navy UI</li>
              <li>• High resolution PNG (1024x1024)</li>
            </ul>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] hover:from-[#8a4ae8] hover:to-[#6d28d9] text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#9b5cff]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating avatar with DALL-E...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate & Save Avatar
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl p-6 border ${
                result.success
                  ? 'bg-green-950/30 border-green-700/50'
                  : 'bg-red-950/30 border-red-700/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-2 ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {result.success ? 'Success!' : 'Error'}
                  </h3>
                  <p className="text-gray-300 text-sm">{result.message}</p>
                  {result.success && result.path && (
                    <p className="text-gray-400 text-xs mt-2">
                      Saved to: <code className="text-purple-400">{result.path}</code>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cost Note */}
          <div className="bg-blue-950/30 border border-blue-700/50 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> Generating an avatar with DALL-E 3 costs approximately $0.04 per
              image. Make sure you have credits in your OpenAI account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

