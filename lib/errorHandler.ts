/**
 * SIGNBRIDGE 3D - ERROR HANDLER INTEGRATION
 * 
 * This module integrates the error recovery system with the existing AI pipeline
 * and application components. It provides a bridge between the generic error
 * recovery system and the specific SignBridge 3D components.
 * 
 * INTEGRATION POINTS:
 * - AI Pipeline Controller error handling
 * - Speech recognition failures
 * - Sign recognition failures  
 * - Avatar rendering failures
 * - Emergency mode activation
 */

import { errorRecoverySystem, type SystemError, type ErrorContext, type SystemComponent } from './errorRecovery'
import { type MediationMode, type MediationContext } from './mediator'

// ============================================================================
// SIGNBRIDGE-SPECIFIC ERROR TYPES
// ============================================================================

export interface SignBridgeError extends SystemError {
  userFacing: boolean
  recoverable: boolean
  emergencyImpact: boolean
}

export interface SignBridgeErrorContext extends ErrorContext {
  mediationMode: MediationMode
  mediationContext: MediationContext
  activeUsers: number
  systemLoad: number
}

// ============================================================================
// ERROR HANDLER CLASS
// ============================================================================

export class SignBridgeErrorHandler {
  private emergencyModeActive: boolean = false
  private errorCount: number = 0
  private lastErrorTime: number = 0

  constructor() {
    // Register SignBridge-specific fallback strategies
    this.registerSignBridgeFallbacks()
  }

  // ========================================================================
  // MAIN ERROR HANDLING ENTRY POINT
  // ========================================================================

  async handleSignBridgeError(
    component: SystemComponent,
    error: Error,
    context: SignBridgeErrorContext
  ): Promise<void> {
    // Create system error from JavaScript error
    const systemError: SignBridgeError = {
      id: `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      component,
      severity: this.determineSeverity(error, context),
      message: error.message,
      timestamp: Date.now(),
      userFacing: this.isUserFacingError(component, error),
      recoverable: this.isRecoverableError(component, error),
      emergencyImpact: this.hasEmergencyImpact(error, context)
    }

    // Update error tracking
    this.updateErrorTracking(systemError)

    // Check if we should activate emergency mode
    if (this.shouldActivateEmergencyMode(systemError, context)) {
      await this.activateEmergencyMode(context)
    }

    // Delegate to error recovery system
    const recoveryAction = await errorRecoverySystem.handleError(systemError, context)

    // Execute SignBridge-specific recovery actions
    await this.executeRecoveryAction(recoveryAction, systemError, context)
  }

  // ========================================================================
  // PIPELINE INTEGRATION
  // ========================================================================

  /**
   * Handle AI Pipeline Controller errors
   */
  async handlePipelineError(
    stage: 'ingest' | 'understand' | 'generate' | 'deliver',
    error: Error,
    context: SignBridgeErrorContext
  ): Promise<void> {
    const component = this.mapPipelineStageToComponent(stage)
    await this.handleSignBridgeError(component, error, context)
  }

  /**
   * Handle Speech Recognition errors
   */
  async handleSpeechRecognitionError(
    error: Error,
    context: SignBridgeErrorContext
  ): Promise<void> {
    await this.handleSignBridgeError('speech-recognition', error, context)
  }

  /**
   * Handle Sign Recognition errors
   */
  async handleSignRecognitionError(
    error: Error,
    context: SignBridgeErrorContext
  ): Promise<void> {
    await this.handleSignBridgeError('sign-recognition', error, context)
  }

  /**
   * Handle Avatar Rendering errors
   */
  async handleAvatarRenderingError(
    error: Error,
    context: SignBridgeErrorContext
  ): Promise<void> {
    await this.handleSignBridgeError('avatar-rendering', error, context)
  }

  // ========================================================================
  // EMERGENCY MODE MANAGEMENT
  // ========================================================================

  async activateEmergencyMode(context: SignBridgeErrorContext): Promise<void> {
    if (this.emergencyModeActive) return

    console.log('🚨 ACTIVATING EMERGENCY MODE')
    this.emergencyModeActive = true

    // Trigger audio alert
    this.triggerEmergencyAlert()

    // Notify UI components
    this.notifyEmergencyModeActivation(context)

    // Switch to emergency processing mode
    await this.switchToEmergencyProcessing(context)
  }

  async deactivateEmergencyMode(): Promise<void> {
    if (!this.emergencyModeActive) return

    console.log('✅ DEACTIVATING EMERGENCY MODE')
    this.emergencyModeActive = false

    // Reset error tracking
    this.errorCount = 0
    this.lastErrorTime = 0

    // Notify UI components
    this.notifyEmergencyModeDeactivation()
  }

  isEmergencyModeActive(): boolean {
    return this.emergencyModeActive
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  private registerSignBridgeFallbacks(): void {
    // Speech Recognition Fallbacks
    errorRecoverySystem.registerFallback('speech-recognition', async (error, context) => {
      if (context.isEmergencyMode) {
        return {
          type: 'manual-input',
          description: 'Emergency: Switch to manual text input immediately',
          estimatedRecoveryTime: 0,
          userNotification: 'Speech recognition failed. Please type your message.',
          audioAlert: true
        }
      } else {
        return {
          type: 'retry',
          description: 'Retry speech recognition with adjusted settings',
          estimatedRecoveryTime: 2000,
          userNotification: 'Adjusting microphone settings...',
          audioAlert: false
        }
      }
    })

    // Sign Recognition Fallbacks
    errorRecoverySystem.registerFallback('sign-recognition', async (error, context) => {
      if (context.isEmergencyMode) {
        return {
          type: 'manual-input',
          description: 'Emergency: Switch to gesture prompts',
          estimatedRecoveryTime: 0,
          userNotification: 'Sign recognition failed. Please use clear gestures or type.',
          audioAlert: true
        }
      } else {
        return {
          type: 'alternative-method',
          description: 'Use gesture confidence scoring and user feedback',
          estimatedRecoveryTime: 3000,
          userNotification: 'Having trouble recognizing signs. Please repeat clearly.',
          audioAlert: false
        }
      }
    })

    // AI Mediation Fallbacks
    errorRecoverySystem.registerFallback('ai-mediation', async (error, context) => {
      if (context.isEmergencyMode) {
        return {
          type: 'emergency-bypass',
          description: 'Emergency: Direct pass-through without AI processing',
          estimatedRecoveryTime: 0,
          userNotification: 'Using direct communication mode.',
          audioAlert: false
        }
      } else {
        return {
          type: 'degraded-functionality',
          description: 'Use basic text processing without AI enhancement',
          estimatedRecoveryTime: 1000,
          userNotification: 'AI processing temporarily unavailable.',
          audioAlert: false
        }
      }
    })

    // Avatar Rendering Fallbacks
    errorRecoverySystem.registerFallback('avatar-rendering', async (error, context) => {
      if (context.isEmergencyMode) {
        return {
          type: 'text-only',
          description: 'Emergency: Text-only display with large fonts',
          estimatedRecoveryTime: 0,
          userNotification: 'Avatar unavailable. Using text display.',
          audioAlert: false
        }
      } else {
        return {
          type: 'alternative-method',
          description: 'Fall back to pre-recorded video signs',
          estimatedRecoveryTime: 2000,
          userNotification: 'Switching to video signs...',
          audioAlert: false
        }
      }
    })
  }

  private determineSeverity(error: Error, context: SignBridgeErrorContext): 'warning' | 'minor' | 'major' | 'critical' {
    // Critical: Patient safety impact or complete system failure
    if (context.emergencyImpact || error.message.includes('critical') || error.message.includes('safety')) {
      return 'critical'
    }

    // Major: Core functionality impacted
    if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('permission')) {
      return 'major'
    }

    // Minor: Degraded functionality but system still works
    if (error.message.includes('warning') || error.message.includes('fallback')) {
      return 'minor'
    }

    // Default to minor for unknown errors
    return 'minor'
  }

  private isUserFacingError(component: SystemComponent, error: Error): boolean {
    // Errors that directly impact user experience
    const userFacingComponents: SystemComponent[] = [
      'speech-recognition', 'sign-recognition', 'avatar-rendering', 'camera', 'microphone'
    ]
    return userFacingComponents.includes(component)
  }

  private isRecoverableError(component: SystemComponent, error: Error): boolean {
    // Most errors are recoverable except for hardware failures
    return !error.message.includes('hardware') && !error.message.includes('permission denied')
  }

  private hasEmergencyImpact(error: Error, context: SignBridgeErrorContext): boolean {
    return context.mediationContext === 'emergency' || 
           context.criticalCommunication ||
           error.message.includes('emergency') ||
           error.message.includes('critical')
  }

  private updateErrorTracking(error: SignBridgeError): void {
    this.errorCount++
    this.lastErrorTime = Date.now()

    // Reset count if errors are spread out over time (more than 5 minutes)
    if (this.lastErrorTime - this.lastErrorTime > 300000) {
      this.errorCount = 1
    }
  }

  private shouldActivateEmergencyMode(error: SignBridgeError, context: SignBridgeErrorContext): boolean {
    // Already in emergency mode
    if (this.emergencyModeActive) return false

    // Critical errors always trigger emergency mode
    if (error.severity === 'critical') return true

    // Emergency context always triggers emergency mode
    if (context.mediationContext === 'emergency') return true

    // Emergency context with major errors
    if (context.mediationContext === 'emergency' && error.severity === 'major') return true

    // Multiple errors in short time period
    if (this.errorCount >= 3 && (Date.now() - this.lastErrorTime) < 60000) return true

    return false
  }

  private mapPipelineStageToComponent(stage: string): SystemComponent {
    switch (stage) {
      case 'ingest': return 'speech-recognition'
      case 'understand': return 'ai-mediation'
      case 'generate': return 'ai-mediation'
      case 'deliver': return 'avatar-rendering'
      default: return 'ai-mediation'
    }
  }

  private async executeRecoveryAction(
    recoveryAction: any,
    error: SignBridgeError,
    context: SignBridgeErrorContext
  ): Promise<void> {
    console.log(`🔧 Executing recovery action: ${recoveryAction.type}`)

    switch (recoveryAction.type) {
      case 'manual-input':
        await this.enableManualInput(context)
        break
      case 'text-only':
        await this.enableTextOnlyMode(context)
        break
      case 'emergency-bypass':
        await this.enableEmergencyBypass(context)
        break
      case 'alternative-method':
        await this.enableAlternativeMethod(error.component, context)
        break
      case 'retry':
        await this.scheduleRetry(error, context)
        break
    }

    // Show user notification if provided
    if (recoveryAction.userNotification) {
      this.showUserNotification(recoveryAction.userNotification, recoveryAction.audioAlert)
    }
  }

  private triggerEmergencyAlert(): void {
    console.log('🔊 EMERGENCY ALERT TRIGGERED')
    
    // Audio alert
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Emergency mode activated. System switching to basic communication.')
      utterance.rate = 1.0
      utterance.volume = 0.9
      utterance.pitch = 1.2
      window.speechSynthesis.speak(utterance)
    }
  }

  private notifyEmergencyModeActivation(context: SignBridgeErrorContext): void {
    // In a real implementation, this would notify UI components
    console.log('📢 Notifying UI: Emergency mode activated')
    
    // Dispatch custom event for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('signbridge:emergency-mode', {
        detail: { active: true, context }
      }))
    }
  }

  private notifyEmergencyModeDeactivation(): void {
    console.log('📢 Notifying UI: Emergency mode deactivated')
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('signbridge:emergency-mode', {
        detail: { active: false }
      }))
    }
  }

  private async switchToEmergencyProcessing(context: SignBridgeErrorContext): Promise<void> {
    console.log('⚡ Switching to emergency processing mode')
    // In a real implementation, this would:
    // - Reduce AI processing complexity
    // - Skip non-essential validation
    // - Prioritize speed over accuracy
    // - Enable direct pass-through modes
  }

  private async enableManualInput(context: SignBridgeErrorContext): Promise<void> {
    console.log('📝 Enabling manual input fallback')
    // Show manual input UI elements
  }

  private async enableTextOnlyMode(context: SignBridgeErrorContext): Promise<void> {
    console.log('📄 Enabling text-only mode')
    // Hide avatar, show large text display
  }

  private async enableEmergencyBypass(context: SignBridgeErrorContext): Promise<void> {
    console.log('🚨 Enabling emergency bypass mode')
    // Skip AI processing, use direct pass-through
  }

  private async enableAlternativeMethod(component: SystemComponent, context: SignBridgeErrorContext): Promise<void> {
    console.log(`🔄 Enabling alternative method for ${component}`)
    // Component-specific alternative methods
  }

  private async scheduleRetry(error: SignBridgeError, context: SignBridgeErrorContext): Promise<void> {
    console.log(`🔄 Scheduling retry for ${error.component}`)
    // Schedule retry with exponential backoff
  }

  private showUserNotification(message: string, audioAlert: boolean = false): void {
    console.log(`📢 User notification: ${message}`)
    
    if (audioAlert && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.rate = 1.0
      utterance.volume = 0.7
      window.speechSynthesis.speak(utterance)
    }

    // In a real implementation, this would show toast notifications or modal dialogs
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const signBridgeErrorHandler = new SignBridgeErrorHandler()

// ============================================================================
// CONVENIENCE FUNCTIONS FOR INTEGRATION
// ============================================================================

/**
 * Handle errors from the AI Pipeline Controller
 */
export async function handlePipelineError(
  stage: 'ingest' | 'understand' | 'generate' | 'deliver',
  error: Error,
  mode: MediationMode,
  context: MediationContext
): Promise<void> {
  const errorContext: SignBridgeErrorContext = {
    mode: mode === 'hearing-to-deaf' ? 'hearing-to-deaf' : 'deaf-to-hearing',
    context: context === 'emergency' ? 'emergency' : 'hospital',
    isEmergencyMode: signBridgeErrorHandler.isEmergencyModeActive(),
    userPresent: true,
    criticalCommunication: context === 'emergency',
    mediationMode: mode,
    mediationContext: context,
    activeUsers: 1,
    systemLoad: 0.5
  }

  await signBridgeErrorHandler.handlePipelineError(stage, error, errorContext)
}

/**
 * Handle speech recognition errors
 */
export async function handleSpeechError(
  error: Error,
  mode: MediationMode,
  context: MediationContext
): Promise<void> {
  const errorContext: SignBridgeErrorContext = {
    mode: mode === 'hearing-to-deaf' ? 'hearing-to-deaf' : 'deaf-to-hearing',
    context: context === 'emergency' ? 'emergency' : 'hospital',
    isEmergencyMode: signBridgeErrorHandler.isEmergencyModeActive(),
    userPresent: true,
    criticalCommunication: context === 'emergency',
    mediationMode: mode,
    mediationContext: context,
    activeUsers: 1,
    systemLoad: 0.5
  }

  await signBridgeErrorHandler.handleSpeechRecognitionError(error, errorContext)
}

/**
 * Handle sign recognition errors
 */
export async function handleSignError(
  error: Error,
  mode: MediationMode,
  context: MediationContext
): Promise<void> {
  const errorContext: SignBridgeErrorContext = {
    mode: mode === 'hearing-to-deaf' ? 'hearing-to-deaf' : 'deaf-to-hearing',
    context: context === 'emergency' ? 'emergency' : 'hospital',
    isEmergencyMode: signBridgeErrorHandler.isEmergencyModeActive(),
    userPresent: true,
    criticalCommunication: context === 'emergency',
    mediationMode: mode,
    mediationContext: context,
    activeUsers: 1,
    systemLoad: 0.5
  }

  await signBridgeErrorHandler.handleSignRecognitionError(error, errorContext)
}

/**
 * Handle avatar rendering errors
 */
export async function handleAvatarError(
  error: Error,
  mode: MediationMode,
  context: MediationContext
): Promise<void> {
  const errorContext: SignBridgeErrorContext = {
    mode: mode === 'hearing-to-deaf' ? 'hearing-to-deaf' : 'deaf-to-hearing',
    context: context === 'emergency' ? 'emergency' : 'hospital',
    isEmergencyMode: signBridgeErrorHandler.isEmergencyModeActive(),
    userPresent: true,
    criticalCommunication: context === 'emergency',
    mediationMode: mode,
    mediationContext: context,
    activeUsers: 1,
    systemLoad: 0.5
  }

  await signBridgeErrorHandler.handleAvatarRenderingError(error, errorContext)
}