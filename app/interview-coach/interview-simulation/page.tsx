'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mic, Square, Loader2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { playQuestionWithTts, stopQuestionAudio } from '@/lib/tts-helper'
import InterviewAvatar from '@/components/interview-coach/InterviewAvatar'

type Status = 'idle' | 'countdown' | 'asking' | 'recording' | 'processing' | 'finished'

// Helper function to normalize questions to string array
function normalizeQuestions(qs: any[]): string[] {
  if (!Array.isArray(qs)) return []

  return qs
    .map((q) => {
      if (typeof q === 'string') return q
      if (q && typeof q === 'object' && typeof q.question === 'string') return q.question
      return ''
    })
    .filter(Boolean)
}

// Default questions (fallback when no job context)
const defaultInterviewQuestions = [
  "Tell me about yourself and why you're interested in this position?",
  "Why should we hire you?",
  "What are your strengths?",
  "What is your biggest weakness?",
  "Tell me about a challenge you faced at work.",
  "Where do you see yourself in 5 years?",
  "Why do you want to work at our company?",
  "Describe a time you worked in a team.",
]

export default function InterviewSimulationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState<Status>('idle')
  const [countdown, setCountdown] = useState(3)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<string[]>(defaultInterviewQuestions)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [spokenAnswers, setSpokenAnswers] = useState<string[]>(Array(8).fill(''))
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingQuestionRef = useRef<boolean>(false) // Track if we're in asking/playing phase
  const currentIndexRef = useRef<number>(0) // Track current index for use in callbacks

  const totalQuestions = questions.length

  // Load questions from API
  useEffect(() => {
    const loadQuestions = async () => {
      const jobTitle = searchParams.get('title') || ''
      const company = searchParams.get('company') || ''

      if (!jobTitle) {
        // No job title, use default questions
        setQuestions(defaultInterviewQuestions)
        return
      }

      setIsLoadingQuestions(true)
      try {
        const response = await fetch('/api/interview/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobType: jobTitle,
            jobTitle: jobTitle,
            company: company,
          }),
        })

        const data = await response.json()

        if (data.ok && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          const normalized = normalizeQuestions(data.questions)
          if (normalized.length > 0) {
            setQuestions(normalized.slice(0, 8)) // Limit to 8 questions
            setSpokenAnswers(Array(Math.min(normalized.length, 8)).fill(''))
          } else {
            setQuestions(defaultInterviewQuestions)
          }
        } else {
          setQuestions(defaultInterviewQuestions)
        }
      } catch (error) {
        console.error('Error loading questions:', error)
        setQuestions(defaultInterviewQuestions)
      } finally {
        setIsLoadingQuestions(false)
      }
    }

    loadQuestions()
  }, [searchParams])

  // Keep ref in sync with state to avoid stale closures
  useEffect(() => {
    currentIndexRef.current = currentQuestionIndex
  }, [currentQuestionIndex])

  // Countdown effect
  useEffect(() => {
    if (status !== 'countdown') return

    if (countdown === 0) {
      // Countdown finished, start first question
      setCurrentQuestionIndex(0)
      currentIndexRef.current = 0
      playQuestion(0)
      return
    }

    countdownIntervalRef.current = setTimeout(() => {
      setCountdown((c) => c - 1)
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current)
      }
    }
  }, [status, countdown])

  // Play question audio using TTS
  // CRITICAL: This function MUST set status='asking' BEFORE audio plays
  // The ONLY transition from asking -> recording should be via audio.onended
  const playQuestion = async (index: number) => {
    if (index >= totalQuestions) {
      finishSimulation()
      return
    }

    // Guard: Prevent duplicate calls - if already playing, return early
    if (isPlayingQuestionRef.current || status === 'asking') {
      console.log('[Interview Simulation] Already playing question, skipping duplicate call')
      return
    }

    const currentQuestion = questions[index]
    if (!currentQuestion) {
      // No question available, start recording
      setStatus('recording')
      startRecording()
      return
    }

    // CRITICAL: Set status to 'asking' IMMEDIATELY before playing audio
    // This ensures the asking animation shows from the start
    setStatus('asking')
    isPlayingQuestionRef.current = true
    setCurrentTranscript('')

    try {
      // Play question audio using TTS
      // The onended callback is the ONLY place that transitions asking -> recording
      await playQuestionWithTts(
        currentQuestion,
        'simulation',
        () => {
          // ONLY transition to recording when audio finishes (audio.onended)
          // This ensures the asking animation shows until audio completes
          // This is the ONLY valid path from asking -> recording
          isPlayingQuestionRef.current = false
          setStatus('recording')
          startRecording()
        },
        () => {
          // Error playing audio, fallback to recording
          isPlayingQuestionRef.current = false
          setStatus('recording')
          startRecording()
        }
      )
    } catch (error) {
      console.error('Error playing question audio:', error)
      // On error, still transition to recording
      isPlayingQuestionRef.current = false
      setStatus('recording')
      startRecording()
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      setStatus('recording')
      setCurrentTranscript('')
      audioChunksRef.current = []

      // Capture the current index at the time of recording to avoid stale closures
      const recordingIndex = currentIndexRef.current

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // Pass the captured index to avoid stale closure issues
        await transcribeAudio(audioBlob, recordingIndex)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()

      // Auto-stop after 60 seconds
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
      }
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording()
      }, 60000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to access microphone. Please check your permissions.')
      setStatus('idle')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  // Transcribe audio
  // Accept index parameter to avoid stale closure issues
  const transcribeAudio = async (blob: Blob, index: number) => {
    try {
      setStatus('processing')

      const formData = new FormData()
      formData.append('audio', blob, 'answer.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      const transcript: string = data.transcript || ''

      setCurrentTranscript(transcript)

      // Save answer using the passed index (not stale currentQuestionIndex from closure)
      setSpokenAnswers((prev) => {
        const copy = [...prev]
        copy[index] = transcript
        return copy
      })

      // Move to next question after a short delay
      // Use functional state update in goToNextQuestion to avoid stale closures
      setTimeout(() => {
        goToNextQuestion()
      }, 1500)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      setStatus('idle')
      alert('Failed to transcribe audio. Please try again.')
    }
  }

  // Go to next question
  // Use functional state updates to avoid stale closure issues
  const goToNextQuestion = () => {
    // Reset audio when moving to next question
    stopQuestionAudio()
    isPlayingQuestionRef.current = false
    
    setCurrentQuestionIndex((prevIndex) => {
      // Use functional update to get the latest currentQuestionIndex value
      const questionsLength = questions.length
      if (prevIndex < questionsLength - 1) {
        const next = prevIndex + 1
        currentIndexRef.current = next
        // Play the question audio after a short delay to ensure cleanup completes
        // playQuestion will set status to 'asking' and isPlayingQuestionRef
        // No need to set them here to avoid duplicate state updates
        setTimeout(() => {
          playQuestion(next)
        }, 50) // Small delay to ensure cleanup completes
        return next
      } else {
        // All questions completed - schedule finishSimulation after state update
        setTimeout(() => {
          finishSimulation()
        }, 0)
        return prevIndex
      }
    })
  }

  // Finish simulation and calculate score
  const finishSimulation = () => {
    setStatus('finished')

    // Calculate score based on average word count
    const wordCounts = spokenAnswers.map((ans) => {
      const words = ans.trim().split(/\s+/).filter((w) => w.length > 0)
      return words.length
    })

    const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length || 0
    const rawScore = Math.min(10, avgWords / 3)
    setScore(parseFloat(rawScore.toFixed(1)))
  }

  // Start interview
  const handleStartInterview = () => {
    // FULL RESET: Stop any playing audio
    stopQuestionAudio()
    
    // FULL RESET: Reset ALL phase tracking refs and flags
    isPlayingQuestionRef.current = false // Reset asking/playing flag - CRITICAL for first run
    currentIndexRef.current = 0
    
    // FULL RESET: Reset state to initial values
    setStatus('countdown') // Start with countdown, then transition to asking via playQuestion
    setCountdown(3)
    setCurrentQuestionIndex(0)
    setSpokenAnswers(Array(questions.length).fill(''))
    setCurrentTranscript('')
    setScore(null)
  }

  // Restart simulation
  const restartSimulation = () => {
    // FULL RESET: Stop and fully reset audio state using tts-helper - MUST match handleStartInterview exactly
    stopQuestionAudio()
    
    // FULL RESET: Clear all pending timers/intervals BEFORE resetting state
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    
    // FULL RESET: Stop media recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        // Ignore errors if already stopped
      }
      mediaRecorderRef.current = null
    }
    
    // FULL RESET: Stop and cleanup media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    
    // FULL RESET: Clear audio chunks
    audioChunksRef.current = []
    
    // FULL RESET: Cancel speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    // FULL RESET: Reset ALL phase tracking refs and flags - MUST match handleStartInterview exactly
    isPlayingQuestionRef.current = false // Reset asking/playing flag - CRITICAL for restart
    currentIndexRef.current = 0
    
    // FULL RESET: Reset state to initial values - MUST match handleStartInterview exactly
    setStatus('countdown') // Start with countdown, then transition to asking via playQuestion (same as handleStartInterview)
    setCountdown(3) // Reset countdown to initial value
    setCurrentQuestionIndex(0)
    setSpokenAnswers(Array(questions.length).fill(''))
    setCurrentTranscript('')
    setScore(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current)
      }
    }
  }, [])

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100

  // Derive avatar state from simulation status
  let avatarState: 'speaking' | 'listening' | 'idle' = 'idle'
  if (status === 'asking') {
    avatarState = 'speaking'
  } else if (status === 'recording') {
    avatarState = 'listening'
  }

  return (
    <AppShell>
      {/* Page Title Section */}
      <div className="mb-6">
        <div className="mb-1">
          <h1 className="text-xl font-heading font-bold mb-0.5">Interview Simulation</h1>
          <div className="text-xs text-purple-300 mb-0.5">
            Voice-only interview simulation with 8 questions
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 py-4">
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Left Side - Main Area */}
          <div className="flex-1 space-y-6">
            {status === 'idle' && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-8 min-h-[400px] flex flex-col items-center justify-center space-y-6">
                <h2 className="text-2xl font-semibold text-center">Interview Simulation</h2>
                <p className="text-gray-400 text-center max-w-md">
                  This is a full voice-only interview simulation. You will hear {totalQuestions} questions as audio,
                  and answer each one by speaking. Your answers will be recorded and transcribed.
                </p>
                {isLoadingQuestions ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading questions...
                  </div>
                ) : (
                  <button
                    onClick={handleStartInterview}
                    className="rounded-full bg-violet-600 px-4 md:px-5 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center gap-2"
                  >
                    Start Interview
                  </button>
                )}
              </div>
            )}

            {status === 'countdown' && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-8 min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="text-8xl font-bold text-purple-400">{countdown}</div>
                <p className="text-xl text-gray-300">Get ready…</p>
              </div>
            )}

            {status !== 'idle' && status !== 'countdown' && status !== 'finished' && (
              <>
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between mb-2 text-sm text-gray-400">
                    <span>
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Question Card */}
                <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6 space-y-4">
                  <div className="text-sm text-purple-300 font-medium">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </div>

                  {/* Status Line */}
                  <div className="text-sm text-gray-400">
                    {status === 'asking' && (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI interviewer is asking the question…
                      </span>
                    )}
                    {status === 'recording' && (
                      <span className="flex items-center gap-2 text-green-400">
                        <Mic className="w-4 h-4 animate-pulse" />
                        Listening… answer in your own words.
                      </span>
                    )}
                    {status === 'processing' && (
                      <span className="flex items-center gap-2 text-yellow-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing your answer…
                      </span>
                    )}
                  </div>

                  {/* Stop Recording Button */}
                  {(status === 'recording' || status === 'processing') && (
                    <button
                      onClick={stopRecording}
                      disabled={status === 'processing'}
                      className="rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      I&apos;m done
                    </button>
                  )}

                  {/* Transcription Display */}
                  {currentTranscript && (
                    <div className="mt-4">
                      <div className="text-xs text-gray-400 mb-2">Your spoken answer (text):</div>
                      <div className="text-sm bg-[#0D0D0D] rounded-xl p-4 border border-slate-700/50 text-gray-300">
                        {currentTranscript || <span className="text-gray-500">No transcription yet.</span>}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Finished State */}
            {status === 'finished' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6">
                  <h3 className="text-xl font-semibold mb-4">Simulation Summary</h3>

                  {/* Score Display */}
                  {score !== null && (
                    <div className="mb-6 p-4 bg-[#0D0D0D] rounded-xl border border-purple-600/30">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400 mb-2">
                          {score}/10
                        </div>
                        <div className="text-sm text-gray-400">Overall Simulation Score</div>
                      </div>
                    </div>
                  )}

                  {/* Results Message */}
                  {score !== null && (
                    <div className="mb-6 p-4 rounded-xl border bg-[#0D0D0D]">
                      {score >= 8 ? (
                        <div>
                          <p className="text-lg font-semibold text-green-400 mb-2">
                            ✓ You passed the interview simulation. Score: {score}/10.
                          </p>
                          <p className="text-sm text-gray-400">
                            Great job! You demonstrated strong communication skills throughout the interview.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-semibold text-yellow-400 mb-2">
                            We recommend repeating the simulation. Score: {score}/10.
                          </p>
                          <p className="text-sm text-gray-400">
                            Practice makes perfect. Try again to improve your answers.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Questions and Answers Summary */}
                  <div className="space-y-4">
                    {Array.from({ length: totalQuestions }, (_, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0D0D0D] rounded-xl p-4 border border-slate-700/50 space-y-2"
                      >
                        <div className="text-sm font-medium text-purple-300">
                          Question {idx + 1}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">Your spoken answer:</div>
                        <div className="text-sm text-gray-300 bg-[#1a1a1a] rounded-lg p-3 border border-slate-700/30">
                          {spokenAnswers[idx] || (
                            <span className="text-gray-500 italic">No answer recorded.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={restartSimulation}
                      className="rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition"
                    >
                      {score !== null && score >= 8 ? 'Restart Simulation' : 'Retry Simulation'}
                    </button>
                    <button
                      onClick={() => router.push('/interview-coach')}
                      className="rounded-full bg-violet-600 px-4 md:px-5 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center gap-2"
                    >
                      Back to Training
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Side Cards */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Interview Avatar Card */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4 flex flex-col items-center justify-center">
              <div className="text-sm font-semibold mb-3">Interview Avatar</div>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 min-h-[300px] flex items-center justify-center w-full">
                <InterviewAvatar state={avatarState} />
              </div>
            </div>

            {/* AI Coach Notes Card */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
              <div className="text-sm font-semibold mb-2">AI Coach Notes</div>
              <div className="text-xs text-gray-400">
                {status === 'finished' && score !== null ? (
                  <div>
                    <p className="mb-2">
                      {score >= 8
                        ? 'Excellent performance! Your answers were clear and well-structured.'
                        : 'Keep practicing to improve your answer length and detail.'}
                    </p>
                    <p>Focus on providing specific examples and maintaining a professional tone.</p>
                  </div>
                ) : (
                  'Detailed feedback will appear here after you complete the simulation.'
                )}
              </div>
            </div>

            {/* Simulation Evaluation Card */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
              <div className="text-sm font-semibold mb-2">Simulation Evaluation</div>
              {score === null ? (
                <div className="text-xs text-gray-400">
                  Your evaluation will appear here after you complete the simulation.
                </div>
              ) : (
                <div className="text-xs text-gray-300 space-y-2">
                  <div>
                    Score: <span className="text-purple-400 font-semibold">{score}/10</span>
                  </div>
                  <div className="text-gray-400">
                    {score >= 8 ? 'Passed' : 'Needs Improvement'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
