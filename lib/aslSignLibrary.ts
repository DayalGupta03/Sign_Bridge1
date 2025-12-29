/**
 * ASL Multi-Step Sign Library
 * 
 * This file contains multi-step sign definitions for ASL signs that require motion.
 * Each sign is decomposed into discrete animation keyframes that the Phase 3
 * sequencer plays in order.
 * 
 * DESIGN NOTES:
 * - Multi-step signs approximate continuous motion with static poses
 * - Circular motions (PLEASE, SORRY) use 3 points constrained to ≤15cm radius
 * - All positions are shoulder-local offsets in meters
 * - Palm orientations use pre-computed quaternions from islCore.ts
 */

import { ASLStep, FingerCurlPreset, PALM_ORIENTATIONS, SIGNING_SPACE_SCALE } from "./islCore"
import * as THREE from "three"

// ============================================================================
// HANDSHAPE PRESETS
// ============================================================================

/** Flat hand: all fingers extended, thumb relaxed */
const FLAT_HAND: FingerCurlPreset = {
    index: 0,
    middle: 0,
    ring: 0,
    pinky: 0,
    thumb: 0.2  // Relaxed, not over-curled
}

/** Closed fist for SORRY sign */
const FIST: FingerCurlPreset = {
    index: 1,
    middle: 1,
    ring: 1,
    pinky: 1,
    thumb: 0.8  // Curled but not fully tucked
}

// ============================================================================
// ASL STEP DEFINITIONS
// ============================================================================

export interface ASLStepDefinition {
    rightTarget?: { x: number; y: number; z: number }
    leftTarget?: { x: number; y: number; z: number }
    rightFingers?: FingerCurlPreset
    leftFingers?: FingerCurlPreset
    rightPalm?: THREE.Quaternion
    leftPalm?: THREE.Quaternion
}

/**
 * Step-by-step animation definitions for multi-pose ASL signs.
 * 
 * WHY MULTI-STEP:
 * ASL signs like HELLO, GOODBYE, PLEASE, THANK YOU, and SORRY convey meaning
 * through MOTION, not static postures. A single static pose does not read as
 * the intended sign. We approximate the motion using discrete keyframes that
 * the Phase 3 sequencer interpolates between.
 */
export const ASL_STEP_LIBRARY: Record<ASLStep, ASLStepDefinition> = {
    // ========================================================================
    // HELLO (2-step salute gesture)
    // Motion: Hand near eyebrow/temple → outward arc
    // SEMANTIC: Face-adjacent start, palm outward, no wave
    // ========================================================================
    HELLO_START: {
        // Hand near right eyebrow - FACE ADJACENT for readability
        rightTarget: { x: 0.18, y: 0.20, z: 0.05 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    HELLO_END: {
        // Outward arc motion - salute gesture completion
        rightTarget: { x: 0.28, y: 0.22, z: 0.18 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },

    // ========================================================================
    // GOODBYE (3-step wave gesture)
    // SEMANTIC: Readable lateral wave, X-axis motion only
    // ========================================================================
    GOODBYE_1: {
        // Base position for wave
        rightTarget: { x: 0.24, y: 0.22, z: 0.12 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    GOODBYE_2: {
        // Lateral shift right - readable wave motion
        rightTarget: { x: 0.30, y: 0.22, z: 0.12 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    GOODBYE_3: {
        // Return to base - completes wave
        rightTarget: { x: 0.24, y: 0.22, z: 0.12 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },

    // ========================================================================
    // PLEASE (3-step circular chest rub)
    // SEMANTIC: Small, tight, polite motion - tight radius
    // ========================================================================
    PLEASE_1: {
        // Center chest contact
        rightTarget: { x: 0.10, y: 0.12, z: 0.06 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    PLEASE_2: {
        // Slight offset for circular illusion
        rightTarget: { x: 0.14, y: 0.10, z: 0.06 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    PLEASE_3: {
        // Return to center - completes circle
        rightTarget: { x: 0.10, y: 0.12, z: 0.06 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },

    // ========================================================================
    // THANK YOU (2-step chin-to-forward gesture)
    // SEMANTIC: Must touch chin/lips first, then forward release
    // ========================================================================
    THANKYOU_START: {
        // Fingertips at chin - FACE CONTACT for readability
        rightTarget: { x: 0.12, y: 0.18, z: 0.02 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    THANKYOU_END: {
        // Forward release with palm rotation
        rightTarget: { x: 0.30, y: 0.14, z: 0.22 },
        rightFingers: FLAT_HAND,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },

    // ========================================================================
    // SORRY (3-step circular fist on chest)
    // SEMANTIC: Tight circular rub, 8-10cm radius
    // ========================================================================
    SORRY_1: {
        // Center chest with fist
        rightTarget: { x: 0.10, y: 0.12, z: 0.06 },
        rightFingers: FIST,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    SORRY_2: {
        // Slight offset for circular rub
        rightTarget: { x: 0.14, y: 0.10, z: 0.06 },
        rightFingers: FIST,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    SORRY_3: {
        // Return to center - completes rub
        rightTarget: { x: 0.10, y: 0.12, z: 0.06 },
        rightFingers: FIST,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
}

// ============================================================================
// MULTI-STEP SIGN SEQUENCES
// Maps semantic glosses to their animation step sequences
// ============================================================================

/** Sequence mappings for signs that require motion */
export const ASL_SIGN_SEQUENCES: Record<string, ASLStep[]> = {
    HELLO: ["HELLO_START", "HELLO_END"],
    GOODBYE: ["GOODBYE_1", "GOODBYE_2", "GOODBYE_3"],
    PLEASE: ["PLEASE_1", "PLEASE_2", "PLEASE_3"],
    THANK_YOU: ["THANKYOU_START", "THANKYOU_END"],
    SORRY: ["SORRY_1", "SORRY_2", "SORRY_3"],
}
