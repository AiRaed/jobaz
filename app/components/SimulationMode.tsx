'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Loader2, RotateCcw, ArrowLeft } from 'lucide-react'

interface Question {
  id: string
  question: string
}

interface SimulationModeProps {
  onBack?: () => void
  jobTitle?: string
  company?: string
}

export default function SimulationMode({ onBack, jobTitle = '', company = '' }: SimulationModeProps) {
  // State management
  const [phase, setPhase] = useState<'initial' | 'countdown' | 'interview' | 'complete'>('initial')
  const [countdown, setCountdown] = useState(3)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [spokenAnswers, setSpokenAnswers] = useState<string[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Refs for recording
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load questions on mount
  useEffect(() => {
    loadQuestions()
  }, [jobTitle, company])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
      }
    }
  }, [])

  const loadQuestions = async () => {
    setIsLoadingQuestions(true)
    setError(null)
    try {
      const response = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company }),
      })

      const data = await response.json()
      if (data.ok && data.questions) {
        setQuestions(data.questions)
      } else {
        throw new Error(data.error || 'Failed to load questions')
      }
    } catch (err: any) {
      console.error('Error loading questions:', err)
      setError(err.message || 'Failed to load questions. Please try again.')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const startInterview = () => {
    if (questions.length === 0) {
      alert('Please wait for questions to load.')
      return
    }
    setPhase('countdown')
    setCountdown(3)
  }

  // Countdown effect
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('interview')
      setCurrentQuestionIndex(0)
      setSpokenAnswers([])
      setCurrentTranscript('')
      // Start recording for first question after a brief delay
      setTimeout(() => {
        startRecording()
      }, 500)
    }
  }, [phase, countdown])

  // Auto-start recording when question changes
  useEffect(() => {
    if (phase === 'interview' && currentQuestionIndex < questions.length && !isRecording && !isProcessing) {
      // Reset state for new question
      setCurrentTranscript('')
      setRecordingTime(0)
      // Start recording after a brief delay
      const timer = setTimeout(() => {
        startRecording()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [phase, currentQuestionIndex, questions.length, isRecording, isProcessing])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        processRecording(audioBlob)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setError(null)

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          // Auto-stop at 60 seconds
          if (newTime >= 60) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)

      // Set 60-second timeout as backup
      recordingTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording()
        }
      }, 60000)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to access microphone. Please check your permissions.')
      alert('Failed to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
        recordingTimeoutRef.current = null
      }
    }
  }

  const processRecording = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Transcribe audio using Whisper
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/simulation-transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Transcription failed')
      }

      const transcript = data.transcript || ''

      // Save transcript
      const updatedAnswers = [...spokenAnswers]
      updatedAnswers[currentQuestionIndex] = transcript
      setSpokenAnswers(updatedAnswers)
      setCurrentTranscript(transcript)

      // Wait 1-2 seconds, then move to next question
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setIsProcessing(false)
        } else {
          // All questions completed
          setIsProcessing(false)
          setPhase('complete')
        }
      }, 1500)
    } catch (err: any) {
      console.error('Error processing recording:', err)
      setError(err.message || 'Failed to transcribe audio. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleDone = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  const restartSimulation = () => {
    stopRecording()
    setPhase('initial')
    setCurrentQuestionIndex(0)
    setSpokenAnswers([])
    setCurrentTranscript('')
    setRecordingTime(0)
    setError(null)
    setIsProcessing(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const calculateScore = () => {
    if (spokenAnswers.length === 0) return 0
    const totalLength = spokenAnswers.reduce((sum, answer) => sum + (answer?.length || 0), 0)
    const avgLength = totalLength / spokenAnswers.length
    return Math.min(10, Math.round((avgLength / 20) * 10) / 10)
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  // Initial state
  if (phase === 'initial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
        <h1 className="text-3xl font-bold mb-8">Simulation Mode</h1>
        {isLoadingQuestions ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading questions...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : questions.length === 0 ? (
          <div className="text-gray-600 mb-4">No questions available. Please try again.</div>
        ) : (
          <button
            onClick={startInterview}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Start Interview
          </button>
        )}
      </div>
    )
  }

  // Countdown state
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
        <div className="text-6xl font-bold text-blue-600 mb-4">
          {countdown > 0 ? countdown : 'Go!'}
        </div>
        <p className="text-xl text-gray-600">Get ready…</p>
      </div>
    )
  }

  // Complete state
  if (phase === 'complete') {
    const score = calculateScore()
    return (
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Simulation Complete</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Interview Summary</h2>
              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={q.id} className="border-b pb-4 last:border-b-0">
                    <div className="font-semibold text-lg mb-2">
                      Question {index + 1}
                    </div>
                    <div className="text-gray-700 mb-2">{q.question}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Your spoken answer (text):</span>{' '}
                      <span className="italic">
                        {spokenAnswers[index] || '(No answer recorded)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Cards */}
          <div className="space-y-6">
            {/* Interview Avatar Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Interview Avatar</h3>
              <div className="text-gray-500 text-sm">Placeholder for future avatar</div>
            </div>

            {/* AI Coach Notes Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">AI Coach Notes</h3>
              <div className="text-gray-500 text-sm">Placeholder for coach notes</div>
            </div>

            {/* Simulation Evaluation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Simulation Evaluation</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {score.toFixed(1)} / 10
              </div>
              <div className="text-sm text-gray-600">
                Simulation complete – your provisional score: {score.toFixed(1)} / 10
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={restartSimulation}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Restart Simulation
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Training
            </button>
          )}
        </div>
      </div>
    )
  }

  // Interview state
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div className="text-sm text-gray-600">{formatTime(recordingTime)}</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="font-semibold text-lg mb-4">
              Question {currentQuestionIndex + 1}
            </div>
            <div className="text-gray-800 mb-6 text-lg">
              {currentQuestion?.question || 'Loading question...'}
            </div>

            {/* Status Line */}
            <div className="mb-4 min-h-[24px]">
              {isRecording && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Listening… please answer now</span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing answer…</span>
                </div>
              )}
            </div>

            {/* Done Button */}
            {isRecording && (
              <button
                onClick={handleDone}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                I'm done
              </button>
            )}

            {/* Transcribed Answer Display */}
            {currentTranscript && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Your spoken answer (text):
                </div>
                <div className="text-gray-800 italic">{currentTranscript}</div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Placeholders */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Interview Avatar</h3>
            <div className="text-gray-500 text-sm">Placeholder for future avatar</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">AI Coach Notes</h3>
            <div className="text-gray-500 text-sm">Placeholder for coach notes</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Simulation Evaluation</h3>
            <div className="text-gray-500 text-sm">Evaluation will appear after completion</div>
          </div>
        </div>
      </div>
    </div>
  )
}

