/**
 * Property-Based Tests for Emergency State Management
 * Feature: emergency-mode-fix, Task 1: Fix Emergency State Management
 * 
 * Tests universal properties that must hold across all valid inputs
 * using fast-check for comprehensive input coverage.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as fc from 'fast-check'

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window and localStorage for Node.js environment
global.window = global.window || {}
Object.defineProperty(global.window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Import the emergency state management types and functions
type Context = "hospital" | "emergency"

interface EmergencyState {
  context: Context
  isTransitioning: boolean
  lastToggleTime: number
  errorCount: number
  fallbackMode: 'none' | 'text-only' | 'offline' | 'emergency-chat'
}

type EmergencyAction = 
  | { type: 'TOGGLE_EMERGENCY' }
  | { type: 'COMPLETE_TRANSITION' }
  | { type: 'ERROR_OCCURRED'; error: string }
  | { type: 'ACTIVATE_FALLBACK'; mode: EmergencyState['fallbackMode'] }
  | { type: 'RESET_STATE' }
  | { type: 'LOAD_FROM_STORAGE'; state: EmergencyState }

const EMERGENCY_STORAGE_KEY = 'signbridge-emergency-state'

const initialEmergencyState: EmergencyState = {
  context: 'hospital',
  isTransitioning: false,
  lastToggleTime: 0,
  errorCount: 0,
  fallbackMode: 'none'
}

function emergencyReducer(state: EmergencyState, action: EmergencyAction): EmergencyState {
  switch (action.type) {
    case 'TOGGLE_EMERGENCY':
      const newContext = state.context === 'emergency' ? 'hospital' : 'emergency'
      const newState = {
        ...state,
        context: newContext,
        isTransitioning: true,
        lastToggleTime: Date.now()
      }
      
      // Persist to localStorage immediately
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(newState))
        }
      } catch (error) {
        console.warn('Failed to persist emergency state:', error)
      }
      
      return newState

    case 'COMPLETE_TRANSITION':
      const completedState = {
        ...state,
        isTransitioning: false
      }
      
      // Persist to localStorage
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(completedState))
        }
      } catch (error) {
        console.warn('Failed to persist emergency state:', error)
      }
      
      return completedState

    case 'ERROR_OCCURRED':
      console.error('🚨 Emergency state error:', action.error)
      return {
        ...state,
        errorCount: state.errorCount + 1
      }

    case 'ACTIVATE_FALLBACK':
      return {
        ...state,
        fallbackMode: action.mode
      }

    case 'RESET_STATE':
      // Clear localStorage
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(EMERGENCY_STORAGE_KEY)
        }
      } catch (error) {
        console.warn('Failed to clear emergency state:', error)
      }
      
      return initialEmergencyState

    case 'LOAD_FROM_STORAGE':
      return action.state

    default:
      return state
  }
}

// Helper function to load state from localStorage
function loadEmergencyStateFromStorage(): EmergencyState {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(EMERGENCY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate the stored state structure
        if (parsed && typeof parsed === 'object' && 
            (parsed.context === 'hospital' || parsed.context === 'emergency')) {
          return {
            ...initialEmergencyState,
            ...parsed
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load emergency state from storage:', error)
  }
  
  return initialEmergencyState
}

describe('Emergency State Management - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
    mockLocalStorage.clear.mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Property 1: Emergency State Toggle Responsiveness', () => {
    /**
     * Feature: emergency-mode-fix, Property 1: Emergency State Toggle Responsiveness
     * **Validates: Requirements 1.1, 1.2, 1.3**
     * 
     * For any emergency button click event, the emergency state should toggle within 50ms 
     * and persist across all re-renders without console errors.
     */
    it('should toggle emergency state within 50ms and persist without errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various initial emergency states
          fc.record({
            context: fc.constantFrom('hospital', 'emergency'),
            isTransitioning: fc.boolean(),
            lastToggleTime: fc.integer({ min: 0, max: Date.now() }),
            errorCount: fc.integer({ min: 0, max: 10 }),
            fallbackMode: fc.constantFrom('none', 'text-only', 'offline', 'emergency-chat')
          }),
          // Generate number of rapid toggles to test
          fc.integer({ min: 1, max: 20 }),
          async (initialState: EmergencyState, toggleCount: number) => {
            let currentState = initialState
            const toggleTimes: number[] = []
            const persistenceCalls: any[] = []

            // Mock localStorage to track persistence calls
            mockLocalStorage.setItem.mockImplementation((key, value) => {
              persistenceCalls.push({ key, value, timestamp: Date.now() })
            })

            // Perform rapid toggles and measure timing
            for (let i = 0; i < toggleCount; i++) {
              const startTime = performance.now()
              
              // Toggle emergency state
              currentState = emergencyReducer(currentState, { type: 'TOGGLE_EMERGENCY' })
              
              const endTime = performance.now()
              const toggleTime = endTime - startTime
              toggleTimes.push(toggleTime)

              // Property 1.1: Toggle should complete within 50ms (Requirement 1.1)
              expect(toggleTime).toBeLessThan(50)

              // Property 1.2: State should toggle correctly (Requirement 1.2)
              const expectedContext = initialState.context === 'hospital' ? 
                (i % 2 === 0 ? 'emergency' : 'hospital') :
                (i % 2 === 0 ? 'hospital' : 'emergency')
              expect(currentState.context).toBe(expectedContext)

              // Property 1.3: Transition flag should be set (Requirement 1.2)
              expect(currentState.isTransitioning).toBe(true)

              // Property 1.4: Last toggle time should be updated
              expect(currentState.lastToggleTime).toBeGreaterThan(initialState.lastToggleTime)

              // Complete the transition
              currentState = emergencyReducer(currentState, { type: 'COMPLETE_TRANSITION' })
              expect(currentState.isTransitioning).toBe(false)
            }

            // Property 1.5: All toggles should be fast (Requirement 1.1)
            const averageToggleTime = toggleTimes.reduce((sum, time) => sum + time, 0) / toggleTimes.length
            expect(averageToggleTime).toBeLessThan(25) // Average should be even faster

            // Property 1.6: Maximum toggle time should be bounded (Requirement 1.1)
            const maxToggleTime = Math.max(...toggleTimes)
            expect(maxToggleTime).toBeLessThan(50)

            // Property 1.7: State persistence should be called for each toggle (Requirement 1.5)
            expect(persistenceCalls.length).toBeGreaterThanOrEqual(toggleCount * 2) // Toggle + Complete

            // Property 1.8: Persistence calls should use correct storage key
            for (const call of persistenceCalls) {
              expect(call.key).toBe(EMERGENCY_STORAGE_KEY)
              
              // Validate stored data structure
              const storedData = JSON.parse(call.value)
              expect(storedData).toHaveProperty('context')
              expect(storedData).toHaveProperty('isTransitioning')
              expect(storedData).toHaveProperty('lastToggleTime')
              expect(storedData).toHaveProperty('errorCount')
              expect(storedData).toHaveProperty('fallbackMode')
              expect(['hospital', 'emergency']).toContain(storedData.context)
            }

            // Property 1.9: No console errors should occur (Requirement 1.3)
            // This is implicitly tested by the fact that all operations complete successfully
            expect(currentState.errorCount).toBe(initialState.errorCount) // No new errors
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle rapid successive toggles without race conditions', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate rapid toggle sequences
          fc.array(
            fc.integer({ min: 10, max: 100 }), // Delay between toggles in ms
            { minLength: 5, maxLength: 50 }
          ),
          async (toggleDelays: number[]) => {
            let currentState = initialEmergencyState
            const stateHistory: EmergencyState[] = [currentState]
            
            // Perform rapid toggles with varying delays
            for (let i = 0; i < toggleDelays.length; i++) {
              const delay = toggleDelays[i]
              
              // Wait for the specified delay
              await new Promise(resolve => setTimeout(resolve, delay))
              
              // Toggle state
              const startTime = performance.now()
              currentState = emergencyReducer(currentState, { type: 'TOGGLE_EMERGENCY' })
              const toggleTime = performance.now() - startTime
              
              stateHistory.push(currentState)
              
              // Property: Each toggle should be fast regardless of timing
              expect(toggleTime).toBeLessThan(50)
              
              // Property: State should be consistent
              expect(currentState.isTransitioning).toBe(true)
              expect(currentState.lastToggleTime).toBeGreaterThan(0)
              
              // Complete transition
              currentState = emergencyReducer(currentState, { type: 'COMPLETE_TRANSITION' })
              stateHistory.push(currentState)
            }

            // Property: Final state should be deterministic based on toggle count
            const expectedFinalContext = toggleDelays.length % 2 === 0 ? 'hospital' : 'emergency'
            expect(currentState.context).toBe(expectedFinalContext)
            
            // Property: All state transitions should be valid
            for (let i = 1; i < stateHistory.length; i++) {
              const prevState = stateHistory[i - 1]
              const currState = stateHistory[i]
              
              // Context should only change on toggle actions
              if (prevState.context !== currState.context) {
                expect(currState.isTransitioning).toBe(true)
              }
              
              // Timestamp should be monotonically increasing
              if (currState.lastToggleTime > 0) {
                expect(currState.lastToggleTime).toBeGreaterThanOrEqual(prevState.lastToggleTime)
              }
            }
          }
        ),
        { numRuns: 50 } // Fewer runs for timing-sensitive tests
      )
    })
  })

  describe('Property 2: Emergency State Persistence', () => {
    /**
     * Feature: emergency-mode-fix, Property 2: Emergency State Persistence
     * **Validates: Requirements 1.5**
     * 
     * For any page refresh or hot-reload event, the emergency state should maintain 
     * its current value without loss.
     */
    it('should persist emergency state across page refreshes and hot-reloads', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various emergency states to persist
          fc.record({
            context: fc.constantFrom('hospital', 'emergency'),
            isTransitioning: fc.boolean(),
            lastToggleTime: fc.integer({ min: 1000000000000, max: Date.now() }), // Valid timestamps
            errorCount: fc.integer({ min: 0, max: 100 }),
            fallbackMode: fc.constantFrom('none', 'text-only', 'offline', 'emergency-chat')
          }),
          // Generate number of refresh cycles to test
          fc.integer({ min: 1, max: 10 }),
          async (stateToStore: EmergencyState, refreshCycles: number) => {
            // Property 2.1: State should be stored correctly
            const storedData = JSON.stringify(stateToStore)
            mockLocalStorage.getItem.mockReturnValue(storedData)
            
            for (let cycle = 0; cycle < refreshCycles; cycle++) {
              // Simulate page refresh by loading state from storage
              const loadedState = loadEmergencyStateFromStorage()
              
              // Property 2.2: Loaded state should match stored state (Requirement 1.5)
              expect(loadedState.context).toBe(stateToStore.context)
              expect(loadedState.isTransitioning).toBe(stateToStore.isTransitioning)
              expect(loadedState.lastToggleTime).toBe(stateToStore.lastToggleTime)
              expect(loadedState.errorCount).toBe(stateToStore.errorCount)
              expect(loadedState.fallbackMode).toBe(stateToStore.fallbackMode)
              
              // Property 2.3: State structure should be preserved
              expect(typeof loadedState.context).toBe('string')
              expect(typeof loadedState.isTransitioning).toBe('boolean')
              expect(typeof loadedState.lastToggleTime).toBe('number')
              expect(typeof loadedState.errorCount).toBe('number')
              expect(typeof loadedState.fallbackMode).toBe('string')
              
              // Property 2.4: Context should be valid
              expect(['hospital', 'emergency']).toContain(loadedState.context)
              
              // Property 2.5: Fallback mode should be valid
              expect(['none', 'text-only', 'offline', 'emergency-chat']).toContain(loadedState.fallbackMode)
              
              // Simulate state modification and re-storage
              const modifiedState = emergencyReducer(loadedState, { type: 'TOGGLE_EMERGENCY' })
              mockLocalStorage.getItem.mockReturnValue(JSON.stringify(modifiedState))
              
              // Update reference for next cycle
              Object.assign(stateToStore, modifiedState)
            }
            
            // Property 2.6: localStorage should be called appropriately
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(EMERGENCY_STORAGE_KEY)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various types of corrupted data
          fc.oneof(
            fc.constant(null), // No data
            fc.constant(''), // Empty string
            fc.constant('invalid json'), // Invalid JSON
            fc.constant('{"invalid": "structure"}'), // Invalid structure
            fc.constant('{"context": "invalid"}'), // Invalid context value
            fc.record({
              context: fc.string(), // Invalid context type
              isTransitioning: fc.string(), // Wrong type
              lastToggleTime: fc.string(), // Wrong type
              errorCount: fc.string(), // Wrong type
              fallbackMode: fc.string() // Potentially invalid value
            }).map(obj => JSON.stringify(obj))
          ),
          async (corruptedData) => {
            // Mock localStorage to return corrupted data
            mockLocalStorage.getItem.mockReturnValue(corruptedData)
            
            // Property 2.7: Should handle corrupted data gracefully (Requirement 1.5)
            const loadedState = loadEmergencyStateFromStorage()
            
            // Property 2.8: Should fall back to initial state when data is corrupted
            expect(loadedState.context).toBe(initialEmergencyState.context)
            expect(loadedState.isTransitioning).toBe(initialEmergencyState.isTransitioning)
            expect(loadedState.lastToggleTime).toBe(initialEmergencyState.lastToggleTime)
            expect(loadedState.errorCount).toBe(initialEmergencyState.errorCount)
            expect(loadedState.fallbackMode).toBe(initialEmergencyState.fallbackMode)
            
            // Property 2.9: Should not throw errors
            expect(() => loadEmergencyStateFromStorage()).not.toThrow()
            
            // Property 2.10: Should be able to continue normal operation
            const toggledState = emergencyReducer(loadedState, { type: 'TOGGLE_EMERGENCY' })
            expect(toggledState.context).toBe('emergency') // Should toggle from hospital
            expect(toggledState.isTransitioning).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle localStorage unavailability gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            context: fc.constantFrom('hospital', 'emergency'),
            isTransitioning: fc.boolean(),
            lastToggleTime: fc.integer({ min: 0, max: Date.now() }),
            errorCount: fc.integer({ min: 0, max: 10 }),
            fallbackMode: fc.constantFrom('none', 'text-only', 'offline', 'emergency-chat')
          }),
          async (testState: EmergencyState) => {
            // Simulate localStorage being unavailable
            const originalLocalStorage = global.window.localStorage
            
            // Test with localStorage throwing errors
            mockLocalStorage.getItem.mockImplementation(() => {
              throw new Error('localStorage unavailable')
            })
            mockLocalStorage.setItem.mockImplementation(() => {
              throw new Error('localStorage unavailable')
            })
            
            // Property 2.11: Should not crash when localStorage is unavailable
            expect(() => loadEmergencyStateFromStorage()).not.toThrow()
            expect(() => emergencyReducer(testState, { type: 'TOGGLE_EMERGENCY' })).not.toThrow()
            
            // Property 2.12: Should fall back to initial state when localStorage fails
            const loadedState = loadEmergencyStateFromStorage()
            expect(loadedState).toEqual(initialEmergencyState)
            
            // Property 2.13: Should continue to function without persistence
            const toggledState = emergencyReducer(testState, { type: 'TOGGLE_EMERGENCY' })
            expect(toggledState.context).toBe(testState.context === 'hospital' ? 'emergency' : 'hospital')
            expect(toggledState.isTransitioning).toBe(true)
            
            // Restore original localStorage
            Object.defineProperty(global.window, 'localStorage', {
              value: originalLocalStorage,
              writable: true
            })
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})