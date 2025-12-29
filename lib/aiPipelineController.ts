/**
 * SIGNBRIDGE 3D - AI PIPELINE ORCHESTRATOR
 * 
 * This module provides a centralized controller for the AI processing pipeline,
 * replacing scattered timing and state logic across the application.
 * 
 * CORE RESPONSIBILITIES:
 * - Orchestrate AI pipeline stages (ingest → understand → generate → deliver)
 * - Manage status transitions with centralized timing
 * - Emit events for UI updates (status, subtitles, errors)
 * - Provide extension points for NLP, vision, and avatar systems
 * 
 * DESIGN PRINCIPLES:
 * - Event-driven architecture for loose coupling
 * - Single source of truth for all timing values
 * - Type-safe state machine
 * - Clean separation from UI logic
 * - Easy to test and extend
 * 
 * INTEGRATION:
 * This controller sits between input sources (STT, gesture recognition) and
 * UI components, providing a clean abstraction layer for AI processing.
 */

import { mediateIntent, type MediationContext, type MediationMode } from "./mediator"

// ============================================================================
// CONFIGURATION - Single Source of Truth for All Timing
// ============================================================================

/**
 * PIPELINE TIMING CONFIGURATION
 * 
 * All timing values in milliseconds. These control how long the system
 * spends in each processing stage before transitioning to the next.
 * 
 * TUNING GUIDELINES:
 * - understanding: Time for AI mediation (typically 800-1500ms)
 * - responding: Time for response preparation (typically 500-1000ms)
 * - speaking: Time for subtitle display + TTS (typically 2000-3000ms)
 * 
 * MODIFICATION:
 * Change these values to adjust the perceived responsiveness of the system.
 * Shorter times = snappier but may feel rushed
 * Longer times = more deliberate but may feel slow
 */
export const PIPELINE_TIMINGS = {
    understanding: 1200, // AI processing and mediation
    responding: 800,     // Response generation and preparation
    speaking: 2000,      // Output delivery and subtitle display
} as const

// ============================================================================
// TYPES - Pipeline Data Structures
// ============================================================================

/**
 * PIPELINE STAGES
 * 
 * The canonical four-stage pipeline that all inputs flow through:
 * 
 * 1. ingest - Receive and validate input (speech, gesture, vision)
 * 2. understand - Process with AI mediation and context analysis
 * 3. generate - Prepare output (text, animation commands)
 * 4. deliver - Emit output to UI and return to ingest
 */
export type PipelineStage = "ingest" | "understand" | "generate" | "deliver"

/**
 * UI STATUS STATES
 * 
 * User-facing status labels that map to pipeline stages:
 * - listening (ingest) - Waiting for input
 * - understanding (understand) - Processing with AI
 * - responding (generate) - Preparing response
 * - speaking (deliver) - Delivering output
 */
export type UIStatus = "listening" | "understanding" | "responding" | "speaking"

/**
 * INPUT EVENT TYPES
 * 
 * All possible input events that can trigger the pipeline.
 * Extensible design allows adding new modalities (vision, etc.)
 */
export type InputEvent =
    | { type: "speech"; transcript: string }
    | { type: "gesture"; intent: string; phrase: string }
    | { type: "vision"; data: any } // Future: video-based sign language

/**
 * PIPELINE CONTEXT
 * 
 * Contextual information needed for AI mediation and processing.
 */
export interface PipelineContext {
    mode: MediationMode
    context: MediationContext
    recentHistory?: string[]
}

/**
 * OUTPUT EVENT TYPES
 * 
 * Events emitted by the pipeline for UI consumption.
 */
export type OutputEventType = "status" | "subtitle" | "error"

/**
 * EVENT CALLBACK TYPES
 * 
 * Type-safe callbacks for pipeline event subscriptions.
 */
type StatusCallback = (status: UIStatus) => void
type SubtitleCallback = (text: string) => void
type ErrorCallback = (error: string) => void

// ============================================================================
// PIPELINE STAGE MAPPING
// ============================================================================

/**
 * MAP PIPELINE STAGE TO UI STATUS
 * 
 * Converts internal pipeline stages to user-facing status labels.
 * This mapping ensures consistent UI feedback across all input modalities.
 */
function mapStageToStatus(stage: PipelineStage): UIStatus {
    const mapping: Record<PipelineStage, UIStatus> = {
        ingest: "listening",
        understand: "understanding",
        generate: "responding",
        deliver: "speaking",
    }
    return mapping[stage]
}

// ============================================================================
// AI PIPELINE CONTROLLER - Main Orchestrator Class
// ============================================================================

/**
 * AI PIPELINE CONTROLLER
 * 
 * Central orchestrator for the AI processing pipeline. Manages the flow
 * from input events through AI mediation to UI output.
 * 
 * USAGE:
 * ```typescript
 * const controller = new AIPipelineController()
 * 
 * // Subscribe to outputs
 * controller.on('status', (status) => setStatus(status))
 * controller.on('subtitle', (text) => setSubtitles(prev => [...prev, text]))
 * 
 * // Process input
 * controller.processInput(
 *   { type: 'speech', transcript: 'Hello' },
 *   { mode: 'hearing-to-deaf', context: 'hospital' }
 * )
 * 
 * // Cleanup
 * controller.cancel()
 * ```
 * 
 * ARCHITECTURE:
 * - Event-driven: UI subscribes to outputs, controller emits events
 * - State machine: Explicit transitions between pipeline stages
 * - Async-safe: Handles cancellation and race conditions
 * - Extensible: Easy to add new input types and processing hooks
 */
export class AIPipelineController {
    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    /**
     * Current pipeline stage
     * Tracks where we are in the processing flow
     */
    private currentStage: PipelineStage = "ingest"

    /**
     * Active timeout handles
     * Used for cancellation and cleanup
     */
    private timeouts: NodeJS.Timeout[] = []

    /**
     * Event subscribers
     * Callbacks registered for each event type
     */
    private statusCallbacks: StatusCallback[] = []
    private subtitleCallbacks: SubtitleCallback[] = []
    private errorCallbacks: ErrorCallback[] = []

    /**
     * Processing flag
     * Prevents concurrent pipeline executions
     */
    private isProcessing = false

    // ========================================================================
    // EVENT SUBSCRIPTION API
    // ========================================================================

    /**
     * SUBSCRIBE TO PIPELINE EVENTS
     * 
     * Register callbacks for pipeline outputs. Multiple callbacks can be
     * registered for the same event type.
     * 
     * @param event - Event type to subscribe to
     * @param callback - Function to call when event is emitted
     * 
     * @example
     * controller.on('status', (status) => {
     *   console.log('Status changed:', status)
     *   setStatus(status)
     * })
     */
    on(event: "status", callback: StatusCallback): void
    on(event: "subtitle", callback: SubtitleCallback): void
    on(event: "error", callback: ErrorCallback): void
    on(event: OutputEventType, callback: any): void {
        switch (event) {
            case "status":
                this.statusCallbacks.push(callback)
                break
            case "subtitle":
                this.subtitleCallbacks.push(callback)
                break
            case "error":
                this.errorCallbacks.push(callback)
                break
        }
    }

    // ========================================================================
    // EVENT EMISSION (PRIVATE)
    // ========================================================================

    /**
     * EMIT STATUS EVENT
     * 
     * Notifies all status subscribers of a status change.
     * Called automatically during pipeline stage transitions.
     */
    private emitStatus(status: UIStatus): void {
        this.statusCallbacks.forEach((callback) => {
            try {
                callback(status)
            } catch (error) {
                console.error("Error in status callback:", error)
            }
        })
    }

    /**
     * EMIT SUBTITLE EVENT
     * 
     * Notifies all subtitle subscribers of new text to display.
     * Called when mediated text is ready for UI consumption.
     */
    private emitSubtitle(text: string): void {
        this.subtitleCallbacks.forEach((callback) => {
            try {
                callback(text)
            } catch (error) {
                console.error("Error in subtitle callback:", error)
            }
        })
    }

    /**
     * EMIT ERROR EVENT
     * 
     * Notifies all error subscribers of a pipeline error.
     * Called when mediation fails or other errors occur.
     */
    private emitError(error: string): void {
        this.errorCallbacks.forEach((callback) => {
            try {
                callback(error)
            } catch (error) {
                console.error("Error in error callback:", error)
            }
        })
    }

    // ========================================================================
    // PIPELINE STAGE TRANSITIONS
    // ========================================================================

    /**
     * TRANSITION TO STAGE
     * 
     * Moves the pipeline to a new stage and emits corresponding status event.
     * This is the core state machine transition function.
     * 
     * DATA FLOW:
     * Pipeline Stage → UI Status → Status Event → UI Update
     * 
     * @param stage - Target pipeline stage
     */
    private transitionTo(stage: PipelineStage): void {
        this.currentStage = stage
        const status = mapStageToStatus(stage)
        console.log(`🔄 Pipeline: ${stage} → UI: ${status}`)
        this.emitStatus(status)
    }

    // ========================================================================
    // TIMEOUT MANAGEMENT
    // ========================================================================

    /**
     * SCHEDULE TRANSITION
     * 
     * Schedules a pipeline stage transition after a delay.
     * Timeout handle is tracked for cancellation.
     * 
     * @param stage - Target stage to transition to
     * @param delay - Delay in milliseconds
     */
    private scheduleTransition(stage: PipelineStage, delay: number): void {
        const timeout = setTimeout(() => {
            this.transitionTo(stage)
        }, delay)
        this.timeouts.push(timeout)
    }

    /**
     * CLEAR ALL TIMEOUTS
     * 
     * Cancels all pending transitions. Called during pipeline cancellation
     * or when starting a new pipeline execution.
     */
    private clearTimeouts(): void {
        this.timeouts.forEach((timeout) => clearTimeout(timeout))
        this.timeouts = []
    }

    // ========================================================================
    // MAIN PIPELINE EXECUTION
    // ========================================================================

    /**
     * PROCESS INPUT
     * 
     * Main entry point for pipeline execution. Receives an input event,
     * processes it through the AI pipeline, and emits output events.
     * 
     * PIPELINE FLOW:
     * 1. INGEST: Validate input and context
     * 2. UNDERSTAND: Call AI mediation layer (1200ms)
     * 3. GENERATE: Prepare output (800ms)
     * 4. DELIVER: Emit subtitle and return to ingest (2000ms)
     * 
     * CONCURRENCY HANDLING:
     * If pipeline is already processing, this call is ignored.
     * Future enhancement: queue inputs instead of dropping them.
     * 
     * ERROR HANDLING:
     * - Invalid input → emit error event
     * - Mediation failure → emit error event with fallback text
     * - Unexpected errors → log and reset to ingest
     * 
     * @param event - Input event (speech, gesture, vision)
     * @param context - Pipeline context (mode, context, history)
     */
    async processInput(event: InputEvent, context: PipelineContext): Promise<void> {
        // ====================================================================
        // CONCURRENCY GUARD
        // ====================================================================
        if (this.isProcessing) {
            console.warn("⚠️ Pipeline already processing, ignoring input")
            return
        }

        // ====================================================================
        // STAGE 1: INGEST - Validate and prepare input
        // ====================================================================
        this.isProcessing = true
        this.clearTimeouts()
        this.transitionTo("ingest")

        try {
            // Extract raw input text based on event type
            let rawInput: string

            switch (event.type) {
                case "speech":
                    rawInput = event.transcript
                    console.log("🎤 Processing speech input:", rawInput)
                    break

                case "gesture":
                    rawInput = event.phrase
                    console.log("👋 Processing gesture input:", event.intent, "→", rawInput)
                    break

                case "vision":
                    // Future: process vision data
                    console.warn("⚠️ Vision input not yet implemented")
                    this.isProcessing = false
                    return

                default:
                    console.error("❌ Unknown input type:", (event as any).type)
                    this.emitError("Unknown input type")
                    this.isProcessing = false
                    return
            }

            // Validate input
            if (!rawInput || rawInput.trim().length === 0) {
                console.warn("⚠️ Empty input, ignoring")
                this.isProcessing = false
                this.transitionTo("ingest")
                return
            }

            // ====================================================================
            // STAGE 2: UNDERSTAND - AI mediation and context analysis
            // ====================================================================
            this.transitionTo("understand")

            // Call AI mediation layer
            // This is where raw input gets transformed into clear, mediated text
            const mediationResult = await mediateIntent({
                rawInput: rawInput,
                mode: context.mode,
                context: context.context,
                recentHistory: context.recentHistory,
            })

            // Determine final text (mediated or fallback to raw)
            const finalText = mediationResult.success ? mediationResult.mediatedText : rawInput

            if (!mediationResult.success) {
                // Only emit error for actual failures, not for expected fallback cases
                if (mediationResult.error === "API key not configured") {
                    // Soft warning: mediation disabled, pipeline continues with raw input
                    console.warn("⚠️ Mediation disabled: API key not configured. Using raw input.")
                } else if (mediationResult.error === "timeout") {
                    // Timeout is expected control flow in real-time systems
                    console.warn("⏱️ Pipeline continuing without mediation (timeout)")
                } else {
                    // Actual mediation failure - emit error to UI
                    console.warn("⚠️ Mediation failed, using raw input:", mediationResult.error)
                    this.emitError(`Mediation failed: ${mediationResult.error}`)
                }
            }

            // ====================================================================
            // STAGE 3: GENERATE - Prepare output
            // ====================================================================
            // Transition to generate stage after understanding duration
            this.scheduleTransition("generate", PIPELINE_TIMINGS.understanding)

            // Wait for generate stage to complete
            await new Promise((resolve) => {
                const timeout = setTimeout(resolve, PIPELINE_TIMINGS.understanding + PIPELINE_TIMINGS.responding)
                this.timeouts.push(timeout)
            })

            // ====================================================================
            // STAGE 4: DELIVER - Emit output and return to ingest
            // ====================================================================
            this.transitionTo("deliver")

            // Emit subtitle for UI display
            this.emitSubtitle(finalText)

            // TODO: EXTENSION POINT - Avatar Animation
            // Trigger 3D avatar signing animation here
            // Example:
            // if (context.mode === 'hearing-to-deaf') {
            //   avatarController.startSigning(finalText)
            // }

            // TODO: EXTENSION POINT - Text-to-Speech
            // TTS is currently handled in application-interface.tsx
            // Could be moved here for better encapsulation
            // Example:
            // if (context.mode === 'deaf-to-hearing') {
            //   speechSynthesis.speak({ text: finalText, context: context.context })
            // }

            // Return to ingest after speaking duration
            this.scheduleTransition("ingest", PIPELINE_TIMINGS.speaking)

            // Wait for speaking to complete before allowing next input
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.isProcessing = false
                    resolve(undefined)
                }, PIPELINE_TIMINGS.speaking)
                this.timeouts.push(timeout)
            })
        } catch (error: any) {
            // ====================================================================
            // ERROR HANDLING
            // ====================================================================
            console.error("❌ Pipeline error:", error)
            this.emitError(error.message || "Unknown pipeline error")

            // Reset to ingest state
            this.isProcessing = false
            this.clearTimeouts()
            this.transitionTo("ingest")
        }
    }

    // ========================================================================
    // CANCELLATION API
    // ========================================================================

    /**
     * CANCEL PIPELINE
     * 
     * Immediately stops the current pipeline execution and returns to
     * ingest state. Called when:
     * - User changes mode or context
     * - Component unmounts
     * - New input arrives while processing (future enhancement)
     * 
     * CLEANUP:
     * - Clears all pending timeouts
     * - Resets processing flag
     * - Transitions to ingest state
     */
    cancel(): void {
        console.log("🛑 Cancelling pipeline")
        this.clearTimeouts()
        this.isProcessing = false
        this.transitionTo("ingest")
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * GET CURRENT STATUS
     * 
     * Returns the current UI status for debugging or conditional logic.
     * 
     * @returns Current UI status
     */
    getCurrentStatus(): UIStatus {
        return mapStageToStatus(this.currentStage)
    }

    /**
     * IS PROCESSING
     * 
     * Checks if the pipeline is currently processing an input.
     * 
     * @returns true if processing, false if idle
     */
    isCurrentlyProcessing(): boolean {
        return this.isProcessing
    }
}

// ============================================================================
// FUTURE ENHANCEMENTS
// ============================================================================

/**
 * TODO: Input Queueing
 * 
 * Currently, inputs are dropped if pipeline is busy. Consider implementing
 * a queue to handle rapid inputs gracefully.
 * 
 * Example:
 * private inputQueue: Array<{ event: InputEvent, context: PipelineContext }> = []
 * 
 * async processInput(event, context) {
 *   if (this.isProcessing) {
 *     this.inputQueue.push({ event, context })
 *     return
 *   }
 *   // ... process ...
 *   if (this.inputQueue.length > 0) {
 *     const next = this.inputQueue.shift()
 *     this.processInput(next.event, next.context)
 *   }
 * }
 */

/**
 * TODO: NLP Processing Hook
 * 
 * Add extension point for medical term extraction and context analysis.
 * 
 * Example:
 * interface NLPResult {
 *   medicalTerms: string[]
 *   urgencyLevel: 'low' | 'medium' | 'high'
 *   suggestedContext: MediationContext
 * }
 * 
 * onUnderstand?: (input: string) => Promise<NLPResult>
 */

/**
 * TODO: Avatar Animation Hook
 * 
 * Add extension point for 3D avatar sign language animation.
 * 
 * Example:
 * interface AnimationCommands {
 *   signs: Array<{ sign: string, duration: number }>
 *   facialExpression: 'neutral' | 'concerned' | 'urgent'
 *   bodyLanguage: 'calm' | 'animated'
 * }
 * 
 * onGenerate?: (text: string) => Promise<AnimationCommands>
 */

/**
 * TODO: Vision Processing Hook
 * 
 * Add extension point for video-based sign language recognition.
 * 
 * Example:
 * interface VisionResult {
 *   detectedSigns: string[]
 *   confidence: number
 *   handedness: 'left' | 'right' | 'both'
 * }
 * 
 * onVisionInput?: (data: VideoFrame) => Promise<VisionResult>
 */

/**
 * TODO: Pipeline Analytics
 * 
 * Track pipeline performance and errors for observability.
 * 
 * Example:
 * interface PipelineMetrics {
 *   totalInputs: number
 *   successfulMediations: number
 *   failedMediations: number
 *   averageProcessingTime: number
 * }
 * 
 * getMetrics(): PipelineMetrics
 */
