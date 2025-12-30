/**
 * AVATAR RENDERER - READY PLAYER ME COMPATIBLE
 * 
 * FEATURES:
 * 1. SkeletonUtils.clone() for proper skeleton binding
 * 2. Quaternion-based head animation
 * 3. Camera framed to show ~75% upper body
 * 4. ARM IK solved in SHOULDER-LOCAL space
 * 5. Procedural finger curl animation
 * 6. SIGNING SPACE - Forward-biased target volume
 */

"use client"

import { Suspense, useRef, useEffect, useState, useMemo } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { Environment, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js"
import type { AvatarState } from "@/lib/avatarState"
import { cn } from "@/lib/utils"
import { speechSynthesis, type TTSContext } from "@/lib/speech-synthesis"
import { AvatarIdleStateManager, detectAvatarActivity } from "@/lib/avatarIdleState"
import { avatarCache } from "@/lib/avatarCache"
import {
    ISLGloss,
    ISLSign,
    ISL_SIGN_LIBRARY,
    COMBINED_SIGN_LIBRARY,
    PALM_ORIENTATIONS,
    SIGNING_SPACE,
    SIGNING_SPACE_SCALE,
    DEFAULT_PALM_ORIENTATION,
    FingerCurlPreset,
    PALM_BLEND
} from "@/lib/islSignLibrary"

// Re-export types for consumers of AvatarRenderer
export type { ISLGloss } from "@/lib/islSignLibrary"

// ============================================================================
// HAND POSE TARGETS - Input from MediaPipe
// ============================================================================

export interface HandPoseTargets {
    leftWrist?: { x: number; y: number; z: number }
    rightWrist?: { x: number; y: number; z: number }
}

// ============================================================================
// ISL SIGN SYSTEM - PHASE 1: STATIC SIGNS
// ============================================================================

// ISLGloss imported from library

// Interfaces imported from library

// ============================================================================
// SIGN SEQUENCING - PHASE 3
// ============================================================================

type SequencePhase = "idle" | "transitioning_in" | "holding" | "transitioning_out"

interface SequenceState {
    queue: ISLGloss[]
    currentIndex: number
    phase: SequencePhase
    phaseStartTime: number
}

// ============================================================================
// SIGNING SPACE CONSTANTS
// ============================================================================

// SIGNING_SPACE imported from library

// ============================================================================
// PALM ORIENTATION CONSTANTS
// ============================================================================

// PALM CONSTANTS imported from library

// ============================================================================
// ISL SIGN LIBRARY - CANONICAL SHOULDER-LOCAL COORDINATES
// ============================================================================
// Phase 1 ISL signing space validated and locked.
// Values are anatomically safe and IK-stable.
// Any future changes must be justified by motion-phase evaluation.

// ISL_SIGN_LIBRARY imported from library

// ============================================================================
// BONE NAME FALLBACKS
// ============================================================================

const BONE_NAMES = {
    head: ["Head", "mixamorig:Head", "head", "HeadTop_End"],
    neck: ["Neck", "mixamorig:Neck", "neck"],
    spine2: ["Spine2", "mixamorig:Spine2", "spine2"],
    hips: ["Hips", "mixamorig:Hips", "hips", "pelvis"],

    leftShoulder: ["LeftShoulder", "mixamorig:LeftShoulder", "leftShoulder", "shoulder_L"],
    leftArm: ["LeftArm", "mixamorig:LeftArm", "leftArm", "upper_arm_L"],
    leftForeArm: ["LeftForeArm", "mixamorig:LeftForeArm", "leftForeArm", "forearm_L"],
    leftHand: ["LeftHand", "mixamorig:LeftHand", "leftHand", "hand_L"],

    rightShoulder: ["RightShoulder", "mixamorig:RightShoulder", "rightShoulder", "shoulder_R"],
    rightArm: ["RightArm", "mixamorig:RightArm", "rightArm", "upper_arm_R"],
    rightForeArm: ["RightForeArm", "mixamorig:RightForeArm", "rightForeArm", "forearm_R"],
    rightHand: ["RightHand", "mixamorig:RightHand", "rightHand", "hand_R"],

    leftIndexProximal: ["LeftHandIndex1", "mixamorig:LeftHandIndex1", "index_01_L"],
    leftIndexIntermediate: ["LeftHandIndex2", "mixamorig:LeftHandIndex2", "index_02_L"],
    leftMiddleProximal: ["LeftHandMiddle1", "mixamorig:LeftHandMiddle1", "middle_01_L"],
    leftMiddleIntermediate: ["LeftHandMiddle2", "mixamorig:LeftHandMiddle2", "middle_02_L"],
    leftRingProximal: ["LeftHandRing1", "mixamorig:LeftHandRing1", "ring_01_L"],
    leftRingIntermediate: ["LeftHandRing2", "mixamorig:LeftHandRing2", "ring_02_L"],
    leftPinkyProximal: ["LeftHandPinky1", "mixamorig:LeftHandPinky1", "pinky_01_L"],
    leftPinkyIntermediate: ["LeftHandPinky2", "mixamorig:LeftHandPinky2", "pinky_02_L"],
    leftThumbProximal: ["LeftHandThumb1", "mixamorig:LeftHandThumb1", "thumb_01_L"],
    leftThumbIntermediate: ["LeftHandThumb2", "mixamorig:LeftHandThumb2", "thumb_02_L"],

    rightIndexProximal: ["RightHandIndex1", "mixamorig:RightHandIndex1", "index_01_R"],
    rightIndexIntermediate: ["RightHandIndex2", "mixamorig:RightHandIndex2", "index_02_R"],
    rightMiddleProximal: ["RightHandMiddle1", "mixamorig:RightHandMiddle1", "middle_01_R"],
    rightMiddleIntermediate: ["RightHandMiddle2", "mixamorig:RightHandMiddle2", "middle_02_R"],
    rightRingProximal: ["RightHandRing1", "mixamorig:RightHandRing1", "ring_01_R"],
    rightRingIntermediate: ["RightHandRing2", "mixamorig:RightHandRing2", "ring_02_R"],
    rightPinkyProximal: ["RightHandPinky1", "mixamorig:RightHandPinky1", "pinky_01_R"],
    rightPinkyIntermediate: ["RightHandPinky2", "mixamorig:RightHandPinky2", "pinky_02_R"],
    rightThumbProximal: ["RightHandThumb1", "mixamorig:RightHandThumb1", "thumb_01_R"],
    rightThumbIntermediate: ["RightHandThumb2", "mixamorig:RightHandThumb2", "thumb_02_R"],
} as const

// ============================================================================
// SPEECH SYNTHESIS AND LIP SYNC CONSTANTS
// ============================================================================

// Phoneme to mouth shape mapping for basic lip synchronization
const PHONEME_TO_MOUTH_SHAPE = {
    // Vowels - mouth open shapes
    'A': { openness: 0.8, width: 0.6, roundness: 0.2 }, // "ah" - wide open
    'E': { openness: 0.6, width: 0.8, roundness: 0.1 }, // "eh" - wide, less open
    'I': { openness: 0.4, width: 0.9, roundness: 0.0 }, // "ee" - wide smile
    'O': { openness: 0.7, width: 0.3, roundness: 0.9 }, // "oh" - round
    'U': { openness: 0.5, width: 0.2, roundness: 1.0 }, // "oo" - small round

    // Consonants - mouth closed/shaped
    'M': { openness: 0.0, width: 0.4, roundness: 0.0 }, // lips together
    'B': { openness: 0.0, width: 0.4, roundness: 0.0 }, // lips together
    'P': { openness: 0.0, width: 0.4, roundness: 0.0 }, // lips together
    'F': { openness: 0.2, width: 0.6, roundness: 0.0 }, // teeth on lip
    'V': { openness: 0.2, width: 0.6, roundness: 0.0 }, // teeth on lip
    'T': { openness: 0.3, width: 0.5, roundness: 0.0 }, // tongue position
    'D': { openness: 0.3, width: 0.5, roundness: 0.0 }, // tongue position
    'S': { openness: 0.2, width: 0.7, roundness: 0.0 }, // slight opening
    'Z': { openness: 0.2, width: 0.7, roundness: 0.0 }, // slight opening

    // Default/rest position
    'REST': { openness: 0.1, width: 0.4, roundness: 0.0 }
} as const

// Speech synthesis timing constants
const SPEECH_SYNTHESIS_TIMING = {
    PHONEME_DURATION: 120, // Average phoneme duration in ms
    MOUTH_TRANSITION_SPEED: 0.15, // How fast mouth shapes transition
    LIP_SYNC_SMOOTHING: 0.25, // Smoothing factor for lip movements
    SPEECH_DETECTION_THRESHOLD: 0.1 // Minimum audio level to trigger lip sync
} as const

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================
const SPEAKING_ANIM = { AMPLITUDE: 0.08, FREQUENCY: 2.0, Y_AMPLITUDE: 0.04 }
const IDLE_ANIM = { AMPLITUDE: 0.015, FREQUENCY: 0.5 }

const IK_SMOOTHING = 0.35

const ELBOW_MIN_ANGLE = THREE.MathUtils.degToRad(35)
const ELBOW_MAX_ANGLE = THREE.MathUtils.degToRad(140)

const WRIST_SMOOTHING = 0.25
const WRIST_MAX_ROLL = THREE.MathUtils.degToRad(15)

const FINGER_CURL_MIN = THREE.MathUtils.degToRad(5)
const FINGER_CURL_MAX = THREE.MathUtils.degToRad(85)
const FINGER_CURL_SMOOTHING = 0.15

const SIGN_TRANSITION_DURATION_MS = 600  // Slower, clearer transitions (was 400ms)
const SIGN_HOLD_DURATION_MS = 1200  // Double duration for hospital-grade readability (was 600ms)

// ============================================================================
// PREALLOCATED OBJECTS
// ============================================================================

const _nodQuat = new THREE.Quaternion()
const _tempQuat = new THREE.Quaternion()
const _tempQuat2 = new THREE.Quaternion()
const _ikTargetPos = new THREE.Vector3()
const _signingTargetPos = new THREE.Vector3()
const _shoulderWorldPos = new THREE.Vector3()
const _targetLocal = new THREE.Vector3()
const _armRotationQuat = new THREE.Quaternion()
const _forearmRotationQuat = new THREE.Quaternion()
const _wristQuat = new THREE.Quaternion()
const _euler = new THREE.Euler()
const _shoulderWorldQuat = new THREE.Quaternion()
const _shoulderWorldQuatInv = new THREE.Quaternion()
const _islSignTargetLocal = new THREE.Vector3()
const _islSignTargetWorld = new THREE.Vector3()
const X_AXIS = new THREE.Vector3(1, 0, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)

// ============================================================================
// TARGET INTERPOLATION - PHASE 2
// ============================================================================

/**
 * Pure function: interpolate between two shoulder-local targets (null-safe)
 * Handles sign→sign, idle→sign, and sign→idle transitions
 */
function interpolateTarget(
    prev: THREE.Vector3 | null,
    next: THREE.Vector3 | null,
    t: number
): THREE.Vector3 | null {
    if (prev && next) {
        // Both defined: lerp between them
        return new THREE.Vector3().lerpVectors(prev, next, t)
    } else if (next) {
        // Fade in from idle: lerp from zero to target
        return next.clone().multiplyScalar(t)
    } else if (prev) {
        // Fade out: gently reduce influence, then yield to idle (null target)
        // When t reaches ~0.95, return null to allow natural idle
        if (t > 0.95) return null
        return prev.clone().multiplyScalar(1 - t)
    }
    return null
}

// ============================================================================
// BONE RESOLVER
// ============================================================================

function resolveBone(
    skeleton: THREE.Skeleton,
    boneKey: keyof typeof BONE_NAMES
): THREE.Bone | null {
    const names = BONE_NAMES[boneKey]
    for (const name of names) {
        const bone = skeleton.bones.find(
            (b: THREE.Bone) => b.name === name || b.name.toLowerCase() === name.toLowerCase()
        )
        if (bone) return bone
    }
    return null
}

// ============================================================================
// SIGNING SPACE TRANSFORM
// ============================================================================

function applySigningSpaceOffset(
    rawTarget: THREE.Vector3,
    isLeft: boolean,
    avatarHeight: number
): THREE.Vector3 {
    _signingTargetPos.copy(rawTarget)
    _signingTargetPos.z += SIGNING_SPACE.FORWARD_OFFSET
    _signingTargetPos.x += isLeft ? SIGNING_SPACE.LEFT_X_OFFSET : SIGNING_SPACE.RIGHT_X_OFFSET
    _signingTargetPos.y += SIGNING_SPACE.UPWARD_OFFSET * (avatarHeight / 1.7)
    return _signingTargetPos
}

// ============================================================================
// FINGER CHAIN STRUCTURE
// ============================================================================

interface FingerChain {
    proximal: THREE.Bone
    intermediate: THREE.Bone
    restProximalQuat: THREE.Quaternion
    restIntermediateQuat: THREE.Quaternion
}

interface HandFingers {
    index?: FingerChain
    middle?: FingerChain
    ring?: FingerChain
    pinky?: FingerChain
    thumb?: FingerChain
}

function createFingerChain(
    skeleton: THREE.Skeleton,
    proximalKey: keyof typeof BONE_NAMES,
    intermediateKey: keyof typeof BONE_NAMES
): FingerChain | undefined {
    const proximal = resolveBone(skeleton, proximalKey)
    const intermediate = resolveBone(skeleton, intermediateKey)

    if (proximal && intermediate) {
        return {
            proximal,
            intermediate,
            restProximalQuat: proximal.quaternion.clone(),
            restIntermediateQuat: intermediate.quaternion.clone(),
        }
    }
    return undefined
}

// ============================================================================
// IK CHAIN STRUCTURE
// ============================================================================

interface IKChain {
    shoulder: THREE.Bone
    upperArm: THREE.Bone
    foreArm: THREE.Bone
    hand: THREE.Bone
    upperArmLength: number
    foreArmLength: number
    totalLength: number
    restUpperArmQuat: THREE.Quaternion
    restForeArmQuat: THREE.Quaternion
    restHandQuat: THREE.Quaternion
    prevWristPos: THREE.Vector3
    fingers: HandFingers
}

function createIKChain(
    skeleton: THREE.Skeleton,
    shoulder: THREE.Bone,
    upperArm: THREE.Bone,
    foreArm: THREE.Bone,
    hand: THREE.Bone,
    isLeft: boolean
): IKChain {
    upperArm.updateWorldMatrix(true, false)
    foreArm.updateWorldMatrix(true, false)
    hand.updateWorldMatrix(true, false)

    const upperArmPos = new THREE.Vector3()
    const foreArmPos = new THREE.Vector3()
    const handPos = new THREE.Vector3()

    upperArm.getWorldPosition(upperArmPos)
    foreArm.getWorldPosition(foreArmPos)
    hand.getWorldPosition(handPos)

    const upperArmLength = upperArmPos.distanceTo(foreArmPos)
    const foreArmLength = foreArmPos.distanceTo(handPos)

    const fingers: HandFingers = {}
    if (isLeft) {
        const idx = createFingerChain(skeleton, "leftIndexProximal", "leftIndexIntermediate")
        const mid = createFingerChain(skeleton, "leftMiddleProximal", "leftMiddleIntermediate")
        const rng = createFingerChain(skeleton, "leftRingProximal", "leftRingIntermediate")
        const pnk = createFingerChain(skeleton, "leftPinkyProximal", "leftPinkyIntermediate")
        const thm = createFingerChain(skeleton, "leftThumbProximal", "leftThumbIntermediate")
        if (idx) fingers.index = idx
        if (mid) fingers.middle = mid
        if (rng) fingers.ring = rng
        if (pnk) fingers.pinky = pnk
        if (thm) fingers.thumb = thm
    } else {
        const idx = createFingerChain(skeleton, "rightIndexProximal", "rightIndexIntermediate")
        const mid = createFingerChain(skeleton, "rightMiddleProximal", "rightMiddleIntermediate")
        const rng = createFingerChain(skeleton, "rightRingProximal", "rightRingIntermediate")
        const pnk = createFingerChain(skeleton, "rightPinkyProximal", "rightPinkyIntermediate")
        const thm = createFingerChain(skeleton, "rightThumbProximal", "rightThumbIntermediate")
        if (idx) fingers.index = idx
        if (mid) fingers.middle = mid
        if (rng) fingers.ring = rng
        if (pnk) fingers.pinky = pnk
        if (thm) fingers.thumb = thm
    }

    const fingerCount = Object.values(fingers).filter((f): f is FingerChain => f !== undefined).length
    console.log(`[IK] Chain: arm=${upperArmLength.toFixed(3)}+${foreArmLength.toFixed(3)}, fingers=${fingerCount}`)

    return {
        shoulder,
        upperArm,
        foreArm,
        hand,
        upperArmLength,
        foreArmLength,
        totalLength: upperArmLength + foreArmLength,
        restUpperArmQuat: upperArm.quaternion.clone(),
        restForeArmQuat: foreArm.quaternion.clone(),
        restHandQuat: hand.quaternion.clone(),
        prevWristPos: handPos.clone(),
        fingers,
    }
}

// ============================================================================
// 2-BONE IK SOLVER - SHOULDER-LOCAL SPACE
// ============================================================================

// Easing function for more organic movement (Cubic Ease In-Out equivalent)
function cubicEaseInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Procedural noise helper for "alive" idle movement
function getIdleNoise(time: number, speed: number = 1.0, scale: number = 0.005): THREE.Vector3 {
    return new THREE.Vector3(
        Math.sin(time * speed) * scale,
        Math.cos(time * speed * 1.3) * scale,
        Math.sin(time * speed * 0.7) * scale
    )
}

function solveIK(
    chain: IKChain,
    targetWorld: THREE.Vector3,
    isLeft: boolean,
    frameCount: number
): { elbowAngleDeg: number; targetLocalLength: number } {
    // Update shoulder world matrix
    chain.shoulder.updateWorldMatrix(true, false)
    chain.upperArm.updateWorldMatrix(true, false)

    // Get shoulder world position (CRITICAL: use shoulder, not upperArm)
    chain.shoulder.getWorldPosition(_shoulderWorldPos)

    // Get shoulder world quaternion (rotation)
    chain.shoulder.getWorldQuaternion(_shoulderWorldQuat)
    _shoulderWorldQuatInv.copy(_shoulderWorldQuat).invert()

    // Convert target to SHOULDER-LOCAL space
    _targetLocal.copy(targetWorld).sub(_shoulderWorldPos)
    _targetLocal.applyQuaternion(_shoulderWorldQuatInv)

    let targetDist = _targetLocal.length()

    // Debug: Log target local length
    if (frameCount % 120 === 0) {
        console.log(`[IK] targetLocal length: ${targetDist.toFixed(3)}m (expect 0.25-0.45)`)
    }

    const maxReach = chain.totalLength * 0.90
    const minReach = Math.abs(chain.upperArmLength - chain.foreArmLength) * 1.3

    if (targetDist > maxReach) {
        targetDist = maxReach
        _targetLocal.normalize().multiplyScalar(targetDist)
    }
    if (targetDist < minReach) {
        targetDist = minReach
    }

    const a = chain.upperArmLength
    const b = chain.foreArmLength
    const c = targetDist

    // Elbow angle via law of cosines
    let cosElbow = (a * a + b * b - c * c) / (2 * a * b)
    cosElbow = THREE.MathUtils.clamp(cosElbow, -1, 1)
    const rawElbowAngle = Math.acos(cosElbow)

    // Elbow bend = π - internal angle
    const elbowBendAngle = Math.PI - rawElbowAngle
    const clampedBendAngle = THREE.MathUtils.clamp(elbowBendAngle, ELBOW_MIN_ANGLE, ELBOW_MAX_ANGLE)

    // Shoulder angle to lift arm toward target
    let cosShoulder = (a * a + c * c - b * b) / (2 * a * c)
    cosShoulder = THREE.MathUtils.clamp(cosShoulder, -1, 1)
    const shoulderAngle = Math.acos(cosShoulder)

    // Direction to target in LOCAL shoulder space
    const targetDir = _targetLocal.clone().normalize()

    // Default arm direction in local space (T-pose: arm extends outward)
    const defaultArmDir = isLeft ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0)

    // Rotation from default arm direction to target direction
    _armRotationQuat.setFromUnitVectors(defaultArmDir, targetDir)

    // Add shoulder pitch adjustment
    const pitchQuat = new THREE.Quaternion()
    pitchQuat.setFromAxisAngle(Z_AXIS, -shoulderAngle * (isLeft ? 1 : -1) * 0.3)
    _armRotationQuat.multiply(pitchQuat)

    // Compute final upper arm rotation in local space
    _tempQuat.copy(chain.restUpperArmQuat)
    _tempQuat.premultiply(_armRotationQuat)

    // Blend with rest pose to prevent collapse
    _tempQuat2.copy(chain.restUpperArmQuat)
    _tempQuat2.slerp(_tempQuat, 1 - SIGNING_SPACE.REST_BLEND)

    // Apply with smoothing
    chain.upperArm.quaternion.slerp(_tempQuat2, IK_SMOOTHING)

    // Forearm elbow bend in local X axis
    _forearmRotationQuat.setFromAxisAngle(X_AXIS, clampedBendAngle)

    _tempQuat.copy(chain.restForeArmQuat)
    _tempQuat.multiply(_forearmRotationQuat)

    // Blend forearm with rest pose
    _tempQuat2.copy(chain.restForeArmQuat)
    _tempQuat2.slerp(_tempQuat, 1 - SIGNING_SPACE.REST_BLEND)

    chain.foreArm.quaternion.slerp(_tempQuat2, IK_SMOOTHING)

    return {
        elbowAngleDeg: THREE.MathUtils.radToDeg(clampedBendAngle),
        targetLocalLength: targetDist
    }
}

// ============================================================================
// PALM ORIENTATION - PHASE 2
// ============================================================================

/**
 * Apply palm orientation to hand bone using local-space rotation only.
 * MUST be called AFTER solveIK() and BEFORE stabilizeWrist().
 * Uses Quaternion.slerp() for smooth blending.
 */
function applyPalmOrientation(
    hand: THREE.Bone,
    restHandQuat: THREE.Quaternion,
    targetOrientation: THREE.Quaternion,
    blendFactor: number = PALM_BLEND
): void {
    // Compute target quaternion by applying orientation to rest pose
    _tempQuat.copy(restHandQuat)
    _tempQuat.multiply(targetOrientation)

    // Slerp current hand quaternion toward target
    hand.quaternion.slerp(_tempQuat, blendFactor)
}

// ============================================================================
// WRIST STABILIZATION
// ============================================================================

function stabilizeWrist(
    chain: IKChain,
    frameCount: number
): { wristRollDeg: number } {
    chain.foreArm.updateWorldMatrix(true, false)

    _euler.setFromQuaternion(chain.hand.quaternion, 'XYZ')

    const clampedRoll = THREE.MathUtils.clamp(_euler.z, -WRIST_MAX_ROLL, WRIST_MAX_ROLL)
    _euler.z = clampedRoll
    _euler.x *= 0.8
    _euler.y *= 0.8

    _wristQuat.setFromEuler(_euler)

    _tempQuat.copy(chain.restHandQuat)
    _tempQuat.slerp(_wristQuat, 0.3)

    chain.hand.quaternion.slerp(_tempQuat, WRIST_SMOOTHING)

    return { wristRollDeg: THREE.MathUtils.radToDeg(clampedRoll) }
}

// ============================================================================
// PROCEDURAL FINGER CURL
// ============================================================================

function applyFingerCurl(
    chain: IKChain,
    targetWorld: THREE.Vector3,
    isActive: boolean,
    frameCount: number
): { curlFactor: number } {
    const currentPos = targetWorld.clone()
    const velocity = currentPos.distanceTo(chain.prevWristPos)
    chain.prevWristPos.copy(currentPos)

    let curlFactor = Math.min(velocity * 10, 1.0)
    if (isActive) {
        curlFactor = Math.max(curlFactor, 0.3)
    }

    const fingers = [chain.fingers.index, chain.fingers.middle, chain.fingers.ring, chain.fingers.pinky, chain.fingers.thumb]
    const fingerOffsets = [0, 0.1, 0.2, 0.3, 0]

    fingers.forEach((finger, idx) => {
        if (!finger) return

        const offset = fingerOffsets[idx]
        const fingerCurl = curlFactor * (1 + offset * 0.5)
        const curlAngle = THREE.MathUtils.lerp(FINGER_CURL_MIN, FINGER_CURL_MAX, fingerCurl)

        _tempQuat.setFromAxisAngle(X_AXIS, curlAngle)
        _tempQuat2.copy(finger.restProximalQuat)
        _tempQuat2.multiply(_tempQuat)
        finger.proximal.quaternion.slerp(_tempQuat2, FINGER_CURL_SMOOTHING)

        _tempQuat.setFromAxisAngle(X_AXIS, curlAngle * 0.7)
        _tempQuat2.copy(finger.restIntermediateQuat)
        _tempQuat2.multiply(_tempQuat)
        finger.intermediate.quaternion.slerp(_tempQuat2, FINGER_CURL_SMOOTHING)
    })

    return { curlFactor }
}

// ============================================================================
// AVATAR RENDERER
// ============================================================================

interface AvatarRendererProps {
    avatarState: AvatarState
    className?: string
    handPoseTargets?: HandPoseTargets
    activeISLSign?: ISLGloss
    signSequence?: ISLGloss[]  // Phase 3: Sign sequence
    // Speech synthesis props
    speechText?: string  // Text to synthesize and lip sync
    speechContext?: TTSContext  // Hospital or emergency context
    onSpeechStart?: () => void  // Callback when speech starts
    onSpeechEnd?: () => void    // Callback when speech ends
    // Accessibility props
    'aria-label'?: string
    'aria-describedby'?: string
    tabIndex?: number
    role?: string
}

export function AvatarRenderer({
    avatarState,
    className,
    handPoseTargets,
    activeISLSign,
    signSequence,
    speechText,
    speechContext = "hospital",
    onSpeechStart,
    onSpeechEnd,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    tabIndex = 0,
    role = "img"
}: AvatarRendererProps) {
    // Accessibility state management
    const [statusMessage, setStatusMessage] = useState<string>("")
    const prevModeRef = useRef(avatarState.mode)

    // Generate dynamic ARIA label based on avatar state
    const getAriaLabel = (): string => {
        if (ariaLabel) return ariaLabel

        if (avatarState.isSpeaking) return "Avatar is speaking sign language"
        if (avatarState.isProcessing) return "Avatar is processing your input"
        if (avatarState.isListening) return "Avatar is listening for sign language"
        if (activeISLSign) return `Avatar is signing: ${activeISLSign}`
        if (signSequence?.length) return `Avatar is signing sequence of ${signSequence.length} signs`
        return "3D Avatar for sign language communication"
    }

    // Generate comprehensive description for screen readers
    const getAriaDescription = (): string => {
        let description = "Interactive 3D avatar that translates between sign language and speech. "
        if (speechText) description += `Currently saying: ${speechText}. `
        if (activeISLSign) description += `Currently signing: ${activeISLSign}. `
        if (signSequence?.length) description += `Signing sequence of ${signSequence.length} signs. `
        description += "Use Enter or Space to interact, Escape to stop speech."
        return description.trim()
    }

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault()
                // Focus management - could trigger interaction
                break
            case 'Escape':
                event.preventDefault()
                // Stop current speech synthesis
                if (speechText) {
                    speechSynthesis.cancel()
                    setStatusMessage("Speech stopped")
                    setTimeout(() => setStatusMessage(""), 1000)
                }
                break
            case 'p':
            case 'P':
                // Pause/Play speech (if active)
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault()
                    if (speechText) {
                        speechSynthesis.pause()
                        setStatusMessage("Speech paused")
                        setTimeout(() => setStatusMessage(""), 1000)
                    }
                }
                break
        }
    }

    // Status announcements for screen readers
    useEffect(() => {
        if (avatarState.mode !== prevModeRef.current) {
            let message = ""

            switch (avatarState.mode) {
                case 'listening':
                    message = "Avatar is now listening for sign language"
                    break
                case 'processing':
                    message = "Avatar is processing your input"
                    break
                case 'speaking':
                    message = "Avatar is now speaking"
                    break
                case 'idle':
                    message = "Avatar is ready"
                    break
            }

            if (message) {
                setStatusMessage(message)
                setTimeout(() => setStatusMessage(""), 1000)
            }

            prevModeRef.current = avatarState.mode
        }
    }, [avatarState.mode])

    return (
        <div
            className={cn(
                "relative",
                // Focus indicators for keyboard navigation
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "focus:border-blue-500 focus:shadow-lg",
                "transition-all duration-200",
                // Reduced motion support
                "motion-reduce:transition-none motion-reduce:animate-none",
                className
            )}
            role={role}
            aria-label={getAriaLabel()}
            aria-describedby={ariaDescribedBy || "avatar-description"}
            aria-live="polite"
            tabIndex={tabIndex}
            onKeyDown={handleKeyDown}
        >
            {/* Hidden description for screen readers */}
            <div id="avatar-description" className="sr-only">
                {getAriaDescription()}
            </div>

            {/* Status announcements */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {statusMessage}
            </div>

            {/* Speech synthesis controls (hidden but accessible) */}
            {speechText && (
                <div className="sr-only" role="region" aria-label="Speech controls">
                    <button
                        onClick={() => {
                            speechSynthesis.cancel()
                            setStatusMessage("Speech stopped")
                            setTimeout(() => setStatusMessage(""), 1000)
                        }}
                        aria-label={`Stop speaking: ${speechText}`}
                        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50 focus:bg-white focus:p-2 focus:border focus:rounded focus:shadow-lg"
                    >
                        Stop Speech
                    </button>
                    <div aria-live="assertive" aria-atomic="true">
                        {avatarState.isSpeaking ? `Speaking: ${speechText}` : ''}
                    </div>
                </div>
            )}

            <Canvas
                camera={{
                    fov: 30,
                    near: 0.1,
                    far: 100,
                    position: [0, 1.2, 2.5],
                }}
                style={{ width: "100%", height: "100%" }}
                gl={{ antialias: true }}
                aria-hidden="true" // Canvas is decorative, description is in aria-describedby
            >
                <Suspense fallback={null}>
                    <AvatarScene
                        avatarState={avatarState}
                        handPoseTargets={handPoseTargets}
                        activeISLSign={activeISLSign}
                        signSequence={signSequence}
                        speechText={speechText}
                        speechContext={speechContext}
                        onSpeechStart={onSpeechStart}
                        onSpeechEnd={onSpeechEnd}
                    />
                </Suspense>
            </Canvas>
        </div>
    )
}

// ============================================================================
// AVATAR SCENE
// ============================================================================

function AvatarScene({
    avatarState,
    handPoseTargets,
    activeISLSign,
    signSequence,
    speechText,
    speechContext,
    onSpeechStart,
    onSpeechEnd
}: {
    avatarState: AvatarState;
    handPoseTargets?: HandPoseTargets;
    activeISLSign?: ISLGloss;
    signSequence?: ISLGloss[];
    speechText?: string;
    speechContext?: TTSContext;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
}) {
    return (
        <>
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 5]} intensity={1.5} />
            <directionalLight position={[-3, 3, -3]} intensity={0.8} />
            {/* RIM LIGHT for hand separation against dark clothes */}
            <spotLight position={[0, 4, -5]} intensity={2.0} angle={0.5} penumbra={1} color="#ffffff" />
            <pointLight position={[0, 2, 3]} intensity={0.6} />
            <AvatarModel
                avatarState={avatarState}
                handPoseTargets={handPoseTargets}
                activeISLSign={activeISLSign}
                signSequence={signSequence}
                speechText={speechText}
                speechContext={speechContext}
                onSpeechStart={onSpeechStart}
                onSpeechEnd={onSpeechEnd}
            />
            <CameraFramer />
            <Environment preset="studio" />
        </>
    )
}

// ============================================================================
// DEBUG TARGET SPHERE
// ============================================================================

function DebugSphere({ position, color = "green" }: { position: THREE.Vector3; color?: string }) {
    return (
        <mesh position={position}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color={color} />
        </mesh>
    )
}

// ============================================================================
// CAMERA FRAMER
// ============================================================================

function CameraFramer() {
    const { camera, scene } = useThree()
    const framedRef = useRef(false)

    useEffect(() => {
        if (framedRef.current) return

        const timer = setTimeout(() => {
            const avatar = scene.getObjectByName("AvatarRoot")
            if (!avatar) return

            const box = new THREE.Box3().setFromObject(avatar)
            const size = box.getSize(new THREE.Vector3())
            const fullHeight = size.y
            // Zoom in closer for "Hospital Clarity" (0.65 scaling instead of 0.75)
            const targetHeight = fullHeight * 0.65

            const fov = (camera as THREE.PerspectiveCamera).fov
            const halfFovRad = THREE.MathUtils.degToRad(fov / 2)
            const distance = (targetHeight / 2) / Math.tan(halfFovRad)

            // STATIC SIGNING FRAME: waist-up, hands always visible
            // Do NOT auto-frame - use fixed position for ASL readability
            const cameraY = 1.55
            const cameraZ = 1.9
            const lookAtY = 1.45

            camera.position.set(0, cameraY, cameraZ)
            camera.lookAt(0, lookAtY, 0)
            camera.updateProjectionMatrix()

            console.log("[CameraFramer] Camera set:", { fullHeight: fullHeight.toFixed(2), distance: distance.toFixed(2) })
            framedRef.current = true
        }, 100)

        return () => clearTimeout(timer)
    }, [camera, scene])

    return null
}

// ============================================================================
// AVATAR MODEL
// ============================================================================

function AvatarModel({
    avatarState,
    handPoseTargets,
    activeISLSign,
    signSequence,
    speechText,
    speechContext = "hospital",
    onSpeechStart,
    onSpeechEnd
}: {
    avatarState: AvatarState;
    handPoseTargets?: HandPoseTargets;
    activeISLSign?: ISLGloss;
    signSequence?: ISLGloss[];
    speechText?: string;
    speechContext?: TTSContext;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
}) {
    const gltf = useGLTF("/models/avatar.glb")

    const clonedScene = useMemo(() => {
        const cloned = cloneSkeleton(gltf.scene)
        cloned.name = "AvatarRoot"
        return cloned
    }, [gltf.scene])

    const skeletonRef = useRef<THREE.Skeleton | null>(null)
    const headBoneRef = useRef<THREE.Bone | null>(null)
    const headRestQuatRef = useRef<THREE.Quaternion | null>(null)
    const setupDoneRef = useRef(false)
    const prevModeRef = useRef(avatarState.mode)
    const frameCountRef = useRef(0)

    const leftArmIKRef = useRef<IKChain | null>(null)
    const rightArmIKRef = useRef<IKChain | null>(null)

    const avatarBoundsRef = useRef<{ minY: number; maxY: number; width: number; height: number }>({ minY: 0, maxY: 1.7, width: 0.6, height: 1.7 })

    const [leftDebugPos, setLeftDebugPos] = useState<THREE.Vector3 | null>(null)
    const [rightDebugPos, setRightDebugPos] = useState<THREE.Vector3 | null>(null)

    // Phase 2: Transition state
    const transitionStateRef = useRef<{
        isTransitioning: boolean
        startTime: number
        fromLeftTarget: THREE.Vector3 | null
        fromRightTarget: THREE.Vector3 | null
        toLeftTarget: THREE.Vector3 | null
        toRightTarget: THREE.Vector3 | null
    }>({
        isTransitioning: false,
        startTime: 0,
        fromLeftTarget: null,
        fromRightTarget: null,
        toLeftTarget: null,
        toRightTarget: null,
    })

    const prevActiveSignRef = useRef<ISLGloss | undefined>(undefined)
    const currentInterpolatedLeftRef = useRef<THREE.Vector3 | null>(null)
    const currentInterpolatedRightRef = useRef<THREE.Vector3 | null>(null)

    // Phase 3: Sequence state
    const sequenceStateRef = useRef<SequenceState>({
        queue: [],
        currentIndex: 0,
        phase: "idle",
        phaseStartTime: 0,
    })

    const prevSequenceKeyRef = useRef<string | null>(null)  // Semantic change detection

    // ========================================================================
    // SPEECH SYNTHESIS STATE
    // ========================================================================
    const speechStateRef = useRef<{
        isActive: boolean
        currentText: string
        startTime: number
        currentPhoneme: string
        phonemeStartTime: number
        utterance: SpeechSynthesisUtterance | null
    }>({
        isActive: false,
        currentText: "",
        startTime: 0,
        currentPhoneme: "REST",
        phonemeStartTime: 0,
        utterance: null
    })

    // Mouth morph targets state
    const mouthStateRef = useRef<{
        currentShape: typeof PHONEME_TO_MOUTH_SHAPE.REST
        targetShape: typeof PHONEME_TO_MOUTH_SHAPE.REST
        transitionStartTime: number
    }>({
        currentShape: PHONEME_TO_MOUTH_SHAPE.REST,
        targetShape: PHONEME_TO_MOUTH_SHAPE.REST,
        transitionStartTime: 0
    })

    // Track previous speech text to detect changes
    const prevSpeechTextRef = useRef<string | undefined>(undefined)

    // Idle state manager for 3D avatar
    const idleManagerRef = useRef<AvatarIdleStateManager | null>(null)

    // ========================================================================
    // SETUP
    // ========================================================================

    useEffect(() => {
        if (setupDoneRef.current) return
        setupDoneRef.current = true

        const scene = clonedScene

        scene.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(scene)
        const size = box.getSize(new THREE.Vector3())

        // Increased scale for ASL readability - hands must be clearly visible
        const targetHeight = 1.7
        const scaleFactor = 1.35  // Fixed scale for sign visibility
        scene.scale.setScalar(scaleFactor)

        scene.updateMatrixWorld(true)
        const scaledBox = new THREE.Box3().setFromObject(scene)
        const scaledSize = scaledBox.getSize(new THREE.Vector3())
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3())

        scene.position.x = -scaledCenter.x
        scene.position.z = -scaledCenter.z
        scene.position.y = -scaledBox.min.y

        avatarBoundsRef.current = {
            minY: 0,
            maxY: scaledSize.y,
            width: scaledSize.x * 2,
            height: scaledSize.y,
        }

        console.log("[Avatar] Scaled to", scaledSize.y.toFixed(3), "m")

        // Initialize idle state manager
        if (!idleManagerRef.current) {
            idleManagerRef.current = new AvatarIdleStateManager({
                idleTimeoutMs: 3000, // 3 seconds for 3D avatar
                transitionDurationMs: 500,
            })

            idleManagerRef.current.setCallbacks({
                onIdleStart: () => {
                    console.log("[3D Avatar] Entering idle state")
                },
                onIdleEnd: () => {
                    console.log("[3D Avatar] Exiting idle state")
                }
            })
        }

        const skinnedMeshes: THREE.SkinnedMesh[] = []
        scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.SkinnedMesh) {
                child.frustumCulled = false
                skinnedMeshes.push(child)

                // CUSTOM CLOTHING COLORS (User Request: Dark Blue Shirt, Black Pants)
                const name = child.name.toLowerCase()

                // Handle Material cloning to avoid affecting other instances or persistent cache
                if (!Array.isArray(child.material)) {
                    // Shirt/Top -> Dark Blue
                    if (name.includes("top") || name.includes("shirt") || name.includes("outfit_top")) {
                        child.material = child.material.clone()
                            ; (child.material as THREE.MeshStandardMaterial).color.setHex(0x0e1b42) // Deep Navy Blue
                        console.log("[Avatar] 👕 Applied Dark Blue to:", child.name)
                    }

                    // Pants/Bottom -> Black
                    if (name.includes("bottom") || name.includes("pants") || name.includes("outfit_bottom")) {
                        child.material = child.material.clone()
                            ; (child.material as THREE.MeshStandardMaterial).color.setHex(0x111111) // Soft Black
                        console.log("[Avatar] 👖 Applied Black to:", child.name)
                    }
                }
            }
        })

        if (skinnedMeshes.length > 0) {
            const skeleton = skinnedMeshes[0].skeleton
            skeletonRef.current = skeleton

            headBoneRef.current = resolveBone(skeleton, "head")
            if (headBoneRef.current) {
                headRestQuatRef.current = headBoneRef.current.quaternion.clone()
                console.log("[Avatar] ✅ Head bone:", headBoneRef.current.name)
            }

            const lShoulder = resolveBone(skeleton, "leftShoulder")
            const lArm = resolveBone(skeleton, "leftArm")
            const lForeArm = resolveBone(skeleton, "leftForeArm")
            const lHand = resolveBone(skeleton, "leftHand")

            if (lShoulder && lArm && lForeArm && lHand) {
                leftArmIKRef.current = createIKChain(skeleton, lShoulder, lArm, lForeArm, lHand, true)
                console.log("[Avatar] ✅ Left arm IK chain created")
            }

            const rShoulder = resolveBone(skeleton, "rightShoulder")
            const rArm = resolveBone(skeleton, "rightArm")
            const rForeArm = resolveBone(skeleton, "rightForeArm")
            const rHand = resolveBone(skeleton, "rightHand")

            if (rShoulder && rArm && rForeArm && rHand) {
                rightArmIKRef.current = createIKChain(skeleton, rShoulder, rArm, rForeArm, rHand, false)
                console.log("[Avatar] ✅ Right arm IK chain created")
            }
        }

    }, [clonedScene])

    // ========================================================================
    // SPEECH SYNTHESIS AND LIP SYNC EFFECT
    // ========================================================================
    // NOTE: Actual TTS is controlled by application-interface.tsx
    // This effect ONLY tracks lip-sync state based on the speechText prop
    // It does NOT call speechSynthesis.speak() or cancel() to avoid conflicts
    useEffect(() => {
        // Detect speech text changes for lip-sync tracking
        if (speechText !== prevSpeechTextRef.current) {
            prevSpeechTextRef.current = speechText

            // Update lip-sync state (no TTS calls here - handled by application-interface.tsx)
            if (speechText && speechText.trim().length > 0) {
                console.log(`[Avatar Lip Sync] Tracking speech: "${speechText}"`)

                speechStateRef.current.currentText = speechText
                speechStateRef.current.startTime = performance.now()
                speechStateRef.current.isActive = true
                speechStateRef.current.currentPhoneme = "REST"

                // Notify parent that lip-sync is starting
                onSpeechStart?.()
            } else {
                // No speech text - ensure mouth returns to rest
                speechStateRef.current.isActive = false
                speechStateRef.current.currentPhoneme = "REST"
                mouthStateRef.current.targetShape = PHONEME_TO_MOUTH_SHAPE.REST

                // Notify parent that lip-sync is ending
                onSpeechEnd?.()
            }
        }

        // Cleanup on unmount - only clean up local state, not TTS
        return () => {
            idleManagerRef.current?.destroy()
        }
    }, [speechText, speechContext, onSpeechStart, onSpeechEnd])

    // ========================================================================
    // PHONEME ESTIMATION AND MOUTH SHAPE MAPPING
    // ========================================================================
    const estimateCurrentPhoneme = (text: string, elapsedTime: number): string => {
        if (!text || text.length === 0) return "REST"

        // Simple phoneme estimation based on elapsed time
        // This is a basic implementation - in production, you'd use more sophisticated
        // phoneme analysis or integrate with speech synthesis events
        const avgPhonemeTime = SPEECH_SYNTHESIS_TIMING.PHONEME_DURATION
        const phonemeIndex = Math.floor(elapsedTime / avgPhonemeTime) % text.length
        const char = text.charAt(phonemeIndex).toUpperCase()

        // Map character to phoneme (simplified)
        if (char in PHONEME_TO_MOUTH_SHAPE) {
            return char as keyof typeof PHONEME_TO_MOUTH_SHAPE
        }

        // Vowel detection for unmapped characters
        if ('AEIOU'.includes(char)) {
            return char as keyof typeof PHONEME_TO_MOUTH_SHAPE
        }

        // Consonant mapping
        if ('MBPFVTDSZ'.includes(char)) {
            return char as keyof typeof PHONEME_TO_MOUTH_SHAPE
        }

        return "REST"
    }

    // ========================================================================
    // MOUTH MORPH TARGET APPLICATION
    // ========================================================================
    const applyMouthMorphTargets = (
        headBone: THREE.Bone | null,
        targetShape: typeof PHONEME_TO_MOUTH_SHAPE.REST,
        currentShape: typeof PHONEME_TO_MOUTH_SHAPE.REST,
        blendFactor: number
    ) => {
        if (!headBone) return

        // In a real implementation, this would apply morph targets to the mesh
        // For now, we'll simulate mouth movement through head bone scaling/rotation
        // This is a placeholder for actual morph target implementation

        // Interpolate between current and target mouth shape
        const openness = THREE.MathUtils.lerp(currentShape.openness, targetShape.openness, blendFactor)
        const width = THREE.MathUtils.lerp(currentShape.width, targetShape.width, blendFactor)
        const roundness = THREE.MathUtils.lerp(currentShape.roundness, targetShape.roundness, blendFactor)

        // Apply subtle head movements to simulate mouth shapes
        // This is a simplified approach - real implementation would use facial morph targets
        const mouthInfluence = 0.02 // Very subtle influence on head movement

        // Openness affects slight jaw drop (head rotation)
        const jawRotation = openness * mouthInfluence
        _tempQuat.setFromAxisAngle(X_AXIS, jawRotation)

        // Width affects slight head width (very subtle scaling simulation)
        // Note: This is a placeholder - real morph targets would affect mesh vertices

        // Store mouth shape for debugging
        if (frameCountRef.current % 60 === 0 && speechStateRef.current.isActive) {
            console.log(`[Avatar Lip Sync] Phoneme: ${speechStateRef.current.currentPhoneme}, ` +
                `Openness: ${openness.toFixed(2)}, Width: ${width.toFixed(2)}, Roundness: ${roundness.toFixed(2)}`)
        }
    }

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================

    useFrame((state) => {
        if (!skeletonRef.current) return

        const time = state.clock.elapsedTime
        const mode = avatarState.mode
        frameCountRef.current++

        if (mode !== prevModeRef.current) {
            console.log(`[Avatar] Mode: ${prevModeRef.current} → ${mode}`)
            prevModeRef.current = mode
        }



        const isSigningActive = handPoseTargets !== undefined &&
            (handPoseTargets.leftWrist !== undefined || handPoseTargets.rightWrist !== undefined)

        // Detect overall avatar activity for idle state management
        const isAvatarActive = detectAvatarActivity({
            isSigningActive,
            isSpeaking: speechStateRef.current.isActive,
            hasHandPoses: handPoseTargets !== undefined,
            signSequence: signSequence || [],
            speechText: speechText,
        })

        // Update idle state manager
        if (isAvatarActive) {
            idleManagerRef.current?.signalActivity()
        }

        // ====================================================================
        // PHASE 3: SIGN SEQUENCING
        // ====================================================================
        // Phase 3 ISL sequencing is deterministic and interrupt-safe.
        // Grammar and subtitle mapping intentionally not handled here.

        // FIX #1: Semantic sequence detection (not reference comparison)
        const sequenceKey = signSequence?.join("|") ?? null

        if (sequenceKey && sequenceKey !== prevSequenceKeyRef.current) {
            const state = sequenceStateRef.current

            // FIX #3: Reset Phase 2 on new sequence
            transitionStateRef.current.isTransitioning = false

            // Initialize new sequence
            state.queue = signSequence!
            state.currentIndex = 0
            state.phase = "transitioning_in"
            state.phaseStartTime = time

            prevSequenceKeyRef.current = sequenceKey
        } else if (!sequenceKey && prevSequenceKeyRef.current) {
            // Sequence cleared
            prevSequenceKeyRef.current = null
        }

        // Sequence state machine
        let computedActiveSign: ISLGloss | undefined = activeISLSign

        if (sequenceStateRef.current.queue.length > 0) {
            const seq = sequenceStateRef.current
            const elapsed = (time - seq.phaseStartTime) * 1000

            if (seq.phase === "transitioning_in") {
                // FIX #2: Explicit transition-in phase
                computedActiveSign = seq.queue[seq.currentIndex]

                if (!transitionStateRef.current.isTransitioning) {
                    // Transition complete, start holding
                    seq.phase = "holding"
                    seq.phaseStartTime = time
                }

            } else if (seq.phase === "holding") {
                computedActiveSign = seq.queue[seq.currentIndex]

                if (elapsed >= SIGN_HOLD_DURATION_MS) {
                    // FIX #2: Explicit transition-out phase
                    seq.phase = "transitioning_out"
                    seq.phaseStartTime = time
                }

            } else if (seq.phase === "transitioning_out") {
                // Transition OUT of current sign (to idle or next sign)

                if (seq.currentIndex + 1 < seq.queue.length) {
                    // More signs: set next sign as target
                    computedActiveSign = seq.queue[seq.currentIndex + 1]
                } else {
                    // Last sign: transition to idle
                    computedActiveSign = undefined
                }

                if (!transitionStateRef.current.isTransitioning) {
                    // Transition complete
                    seq.currentIndex++

                    if (seq.currentIndex < seq.queue.length) {
                        // Start next sign
                        seq.phase = "transitioning_in"
                        seq.phaseStartTime = time
                    } else {
                        // Sequence complete
                        seq.queue = []
                        seq.currentIndex = 0
                        seq.phase = "idle"
                    }
                }
            }
        }

        // ====================================================================
        // ISL SIGN SYSTEM - PHASE 2 (WITH TRANSITIONS)
        // ====================================================================
        // Phase 2 ISL target transitions are deterministic and interrupt-safe.
        // Do not modify interpolation semantics without re-validating drift and idle behavior.

        // Detect sign change and initiate transition
        if (computedActiveSign !== prevActiveSignRef.current) {
            const state = transitionStateRef.current

            // CRITICAL FIX #1: Capture CURRENT INTERPOLATED POSE (not target endpoint)
            state.fromLeftTarget = currentInterpolatedLeftRef.current?.clone() || null
            state.fromRightTarget = currentInterpolatedRightRef.current?.clone() || null

            // Set new destination targets
            if (computedActiveSign) {
                const sign = COMBINED_SIGN_LIBRARY[computedActiveSign]
                state.toLeftTarget = sign.leftTarget
                    ? new THREE.Vector3(sign.leftTarget.x, sign.leftTarget.y, sign.leftTarget.z)
                    : null
                state.toRightTarget = sign.rightTarget
                    ? new THREE.Vector3(sign.rightTarget.x, sign.rightTarget.y, sign.rightTarget.z)
                    : null
            } else {
                // CRITICAL FIX #2: Idle is NULL, not zero
                state.toLeftTarget = null
                state.toRightTarget = null
            }

            // Start transition
            state.isTransitioning = true
            state.startTime = time

            prevActiveSignRef.current = computedActiveSign
        }

        // Process ISL signs (with transitions) or MediaPipe
        if (computedActiveSign || transitionStateRef.current.isTransitioning) {
            const state = transitionStateRef.current
            const elapsed = (time - state.startTime) * 1000  // ms
            const progress = Math.min(elapsed / SIGN_TRANSITION_DURATION_MS, 1.0)

            // Compute interpolated shoulder-local targets using PURE function
            let leftTargetLocal: THREE.Vector3 | null = null
            let rightTargetLocal: THREE.Vector3 | null = null

            if (state.isTransitioning) {
                // Apply easing for "Blender-like" smooth motion
                const easedProgress = cubicEaseInOut(progress)

                leftTargetLocal = interpolateTarget(state.fromLeftTarget, state.toLeftTarget, easedProgress)
                rightTargetLocal = interpolateTarget(state.fromRightTarget, state.toRightTarget, easedProgress)

                // End transition at progress = 1.0
                if (progress >= 1.0) {
                    state.isTransitioning = false
                }
            } else {
                // Not transitioning: use static targets from current sign
                if (computedActiveSign) {
                    const sign = COMBINED_SIGN_LIBRARY[computedActiveSign]

                    // Add subtle organic noise "breath" to the hold pose
                    const noise = getIdleNoise(time, 1.5, 0.008) // 8mm drift

                    if (sign.leftTarget) {
                        leftTargetLocal = new THREE.Vector3(sign.leftTarget.x, sign.leftTarget.y, sign.leftTarget.z).add(noise)
                    } else {
                        leftTargetLocal = null
                    }

                    if (sign.rightTarget) {
                        rightTargetLocal = new THREE.Vector3(sign.rightTarget.x, sign.rightTarget.y, sign.rightTarget.z).add(noise)
                    } else {
                        rightTargetLocal = null
                    }
                }
            }

            // Store current interpolated pose for next potential interrupt
            currentInterpolatedLeftRef.current = leftTargetLocal
            currentInterpolatedRightRef.current = rightTargetLocal

            // Transform shoulder-local → world and feed into IK
            // If target is null, skip IK for that hand (natural idle)

            // LEFT ARM
            if (leftTargetLocal && leftArmIKRef.current) {
                // Update world matrices
                leftArmIKRef.current.shoulder.updateWorldMatrix(true, false)

                // DIRECT OFFSET APPROACH: Bypass shoulder matrix rotation
                // Calculate target relative to shoulder position in WORLD ALIGNED axes
                // X = Left/Right, Y = Up/Down, Z = Forward/Back
                leftArmIKRef.current.shoulder.getWorldPosition(_islSignTargetWorld)
                _islSignTargetWorld.x += leftTargetLocal.x
                _islSignTargetWorld.y += leftTargetLocal.y
                _islSignTargetWorld.z += leftTargetLocal.z  // +Z is forward towards camera

                setLeftDebugPos(_islSignTargetWorld.clone())

                // Feed into existing IK pipeline (same as MediaPipe)
                const ikResult = solveIK(leftArmIKRef.current, _islSignTargetWorld, true, frameCountRef.current)

                const wristResult = stabilizeWrist(leftArmIKRef.current, frameCountRef.current)

                // apply forward-facing palm orientation AFTER wrist stabilization
                // Use 1.0 blend to force the orientation
                const activeSignDef = computedActiveSign ? COMBINED_SIGN_LIBRARY[computedActiveSign] : undefined
                const targetPalm = (activeSignDef?.leftPalm) ?? DEFAULT_PALM_ORIENTATION

                applyPalmOrientation(
                    leftArmIKRef.current.hand,
                    leftArmIKRef.current.restHandQuat,
                    targetPalm,
                    1.0  // Full override
                )

                // Override finger curl with sign preset if defined
                if (computedActiveSign) {
                    const sign = COMBINED_SIGN_LIBRARY[computedActiveSign]
                    if (sign.leftFingers) {
                        const fingers = [
                            leftArmIKRef.current.fingers.index,
                            leftArmIKRef.current.fingers.middle,
                            leftArmIKRef.current.fingers.ring,
                            leftArmIKRef.current.fingers.pinky,
                            leftArmIKRef.current.fingers.thumb
                        ]
                        const presets = [
                            sign.leftFingers.index,
                            sign.leftFingers.middle,
                            sign.leftFingers.ring,
                            sign.leftFingers.pinky,
                            sign.leftFingers.thumb ?? 0.2 // Default relaxed thumb
                        ]

                        // Thumb axis mapping: Thumb usually curls around Z or Y local axis depending on rig
                        // For Mixamo, thumb curl is often Z-axis relative to parent
                        // We'll stick to X-axis first as standard fallback, but thumb might need custom axis

                        fingers.forEach((finger, idx) => {
                            if (!finger) return
                            const curlFactor = presets[idx]
                            const curlAngle = THREE.MathUtils.lerp(FINGER_CURL_MIN, FINGER_CURL_MAX, curlFactor)

                            // Thumb (idx 4) needs slightly different curl mapping? 
                            // Standardizing on X-curl for now as it's consistent with other fingers in this simple rig
                            _tempQuat.setFromAxisAngle(X_AXIS, curlAngle)
                            _tempQuat2.copy(finger.restProximalQuat)
                            _tempQuat2.multiply(_tempQuat)
                            finger.proximal.quaternion.slerp(_tempQuat2, FINGER_CURL_SMOOTHING)

                            _tempQuat.setFromAxisAngle(X_AXIS, curlAngle * 0.7)
                            _tempQuat2.copy(finger.restIntermediateQuat)
                            _tempQuat2.multiply(_tempQuat)
                            finger.intermediate.quaternion.slerp(_tempQuat2, FINGER_CURL_SMOOTHING)
                        })
                    } else {
                        // No finger preset - use procedural curl
                        applyFingerCurl(leftArmIKRef.current, _islSignTargetWorld, true, frameCountRef.current)
                    }
                } else {
                    // Transitioning to idle - use procedural curl
                    applyFingerCurl(leftArmIKRef.current, _islSignTargetWorld, true, frameCountRef.current)
                }

                if (frameCountRef.current % 120 === 0 && computedActiveSign) {
                    console.log(`[ISL-L ${computedActiveSign}] elbow=${ikResult.elbowAngleDeg.toFixed(1)}° dist=${ikResult.targetLocalLength.toFixed(3)}m`)
                }
            } else {
                setLeftDebugPos(null)
            }

            // RIGHT ARM
            if (rightTargetLocal && rightArmIKRef.current) {
                rightArmIKRef.current.shoulder.updateWorldMatrix(true, false)

                // DIRECT OFFSET APPROACH: Bypass shoulder matrix rotation
                rightArmIKRef.current.shoulder.getWorldPosition(_islSignTargetWorld)
                _islSignTargetWorld.x += rightTargetLocal.x
                _islSignTargetWorld.y += rightTargetLocal.y
                _islSignTargetWorld.z += rightTargetLocal.z // +Z is forward towards camera

                setRightDebugPos(_islSignTargetWorld.clone())

                const ikResult = solveIK(rightArmIKRef.current, _islSignTargetWorld, false, frameCountRef.current)

                const wristResult = stabilizeWrist(rightArmIKRef.current, frameCountRef.current)

                // ALWAYS apply forward-facing palm orientation AFTER wrist stabilization
                // Use 1.0 blend to force the orientation
                const activeSignDef = computedActiveSign ? COMBINED_SIGN_LIBRARY[computedActiveSign] : undefined
                const targetPalm = (activeSignDef?.rightPalm) ?? DEFAULT_PALM_ORIENTATION

                applyPalmOrientation(
                    rightArmIKRef.current.hand,
                    rightArmIKRef.current.restHandQuat,
                    targetPalm,
                    1.0  // Full override
                )

                if (computedActiveSign) {
                    const sign = COMBINED_SIGN_LIBRARY[computedActiveSign]
                    if (sign.rightFingers) {
                        const fingers = [
                            rightArmIKRef.current.fingers.index,
                            rightArmIKRef.current.fingers.middle,
                            rightArmIKRef.current.fingers.ring,
                            rightArmIKRef.current.fingers.pinky,
                            rightArmIKRef.current.fingers.thumb
                        ]
                        const presets = [
                            sign.rightFingers.index,
                            sign.rightFingers.middle,
                            sign.rightFingers.ring,
                            sign.rightFingers.pinky,
                            sign.rightFingers.thumb ?? 0.2
                        ]

                        fingers.forEach((finger, idx) => {
                            if (!finger) return
                            const curlFactor = presets[idx]
                            const curlAngle = THREE.MathUtils.lerp(FINGER_CURL_MIN, FINGER_CURL_MAX, curlFactor)

                            _tempQuat.setFromAxisAngle(X_AXIS, curlAngle)
                            _tempQuat2.copy(finger.restProximalQuat)
                            _tempQuat2.multiply(_tempQuat)
                            finger.proximal.quaternion.slerp(_tempQuat2, FINGER_CURL_SMOOTHING)

                            _tempQuat.setFromAxisAngle(X_AXIS, curlAngle * 0.7)
                            _tempQuat2.copy(finger.restIntermediateQuat)
                            _tempQuat2.multiply(_tempQuat)
                            finger.intermediate.quaternion.slerp(_tempQuat2, FINGER_CURL_SMOOTHING)
                        })
                    } else {
                        applyFingerCurl(rightArmIKRef.current, _islSignTargetWorld, true, frameCountRef.current)
                    }
                } else {
                    applyFingerCurl(rightArmIKRef.current, _islSignTargetWorld, true, frameCountRef.current)
                }

                if (frameCountRef.current % 120 === 0 && computedActiveSign) {
                    console.log(`[ISL-R ${computedActiveSign}] elbow=${ikResult.elbowAngleDeg.toFixed(1)}° dist=${ikResult.targetLocalLength.toFixed(3)}m`)
                }
            } else {
                setRightDebugPos(null)
            }
        }
        // ====================================================================
        // ARM IK - MEDIAPIPE HAND TRACKING WITH CACHING
        // ====================================================================
        // Only process MediaPipe if NO ISL sign is active
        else if (handPoseTargets) {
            // Check cache for deaf→hearing mode gesture recognition
            const gestureKey = avatarCache.generateGestureKey(handPoseTargets)
            const cachedRecognition = avatarCache.getSignRecognition(gestureKey)

            if (cachedRecognition) {
                console.log("[3D Avatar] Using cached sign recognition:", cachedRecognition.recognizedSigns)
                // Use cached recognition result - this would typically trigger speech synthesis
                // For now, we'll just log it and continue with normal processing
            }

            // Signal activity to idle manager when hand poses are detected
            idleManagerRef.current?.signalActivity()

            const bounds = avatarBoundsRef.current

            // LEFT ARM
            if (handPoseTargets.leftWrist && leftArmIKRef.current) {
                const mp = handPoseTargets.leftWrist

                // Step 1: Convert MediaPipe to avatar world space
                _ikTargetPos.set(
                    (1 - mp.x - 0.5) * bounds.width,
                    (1 - mp.y) * bounds.maxY,
                    (mp.z || 0) * 0.5 + 0.3
                )

                // Step 2: Apply signing space offset (still in world)
                const signingTarget = applySigningSpaceOffset(_ikTargetPos, true, bounds.height)

                setLeftDebugPos(signingTarget.clone())

                // Step 3: Solve IK (converts to shoulder-local internally)
                const ikResult = solveIK(leftArmIKRef.current, signingTarget, true, frameCountRef.current)

                // Step 4: Wrist stabilization
                const wristResult = stabilizeWrist(leftArmIKRef.current, frameCountRef.current)

                // Step 5: Finger curl
                const fingerResult = applyFingerCurl(leftArmIKRef.current, signingTarget, isSigningActive, frameCountRef.current)

                if (frameCountRef.current % 120 === 0) {
                    console.log(`[IK-L] elbow=${ikResult.elbowAngleDeg.toFixed(1)}° dist=${ikResult.targetLocalLength.toFixed(3)}m curl=${fingerResult.curlFactor.toFixed(2)}`)
                }
            } else {
                setLeftDebugPos(null)
            }

            // RIGHT ARM
            if (handPoseTargets.rightWrist && rightArmIKRef.current) {
                const mp = handPoseTargets.rightWrist

                _ikTargetPos.set(
                    (1 - mp.x - 0.5) * bounds.width,
                    (1 - mp.y) * bounds.maxY,
                    (mp.z || 0) * 0.5 + 0.3
                )

                const signingTarget = applySigningSpaceOffset(_ikTargetPos, false, bounds.height)

                setRightDebugPos(signingTarget.clone())

                const ikResult = solveIK(rightArmIKRef.current, signingTarget, false, frameCountRef.current)
                const wristResult = stabilizeWrist(rightArmIKRef.current, frameCountRef.current)
                const fingerResult = applyFingerCurl(rightArmIKRef.current, signingTarget, isSigningActive, frameCountRef.current)

                if (frameCountRef.current % 120 === 0) {
                    console.log(`[IK-R] elbow=${ikResult.elbowAngleDeg.toFixed(1)}° dist=${ikResult.targetLocalLength.toFixed(3)}m curl=${fingerResult.curlFactor.toFixed(2)}`)
                }
            } else {
                setRightDebugPos(null)
            }
        }

        // ====================================================================
        // HEAD ANIMATION AND LIP SYNC
        // ====================================================================
        if (headBoneRef.current && headRestQuatRef.current) {
            let xAngle = 0
            let yAngle = 0

            // Update speech synthesis and lip sync
            if (speechStateRef.current.isActive && speechStateRef.current.currentText) {
                const elapsedTime = time * 1000 - speechStateRef.current.startTime

                // Estimate current phoneme based on elapsed time
                const estimatedPhoneme = estimateCurrentPhoneme(speechStateRef.current.currentText, elapsedTime)

                // Update phoneme if it changed
                if (estimatedPhoneme !== speechStateRef.current.currentPhoneme) {
                    speechStateRef.current.currentPhoneme = estimatedPhoneme
                    speechStateRef.current.phonemeStartTime = time * 1000

                    // Set new target mouth shape
                    const newTargetShape = PHONEME_TO_MOUTH_SHAPE[estimatedPhoneme as keyof typeof PHONEME_TO_MOUTH_SHAPE] || PHONEME_TO_MOUTH_SHAPE.REST
                    mouthStateRef.current.targetShape = newTargetShape
                    mouthStateRef.current.transitionStartTime = time * 1000
                }

                // Interpolate mouth shape
                const transitionElapsed = time * 1000 - mouthStateRef.current.transitionStartTime
                const transitionProgress = Math.min(transitionElapsed / (SPEECH_SYNTHESIS_TIMING.PHONEME_DURATION * 0.5), 1.0)
                const blendFactor = SPEECH_SYNTHESIS_TIMING.LIP_SYNC_SMOOTHING * transitionProgress

                // Update current mouth shape
                mouthStateRef.current.currentShape = {
                    openness: THREE.MathUtils.lerp(
                        mouthStateRef.current.currentShape.openness,
                        mouthStateRef.current.targetShape.openness,
                        blendFactor
                    ),
                    width: THREE.MathUtils.lerp(
                        mouthStateRef.current.currentShape.width,
                        mouthStateRef.current.targetShape.width,
                        blendFactor
                    ),
                    roundness: THREE.MathUtils.lerp(
                        mouthStateRef.current.currentShape.roundness,
                        mouthStateRef.current.targetShape.roundness,
                        blendFactor
                    )
                }

                // Apply mouth morph targets (placeholder implementation)
                applyMouthMorphTargets(
                    headBoneRef.current,
                    mouthStateRef.current.targetShape,
                    mouthStateRef.current.currentShape,
                    blendFactor
                )

                // Speaking head animation - more pronounced when speaking
                xAngle = Math.sin(time * Math.PI * 2 * SPEAKING_ANIM.FREQUENCY) * SPEAKING_ANIM.AMPLITUDE
                yAngle = Math.sin(time * Math.PI * 2 * 0.7) * SPEAKING_ANIM.Y_AMPLITUDE

                // Add subtle mouth-influenced head movement
                const mouthInfluence = mouthStateRef.current.currentShape.openness * 0.01
                xAngle += mouthInfluence

            } else {
                // Non-speaking animation modes
                if (mode === "speaking") {
                    // Speaking mode without active speech synthesis
                    xAngle = Math.sin(time * Math.PI * 2 * SPEAKING_ANIM.FREQUENCY) * SPEAKING_ANIM.AMPLITUDE
                    yAngle = Math.sin(time * Math.PI * 2 * 0.7) * SPEAKING_ANIM.Y_AMPLITUDE
                } else {
                    // Default idle animation for all other modes (including processing)
                    xAngle = Math.sin(time * Math.PI * 2 * IDLE_ANIM.FREQUENCY) * IDLE_ANIM.AMPLITUDE
                }

                // Return mouth to rest position when not speaking
                if (!speechStateRef.current.isActive) {
                    const restTransitionSpeed = 0.05
                    mouthStateRef.current.currentShape = {
                        openness: THREE.MathUtils.lerp(mouthStateRef.current.currentShape.openness, PHONEME_TO_MOUTH_SHAPE.REST.openness, restTransitionSpeed),
                        width: THREE.MathUtils.lerp(mouthStateRef.current.currentShape.width, PHONEME_TO_MOUTH_SHAPE.REST.width, restTransitionSpeed),
                        roundness: THREE.MathUtils.lerp(mouthStateRef.current.currentShape.roundness, PHONEME_TO_MOUTH_SHAPE.REST.roundness, restTransitionSpeed)
                    }
                }
            }

            _nodQuat.setFromAxisAngle(X_AXIS, xAngle)
            if (yAngle !== 0) {
                _tempQuat.setFromAxisAngle(Y_AXIS, yAngle)
                _nodQuat.multiply(_tempQuat)
            }

            _tempQuat.copy(_nodQuat)
            _tempQuat.multiply(headRestQuatRef.current)
            headBoneRef.current.quaternion.copy(_tempQuat)
        }

        // ====================================================================
        // SKELETON UPDATE (MUST BE LAST)
        // ====================================================================
        skeletonRef.current.update()
    })

    return (
        <>
            <primitive object={clonedScene} />
            {leftDebugPos && <DebugSphere position={leftDebugPos} color="lime" />}
            {rightDebugPos && <DebugSphere position={rightDebugPos} color="cyan" />}
        </>
    )
}

useGLTF.preload("/models/avatar.glb")
