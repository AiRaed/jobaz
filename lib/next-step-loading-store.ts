import { create } from 'zustand'

interface NextStepLoadingStore {
  // Loading state
  nextStepLoading: boolean
  nextStepLoadingCount: number
  
  // Track in-flight requests to prevent double-trigger
  inFlightRequests: Set<string>
  
  // Actions
  startLoading: (requestId: string) => void
  stopLoading: (requestId: string) => void
  clearAll: () => void
}

export const useNextStepLoadingStore = create<NextStepLoadingStore>((set, get) => ({
  nextStepLoading: false,
  nextStepLoadingCount: 0,
  inFlightRequests: new Set<string>(),
  
  startLoading: (requestId: string) => {
    const state = get()
    
    // Prevent double-trigger: if request already in flight, ignore
    if (state.inFlightRequests.has(requestId)) {
      return
    }
    
    // Add to in-flight set
    const newInFlight = new Set(state.inFlightRequests)
    newInFlight.add(requestId)
    
    // Increment counter and set loading to true
    set({
      inFlightRequests: newInFlight,
      nextStepLoadingCount: state.nextStepLoadingCount + 1,
      nextStepLoading: true,
    })
  },
  
  stopLoading: (requestId: string) => {
    const state = get()
    
    // Remove from in-flight set
    const newInFlight = new Set(state.inFlightRequests)
    newInFlight.delete(requestId)
    
    // Decrement counter
    const newCount = Math.max(0, state.nextStepLoadingCount - 1)
    
    // Only set loading to false if counter reaches 0
    set({
      inFlightRequests: newInFlight,
      nextStepLoadingCount: newCount,
      nextStepLoading: newCount > 0,
    })
  },
  
  clearAll: () => {
    set({
      nextStepLoading: false,
      nextStepLoadingCount: 0,
      inFlightRequests: new Set<string>(),
    })
  },
}))

// Helper to generate unique request ID
export function generateRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

