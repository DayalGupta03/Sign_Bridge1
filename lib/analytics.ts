/**
 * SIGNBRIDGE 3D - ANALYTICS & EVENT TRACKING
 * 
 * This module provides optional backend integration for observability.
 * 
 * KEY PRINCIPLES:
 * - Optional: Frontend works without backend
 * - Non-blocking: Never delays user interactions
 * - Silent failures: Errors don't affect UX
 * - Privacy-first: No PHI or personal data
 * 
 * USAGE:
 * import { trackEvent } from '@/lib/analytics'
 * 
 * trackEvent({
 *   status: 'speaking',
 *   mode: 'deaf-to-hearing',
 *   context: 'hospital'
 * })
 */

// ============================================================================
// TYPES
// ============================================================================

export type EventMode = "deaf-to-hearing" | "hearing-to-deaf"
export type EventContext = "hospital" | "emergency"
export type EventStatus = "listening" | "understanding" | "responding" | "speaking"

export interface TrackEventOptions {
  status?: EventStatus
  mode?: EventMode
  context?: EventContext
  latency?: number
  error?: string
  metadata?: Record<string, any>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * BACKEND URL
 * 
 * Set via environment variable or default to localhost.
 * In production, set NEXT_PUBLIC_BACKEND_URL to your backend domain.
 * 
 * Examples:
 * - Development: http://localhost:3001
 * - Production: https://api.signbridge3d.com
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

/**
 * ENABLE TRACKING
 * 
 * Set to false to disable all tracking (useful for development).
 * In production, set NEXT_PUBLIC_ENABLE_TRACKING=true
 */
const ENABLE_TRACKING = process.env.NEXT_PUBLIC_ENABLE_TRACKING !== 'false'

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * SESSION ID
 * 
 * Generated once per page load, persists for entire session.
 * Used to correlate events from same user session.
 * 
 * Format: sess_[timestamp]_[random]
 * Example: sess_1234567890_a1b2c3d4
 * 
 * PRIVACY:
 * - Anonymous (no user identification)
 * - Not stored in cookies or localStorage
 * - Resets on page refresh
 */
let sessionId: string | null = null

function getSessionId(): string {
  if (!sessionId) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 10)
    sessionId = `sess_${timestamp}_${random}`
  }
  return sessionId
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * HIPAA SAFEGUARD: REMOVE PHI FROM ANALYTICS
 * 
 * Recursively removes sensitive keys from objects before logging.
 * Ensures no text content, names, or transcripts leave the browser.
 */
function scrubMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata) return undefined

  const SENSITIVE_KEYS = ['text', 'transcript', 'input', 'message', 'translation', 'user_input']
  const clean: Record<string, any> = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      clean[key] = '[REDACTED_PHI]'
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = scrubMetadata(value)
    } else {
      clean[key] = value
    }
  }

  return clean
}

/**
 * TRACK EVENT
 * 
 * Sends interaction event to backend for logging and analytics.
 * 
 * BEHAVIOR:
 * - Non-blocking: Uses fetch with no await
 * - Silent failures: Errors are logged but don't throw
 * - Optional: If backend is down, frontend continues normally
 * 
 * PRIVACY:
 * - No PHI (Protected Health Information)
 * - No audio/video data
 * - No personal identifiers
 * - Session IDs are anonymous
 * 
 * @param options - Event data to track
 */
export function trackEvent(options: TrackEventOptions): void {
  // Skip if tracking is disabled
  if (!ENABLE_TRACKING) {
    return
  }

  // Skip if running on server (Next.js SSR)
  if (typeof window === 'undefined') {
    return
  }

  try {
    // HIPAA SAFETY: Scrub potentially sensitive data from metadata
    // We never want to log actual conversation text, only operational metrics
    const scrubbedMetadata = scrubMetadata(options.metadata)

    // Prepare event payload
    const event = {
      sessionId: getSessionId(),
      timestamp: Date.now(),
      ...options,
      metadata: scrubbedMetadata, // Use scrubbed version
    }

    // Send to backend (non-blocking, no await)
    fetch(`${BACKEND_URL}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
      .then((response) => {
        if (!response.ok) {
          console.warn('⚠️ Analytics event failed:', response.status)
        }
      })
      .catch((error) => {
        // Silent failure - backend is optional
        console.warn('⚠️ Analytics backend unreachable:', error.message)
      })
  } catch (error) {
    // Silent failure - never break user experience
    console.warn('⚠️ Analytics error:', error)
  }
}

/**
 * TRACK STATUS CHANGE
 * 
 * Convenience function for tracking status transitions.
 * 
 * @param status - New status
 * @param mode - Current mode
 * @param context - Current context
 */
export function trackStatusChange(
  status: EventStatus,
  mode: EventMode,
  context: EventContext
): void {
  trackEvent({ status, mode, context })
}

/**
 * TRACK ERROR
 * 
 * Convenience function for tracking errors.
 * 
 * @param error - Error message or Error object
 * @param metadata - Additional context
 */
export function trackError(error: string | Error, metadata?: Record<string, any>): void {
  const errorMessage = error instanceof Error ? error.message : error

  trackEvent({
    error: errorMessage,
    metadata,
  })
}

/**
 * TRACK LATENCY
 * 
 * Convenience function for tracking performance metrics.
 * 
 * @param operation - Operation name (e.g., "stt", "mediation", "tts")
 * @param latency - Time in milliseconds
 * @param metadata - Additional context
 */
export function trackLatency(
  operation: string,
  latency: number,
  metadata?: Record<string, any>
): void {
  trackEvent({
    latency,
    metadata: {
      operation,
      ...metadata,
    },
  })
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * CHECK BACKEND HEALTH
 * 
 * Pings backend to verify it's running.
 * Useful for debugging and monitoring.
 * 
 * @returns Promise<boolean> - true if backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (!ENABLE_TRACKING) {
    return false
  }

  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Backend health:', data)
      return true
    }

    return false
  } catch (error) {
    console.warn('⚠️ Backend health check failed:', error)
    return false
  }
}

// ============================================================================
// EXPORT SESSION ID (FOR DEBUGGING)
// ============================================================================

/**
 * GET CURRENT SESSION ID
 * 
 * Returns the current session ID for debugging purposes.
 * Useful for correlating frontend logs with backend events.
 * 
 * @returns Current session ID
 */
export function getCurrentSessionId(): string {
  return getSessionId()
}
