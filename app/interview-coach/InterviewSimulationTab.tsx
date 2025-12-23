'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mic, Square, Loader2 } from 'lucide-react'
import { playQuestionWithTts, stopQuestionAudio } from '@/lib/tts-helper'
import InterviewAvatar from '@/components/interview-coach/InterviewAvatar'
import TranslatableText from '@/components/TranslatableText'

type Status = 'idle' | 'countdown' | 'asking' | 'recording' | 'processing' | 'finished'

interface InterviewEvaluation {
  clarity: number
  confidence: number
  speed: number
  tone: number
  structure: number
  completeness: number
  examples: number
  overall: number
}

type InterviewEval = {
  overall: number
  clarity: number
  confidence: number
  speed: number
  tone: number
  structure: number
  completeness: number
  examples: number
}

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

interface InterviewSimulationTabProps {
  onScoreUpdate?: (score: number | null, finished: boolean) => void
  onCoachNotesUpdate?: (coachNotes: string[] | null) => void
  onRestart?: () => void // Callback to trigger force remount
  coreQuestions?: string[] // Primary source: questions from Writing Training
  writingEvaluations?: { [questionIndex: number]: { savedAnswer?: string } } // Saved answers from Writing Training
}

export default function InterviewSimulationTab({ onScoreUpdate, onCoachNotesUpdate, onRestart, coreQuestions = [], writingEvaluations = {} }: InterviewSimulationTabProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false) // Start as false since we use coreQuestions immediately
  const [status, setStatus] = useState<Status>('idle')
  const [countdown, setCountdown] = useState(3)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [spokenAnswers, setSpokenAnswers] = useState<string[]>([])
  const [writtenAnswers, setWrittenAnswers] = useState<string[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [interviewEvaluation, setInterviewEvaluation] = useState<InterviewEvaluation | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [coachNotes, setCoachNotes] = useState<string[] | null>(null)
  const [interviewEval, setInterviewEval] = useState<InterviewEval | null>(null)

  // Keep ref in sync with state to avoid stale closures in callbacks
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentIndexRef = useRef<number>(0) // Track current index for use in callbacks to avoid stale closures
  const audioRef = useRef<HTMLAudioElement | null>(null) // Track current audio element for proper cleanup
  const audioObjectUrlRef = useRef<string | null>(null) // Track object URL for cleanup
  const isPlayingQuestionRef = useRef<boolean>(false) // Track if we're in asking/playing phase

  // Helper function to load saved written answers from writingEvaluations prop
  const loadWrittenAnswers = (questionCount: number) => {
    try {
      const savedAnswers: string[] = Array(questionCount).fill('')
      
      // Extract saved answers from writingEvaluations prop (same method as Hard Mode)
      for (let i = 0; i < questionCount; i++) {
        const evaluation = writingEvaluations[i]
        if (evaluation?.savedAnswer) {
          savedAnswers[i] = evaluation.savedAnswer
        }
      }
      
      setWrittenAnswers(savedAnswers)
    } catch (error) {
      console.error('Error loading written answers:', error)
      setWrittenAnswers(Array(questionCount).fill(''))
    }
  }

  // Primary: Use coreQuestions from Writing Training (shared source of truth)
  // Secondary: Optional API call for enrichment (non-blocking)
  useEffect(() => {
    // Use coreQuestions as primary source (same as Hard Mode and Voice Training)
    if (coreQuestions.length > 0) {
      const normalized = normalizeQuestions(coreQuestions)
      if (normalized.length > 0) {
        console.log('[Interview Simulation] Using coreQuestions from Writing Training:', normalized.length, 'questions')
        setQuestions(normalized)
        setSpokenAnswers(Array(normalized.length).fill(''))
        loadWrittenAnswers(normalized.length)
        setIsLoadingQuestions(false)
      }
    } else {
      // No questions available - will show "Go to Writing Training" state
      console.log('[Interview Simulation] No coreQuestions available - user needs to complete Writing Training')
      setQuestions([])
      setSpokenAnswers([])
      setWrittenAnswers([])
      setIsLoadingQuestions(false)
    }

    // Optional: Try to enrich questions from API (non-blocking, doesn't affect UI)
    // This is only for enrichment if API has better questions, but we don't wait for it
    const jobTitle = searchParams.get('title') || ''
    const company = searchParams.get('company') || ''
    
    if (jobTitle && coreQuestions.length > 0) {
      // Only make API call if we already have questions (for potential enrichment)
      // This is non-blocking - we don't wait for it or show loading state
      fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: jobTitle,
          jobTitle: jobTitle,
          company: company,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            const normalized = normalizeQuestions(data.questions)
            if (normalized.length > 0) {
              console.log('[Interview Simulation] API enrichment available:', normalized.length, 'questions (not used, coreQuestions is primary)')
              // We don't update questions here - coreQuestions is the source of truth
            }
          }
        })
        .catch(error => {
          // Silently fail - API is optional
          console.log('[Interview Simulation] Optional API call failed (non-blocking):', error.message)
        })
    }
  }, [coreQuestions, writingEvaluations, searchParams])

  // Reset audio when question index changes (but not on initial mount)
  // IMPORTANT: Never run this effect while phase is 'asking' or while audio is playing
  const prevIndexRef = useRef<number | null>(null)
  useEffect(() => {
    // Gate: Never run while asking or playing - only reset on actual question change
    if (status === 'asking' || isPlayingQuestionRef.current) {
      return
    }
    // Only reset if this is a real question change (not initial mount)
    if (prevIndexRef.current !== null && prevIndexRef.current !== currentIndex) {
      // Reset audio when moving to a new question
      // This ensures clean state for each question
      resetAudio()
    }
    prevIndexRef.current = currentIndex
  }, [currentIndex, status])

  // Countdown effect
  useEffect(() => {
    if (status !== 'countdown') return

    if (countdown === 0) {
      // Countdown finished, start first question
      setCurrentIndex(0)
      currentIndexRef.current = 0 // Ensure ref is in sync
      speakQuestionAndRecord(0)
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

  // Reset audio on question change
  const resetAudio = () => {
    // Use the tts-helper function to properly stop and clean up audio
    stopQuestionAudio()
    // Also clear local refs if they exist
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current)
      audioObjectUrlRef.current = null
    }
    // Reset playing flag
    isPlayingQuestionRef.current = false
  }

  // Comprehensive reset function for simulation state
  // Resets ALL state/refs/timers to ensure clean state for restart and new questions
  // Note: Does NOT reset currentIndex - that should be handled separately
  const resetSimulationState = () => {
    // Stop and reset question audio state
    stopQuestionAudio()
    resetAudio()
    
    // Clear all pending timers/intervals
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    
    // Stop and null MediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
        // Remove handlers
        mediaRecorderRef.current.ondataavailable = null
        mediaRecorderRef.current.onstop = null
      } catch (e) {
        // Ignore errors if already stopped
      }
      mediaRecorderRef.current = null
    }
    
    // Clear audio capture stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    
    // Clear audio chunks
    audioChunksRef.current = []
    
    // Cancel speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    // Reset all phase tracking refs and flags
    prevIndexRef.current = null
    isPlayingQuestionRef.current = false
    // Note: currentIndexRef is NOT reset here - it's updated separately when needed
    
    // Reset transcription state
    setCurrentTranscript('')
    
    // CRITICAL: Reset status to 'idle' to clear any stale state from previous question
    // This prevents Q2-Q8 from jumping to listening/recording during question playback
    // Status will be set to 'asking' BEFORE playing audio in speakQuestionAndRecord()
    setStatus('idle')
  }

  // Speak question using TTS and then start recording
  // CRITICAL: This function MUST set status='asking' BEFORE audio plays
  // The ONLY transition from asking -> recording should be via audio.onended
  const speakQuestionAndRecord = async (index: number) => {
    // Guard: Prevent duplicate calls - if already playing, return early
    if (isPlayingQuestionRef.current || status === 'asking') {
      console.log('[Interview Simulation] Already playing question, skipping duplicate call')
      return
    }

    // CRITICAL: Reset ALL state/refs/timers before starting each question
    // This ensures clean state for Q1-Q8 (prevents Q2-Q8 from jumping to listening/recording)
    resetSimulationState()
    
    // Update current index ref
    currentIndexRef.current = index

    // questions is string[], so no .text property needed
    const q = questions[index]
    if (!q) {
      // no question text – go straight to recording
      setStatus('recording')
      startRecording()
      return
    }

    // CRITICAL: Set status to 'asking' IMMEDIATELY before playing audio
    // This ensures the asking animation shows from the start for ALL questions
    // Listening can ONLY become true after question audio ended (via audio.onended)
    setStatus('asking')
    isPlayingQuestionRef.current = true

    try {
      // Play question audio using TTS
      // Create a fresh onended handler for each question
      // The onended callback is the ONLY place that transitions asking -> recording
      await playQuestionWithTts(
        q,
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

      // Save answer using the passed index (not stale currentIndex from closure)
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
    // CRITICAL: Reset ALL state/refs/timers before starting new question
    // This ensures clean state for Q2-Q8 (not just Q1)
    resetSimulationState()
    
    setCurrentIndex((prevIndex) => {
      // Use functional update to get the latest currentIndex value
      const questionsLength = questions.length // Capture questions.length to check if it's available
      if (prevIndex < questionsLength - 1) {
        const next = prevIndex + 1
        currentIndexRef.current = next // Update ref immediately
        
        // Play the question audio after a short delay to ensure cleanup completes
        // speakQuestionAndRecord will set status to 'asking' and isPlayingQuestionRef
        // No need to set them here to avoid duplicate state updates
        setTimeout(() => {
          speakQuestionAndRecord(next)
        }, 50)
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

  // Evaluate interview - sends all answers to API for scoring
  const evaluateInterview = async (answers: string[]) => {
    try {
      setIsEvaluating(true)
      const response = await fetch('/api/interview/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        throw new Error('Evaluation failed')
      }

      const data = await response.json()
      if (data.ok) {
        const evalData: InterviewEval = {
          clarity: data.clarity,
          confidence: data.confidence,
          speed: data.speed,
          tone: data.tone,
          structure: data.structure,
          completeness: data.completeness,
          examples: data.examples,
          overall: data.overall,
        }
        
        // Update both evaluation states
        setInterviewEvaluation({
          clarity: data.clarity,
          confidence: data.confidence,
          speed: data.speed,
          tone: data.tone,
          structure: data.structure,
          completeness: data.completeness,
          examples: data.examples,
          overall: data.overall,
        })
        setInterviewEval(evalData)
      }
    } catch (error) {
      console.error('Error evaluating interview:', error)
      // On error, keep the local evaluation that was already set
    } finally {
      setIsEvaluating(false)
    }
  }


  // Finish simulation and calculate score
  const finishSimulation = async () => {
    setStatus('finished')

    // Calculate score based on average word count
    const wordCounts = spokenAnswers.map((ans) => {
      const words = ans.trim().split(/\s+/).filter((w) => w.length > 0)
      return words.length
    })

    const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length || 0
    const rawScore = Math.min(10, avgWords / 3)
    const finalScore = parseFloat(rawScore.toFixed(1))
    setScore(finalScore)

    // Generate simple text feedback based on score and answers
    const feedbackLines: string[] = []
    
    if (finalScore < 5) {
      // Low score feedback
      feedbackLines.push('Work on improving the clarity of your answers')
      feedbackLines.push('Add more specific examples to support your points')
      feedbackLines.push('Try to provide more detailed responses')
      feedbackLines.push('Focus on structuring your answers better')
    } else if (finalScore < 8) {
      // Medium score feedback
      feedbackLines.push('Your answers show good structure')
      feedbackLines.push('Consider adding more concrete examples')
      feedbackLines.push('Work on expanding your responses with more detail')
      feedbackLines.push('Practice maintaining a confident delivery')
    } else {
      // High score feedback
      feedbackLines.push('Excellent structure in your answers')
      feedbackLines.push('You demonstrated confident delivery')
      feedbackLines.push('Your responses were clear and well-organized')
      feedbackLines.push('Great use of examples to support your points')
    }
    
    setCoachNotes(feedbackLines)
    
    // Notify parent component of coach notes update
    if (onCoachNotesUpdate) {
      onCoachNotesUpdate(feedbackLines)
    }

    // Notify parent component of score update
    if (onScoreUpdate) {
      onScoreUpdate(finalScore, true)
    }

    // Set interviewEval immediately after setting the provisional score
    // All categories use the same provisional score for now
    setInterviewEval({
      overall: finalScore,
      clarity: finalScore,
      confidence: finalScore,
      speed: finalScore,
      tone: finalScore,
      structure: finalScore,
      completeness: finalScore,
      examples: finalScore,
    })

    // Call API evaluations if all 8 questions are answered
    // This will update interviewEval with API results when they arrive
    const allAnswersPresent = spokenAnswers.length === questions.length && 
                              spokenAnswers.every((ans) => ans && ans.trim().length > 0)
    
    if (allAnswersPresent && questions.length === 8) {
      // Call both evaluations - they will update the states when complete
      await evaluateInterview(spokenAnswers)
    }
  }

  // Start interview
  const handleStartInterview = () => {
    if (questions.length === 0) {
      alert('Questions are still loading. Please wait.')
      return
    }
    
    // Reset ALL state/refs/timers using comprehensive reset function
    resetSimulationState()
    
    // Reset state to initial values
    setStatus('countdown') // Start with countdown, then transition to asking via speakQuestionAndRecord
    setCountdown(3)
    setCurrentIndex(0)
    currentIndexRef.current = 0 // Reset ref to match state
    setSpokenAnswers(Array(questions.length).fill(''))
    setCurrentTranscript('')
    setScore(null)
    setInterviewEvaluation(null)
    setCoachNotes(null)
    setInterviewEval(null)
    
    // Notify parent component that simulation is reset
    if (onScoreUpdate) {
      onScoreUpdate(null, false)
    }
    if (onCoachNotesUpdate) {
      onCoachNotesUpdate(null)
    }
    
    // Reload written answers when starting
    loadWrittenAnswers(questions.length)
  }

  // Restart simulation
  const restartSimulation = () => {
    // Reset ALL state/refs/timers using comprehensive reset function
    resetSimulationState()
    
    // Reset state to initial values - MUST match handleStartInterview exactly
    setStatus('countdown') // Start with countdown, then transition to asking via speakQuestionAndRecord
    setCountdown(3) // Reset countdown to initial value
    setCurrentIndex(0)
    currentIndexRef.current = 0 // Reset ref to match state
    setSpokenAnswers(Array(questions.length).fill(''))
    setCurrentTranscript('')
    setScore(null)
    setInterviewEvaluation(null)
    setCoachNotes(null)
    setInterviewEval(null)
    
    // Notify parent component that simulation is reset
    if (onScoreUpdate) {
      onScoreUpdate(null, false)
    }
    if (onCoachNotesUpdate) {
      onCoachNotesUpdate(null)
    }
    
    // Reload written answers when restarting
    if (questions.length > 0) {
      loadWrittenAnswers(questions.length)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset audio on unmount
      resetAudio()
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
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

  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  // Derive avatar state from simulation status
  let avatarState: 'speaking' | 'listening' | 'idle' = 'idle'
  if (status === 'asking') {
    avatarState = 'speaking'
  } else if (status === 'recording') {
    avatarState = 'listening'
  }

  // Show loading state while questions are being loaded
  if (isLoadingQuestions) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-semibold mb-6">Interview Simulation</h2>
        <div className="w-full flex justify-center">
          <div className="bg-[#0D0D0D] rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center space-y-4 border border-gray-800">
            <Loader2 className="w-8 h-8 animate-spin text-[#9b5cff]" />
            <p className="text-gray-400 text-center">Loading questions…</p>
          </div>
        </div>
      </div>
    )
  }

  // Show "Go to Writing Training" state if no questions available
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-semibold mb-6">Interview Simulation</h2>
        <div className="w-full flex justify-center">
          <div className="bg-[#0D0D0D] rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center space-y-4 border border-gray-800">
            <p className="text-gray-400 text-center text-lg mb-2">
              Complete Writing Training first to unlock Interview Simulation.
            </p>
            <p className="text-gray-500 text-center text-sm">
              Save your written answers for all questions to access the full simulation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-semibold mb-6">Interview Simulation</h2>
      
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-full">
          {/* Main Center Content */}
          <div className="space-y-4">
            {/* Interview Avatar Card - Top of Main Column */}
            <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-gray-800">
              <h3 className="text-base font-heading font-semibold mb-3 text-center">Interview Avatar</h3>
              <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 min-h-[300px] flex items-center justify-center">
                <InterviewAvatar state={avatarState} />
              </div>
            </div>

            {/* Interview Simulation Card */}
            <div className="bg-[#0D0D0D] rounded-xl border border-gray-800">
            {/* Idle State */}
            {status === 'idle' && (
                <div className="p-8 min-h-[400px] flex flex-col items-center justify-center space-y-6">
                <h3 className="text-xl font-semibold text-center">Interview Simulation</h3>
                <p className="text-gray-400 text-center max-w-md">
                  This is a full voice-only interview simulation. You will hear {questions.length} questions as audio,
                  and answer each one by speaking. Your answers will be recorded and transcribed.
                </p>
                <button
                  onClick={handleStartInterview}
                  disabled={questions.length === 0}
                  data-jaz-action="ic_sim_start"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] hover:from-[#8a4ae8] hover:to-[#6d28d9] text-white font-semibold text-lg transition-all shadow-lg shadow-[#9b5cff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Interview
                </button>
              </div>
            )}

            {/* Countdown State */}
            {status === 'countdown' && (
                <div className="p-8 min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="text-9xl font-bold text-[#9b5cff]">{countdown}</div>
                <p className="text-xl text-gray-300">Get ready…</p>
              </div>
            )}

            {/* Active Interview State */}
            {status !== 'idle' && status !== 'countdown' && status !== 'finished' && (
                <div className="p-6 space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between mb-2 text-sm text-gray-400">
                    <span>
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                  {/* Question */}
                  <div className="text-sm text-[#9b5cff] font-medium">
                    Question {currentIndex + 1} of {questions.length}
                  </div>
                  <div className="text-lg text-white font-medium">
                    <TranslatableText text={questions[currentIndex]}>
                      {questions[currentIndex]}
                    </TranslatableText>
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

                  {/* I'm Done Button */}
                  {(status === 'recording' || status === 'processing') && (
                    <button
                      onClick={stopRecording}
                      disabled={status === 'processing'}
                      data-jaz-action="ic_sim_stop"
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      I&apos;m done
                    </button>
                  )}

                  {/* Transcription Display */}
                  {currentTranscript && (
                    <div className="mt-4">
                      <div className="text-xs text-gray-400 mb-2">Your spoken answer (transcribed):</div>
                      <div className="text-sm bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 text-gray-300">
                        {currentTranscript || <span className="text-gray-500">No transcription yet.</span>}
                      </div>
                    </div>
                  )}
                </div>
            )}
            </div>

            {/* Simulation Summary - Bottom of Main Column (when finished) */}
            {status === 'finished' && (
                <div className="bg-[#0D0D0D] rounded-xl border border-gray-800 p-6">
                  <h3 className="text-xl font-semibold mb-4">Simulation Summary</h3>

                  {/* Score Display */}
                  {score !== null && (
                    <div className="mb-6 p-4 bg-[#1a1a1a] rounded-xl border border-[#9b5cff]/30">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#9b5cff] mb-2">
                          {score}/10
                        </div>
                        <div className="text-sm text-gray-400">Provisional Simulation Score</div>
                      </div>
                    </div>
                  )}

                  {/* Questions and Answers Summary */}
                  <div className="space-y-4">
                    {questions.map((question, idx) => (
                      <div
                        key={idx}
                      className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 space-y-3"
                      >
                        <div className="text-sm font-medium text-[#9b5cff]">
                          Question {idx + 1}
                        </div>
                        <div className="text-sm text-gray-300">
                          <TranslatableText text={question}>
                            {question}
                          </TranslatableText>
                        </div>
                      
                      {/* Written Answer */}
                      {writtenAnswers[idx] && writtenAnswers[idx].trim().length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400 font-medium">Your Written Answer:</div>
                          <div className="text-sm text-gray-300 bg-[#0D0D0D] rounded-lg p-3 border border-gray-800">
                            {writtenAnswers[idx]}
                          </div>
                        </div>
                      )}
                      
                      {/* Spoken Answer */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400 font-medium">Your Interview Answer (transcribed):</div>
                        <div className="text-sm text-gray-300 bg-[#0D0D0D] rounded-lg p-3 border border-gray-800">
                          {spokenAnswers[idx] || (
                            <span className="text-gray-500 italic">No answer recorded.</span>
                          )}
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={restartSimulation}
                      className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
                    >
                      Restart Simulation
                    </button>
                    <button
                      onClick={() => router.push('/interview-coach')}
                      className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] hover:from-[#8a4ae8] hover:to-[#6d28d9] text-sm font-medium text-white transition-all"
                    >
                      Back to Training
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

