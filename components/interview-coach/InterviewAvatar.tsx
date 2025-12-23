'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type InterviewAvatarProps = {
  state: 'speaking' | 'listening' | 'idle'
}

export default function InterviewAvatar({ state }: InterviewAvatarProps) {
  const [src, setSrc] = useState('/avatars/interviewer_idle.png')
  const [speakingFrame, setSpeakingFrame] = useState(0)
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const listeningReturnTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleReturnTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef(state)
  
  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  // Array of speaking animation frames
  const speakingFrames = [
    '/avatars/interviewer_talk_a.png',
    '/avatars/interviewer_talk_o.png',
    '/avatars/interviewer_talk_closed.png'
  ]

  // Effect 1: Talking animation (state === 'speaking')
  // Do NOT change this - blinking must never run when speaking
  useEffect(() => {
    if (state === 'speaking') {
      const interval = setInterval(() => {
        setSpeakingFrame((prev) => {
          const nextFrame = (prev + 1) % speakingFrames.length
          setSrc(speakingFrames[nextFrame])
          return nextFrame
        })
      }, 400) // Change frame every 400ms

      // Set initial frame
      setSrc(speakingFrames[0])

      return () => clearInterval(interval)
    } else {
      // Reset to first frame when not speaking
      setSpeakingFrame(0)
    }
  }, [state, speakingFrames.length])

  // Effect 2: Listening blinking animation (state === 'listening')
  // Natural human-like blink: open eyes for 3000-4000ms, closed for 100-130ms
  useEffect(() => {
    // Clean up any existing timeouts when state changes
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current)
      listeningTimeoutRef.current = null
    }
    if (listeningReturnTimeoutRef.current) {
      clearTimeout(listeningReturnTimeoutRef.current)
      listeningReturnTimeoutRef.current = null
    }

    if (state === 'listening') {
      // Start with open eyes
      setSrc('/avatars/interviewer_idle.png')

      const scheduleBlink = () => {
        // Early return if state changed away from listening
        if (stateRef.current !== 'listening') return

        // Open eyes duration: 3000-4000ms
        const openDuration = 3000 + Math.random() * 1000

        listeningTimeoutRef.current = setTimeout(() => {
          // Early return if state changed
          if (stateRef.current !== 'listening') return

          // Show closed eyes
          setSrc('/avatars/interviewer_listen_closed.png')
          
          // Closed eyes duration: 100-130ms
          const closedDuration = 100 + Math.random() * 30
          
          listeningReturnTimeoutRef.current = setTimeout(() => {
            // Early return if state changed
            if (stateRef.current !== 'listening') return
            
            // Return to open eyes
            setSrc('/avatars/interviewer_idle.png')
            // Recursively schedule next blink
            scheduleBlink()
          }, closedDuration)
        }, openDuration)
      }

      // Start the blink cycle
      scheduleBlink()

      return () => {
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current)
          listeningTimeoutRef.current = null
        }
        if (listeningReturnTimeoutRef.current) {
          clearTimeout(listeningReturnTimeoutRef.current)
          listeningReturnTimeoutRef.current = null
        }
      }
    }
  }, [state])

  // Effect 3: Idle blinking (state === 'idle')
  // Optional slow natural blink every 5000-6000ms
  useEffect(() => {
    // Clear any existing timeouts when state changes
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
    if (idleReturnTimeoutRef.current) {
      clearTimeout(idleReturnTimeoutRef.current)
      idleReturnTimeoutRef.current = null
    }

    if (state === 'idle') {
      setSrc('/avatars/interviewer_idle.png') // Set to open eyes

      const scheduleBlink = () => {
        // Early return if state changed away from idle
        if (stateRef.current !== 'idle') return

        // Delay between blinks: 5000-6000ms
        const delay = 5000 + Math.random() * 1000

        idleTimeoutRef.current = setTimeout(() => {
          // Early return if state changed
          if (stateRef.current !== 'idle') return

          // Show closed eyes
          setSrc('/avatars/interviewer_listen_closed.png')
          
          // Closed eyes duration: 100-130ms
          const closedDuration = 100 + Math.random() * 30
          
          idleReturnTimeoutRef.current = setTimeout(() => {
            // Early return if state changed
            if (stateRef.current !== 'idle') return
            
            // Return to open eyes
            setSrc('/avatars/interviewer_idle.png')
            // Recursively schedule next blink
            scheduleBlink()
          }, closedDuration)
        }, delay)
      }

      // Start the blink cycle
      scheduleBlink()

      return () => {
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current)
          idleTimeoutRef.current = null
        }
        if (idleReturnTimeoutRef.current) {
          clearTimeout(idleReturnTimeoutRef.current)
          idleReturnTimeoutRef.current = null
        }
      }
    }
  }, [state])

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div
        className={cn(
          "relative w-32 h-32 rounded-full overflow-hidden ring-2 transition-all duration-300",
          state === 'speaking' && "ring-purple-400/80 shadow-lg animate-avatar-speaking",
          state === 'listening' && "ring-green-400/80 shadow-lg",
          state === 'idle' && "ring-slate-600/60"
        )}
      >
        <div className="w-32 h-32 mx-auto rounded-full bg-black/40 flex items-center justify-center">
          <img
            src={src}
            alt={`AI interviewer avatar (${state})`}
            className="w-24 h-24 object-contain transition-all duration-75"
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-300 text-center">
        {state === 'speaking' && "AI interviewer is asking the question…"}
        {state === 'listening' && "AI interviewer is listening to your answer…"}
        {state === 'idle' && "AI interviewer is ready for the next question."}
      </p>
    </div>
  )
}

