/**
 * Property-Based Tests for Error Recovery System
 * Feature: phase-2-enhancement
 * 
 * Tests universal properties that must hold across all valid inputs
 * using fast-check for comprehensive input coverage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { 
  ErrorRecoverySystem, 
  type SystemError, 
  type ErrorContext, 
  type SystemComponent,
  type ErrorSeverity,
  type Operation,
  type CriticalFailure
} from '../errorRecovery'

describe('Error Recovery System - Property Tests', () => {
  let errorSystem: ErrorRecoverySystem

  beforeEach(() => {
    errorSystem = new ErrorRecoverySystem()
    // Clear any existing state
    vi.clearAllMocks()
  })

  describe('Property 6: Error Recovery Fallback Chain', () => {
    /**
     * Feature: phase-2-enhancement, Property 6: Error Recovery Fallback Chain
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**
     * 
     * For any system component failure, the error recovery system should engage 
     * appropriate fallbacks within the retry limit (3 attempts) before degrading 
     * gracefully to the next available mode.
     */
    it('should always provide a fallback within retry limit for any component failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random system errors
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            component: fc.constantFrom(
              'speech-recognition', 'sign-recognition', 'ai-mediation', 
              'avatar-rendering', 'text-to-speech', 'camera', 'microphone'
            ) as fc.Arbitrary<SystemComponent>,
            severity: fc.constantFrom('warning', 'minor', 'major', 'critical') as fc.Arbitrary<ErrorSeverity>,
            message: fc.string({ minLength: 10, maxLength: 100 }),
            timestamp: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
            retryCount: fc.integer({ min: 0, max: 5 })
          }),
          // Generate random error contexts
          fc.record({
            mode: fc.constantFrom('hearing-to-deaf', 'deaf-to-hearing'),
            context: fc.constantFrom('hospital', 'emergency'),
            isEmergencyMode: fc.boolean(),
            userPresent: fc.boolean(),
            criticalCommunication: fc.boolean()
          }),
          async (error: SystemError, context: ErrorContext) => {
            // The system should ALWAYS provide a recovery action
            const recoveryAction = await errorSystem.handleError(error, context)
            
            // Recovery action should be well-formed
            expect(recoveryAction).toBeDefined()
            expect(recoveryAction.type).toBeDefined()
            expect(['retry', 'alternative-method', 'degraded-functionality', 'manual-input', 'text-only', 'emergency-bypass'])
              .toContain(recoveryAction.type)
            expect(recoveryAction.description).toBeDefined()
            expect(recoveryAction.description.length).toBeGreaterThan(0)
            expect(recoveryAction.estimatedRecoveryTime).toBeGreaterThanOrEqual(0)
            
            // Emergency mode should prioritize speed (faster recovery times)
            if (context.isEmergencyMode) {
              expect(recoveryAction.estimatedRecoveryTime).toBeLessThanOrEqual(5000) // Max 5 seconds in emergency
            }
            
            // Critical errors should trigger audio alerts
            if (error.severity === 'critical') {
              expect(recoveryAction.audioAlert).toBe(true)
            }
            
            // System should maintain error history
            const errorHistory = errorSystem.getErrorHistory()
            expect(errorHistory.length).toBeGreaterThan(0)
            
            // Most recent error should match our input
            const latestError = errorHistory[errorHistory.length - 1]
            expect(latestError.error.component).toBe(error.component)
            expect(latestError.error.severity).toBe(error.severity)
            expect(latestError.context).toEqual(context)
            
            // System health should reflect the error
            const health = errorSystem.getSystemHealth()
            expect(health.components[error.component]).toBeDefined()
            
            // Critical and major errors should degrade component health
            if (error.severity === 'critical') {
              expect(health.components[error.component]).toBe('failed')
            } else if (error.severity === 'major') {
              expect(health.components[error.component]).toBe('degraded')
            }
            
            // Overall system health should reflect component states
            expect(['healthy', 'degraded', 'critical', 'offline']).toContain(health.overall)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should respect retry limits and escalate to fallbacks appropriately', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate operations that might fail
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 }),
            component: fc.constantFrom(
              'speech-recognition', 'sign-recognition', 'ai-mediation', 
              'avatar-rendering', 'text-to-speech'
            ) as fc.Arbitrary<SystemComponent>,
            action: fc.string({ minLength: 5, maxLength: 20 }),
            timeout: fc.integer({ min: 1000, max: 10000 })
          }),
          fc.integer({ min: 1, max: 5 }), // maxRetries
          fc.float({ min: 0, max: 1 }), // failureRate (0 = always succeed, 1 = always fail)
          async (operationConfig: Omit<Operation, 'execute'>, maxRetries: number, failureRate: number) => {
            let attemptCount = 0
            
            const operation: Operation = {
              ...operationConfig,
              execute: async () => {
                attemptCount++
                if (Math.random() < failureRate) {
                  throw new Error(`Simulated failure on attempt ${attemptCount}`)
                }
                return { success: true, attempt: attemptCount }
              }
            }
            
            const result = await errorSystem.retryOperation(operation, maxRetries)
            
            // Result should always be defined
            expect(result).toBeDefined()
            expect(typeof result.success).toBe('boolean')
            
            if (result.success) {
              // Successful operations should have data
              expect(result.data).toBeDefined()
              expect(result.error).toBeUndefined()
              
              // Should not exceed retry limit
              expect(attemptCount).toBeLessThanOrEqual(maxRetries)
            } else {
              // Failed operations should have error details
              expect(result.error).toBeDefined()
              expect(result.error!.component).toBe(operation.component)
              expect(result.error!.severity).toBeDefined()
              
              // Should have attempted up to maxRetries
              if (failureRate === 1) { // Always fails
                expect(attemptCount).toBe(maxRetries)
                expect(result.error!.retryCount).toBe(maxRetries)
              }
              
              // Error should indicate retry limit exceeded if applicable
              if (attemptCount >= maxRetries) {
                expect(result.error!.message).toContain('Maximum retry attempts')
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle cascading failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate critical failures that might cascade
          fc.record({
            component: fc.constantFrom(
              'speech-recognition', 'sign-recognition', 'ai-mediation', 'avatar-rendering'
            ) as fc.Arbitrary<SystemComponent>,
            errors: fc.array(
              fc.record({
                id: fc.string({ minLength: 5, maxLength: 15 }),
                component: fc.constantFrom(
                  'speech-recognition', 'sign-recognition', 'ai-mediation', 'avatar-rendering'
                ) as fc.Arbitrary<SystemComponent>,
                severity: fc.constantFrom('major', 'critical') as fc.Arbitrary<ErrorSeverity>,
                message: fc.string({ minLength: 10, maxLength: 50 }),
                timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() })
              }),
              { minLength: 1, maxLength: 3 }
            ),
            cascadingFailures: fc.array(
              fc.constantFrom(
                'speech-recognition', 'sign-recognition', 'ai-mediation', 'avatar-rendering'
              ) as fc.Arbitrary<SystemComponent>,
              { minLength: 0, maxLength: 2 }
            ),
            totalDowntime: fc.integer({ min: 0, max: 300000 }), // Up to 5 minutes
            patientSafetyImpact: fc.boolean(),
            emergencyProtocolTriggered: fc.boolean(),
            manualInterventionRequired: fc.boolean()
          }),
          async (criticalFailure: CriticalFailure) => {
            // System should handle critical failures without throwing
            await expect(errorSystem.handleCriticalFailure(criticalFailure)).resolves.not.toThrow()
            
            // System health should reflect the critical state
            const health = errorSystem.getSystemHealth()
            expect(health.overall).toBe('critical')
            
            // Failed component should be marked as failed
            expect(health.components[criticalFailure.component]).toBe('failed')
            
            // Error history should contain the failure
            const errorHistory = errorSystem.getErrorHistory()
            expect(errorHistory.length).toBeGreaterThan(0)
            
            // Should have active errors
            expect(health.activeErrors.length).toBeGreaterThan(0)
            
            // Should have recovery actions
            expect(health.recoveryActions.length).toBeGreaterThan(0)
            
            // Patient safety impact should trigger appropriate protocols
            if (criticalFailure.patientSafetyImpact) {
              // Should have triggered emergency protocols
              expect(criticalFailure.emergencyProtocolTriggered).toBe(true)
            }
            
            // Manual intervention should be clearly indicated
            if (criticalFailure.manualInterventionRequired) {
              const latestRecoveryAction = health.recoveryActions[health.recoveryActions.length - 1]
              expect(latestRecoveryAction.userNotification).toBeDefined()
              expect(latestRecoveryAction.audioAlert).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 7: Emergency Mode Speed Prioritization', () => {
    /**
     * Feature: phase-2-enhancement, Property 7: Emergency Mode Speed Prioritization
     * **Validates: Requirements 3.7**
     * 
     * For any input processed in emergency mode, the system should complete processing 
     * faster than normal mode by skipping non-critical steps, even if accuracy is reduced.
     */
    it('should prioritize speed over accuracy in emergency mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate error scenarios
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            component: fc.constantFrom(
              'speech-recognition', 'sign-recognition', 'ai-mediation', 'avatar-rendering'
            ) as fc.Arbitrary<SystemComponent>,
            severity: fc.constantFrom('minor', 'major', 'critical') as fc.Arbitrary<ErrorSeverity>,
            message: fc.string({ minLength: 10, maxLength: 100 }),
            timestamp: fc.integer({ min: Date.now() - 86400000, max: Date.now() })
          }),
          // Generate contexts with and without emergency mode
          fc.boolean(), // isEmergencyMode
          async (error: SystemError, isEmergencyMode: boolean) => {
            const normalContext: ErrorContext = {
              mode: 'hearing-to-deaf',
              context: 'hospital',
              isEmergencyMode: false,
              userPresent: true,
              criticalCommunication: false
            }
            
            const emergencyContext: ErrorContext = {
              mode: 'hearing-to-deaf',
              context: 'emergency',
              isEmergencyMode: true,
              userPresent: true,
              criticalCommunication: true
            }
            
            const context = isEmergencyMode ? emergencyContext : normalContext
            
            // Measure recovery time
            const startTime = Date.now()
            const recoveryAction = await errorSystem.handleError(error, context)
            const actualRecoveryTime = Date.now() - startTime
            
            // Recovery action should be appropriate for the mode
            expect(recoveryAction).toBeDefined()
            expect(recoveryAction.estimatedRecoveryTime).toBeGreaterThanOrEqual(0)
            
            if (isEmergencyMode) {
              // Emergency mode should prioritize speed
              expect(recoveryAction.estimatedRecoveryTime).toBeLessThanOrEqual(5000) // Max 5 seconds
              
              // Should prefer faster fallback types
              const speedPriorityTypes = ['emergency-bypass', 'text-only', 'manual-input']
              if (error.severity === 'critical' || error.severity === 'major') {
                expect(speedPriorityTypes).toContain(recoveryAction.type)
              }
              
              // Should have immediate user notification
              expect(recoveryAction.userNotification).toBeDefined()
              
              // Critical errors in emergency mode should trigger audio alerts
              if (error.severity === 'critical') {
                expect(recoveryAction.audioAlert).toBe(true)
              }
            } else {
              // Normal mode can take more time for better accuracy
              expect(recoveryAction.estimatedRecoveryTime).toBeLessThanOrEqual(10000) // Max 10 seconds
              
              // May use more thorough recovery methods
              const accuracyPriorityTypes = ['retry', 'alternative-method', 'degraded-functionality']
              if (error.severity === 'minor' || error.severity === 'warning') {
                // Minor errors in normal mode should prefer retry/alternative methods
                expect([...accuracyPriorityTypes, 'manual-input', 'text-only']).toContain(recoveryAction.type)
              }
            }
            
            // Actual recovery time should be reasonable
            expect(actualRecoveryTime).toBeLessThanOrEqual(1000) // Should complete within 1 second for testing
            
            // System should maintain consistent behavior regardless of mode
            const health = errorSystem.getSystemHealth()
            expect(health).toBeDefined()
            expect(health.components[error.component]).toBeDefined()
            
            // Error should be logged consistently
            const errorHistory = errorSystem.getErrorHistory()
            expect(errorHistory.length).toBeGreaterThan(0)
            const latestLog = errorHistory[errorHistory.length - 1]
            expect(latestLog.context.isEmergencyMode).toBe(isEmergencyMode)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain minimum functionality even under severe failures in emergency mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate severe failure scenarios
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 15 }),
              component: fc.constantFrom(
                'speech-recognition', 'sign-recognition', 'ai-mediation', 'avatar-rendering'
              ) as fc.Arbitrary<SystemComponent>,
              severity: fc.constantFrom('major', 'critical') as fc.Arbitrary<ErrorSeverity>,
              message: fc.string({ minLength: 10, maxLength: 50 }),
              timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() })
            }),
            { minLength: 2, maxLength: 4 } // Multiple simultaneous failures
          ),
          async (errors: SystemError[]) => {
            const emergencyContext: ErrorContext = {
              mode: 'hearing-to-deaf',
              context: 'emergency',
              isEmergencyMode: true,
              userPresent: true,
              criticalCommunication: true
            }
            
            // Process all errors in emergency mode
            const recoveryActions = []
            for (const error of errors) {
              const action = await errorSystem.handleError(error, emergencyContext)
              recoveryActions.push(action)
            }
            
            // Should have recovery actions for all errors
            expect(recoveryActions.length).toBe(errors.length)
            
            // All recovery actions should prioritize speed
            recoveryActions.forEach(action => {
              expect(action.estimatedRecoveryTime).toBeLessThanOrEqual(5000)
              expect(action.type).toBeDefined()
              expect(action.description).toBeDefined()
            })
            
            // System should still be functional (not completely offline)
            const health = errorSystem.getSystemHealth()
            expect(health.overall).not.toBe('offline')
            
            // Should have at least one operational or degraded component
            const componentStates = Object.values(health.components)
            const functionalComponents = componentStates.filter(state => 
              state === 'operational' || state === 'degraded'
            )
            expect(functionalComponents.length).toBeGreaterThan(0)
            
            // Should maintain error history for analysis
            const errorHistory = errorSystem.getErrorHistory()
            expect(errorHistory.length).toBeGreaterThanOrEqual(errors.length)
            
            // All logged errors should be in emergency context
            const recentLogs = errorHistory.slice(-errors.length)
            recentLogs.forEach(log => {
              expect(log.context.isEmergencyMode).toBe(true)
              expect(log.context.context).toBe('emergency')
            })
          }
        ),
        { numRuns: 50 } // Fewer runs for complex scenarios
      )
    })
  })
})