/**
 * AVATAR STATE CONTRACT
 * 
 * Formal interface between AI pipeline and avatar renderer.
 * This is the ONLY data the avatar can consume.
 * 
 * DESIGN PRINCIPLES:
 * - Declarative, not imperative
 * - Renderer-agnostic (works with 2D or 3D)
 * - Extensible without breaking changes
 * - No pipeline internals exposed
 * 
 * ARCHITECTURE:
 * Pipeline Status → useAvatarController → AvatarState → AvatarRenderer → Visuals
 *     (input)          (translator)       (contract)     (renderer)      (output)
 */

// ============================================================================
// AVATAR MODE - High-level behavior state
// ============================================================================

/**
 * AVATAR MODE
 * 
 * High-level behavior state that determines animation style.
 * Maps directly from pipeline status.
 * 
 * MODES:
 * - idle: Calm, waiting for input (pipeline: listening)
 * - processing: Thinking, analyzing (pipeline: understanding/responding)
 * - speaking: Active output delivery (pipeline: speaking)
 */
export type AvatarMode = "idle" | "processing" | "speaking"

// ============================================================================
// AVATAR STATE - Complete declarative state
// ============================================================================

/**
 * AVATAR STATE
 * 
 * Complete declarative state for avatar rendering.
 * All animation parameters are normalized 0.0 - 1.0 for consistency.
 * 
 * USAGE:
 * const avatarState = useAvatarController({ status, context })
 * <AvatarRenderer avatarState={avatarState} />
 * 
 * CONSTRAINTS:
 * - Avatar renderer can ONLY access this interface
 * - No direct pipeline access allowed
 * - All future features plug into this contract
 */
export interface AvatarState {
    // ==========================================================================
    // CORE BEHAVIOR - Always present
    // ==========================================================================

    /**
     * Current behavior mode
     * Determines which animation set to use
     */
    mode: AvatarMode

    /**
     * Animation intensity (0.0 - 1.0)
     * 
     * Controls how much the avatar moves:
     * - 0.0: Minimal movement (calm, subtle)
     * - 0.5: Normal movement (standard)
     * - 1.0: Maximum movement (urgent, expressive)
     * 
     * USAGE:
     * - Multiply base animation amplitudes by intensity
     * - Scale breathing depth, head nod amount, etc.
     */
    intensity: number

    /**
     * Animation tempo multiplier (0.5 - 2.0)
     * 
     * Controls how fast animations play:
     * - 0.5: Slow, deliberate (hospital context)
     * - 1.0: Normal speed
     * - 2.0: Fast, urgent (emergency context)
     * 
     * USAGE:
     * - Divide animation durations by tempo
     * - Speed up breathing cycles, head movements, etc.
     */
    tempo: number

    // ==========================================================================
    // EXTENSION POINTS - Future features (optional)
    // ==========================================================================

    /**
     * LIP-SYNC DATA (Phase 5C)
     * 
     * Phoneme-level mouth animation data.
     * Populated by TTS integration when speaking.
     * 
     * INTEGRATION POINT:
     * In lib/speech-synthesis.ts, add phoneme event listener:
     * 
     * speechSynthesis.on('phoneme', (phonemeData) => {
     *   setLipSyncData({
     *     currentPhoneme: phonemeData.phoneme,
     *     viseme: mapPhonemeToViseme(phonemeData.phoneme),
     *     nextPhoneme: phonemeData.nextPhoneme,
     *     timestamp: Date.now()
     *   })
     * })
     * 
     * Then in useAvatarController:
     * const avatarState: AvatarState = {
     *   mode, intensity, tempo,
     *   lipSync: currentLipSyncData  // ← Plug in here
     * }
     * 
     * RENDERER USAGE:
     * if (avatarState.lipSync) {
     *   // Animate mouth blendshapes based on viseme
     *   mouthMesh.morphTargetInfluences[0] = avatarState.lipSync.viseme
     * }
     */
    lipSync?: {
        currentPhoneme: string // Current phoneme being spoken (e.g., 'AH', 'T', 'S')
        viseme: number // Mouth openness 0.0 - 1.0
        nextPhoneme?: string // Next phoneme for smooth transitions
        timestamp: number // When this phoneme started (ms)
    }

    /**
     * SIGN LANGUAGE ANIMATION (Phase 6)
     * 
     * Hand/arm position targets for sign language.
     * Populated by sign language generation during speaking.
     * 
     * INTEGRATION POINT:
     * In lib/aiPipelineController.ts, add generate hook:
     * 
     * pipelineController.onGenerate = async (text) => {
     *   const signCommands = await generateSignLanguage(text)
     *   setSigningData({
     *     leftHand: signCommands.leftHandTarget,
     *     rightHand: signCommands.rightHandTarget,
     *     handShape: signCommands.shape,
     *     duration: signCommands.duration
     *   })
     * }
     * 
     * Then in useAvatarController:
     * const avatarState: AvatarState = {
     *   mode, intensity, tempo,
     *   signing: currentSigningData  // ← Plug in here
     * }
     * 
     * RENDERER USAGE:
     * if (avatarState.signing) {
     *   // Animate arm IK to target positions
     *   animateArmIK(leftArm, avatarState.signing.leftHand)
     *   animateArmIK(rightArm, avatarState.signing.rightHand)
     *   setHandShape(avatarState.signing.handShape)
     * }
     */
    signing?: {
        leftHand: { x: number; y: number; z: number } // Position in avatar space (-1 to 1)
        rightHand: { x: number; y: number; z: number } // Position in avatar space (-1 to 1)
        handShape: string // Hand configuration (e.g., 'FLAT', 'FIST', 'POINT')
        duration: number // How long to hold this sign (ms)
    }

    /**
     * FACIAL EXPRESSION (Phase 5D)
     * 
     * Emotional state for facial blendshapes.
     * Derived from context and conversation analysis.
     * 
     * INTEGRATION POINT:
     * In lib/mediator.ts, add emotion analysis:
     * 
     * const emotionAnalysis = analyzeEmotionalContext(context, recentHistory)
     * setExpressionData({
     *   type: emotionAnalysis.emotion,
     *   intensity: emotionAnalysis.confidence,
     *   eyebrowRaise: emotionAnalysis.eyebrowRaise,
     *   mouthCurve: emotionAnalysis.mouthCurve
     * })
     * 
     * Then in useAvatarController:
     * const avatarState: AvatarState = {
     *   mode, intensity, tempo,
     *   expression: currentExpressionData  // ← Plug in here
     * }
     * 
     * RENDERER USAGE:
     * if (avatarState.expression) {
     *   // Animate facial blendshapes
     *   faceMesh.morphTargetInfluences['eyebrowRaise'] = avatarState.expression.eyebrowRaise
     *   faceMesh.morphTargetInfluences['mouthSmile'] = avatarState.expression.mouthCurve
     * }
     */
    expression?: {
        type: "neutral" | "concerned" | "reassuring" | "focused" // Emotion type
        intensity: number // How strongly to show this emotion (0.0 - 1.0)
        eyebrowRaise?: number // Eyebrow position (-1.0 down to 1.0 up)
        mouthCurve?: number // Mouth shape (-1.0 frown to 1.0 smile)
    }
}

// ============================================================================
// DEFAULT STATE - Safe fallback
// ============================================================================

/**
 * DEFAULT AVATAR STATE
 * 
 * Safe fallback when no pipeline data available.
 * Used during initialization or error states.
 */
export const DEFAULT_AVATAR_STATE: AvatarState = {
    mode: "idle",
    intensity: 0.3,
    tempo: 1.0,
}
