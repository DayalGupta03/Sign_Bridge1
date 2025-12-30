/**
 * Integration Tests for Error Handler
 * Feature: phase-2-enhancement
 * 
 * Tests the integration between the error recovery system and SignBridge components.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { signBridgeErrorHandler, handlePipelineError, handleSpeechError } from '../errorHandler'

describe('Error Handler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Pipeline Error Integration', () => {
    it('should handle pipeline errors and integrate with recovery system', async () => {
      const testError = new Error('Test pipeline failure')
      
      // Should not throw
      await expect(handlePipelineError(
        'understand',
        testError,
        'hearing-to-deaf',
        'emergency'
      )).resolves.not.toThrow()
      
      // Emergency mode should be activated for emergency context
      expect(signBridgeErrorHandler.isEmergencyModeActive()).toBe(true)
    })

    it('should handle speech recognition errors', async () => {
      const testError = new Error('Microphone permission denied')
      
      await expect(handleSpeechError(
        testError,
        'hearing-to-deaf',
        'hospital'
      )).resolves.not.toThrow()
    })
  })

  describe('Emergency Mode Management', () => {
    it('should activate emergency mode for critical errors', async () => {
      const criticalError = new Error('Critical system failure')
      
      await handlePipelineError(
        'understand',
        criticalError,
        'hearing-to-deaf',
        'emergency'
      )
      
      expect(signBridgeErrorHandler.isEmergencyModeActive()).toBe(true)
    })

    it('should deactivate emergency mode when requested', async () => {
      // First activate emergency mode
      await handlePipelineError(
        'understand',
        new Error('Critical error'),
        'hearing-to-deaf',
        'emergency'
      )
      
      expect(signBridgeErrorHandler.isEmergencyModeActive()).toBe(true)
      
      // Then deactivate
      await signBridgeErrorHandler.deactivateEmergencyMode()
      
      expect(signBridgeErrorHandler.isEmergencyModeActive()).toBe(false)
    })
  })
})