/**
 * SIGNBRIDGE 3D - PERFORMANCE TIMING SYSTEM
 * 
 * This module provides high-precision timing measurements for each pipeline stage
 * to achieve and monitor sub-150ms end-to-end latency targets.
 * 
 * CORE RESPONSIBILITIES:
 * - Measure pipeline stage durations with microsecond precision
 * - Track end-to-end latency across complete workflows
 * - Identify performance bottlenecks in real-time
 * - Provide performance alerts for threshold violations
 * 
 * DESIGN PRINCIPLES:
 * - High-precision timing using performance.now()
 * - Minimal overhead to avoid affecting measured performance
 * - Real-time bottleneck detection
 * - Comprehensive performance analytics
 */

// ============================================================================
// TYPES
// ============================================================================

export type PipelineStage = 
  | 'speech_capture'
  | 'speech_recognition' 
  | 'cache_lookup'
  | 'llm_mediation'
  | 'intent_mapping'
  | 'avatar_preparation'
  | 'sign_rendering'
  | 'speech_synthesis'
  | 'total_e2e'

export interface StageTimer {
  stage: PipelineStage
  startTime: number
  endTime?: number
  duration?: number
}

export interface PerformanceMeasurement {
  stage: PipelineStage
  duration: number
  timestamp: number
  exceedsThreshold: boolean
  threshold: number
}

export interface PerformanceSnapshot {
  totalE2E: number
  stageBreakdown: Record<PipelineStage, number>
  bottlenecks: PipelineStage[]
  timestamp: number
}

export interface PerformanceStats {
  measurements: PerformanceMeasurement[]
  averageDurations: Record<PipelineStage, number>
  p95Durations: Record<PipelineStage, number>
  p99Durations: Record<PipelineStage, number>
  thresholdViolations: number
  totalMeasurements: number
}

// ============================================================================
// PERFORMANCE THRESHOLDS
// ============================================================================

/**
 * PERFORMANCE THRESHOLDS (milliseconds)
 * 
 * These thresholds define acceptable performance for each pipeline stage.
 * Exceeding these triggers performance alerts and bottleneck detection.
 * 
 * TARGET: 150ms total end-to-end latency (95th percentile)
 * ALERT: 100ms per individual stage (red indicators)
 */
export const PERFORMANCE_THRESHOLDS: Record<PipelineStage, number> = {
  speech_capture: 20,      // Microphone to recognition start
  speech_recognition: 50,   // Web Speech API processing
  cache_lookup: 1,         // Medical term cache lookup
  llm_mediation: 80,       // AI mediation (when cache miss)
  intent_mapping: 30,      // Speech to sign intent mapping
  avatar_preparation: 20,   // Avatar animation preparation
  sign_rendering: 40,      // 3D avatar sign animation
  speech_synthesis: 30,    // Text-to-speech output
  total_e2e: 150          // Complete end-to-end workflow
}

// ============================================================================
// PERFORMANCE TIMER - High-Precision Measurement System
// ============================================================================

/**
 * PERFORMANCE TIMER CLASS
 * 
 * Provides high-precision timing for pipeline stages with real-time
 * bottleneck detection and performance analytics.
 * 
 * USAGE:
 * ```typescript
 * const timer = new PerformanceTimer()
 * 
 * timer.startStage('speech_recognition')
 * // ... do work ...
 * const measurement = timer.endStage('speech_recognition')
 * 
 * if (measurement.exceedsThreshold) {
 *   console.warn('Performance threshold exceeded!')
 * }
 * ```
 */
export class PerformanceTimer {
  // ========================================================================
  // PRIVATE STATE
  // ========================================================================

  /**
   * Active stage timers
   * Tracks currently running measurements
   */
  private activeTimers = new Map<PipelineStage, StageTimer>()

  /**
   * Completed measurements
   * Historical performance data for analytics
   */
  private measurements: PerformanceMeasurement[] = []

  /**
   * Current performance snapshot
   * Latest complete workflow measurement
   */
  private currentSnapshot: PerformanceSnapshot | null = null

  /**
   * Performance event callbacks
   * For real-time performance monitoring
   */
  private onThresholdExceeded?: (measurement: PerformanceMeasurement) => void
  private onBottleneckDetected?: (bottlenecks: PipelineStage[]) => void

  // ========================================================================
  // TIMING API
  // ========================================================================

  /**
   * START STAGE TIMER
   * 
   * Begins timing for a specific pipeline stage.
   * Uses high-precision performance.now() for microsecond accuracy.
   * 
   * @param stage - Pipeline stage to time
   * @returns Start timestamp for reference
   */
  startStage(stage: PipelineStage): number {
    const startTime = performance.now()
    
    this.activeTimers.set(stage, {
      stage,
      startTime
    })
    
    return startTime
  }

  /**
   * END STAGE TIMER
   * 
   * Completes timing for a pipeline stage and returns measurement.
   * Automatically detects threshold violations and bottlenecks.
   * 
   * @param stage - Pipeline stage to complete
   * @returns PerformanceMeasurement with duration and threshold status
   */
  endStage(stage: PipelineStage): PerformanceMeasurement | null {
    const endTime = performance.now()
    const timer = this.activeTimers.get(stage)
    
    if (!timer) {
      console.warn(`⚠️ No active timer found for stage: ${stage}`)
      return null
    }
    
    // Calculate duration
    const duration = endTime - timer.startTime
    const threshold = PERFORMANCE_THRESHOLDS[stage]
    const exceedsThreshold = duration > threshold
    
    // Create measurement
    const measurement: PerformanceMeasurement = {
      stage,
      duration,
      timestamp: endTime,
      exceedsThreshold,
      threshold
    }
    
    // Store measurement
    this.measurements.push(measurement)
    this.activeTimers.delete(stage)
    
    // Log performance
    if (exceedsThreshold) {
      console.warn(`⚠️ Performance threshold exceeded: ${stage} took ${duration.toFixed(1)}ms (threshold: ${threshold}ms)`)
      this.onThresholdExceeded?.(measurement)
    } else {
      console.log(`✅ ${stage}: ${duration.toFixed(1)}ms (under ${threshold}ms threshold)`)
    }
    
    return measurement
  }

  /**
   * MEASURE FUNCTION
   * 
   * Convenience method to time a function execution.
   * 
   * @param stage - Pipeline stage being measured
   * @param fn - Function to measure
   * @returns Function result and measurement
   */
  async measure<T>(stage: PipelineStage, fn: () => Promise<T>): Promise<{ result: T, measurement: PerformanceMeasurement | null }> {
    this.startStage(stage)
    try {
      const result = await fn()
      const measurement = this.endStage(stage)
      return { result, measurement }
    } catch (error) {
      this.endStage(stage) // Ensure timer is cleaned up on error
      throw error
    }
  }

  /**
   * MEASURE SYNC FUNCTION
   * 
   * Convenience method to time a synchronous function execution.
   * 
   * @param stage - Pipeline stage being measured
   * @param fn - Synchronous function to measure
   * @returns Function result and measurement
   */
  measureSync<T>(stage: PipelineStage, fn: () => T): { result: T, measurement: PerformanceMeasurement | null } {
    this.startStage(stage)
    try {
      const result = fn()
      const measurement = this.endStage(stage)
      return { result, measurement }
    } catch (error) {
      this.endStage(stage) // Ensure timer is cleaned up on error
      throw error
    }
  }

  // ========================================================================
  // WORKFLOW TIMING
  // ========================================================================

  /**
   * START WORKFLOW
   * 
   * Begins timing for complete end-to-end workflow.
   * Used to measure total latency from input to output.
   */
  startWorkflow(): void {
    this.startStage('total_e2e')
    this.currentSnapshot = null
  }

  /**
   * END WORKFLOW
   * 
   * Completes end-to-end workflow timing and creates performance snapshot.
   * Automatically detects bottlenecks and performance issues.
   * 
   * @returns PerformanceSnapshot with complete workflow analysis
   */
  endWorkflow(): PerformanceSnapshot | null {
    const e2eMeasurement = this.endStage('total_e2e')
    if (!e2eMeasurement) return null
    
    // Get recent stage measurements for this workflow
    const recentMeasurements = this.measurements.slice(-10) // Last 10 measurements
    const stageBreakdown: Record<PipelineStage, number> = {} as any
    
    // Build stage breakdown
    Object.keys(PERFORMANCE_THRESHOLDS).forEach(stage => {
      const stageMeasurement = recentMeasurements
        .filter(m => m.stage === stage as PipelineStage)
        .pop() // Get most recent measurement for this stage
      
      stageBreakdown[stage as PipelineStage] = stageMeasurement?.duration || 0
    })
    
    // Identify bottlenecks (stages exceeding thresholds)
    const bottlenecks = Object.entries(stageBreakdown)
      .filter(([stage, duration]) => duration > PERFORMANCE_THRESHOLDS[stage as PipelineStage])
      .map(([stage]) => stage as PipelineStage)
    
    // Create snapshot
    this.currentSnapshot = {
      totalE2E: e2eMeasurement.duration,
      stageBreakdown,
      bottlenecks,
      timestamp: e2eMeasurement.timestamp
    }
    
    // Notify bottleneck detection
    if (bottlenecks.length > 0) {
      console.warn(`🚨 Performance bottlenecks detected:`, bottlenecks)
      this.onBottleneckDetected?.(bottlenecks)
    }
    
    return this.currentSnapshot
  }

  // ========================================================================
  // PERFORMANCE ANALYTICS
  // ========================================================================

  /**
   * GET CURRENT SNAPSHOT
   * 
   * Returns the most recent complete workflow performance snapshot.
   * 
   * @returns Latest PerformanceSnapshot or null if no workflow completed
   */
  getCurrentSnapshot(): PerformanceSnapshot | null {
    return this.currentSnapshot
  }

  /**
   * GET PERFORMANCE STATS
   * 
   * Returns comprehensive performance statistics for analysis.
   * Includes averages, percentiles, and threshold violations.
   * 
   * @returns PerformanceStats with complete analytics
   */
  getStats(): PerformanceStats {
    const stats: PerformanceStats = {
      measurements: [...this.measurements],
      averageDurations: {} as any,
      p95Durations: {} as any,
      p99Durations: {} as any,
      thresholdViolations: 0,
      totalMeasurements: this.measurements.length
    }
    
    // Calculate statistics for each stage
    Object.keys(PERFORMANCE_THRESHOLDS).forEach(stage => {
      const stageMeasurements = this.measurements
        .filter(m => m.stage === stage as PipelineStage)
        .map(m => m.duration)
        .sort((a, b) => a - b)
      
      if (stageMeasurements.length > 0) {
        // Average
        stats.averageDurations[stage as PipelineStage] = 
          stageMeasurements.reduce((sum, d) => sum + d, 0) / stageMeasurements.length
        
        // 95th percentile
        const p95Index = Math.floor(stageMeasurements.length * 0.95)
        stats.p95Durations[stage as PipelineStage] = stageMeasurements[p95Index] || 0
        
        // 99th percentile
        const p99Index = Math.floor(stageMeasurements.length * 0.99)
        stats.p99Durations[stage as PipelineStage] = stageMeasurements[p99Index] || 0
      } else {
        stats.averageDurations[stage as PipelineStage] = 0
        stats.p95Durations[stage as PipelineStage] = 0
        stats.p99Durations[stage as PipelineStage] = 0
      }
    })
    
    // Count threshold violations
    stats.thresholdViolations = this.measurements.filter(m => m.exceedsThreshold).length
    
    return stats
  }

  /**
   * GET RECENT MEASUREMENTS
   * 
   * Returns the most recent performance measurements.
   * 
   * @param limit - Maximum number of measurements to return
   * @returns Array of recent PerformanceMeasurement objects
   */
  getRecentMeasurements(limit = 50): PerformanceMeasurement[] {
    return this.measurements.slice(-limit)
  }

  /**
   * CLEAR MEASUREMENTS
   * 
   * Clears all stored measurements for fresh analysis.
   * Used for testing and benchmarking.
   */
  clearMeasurements(): void {
    this.measurements = []
    this.currentSnapshot = null
    this.activeTimers.clear()
  }

  // ========================================================================
  // EVENT CALLBACKS
  // ========================================================================

  /**
   * SET THRESHOLD CALLBACK
   * 
   * Sets callback for threshold violation events.
   * 
   * @param callback - Function to call when threshold is exceeded
   */
  onThresholdViolation(callback: (measurement: PerformanceMeasurement) => void): void {
    this.onThresholdExceeded = callback
  }

  /**
   * SET BOTTLENECK CALLBACK
   * 
   * Sets callback for bottleneck detection events.
   * 
   * @param callback - Function to call when bottlenecks are detected
   */
  onBottleneckDetection(callback: (bottlenecks: PipelineStage[]) => void): void {
    this.onBottleneckDetected = callback
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * SINGLETON PATTERN
 * 
 * Single instance ensures:
 * - Consistent timing across all components
 * - Centralized performance monitoring
 * - Shared performance analytics
 * 
 * Export singleton instance for use throughout the app.
 */
export const performanceTimer = new PerformanceTimer()

// ============================================================================
// REACT HOOK (OPTIONAL)
// ============================================================================

/**
 * USE PERFORMANCE TIMER HOOK
 * 
 * React hook for easy integration with components.
 * 
 * @returns Performance timer API
 */
export function usePerformanceTimer() {
  return {
    startStage: (stage: PipelineStage) => performanceTimer.startStage(stage),
    endStage: (stage: PipelineStage) => performanceTimer.endStage(stage),
    measure: <T>(stage: PipelineStage, fn: () => Promise<T>) => performanceTimer.measure(stage, fn),
    measureSync: <T>(stage: PipelineStage, fn: () => T) => performanceTimer.measureSync(stage, fn),
    startWorkflow: () => performanceTimer.startWorkflow(),
    endWorkflow: () => performanceTimer.endWorkflow(),
    getCurrentSnapshot: () => performanceTimer.getCurrentSnapshot(),
    getStats: () => performanceTimer.getStats(),
    getRecentMeasurements: (limit?: number) => performanceTimer.getRecentMeasurements(limit),
    clearMeasurements: () => performanceTimer.clearMeasurements(),
    onThresholdViolation: (callback: (measurement: PerformanceMeasurement) => void) => 
      performanceTimer.onThresholdViolation(callback),
    onBottleneckDetection: (callback: (bottlenecks: PipelineStage[]) => void) => 
      performanceTimer.onBottleneckDetection(callback)
  }
}