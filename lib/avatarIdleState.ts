/**
 * AVATAR IDLE STATE MANAGER
 * 
 * Manages idle state detection and idle video playback for both avatar renderers.
 * Automatically plays idle.mp4 when avatar is not performing any actions.
 * 
 * Features:
 * - Automatic idle detection
 * - Smooth transitions between idle and active states
 * - Configurable idle timeout
 * - State synchronization between 3D and video avatars
 */

// ============================================================================
// TYPES
// ============================================================================

export type AvatarIdleState = 'idle' | 'active' | 'transitioning'

export interface IdleStateConfig {
  idleTimeoutMs: number // Time before entering idle state
  transitionDurationMs: number // Duration of idle transition
  idleVideoPath: string // Path to idle video
}

export interface IdleStateCallbacks {
  onIdleStart?: () => void
  onIdleEnd?: () => void
  onTransitionStart?: () => void
  onTransitionEnd?: () => void
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: IdleStateConfig = {
  idleTimeoutMs: 3000, // 3 seconds of inactivity
  transitionDurationMs: 500, // 500ms transition
  idleVideoPath: '/videos/idle.mp4',
}

// ============================================================================
// AVATAR IDLE STATE MANAGER
// ============================================================================

export class AvatarIdleStateManager {
  private state: AvatarIdleState = 'idle'
  private lastActivityTime = Date.now()
  private idleTimeout: NodeJS.Timeout | null = null
  private transitionTimeout: NodeJS.Timeout | null = null
  private config: IdleStateConfig
  private callbacks: IdleStateCallbacks = {}
  private isDestroyed = false

  constructor(config: Partial<IdleStateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startIdleTimer()
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Register callbacks for idle state changes
   */
  setCallbacks(callbacks: IdleStateCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Signal that avatar is performing an activity
   */
  signalActivity(): void {
    if (this.isDestroyed) return

    this.lastActivityTime = Date.now()
    
    if (this.state === 'idle') {
      this.transitionToActive()
    } else if (this.state === 'transitioning') {
      // Cancel transition to idle, stay active
      this.cancelTransition()
      this.setState('active')
    }

    this.resetIdleTimer()
  }

  /**
   * Force avatar to idle state
   */
  forceIdle(): void {
    if (this.isDestroyed) return

    this.clearTimers()
    this.transitionToIdle()
  }

  /**
   * Get current idle state
   */
  getState(): AvatarIdleState {
    return this.state
  }

  /**
   * Check if avatar should be showing idle animation
   */
  isIdle(): boolean {
    return this.state === 'idle'
  }

  /**
   * Check if avatar is currently active
   */
  isActive(): boolean {
    return this.state === 'active'
  }

  /**
   * Check if avatar is transitioning between states
   */
  isTransitioning(): boolean {
    return this.state === 'transitioning'
  }

  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IdleStateConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.resetIdleTimer()
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.isDestroyed = true
    this.clearTimers()
    this.callbacks = {}
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Set internal state and notify callbacks
   */
  private setState(newState: AvatarIdleState): void {
    if (this.state === newState) return

    const oldState = this.state
    this.state = newState

    console.log(`[IdleState] ${oldState} → ${newState}`)

    // Trigger callbacks
    switch (newState) {
      case 'idle':
        this.callbacks.onIdleStart?.()
        break
      case 'active':
        if (oldState === 'idle') {
          this.callbacks.onIdleEnd?.()
        }
        break
      case 'transitioning':
        this.callbacks.onTransitionStart?.()
        break
    }
  }

  /**
   * Start transition to active state
   */
  private transitionToActive(): void {
    this.setState('transitioning')
    
    this.transitionTimeout = setTimeout(() => {
      this.setState('active')
      this.callbacks.onTransitionEnd?.()
    }, this.config.transitionDurationMs)
  }

  /**
   * Start transition to idle state
   */
  private transitionToIdle(): void {
    this.setState('transitioning')
    
    this.transitionTimeout = setTimeout(() => {
      this.setState('idle')
      this.callbacks.onTransitionEnd?.()
    }, this.config.transitionDurationMs)
  }

  /**
   * Cancel ongoing transition
   */
  private cancelTransition(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout)
      this.transitionTimeout = null
    }
  }

  /**
   * Start or restart the idle timer
   */
  private startIdleTimer(): void {
    this.clearIdleTimer()
    
    this.idleTimeout = setTimeout(() => {
      if (this.getTimeSinceLastActivity() >= this.config.idleTimeoutMs) {
        this.transitionToIdle()
      } else {
        // Activity occurred during timeout, restart timer
        this.startIdleTimer()
      }
    }, this.config.idleTimeoutMs)
  }

  /**
   * Reset the idle timer
   */
  private resetIdleTimer(): void {
    this.startIdleTimer()
  }

  /**
   * Clear the idle timer
   */
  private clearIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
      this.idleTimeout = null
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearIdleTimer()
    this.cancelTransition()
  }
}

// ============================================================================
// ACTIVITY DETECTION UTILITIES
// ============================================================================

/**
 * Detect if avatar should be considered active based on various inputs
 */
export function detectAvatarActivity(params: {
  isSigningActive?: boolean
  isSpeaking?: boolean
  hasHandPoses?: boolean
  signSequence?: any[]
  speechText?: string
}): boolean {
  const {
    isSigningActive = false,
    isSpeaking = false,
    hasHandPoses = false,
    signSequence = [],
    speechText = ''
  } = params

  return (
    isSigningActive ||
    isSpeaking ||
    hasHandPoses ||
    signSequence.length > 0 ||
    (speechText && speechText.trim().length > 0)
  )
}

/**
 * Create a debounced activity detector
 */
export function createDebouncedActivityDetector(
  callback: (isActive: boolean) => void,
  debounceMs: number = 100
): (isActive: boolean) => void {
  let timeout: NodeJS.Timeout | null = null
  let lastValue: boolean | null = null

  return (isActive: boolean) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      if (lastValue !== isActive) {
        lastValue = isActive
        callback(isActive)
      }
    }, debounceMs)
  }
}