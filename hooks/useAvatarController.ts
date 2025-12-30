/**
 * AVATAR CONTROLLER HOOK
 * 
 * Pure translation layer: Pipeline Status → AvatarState
 * 
 * RESPONSIBILITIES:
 * - Map pipeline status to avatar mode
 * - Calculate intensity and tempo based on context
 * - Prepare extension point data (when available)
 * 
 * CONSTRAINTS:
 * - NO animation logic (that belongs in renderer)
 * - NO Three.js code (renderer-agnostic)
 * - NO direct rendering (pure data transformation)
 * - NO side effects (pure function)
 * 
 * ARCHITECTURE:
 * Pipeline Status → useAvatarController → AvatarState → AvatarRenderer
 *     (input)          (translator)       (contract)     (renderer)
 */

import { useMemo } from "react"
import type { AvatarState, AvatarMode } from "@/lib/avatarState"
import { DEFAULT_AVATAR_STATE } from "@/lib/avatarState"

// ============================================================================
// TYPES - Pipeline inputs
// ============================================================================

type SystemStatus = "listening" | "understanding" | "responding" | "speaking"
type Context = "hospital" | "emergency"

interface AvatarControllerProps {
    status: SystemStatus
    context: Context
}

// ============================================================================
// HOOK - Main translation function
// ============================================================================

/**
 * USE AVATAR CONTROLLER
 * 
 * Translates pipeline state into avatar state.
 * This is the ONLY place where pipeline status is converted to avatar mode.
 * 
 * USAGE:
 * const avatarState = useAvatarController({ status, context })
 * <AvatarRenderer avatarState={avatarState} />
 * 
 * @param status - Current pipeline processing status
 * @param context - Current medical context (hospital vs emergency)
 * @returns Complete avatar state for rendering
 */
export function useAvatarController({ status, context }: AvatarControllerProps): AvatarState {
    return useMemo(() => {
        // ========================================================================
        // PIPELINE STATUS → AVATAR MODE
        // ========================================================================
        // Pipeline has 4 states, avatar has 3 modes.
        // Collapse understanding + responding into "processing" mode.

        const mode: AvatarMode = mapStatusToMode(status)

        // ========================================================================
        // CONTEXT → TEMPO
        // ========================================================================
        // Emergency context = faster animations (convey urgency)
        // Hospital context = normal speed (convey calm)

        const tempo = context === "emergency" ? 1.5 : 1.0

        // ========================================================================
        // STATUS + CONTEXT → INTENSITY
        // ========================================================================
        // Calculate how expressive the avatar should be.
        // Emergency increases intensity for all states.

        const intensity = calculateIntensity(status, context)

        // ========================================================================
        // ASSEMBLE AVATAR STATE
        // ========================================================================

        const avatarState: AvatarState = {
            mode,
            intensity,
            tempo,

            // ======================================================================
            // EXTENSION POINTS - Populated by future integrations
            // ======================================================================

            // LIP-SYNC (Phase 5C)
            // Will be populated by TTS integration in lib/speech-synthesis.ts
            // 
            // Integration example:
            // speechSynthesis.on('phoneme', (phonemeData) => {
            //   setLipSyncData({
            //     currentPhoneme: phonemeData.phoneme,
            //     viseme: mapPhonemeToViseme(phonemeData.phoneme),
            //     nextPhoneme: phonemeData.nextPhoneme,
            //     timestamp: Date.now()
            //   })
            // })
            //
            // Then add here:
            // lipSync: currentLipSyncData,

            // SIGNING (Phase 6)
            // Will be populated by sign language generation in lib/aiPipelineController.ts
            //
            // Integration example:
            // pipelineController.onGenerate = async (text) => {
            //   const signCommands = await generateSignLanguage(text)
            //   setSigningData({
            //     leftHand: signCommands.leftHandTarget,
            //     rightHand: signCommands.rightHandTarget,
            //     handShape: signCommands.shape,
            //     duration: signCommands.duration
            //   })
            // }
            //
            // Then add here:
            // signing: currentSigningData,

            // EXPRESSION (Phase 5D)
            // Will be populated by emotion analysis in lib/mediator.ts
            //
            // Integration example:
            // const emotionAnalysis = analyzeEmotionalContext(context, recentHistory)
            // setExpressionData({
            //   type: emotionAnalysis.emotion,
            //   intensity: emotionAnalysis.confidence,
            //   eyebrowRaise: emotionAnalysis.eyebrowRaise,
            //   mouthCurve: emotionAnalysis.mouthCurve
            // })
            //
            // Then add here:
            // expression: currentExpressionData,
        }

        return avatarState
    }, [status, context])
}

// ============================================================================
// MAPPING FUNCTIONS - Pure translation logic
// ============================================================================

/**
 * MAP PIPELINE STATUS TO AVATAR MODE
 * 
 * Converts 4-state pipeline into 3-mode avatar behavior.
 * 
 * MAPPING:
 * - listening → idle (calm, waiting)
 * - understanding → processing (thinking)
 * - responding → processing (preparing)
 * - speaking → speaking (active output)
 * 
 * RATIONALE:
 * Understanding and responding are visually similar from user perspective
 * (avatar is "thinking"), so we collapse them into one mode.
 * 
 * @param status - Pipeline processing status
 * @returns Avatar behavior mode
 */
function mapStatusToMode(status: SystemStatus): AvatarMode {
    switch (status) {
        case "listening":
            // Calm idle state - waiting for input
            return "idle"

        case "understanding":
        case "responding":
            // Processing state - AI is thinking/preparing
            // Collapsed into single mode for visual simplicity
            return "processing"

        case "speaking":
            // Active output delivery - avatar is communicating
            return "speaking"

        default:
            // Fallback to idle for unknown states
            return "idle"
    }
}

/**
 * CALCULATE ANIMATION INTENSITY
 * 
 * Determines how expressive the avatar should be.
 * Higher intensity = larger movements, more visible animation.
 * 
 * FACTORS:
 * - Status: Different states have different base intensities
 * - Context: Emergency increases intensity by 30%
 * 
 * INTENSITY SCALE:
 * - 0.0 - 0.2: Minimal (subtle breathing only)
 * - 0.2 - 0.4: Low (calm, gentle movements)
 * - 0.4 - 0.6: Normal (standard expressiveness)
 * - 0.6 - 0.8: High (active, noticeable movements)
 * - 0.8 - 1.0: Maximum (urgent, highly expressive)
 * 
 * @param status - Pipeline processing status
 * @param context - Medical context (hospital vs emergency)
 * @returns Intensity value 0.0 - 1.0
 */
function calculateIntensity(status: SystemStatus, context: Context): number {
    // Base intensity by status
    // These values are tuned for natural, non-distracting animation
    const baseIntensity: Record<SystemStatus, number> = {
        listening: 0.3, // Calm idle breathing - subtle presence
        understanding: 0.2, // Focused, minimal movement - "thinking"
        responding: 0.2, // Still, preparing - building anticipation
        speaking: 0.5, // Active, expressive - delivering output
    }

    let intensity = baseIntensity[status]

    // Emergency context increases intensity (convey urgency)
    if (context === "emergency") {
        intensity = Math.min(1.0, intensity * 1.3) // 30% increase, capped at 1.0
    }

    return intensity
}
