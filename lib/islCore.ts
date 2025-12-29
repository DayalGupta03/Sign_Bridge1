
import * as THREE from "three"

// ============================================================================
// ISL SIGN SYSTEM TYPES & CONSTANTS
// ============================================================================

export type ISLGloss =
    // 1-10
    | "HELLO" | "GOODBYE" | "PLEASE" | "THANK_YOU" | "SORRY"
    | "GOOD" | "BAD" | "YES" | "NO" | "I_ME"
    // 11-20
    | "YOU" | "HE_SHE_IT" | "WE_US" | "THEY_THEM" | "MY_MINE"
    | "YOUR_YOURS" | "WHO" | "WHAT" | "WHERE" | "WHEN"
    // 21-30
    | "WHY" | "HOW" | "HAPPY" | "SAD" | "ANGRY"
    | "TIRED" | "SICK" | "HURT" | "SCARED" | "EXCITED"
    // 31-40
    | "BORED" | "HUNGRY" | "THIRSTY" | "LOVE" | "EAT"
    | "DRINK" | "SLEEP" | "WAKE_UP" | "GO" | "COME"
    // 41-50
    | "WALK" | "RUN" | "HELP" | "STOP" | "WAIT"
    | "FINISH" | "WANT" | "NEED" | "LIKE" | "DONT_LIKE"
    // 51-60
    | "HAVE" | "GET" | "GIVE" | "TAKE" | "SHOW"
    | "LOOK" | "WATCH" | "LISTEN" | "UNDERSTAND" | "DONT_UNDERSTAND"
    // 61-70
    | "WORK" | "SCHOOL" | "LEARN" | "TEACH" | "READ"
    | "WRITE" | "DRIVE" | "PLAY" | "LAUGH" | "CRY"
    // 71-80
    | "SLEEP_POSE" | "WATER" | "FOOD" | "MILK" | "COFFEE"
    | "TEA" | "APPLE" | "BREAD" | "PIZZA" | "HOME"
    // 81-90
    | "HOUSE" | "SCHOOL_PLACE" | "BATHROOM" | "STORE" | "RESTAURANT"
    | "HOSPITAL" | "CHURCH" | "CITY" | "PARK" | "NOW"
    // 91-100
    | "TODAY" | "YESTERDAY" | "TOMORROW" | "MORNING" | "AFTERNOON"
    | "NIGHT" | "WEEK" | "MONTH" | "AGAIN" | "ALWAYS"
    | "THINK" | "KNOW"

export interface FingerCurlPreset {
    index: number    // 0–1 (0 = straight, 1 = fully curled)
    middle: number
    ring: number
    pinky: number
    thumb?: number   // 0–1 (0 = extended, 1 = tucked against palm)
    // NOTE: Thumb curl values are approximate and may need axis adjustment per rig
}

/**
 * Internal animation sub-steps for multi-pose ASL signs.
 * These are NOT semantic glosses—they are animation keyframes
 * used by the Phase 3 sequencer to play multi-step signs.
 */
export type ASLStep =
    | "HELLO_START" | "HELLO_END"
    | "GOODBYE_1" | "GOODBYE_2" | "GOODBYE_3"
    | "PLEASE_1" | "PLEASE_2" | "PLEASE_3"
    | "THANKYOU_START" | "THANKYOU_END"
    | "SORRY_1" | "SORRY_2" | "SORRY_3"

export interface ISLSign {
    gloss: ISLGloss
    leftTarget?: { x: number; y: number; z: number }   // shoulder-local space (optional)
    rightTarget?: { x: number; y: number; z: number }  // shoulder-local space (optional)
    leftFingers?: FingerCurlPreset
    rightFingers?: FingerCurlPreset
    leftPalm?: THREE.Quaternion    // Phase 2 - not applied in Phase 1
    rightPalm?: THREE.Quaternion   // Phase 2 - not applied in Phase 1
    sequence?: ASLStep[]           // Multi-step signs: list of sub-step keys to play
}

// ============================================================================
// SIGNING SPACE CONSTANTS
// ============================================================================

export const SIGNING_SPACE_SCALE = 0.35  // meters, chest-level signing radius

export const SIGNING_SPACE = {
    FORWARD_OFFSET: 0.35,
    LEFT_X_OFFSET: -0.18,
    RIGHT_X_OFFSET: 0.18,
    UPWARD_OFFSET: 0.16,
    REST_BLEND: 0.25,
}

// ============================================================================
// PALM ORIENTATION CONSTANTS
// ============================================================================

export const PALM_BLEND = 0.12  // Soft blend factor for palm orientation slerp (prevents snapping)

// Pre-computed palm orientation quaternions
export const PALM_ORIENTATIONS = {
    // *** DEFAULT: Palm facing FORWARD (toward camera/viewer) - fingers pointing UP ***
    // X rotation (PI/2) lifts palm from looking down to looking forward. Z rotation removed to prevent horizontal flip.
    PALM_FORWARD: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),

    // Palm facing outward (away from body) - Vertical
    PALM_OUT: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),

    // Palm facing inward (toward body) - for PLEASE, MY_MINE
    PALM_IN: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),

    // Palm facing down - for BAD end position
    PALM_DOWN: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),

    // Palm facing up - for WANT, offering gestures
    PALM_UP: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),

    // Palm facing sideways (neutral) - for YES fist
    PALM_SIDE: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),

    // Palm angled toward face - for EAT, DRINK
    PALM_TO_FACE: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0)),

    // === NEW PALM ORIENTATIONS ===
    // Palm angled forward and down - for pointing/indexing gestures
    PALM_FORWARD_DOWN: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 6, 0, 0)),

    // Palm angled inward at 45° - for LOOK, SEE (V-hand from eyes)
    PALM_ANGLED_IN: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),

    // Palm facing other palm - for symmetrical gestures like WORK
    PALM_FACING: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)),

    // Palm facing sideways but inward (for "I", "ME")
    PALM_SIDE_IN: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 1.5, 0)),
} as const

export const DEFAULT_PALM_ORIENTATION = PALM_ORIENTATIONS.PALM_FORWARD
