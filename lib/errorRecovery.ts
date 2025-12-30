/**
 * SIGNBRIDGE 3D - ERROR RECOVERY SYSTEM
 * 
 * This module provides robust error handling with graceful degradation and automatic 
 * recovery for emergency scenarios. It implements multi-layered fallback mechanisms 
 * to ensure critical communication is never completely interrupted.
 * 
 * CORE RESPONSIBILITIES:
 * - Multi-layered fallback mechanisms for each system component
 * - Automatic retry logic with exponential backoff
 * - Emergency mode prioritization (speed over accuracy)
 * - Comprehensive error logging with timestamps
 * - Audio alerts for critical failures
 * 
 * DESIGN PRINCIPLES:
 * - Never completely fail - always provide some level of functionality
 * - Fail fast and recover gracefully
 * - Prioritize speed in emergency contexts
 * - Maintain audit trail for post-incident analysis
 * - Clear user feedback for all error states
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type SystemComponent = 
  | 'speech-recognition' 
  | 'sign-recognition' 
  | 'ai-mediation' 
  | 'avatar-rendering'
  | 'text-to-speech'
  | 'camera'
  | 'microphone'

export type ErrorSeverity = 'warning' | 'minor' | 'major' | 'critical'

export type FallbackMode = 
  | 'retry' 
  | 'alternative-method' 
  | 'degraded-functionality' 
  | 'manual-input' 
  | 'text-only'
  | 'emergency-bypass'

export type AlertType = 'audio' | 'visual' | 'haptic'

export interface SystemError {
  id: string
  component: SystemComponent
  severity: ErrorSeverity
  message: string
  timestamp: number
  context?: Record<string, any>
  retryCount?: number
}

export interface ErrorContext {
  mode: 'hearing-to-deaf' | 'deaf-to-hearing'
  context: 'hospital' | 'emergency'
  isEmergencyMode: boolean
  userPresent: boolean
  criticalCommunication: boolean
}

export interface RecoveryAction {
  type: FallbackMode
  description: string
  estimatedRecoveryTime: number // milliseconds
  userNotification?: string
  audioAlert?: boolean
  retryAfter?: number
}

export interface FallbackFunction {
  (error: SystemError, context: ErrorContext): Promise<RecoveryAction>
}

export interface Operation {
  id: string
  component: SystemComponent
  action: string
  execute: () => Promise<any>
  timeout?: number
}

export interface OperationResult {
  success: boolean
  data?: any
  error?: SystemError
  fallbackUsed?: boolean
  recoveryAction?: RecoveryAction
}

export interface SystemFailure {
  component: SystemComponent
  errors: SystemError[]
  cascadingFailures: SystemComponent[]
  totalDowntime: number
}

export interface CriticalFailure extends SystemFailure {
  patientSafetyImpact: boolean
  emergencyProtocolTriggered: boolean
  manualInterventionRequired: boolean
}

export interface ErrorLog {
  timestamp: number
  error: SystemError
  context: ErrorContext
  recoveryAction: RecoveryAction
  outcome: 'recovered' | 'degraded' | 'failed'
  userImpact: 'none' | 'minor' | 'major' | 'critical'
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'offline'
  components: Record<SystemComponent, 'operational' | 'degraded' | 'failed'>
  activeErrors: SystemError[]
  recoveryActions: RecoveryAction[]
  uptime: number
  lastHealthCheck: number
}

export interface SignSequence {
  signs: Array<{
    id: string
    term: string
    duration: number
    keyframes: any[]
  }>
  totalDuration: number
  transitions: Array<{
    fromSign: string
    toSign: string
    duration: number
    type: 'smooth' | 'pause' | 'emphasis'
  }>
}

// ============================================================================
// ERROR RECOVERY SYSTEM CLASS
// ============================================================================

export class ErrorRecoverySystem {
  private fallbacks: Map<SystemComponent, FallbackFunction[]> = new Map()
  private errorHistory: ErrorLog[] = []
  private componentHealth: Map<SystemComponent, 'operational' | 'degraded' | 'failed'> = new Map()
  private retryAttempts: Map<string, number> = new Map()
  private emergencyMode: boolean = false

  constructor() {
    // Initialize component health tracking
    const components: SystemComponent[] = [
      'speech-recognition', 'sign-recognition', 'ai-mediation', 
      'avatar-rendering', 'text-to-speech', 'camera', 'microphone'
    ]
    
    components.forEach(component => {
      this.componentHealth.set(component, 'operational')
      this.fallbacks.set(component, [])
    })

    // Register default fallback strategies
    this.registerDefaultFallbacks()
  }

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  async handleError(error: SystemError, context: ErrorContext): Promise<RecoveryAction> {
    console.log(`🚨 Handling ${error.severity} error in ${error.component}:`, error.message)
    
    // Log error immediately
    this.logError(error, context)
    
    // Update component health
    this.updateComponentHealth(error.component, error.severity)
    
    // Get appropriate fallback strategy
    const fallbacks = this.fallbacks.get(error.component) || []
    
    // Try fallbacks in order of preference
    for (const fallback of fallbacks) {
      try {
        const recoveryAction = await fallback(error, context)
        
        // Log successful recovery
        this.logRecovery(error, context, recoveryAction, 'recovered')
        
        return recoveryAction
      } catch (fallbackError) {
        console.warn(`⚠️ Fallback failed for ${error.component}:`, fallbackError)
      }
    }
    
    // If all fallbacks fail, use emergency bypass
    const emergencyAction = await this.getEmergencyFallback(error, context)
    this.logRecovery(error, context, emergencyAction, 'degraded')
    
    return emergencyAction
  }

  registerFallback(component: SystemComponent, fallback: FallbackFunction): void {
    const componentFallbacks = this.fallbacks.get(component) || []
    componentFallbacks.push(fallback)
    this.fallbacks.set(component, componentFallbacks)
  }

  // ========================================================================
  // RECOVERY OPERATIONS
  // ========================================================================

  async retryOperation(operation: Operation, maxRetries: number = 3): Promise<OperationResult> {
    const retryKey = `${operation.component}:${operation.id}`
    let currentRetries = this.retryAttempts.get(retryKey) || 0
    
    if (currentRetries >= maxRetries) {
      return {
        success: false,
        error: {
          id: `retry-limit-${Date.now()}`,
          component: operation.component,
          severity: 'major',
          message: `Maximum retry attempts (${maxRetries}) exceeded`,
          timestamp: Date.now(),
          retryCount: currentRetries
        }
      }
    }

    try {
      // Execute operation with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), operation.timeout || 5000)
      })
      
      const result = await Promise.race([operation.execute(), timeoutPromise])
      
      // Success - reset retry count
      this.retryAttempts.delete(retryKey)
      
      return {
        success: true,
        data: result
      }
    } catch (error: any) {
      // Increment retry count
      currentRetries++
      this.retryAttempts.set(retryKey, currentRetries)
      
      // Calculate exponential backoff delay
      const backoffDelay = Math.min(1000 * Math.pow(2, currentRetries - 1), 10000)
      
      const systemError: SystemError = {
        id: `retry-${currentRetries}-${Date.now()}`,
        component: operation.component,
        severity: currentRetries >= maxRetries ? 'major' : 'minor',
        message: error.message || 'Operation failed',
        timestamp: Date.now(),
        retryCount: currentRetries
      }
      
      if (currentRetries < maxRetries) {
        // Schedule retry with backoff
        setTimeout(() => {
          this.retryOperation(operation, maxRetries)
        }, backoffDelay)
        
        return {
          success: false,
          error: systemError
        }
      } else {
        // Max retries exceeded
        return {
          success: false,
          error: systemError
        }
      }
    }
  }

  async engageFallbackMode(component: SystemComponent): Promise<void> {
    console.log(`🔄 Engaging fallback mode for ${component}`)
    
    this.componentHealth.set(component, 'degraded')
    
    // Trigger appropriate fallback based on component
    switch (component) {
      case 'speech-recognition':
        // Fall back to manual text input
        this.triggerManualInput('speech')
        break
      case 'sign-recognition':
        // Fall back to gesture prompts
        this.triggerGesturePrompts()
        break
      case 'ai-mediation':
        // Fall back to direct pass-through
        this.triggerPassThroughMode()
        break
      case 'avatar-rendering':
        // Fall back to text-only display
        this.triggerTextOnlyMode()
        break
      default:
        console.warn(`⚠️ No specific fallback defined for ${component}`)
    }
  }

  async recoverFromFailure(failure: SystemFailure): Promise<boolean> {
    console.log(`🔧 Attempting recovery from ${failure.component} failure`)
    
    try {
      // Attempt component restart
      await this.restartComponent(failure.component)
      
      // Verify recovery
      const isRecovered = await this.verifyComponentHealth(failure.component)
      
      if (isRecovered) {
        this.componentHealth.set(failure.component, 'operational')
        console.log(`✅ Successfully recovered ${failure.component}`)
        return true
      } else {
        console.warn(`⚠️ Recovery verification failed for ${failure.component}`)
        return false
      }
    } catch (error: any) {
      console.error(`❌ Recovery failed for ${failure.component}:`, error.message)
      return false
    }
  }

  // ========================================================================
  // EMERGENCY HANDLING
  // ========================================================================

  async handleCriticalFailure(failure: CriticalFailure): Promise<void> {
    console.error(`🚨 CRITICAL FAILURE in ${failure.component}`)
    
    // Immediately trigger audio alert
    this.triggerAudioAlert('audio')
    
    // Enable emergency mode
    this.emergencyMode = true
    
    // Engage emergency bypass protocols
    await this.engageEmergencyBypass(failure)
    
    // Notify user of critical failure
    this.notifyUserOfCriticalFailure(failure)
    
    // Log critical failure for analysis
    this.logCriticalFailure(failure)
  }

  triggerAudioAlert(alertType: AlertType): void {
    console.log(`🔊 Triggering ${alertType} alert`)
    
    // In a real implementation, this would:
    // - Play audio alert sounds
    // - Flash visual indicators
    // - Trigger haptic feedback
    
    // For now, we'll simulate the alert
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('System alert: Communication error detected')
      utterance.rate = 1.2
      utterance.volume = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  // ========================================================================
  // MONITORING AND LOGGING
  // ========================================================================

  logError(error: SystemError, context?: ErrorContext): void {
    const logEntry: ErrorLog = {
      timestamp: Date.now(),
      error,
      context: context || {
        mode: 'hearing-to-deaf',
        context: 'hospital',
        isEmergencyMode: this.emergencyMode,
        userPresent: true,
        criticalCommunication: false
      },
      recoveryAction: {
        type: 'retry',
        description: 'Initial error logged',
        estimatedRecoveryTime: 0
      },
      outcome: 'failed',
      userImpact: this.mapSeverityToUserImpact(error.severity)
    }
    
    this.errorHistory.push(logEntry)
    
    // Keep only last 100 error logs to prevent memory issues
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100)
    }
  }

  getErrorHistory(): ErrorLog[] {
    return [...this.errorHistory]
  }

  getSystemHealth(): HealthStatus {
    const components: Record<SystemComponent, 'operational' | 'degraded' | 'failed'> = {}
    
    this.componentHealth.forEach((health, component) => {
      components[component] = health
    })
    
    // Determine overall health
    const healthValues = Array.from(this.componentHealth.values())
    let overall: HealthStatus['overall'] = 'healthy'
    
    if (healthValues.some(h => h === 'failed')) {
      overall = 'critical'
    } else if (healthValues.some(h => h === 'degraded')) {
      overall = 'degraded'
    }
    
    return {
      overall,
      components,
      activeErrors: this.getActiveErrors(),
      recoveryActions: this.getActiveRecoveryActions(),
      uptime: Date.now() - (this.startTime || Date.now()),
      lastHealthCheck: Date.now()
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  private startTime: number = Date.now()

  private registerDefaultFallbacks(): void {
    // Speech Recognition Fallbacks
    this.registerFallback('speech-recognition', async (error, context) => ({
      type: 'manual-input',
      description: 'Switch to manual text input',
      estimatedRecoveryTime: 0,
      userNotification: 'Speech recognition unavailable. Please type your message.',
      audioAlert: false
    }))

    // Sign Recognition Fallbacks  
    this.registerFallback('sign-recognition', async (error, context) => ({
      type: 'alternative-method',
      description: 'Use gesture prompts and confirmation',
      estimatedRecoveryTime: 2000,
      userNotification: 'Sign recognition having issues. Please use clear gestures.',
      audioAlert: false
    }))

    // AI Mediation Fallbacks
    this.registerFallback('ai-mediation', async (error, context) => ({
      type: 'emergency-bypass',
      description: 'Direct pass-through without AI processing',
      estimatedRecoveryTime: 0,
      userNotification: 'Using direct communication mode.',
      audioAlert: false
    }))

    // Avatar Rendering Fallbacks
    this.registerFallback('avatar-rendering', async (error, context) => ({
      type: 'text-only',
      description: 'Display text without avatar animation',
      estimatedRecoveryTime: 0,
      userNotification: 'Avatar unavailable. Using text display.',
      audioAlert: false
    }))
  }

  private updateComponentHealth(component: SystemComponent, severity: ErrorSeverity): void {
    switch (severity) {
      case 'critical':
        this.componentHealth.set(component, 'failed')
        break
      case 'major':
        this.componentHealth.set(component, 'degraded')
        break
      case 'minor':
      case 'warning':
        // Don't change health for minor issues
        break
    }
  }

  private async getEmergencyFallback(error: SystemError, context: ErrorContext): Promise<RecoveryAction> {
    return {
      type: 'emergency-bypass',
      description: 'Emergency bypass - minimal functionality maintained',
      estimatedRecoveryTime: 0,
      userNotification: 'System in emergency mode. Basic communication available.',
      audioAlert: true
    }
  }

  private logRecovery(error: SystemError, context: ErrorContext, action: RecoveryAction, outcome: 'recovered' | 'degraded' | 'failed'): void {
    const logEntry: ErrorLog = {
      timestamp: Date.now(),
      error,
      context,
      recoveryAction: action,
      outcome,
      userImpact: this.mapSeverityToUserImpact(error.severity)
    }
    
    this.errorHistory.push(logEntry)
  }

  private mapSeverityToUserImpact(severity: ErrorSeverity): 'none' | 'minor' | 'major' | 'critical' {
    switch (severity) {
      case 'warning': return 'none'
      case 'minor': return 'minor'
      case 'major': return 'major'
      case 'critical': return 'critical'
    }
  }

  private triggerManualInput(type: string): void {
    console.log(`📝 Triggering manual ${type} input fallback`)
  }

  private triggerGesturePrompts(): void {
    console.log(`👋 Triggering gesture prompt fallback`)
  }

  private triggerPassThroughMode(): void {
    console.log(`🔄 Triggering pass-through mode fallback`)
  }

  private triggerTextOnlyMode(): void {
    console.log(`📄 Triggering text-only mode fallback`)
  }

  private async restartComponent(component: SystemComponent): Promise<void> {
    console.log(`🔄 Restarting ${component}`)
    // Simulate component restart delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async verifyComponentHealth(component: SystemComponent): Promise<boolean> {
    console.log(`🔍 Verifying ${component} health`)
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 500))
    return Math.random() > 0.3 // 70% success rate for testing
  }

  private async engageEmergencyBypass(failure: CriticalFailure): Promise<void> {
    console.log(`🚨 Engaging emergency bypass for ${failure.component}`)
    this.emergencyMode = true
  }

  private notifyUserOfCriticalFailure(failure: CriticalFailure): void {
    console.log(`📢 Notifying user of critical failure in ${failure.component}`)
  }

  private logCriticalFailure(failure: CriticalFailure): void {
    console.log(`📋 Logging critical failure:`, failure)
  }

  private getActiveErrors(): SystemError[] {
    // Return errors from last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    return this.errorHistory
      .filter(log => log.timestamp > fiveMinutesAgo && log.outcome === 'failed')
      .map(log => log.error)
  }

  private getActiveRecoveryActions(): RecoveryAction[] {
    // Return recovery actions from last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    return this.errorHistory
      .filter(log => log.timestamp > fiveMinutesAgo)
      .map(log => log.recoveryAction)
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const errorRecoverySystem = new ErrorRecoverySystem()