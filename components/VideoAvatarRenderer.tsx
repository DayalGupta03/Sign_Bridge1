/**
 * VIDEO AVATAR RENDERER - Hearing → Deaf Mode
 * 
 * Production-grade video-based avatar using pre-recorded sign videos.
 * 
 * STATE MACHINE (2 states only):
 * - IDLE: Loop idle.mp4
 * - SIGNING: Play sign video
 * 
 * DESIGN PRINCIPLES:
 * - ALL videos pre-mounted as persistent <video> elements
 * - Visibility controlled via opacity (no DOM destruction)
 * - New speech INTERRUPTS current sign (latest wins)
 * - Explicit filename mapping (no case assumptions)
 */

"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { AvatarIdleStateManager, detectAvatarActivity } from "@/lib/avatarIdleState"
import { avatarCache } from "@/lib/avatarCache"

// ============================================================================
// CANONICAL FILENAME MAPPING (SOURCE OF TRUTH)
// ============================================================================
// Intent keys (UPPER_SNAKE_CASE) → Actual filenames (mixed case)
// DO NOT auto-generate. DO NOT assume casing.

const SIGN_VIDEO_FILES: Record<string, string> = {
    ARE_YOU_IN_PAIN: "ARE_YOU_IN_PAIN.mp4",
    DO_YOU_FEEL_BETTER: "DO_YOU_FEEL_BETTER.mp4",
    DO_YOU_HAVE_ALLERGIES: "DO_YOU_HAVE_ALLERGIES.mp4",
    HOW_ARE_YOU: "How_Are_You.mp4",
    I_AM_FINE_THANK_YOU: "I_Am_Fine_Thank_You.mp4",
    SEE_YOU_SOON: "See_You_Soon.mp4",
    THANK_YOU: "Thank_You.mp4",
    WHAT_IS_YOUR_NAME: "What_Is_Your_Name.mp4",
    WHERE_DOES_IT_HURT: "Where_Does_It_Hurt.mp4",
    WHERE_IS_THE_DOCTOR: "Where_Is_The_Doctor.mp4",
}

// All sign keys for pre-mounting
const ALL_SIGN_KEYS = Object.keys(SIGN_VIDEO_FILES)

// Build full paths
const SIGN_VIDEO_PATHS: Record<string, string> = {}
for (const key of ALL_SIGN_KEYS) {
    SIGN_VIDEO_PATHS[key] = `/videos/${SIGN_VIDEO_FILES[key]}`
}

const IDLE_VIDEO_PATH = "/videos/idle.mp4"

// ============================================================================
// KEYWORD FALLBACK MAPPING
// ============================================================================

const KEYWORD_TO_INTENT: Array<{ keywords: string[]; intent: string }> = [
    { keywords: ["are you in pain", "pain", "hurting", "does it pain"], intent: "ARE_YOU_IN_PAIN" },
    { keywords: ["feel better", "better now", "are you better"], intent: "DO_YOU_FEEL_BETTER" },
    { keywords: ["allergy", "allergies", "allergic"], intent: "DO_YOU_HAVE_ALLERGIES" },
    { keywords: ["how are you", "how r u", "how you doing"], intent: "HOW_ARE_YOU" },
    { keywords: ["i am fine", "i'm fine", "doing fine"], intent: "I_AM_FINE_THANK_YOU" },
    { keywords: ["thank you", "thanks", "thank u"], intent: "THANK_YOU" },
    { keywords: ["see you", "see you soon"], intent: "SEE_YOU_SOON" },
    { keywords: ["your name", "what is your name", "who are you"], intent: "WHAT_IS_YOUR_NAME" },
    { keywords: ["where does it hurt", "where are you hurt", "where is the pain"], intent: "WHERE_DOES_IT_HURT" },
    { keywords: ["where is the doctor", "call the doctor", "doctor please"], intent: "WHERE_IS_THE_DOCTOR" },
]

// ============================================================================
// TYPES
// ============================================================================

type VideoAvatarState = "idle" | "signing"

interface VideoAvatarRendererProps {
    signSequence: string[]
    subtitles?: string[]
    className?: string
    onSignComplete?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VideoAvatarRenderer({
    signSequence,
    subtitles = [],
    className,
    onSignComplete,
}: VideoAvatarRendererProps) {
    // ========================================================================
    // STATE
    // ========================================================================

    const [avatarState, setAvatarState] = useState<VideoAvatarState>("idle")
    const [activeSignKey, setActiveSignKey] = useState<string | null>(null)

    // Queue for pending signs (intent keys, not URLs)
    const signQueueRef = useRef<string[]>([])
    const isPlayingRef = useRef(false)

    // Video refs - one for idle, one per sign
    const idleVideoRef = useRef<HTMLVideoElement>(null)
    const signVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

    // Track last processed sequence to prevent re-processing
    const lastSequenceKeyRef = useRef<string>("")

    // Idle state manager
    const idleManagerRef = useRef<AvatarIdleStateManager | null>(null)

    // Initialize idle state manager
    useEffect(() => {
        idleManagerRef.current = new AvatarIdleStateManager({
            idleTimeoutMs: 2000, // 2 seconds for video avatar
            transitionDurationMs: 300,
        })

        idleManagerRef.current.setCallbacks({
            onIdleStart: () => {
                console.log("[VideoAvatar] Entering idle state")
                if (avatarState !== "signing") {
                    setAvatarState("idle")
                }
            },
            onIdleEnd: () => {
                console.log("[VideoAvatar] Exiting idle state")
            }
        })

        return () => {
            idleManagerRef.current?.destroy()
        }
    }, [])

    // ========================================================================
    // INTENT RESOLUTION
    // ========================================================================

    const resolveIntent = useCallback((intentOrGloss: string, transcript?: string): string | null => {
        // Normalize to uppercase
        const normalized = intentOrGloss.toUpperCase().replace(/-/g, "_")

        // Direct match
        if (SIGN_VIDEO_PATHS[normalized]) {
            console.log(`[VideoAvatar] Direct match: ${normalized}`)
            return normalized
        }

        // Keyword fallback
        if (transcript) {
            const lowerTranscript = transcript.toLowerCase()
            for (const mapping of KEYWORD_TO_INTENT) {
                if (mapping.keywords.some(kw => lowerTranscript.includes(kw))) {
                    console.log(`[VideoAvatar] Keyword match: "${transcript}" → ${mapping.intent}`)
                    return mapping.intent
                }
            }
        }

        console.warn(`[VideoAvatar] No video for: ${intentOrGloss}`)
        return null
    }, [])

    // ========================================================================
    // PLAYBACK CONTROL
    // ========================================================================

    const stopCurrentSign = useCallback(() => {
        // Stop all sign videos
        for (const key of ALL_SIGN_KEYS) {
            const video = signVideoRefs.current[key]
            if (video) {
                video.pause()
                video.currentTime = 0
            }
        }
        isPlayingRef.current = false
        setActiveSignKey(null)
    }, [])

    const playSign = useCallback((intentKey: string) => {
        const video = signVideoRefs.current[intentKey]
        if (!video) {
            console.error(`[VideoAvatar] ❌ No video element for: ${intentKey}`)
            return false
        }

        isPlayingRef.current = true
        setActiveSignKey(intentKey)
        setAvatarState("signing")

        video.currentTime = 0
        video.play().catch(err => {
            console.error(`[VideoAvatar] Playback failed for ${intentKey}:`, err)
        })

        console.log(`[VideoAvatar] ▶️ Playing: ${intentKey}`)
        return true
    }, [])

    const processQueue = useCallback(() => {
        if (signQueueRef.current.length === 0) {
            isPlayingRef.current = false
            setActiveSignKey(null)
            setAvatarState("idle")
            onSignComplete?.()
            console.log("[VideoAvatar] Queue empty → IDLE")

            // Signal idle state manager
            idleManagerRef.current?.forceIdle()
            return
        }

        const nextIntent = signQueueRef.current.shift()!
        playSign(nextIntent)
    }, [playSign, onSignComplete])

    const handleSignEnded = useCallback(() => {
        console.log("[VideoAvatar] Sign ended")
        processQueue()
    }, [processQueue])

    // ========================================================================
    // INTERRUPT HANDLING - New speech always wins + KEYWORD RESOLUTION
    // ========================================================================

    useEffect(() => {
        if (signSequence.length === 0) return

        const sequenceKey = signSequence.join(",")
        if (sequenceKey === lastSequenceKeyRef.current) return
        lastSequenceKeyRef.current = sequenceKey

        // Build transcript from subtitles for keyword matching
        const transcript = subtitles.slice(-2).join(" ")

        console.log("[VideoAvatar] 📥 Processing signSequence:", signSequence)
        console.log("[VideoAvatar] 📝 Transcript for matching:", transcript)

        // Check cache first for hearing→deaf mode
        const cacheKey = avatarCache.generateTextKey(transcript)
        const cachedAnimation = avatarCache.getAvatarAnimation(cacheKey)

        if (cachedAnimation && cachedAnimation.signSequence.length > 0) {
            console.log("[VideoAvatar] Using cached animation for:", transcript)
            // ISLGloss is already a string literal union type, so cast directly
            signQueueRef.current = cachedAnimation.signSequence as string[]
            idleManagerRef.current?.signalActivity()
            stopCurrentSign()
            processQueue()
            return
        }

        // INTERRUPT: Stop current playback immediately
        stopCurrentSign()
        signQueueRef.current = []

        // Resolve intents - handle __TEXT: marker specially
        const validIntents: string[] = []

        for (const item of signSequence) {
            // Special handling for __TEXT: marker
            // Format: "__TEXT:the actual transcript text"
            // This carries the transcript directly, avoiding race conditions
            if (typeof item === 'string' && item.startsWith("__TEXT:")) {
                const embeddedTranscript = item.substring(7) // Remove "__TEXT:" prefix
                console.log("[VideoAvatar] 🔍 __TEXT: marker detected, transcript:", embeddedTranscript)

                // Try keyword matching on the embedded transcript
                if (embeddedTranscript && embeddedTranscript.length > 0) {
                    const lowerTranscript = embeddedTranscript.toLowerCase()
                    let matched = false

                    for (const mapping of KEYWORD_TO_INTENT) {
                        if (mapping.keywords.some(kw => lowerTranscript.includes(kw))) {
                            console.log(`[VideoAvatar] ✅ Keyword match: "${embeddedTranscript}" → ${mapping.intent}`)
                            validIntents.push(mapping.intent)
                            matched = true
                            break // Only match first keyword to avoid duplicates
                        }
                    }

                    if (!matched) {
                        console.log("[VideoAvatar] ⚠️ No keyword match found for:", embeddedTranscript)
                        console.log("[VideoAvatar] 📋 Available keywords:", KEYWORD_TO_INTENT.map(m => m.keywords).flat().slice(0, 10).join(", "), "...")
                    }
                }
            } else if (item === "__TRANSCRIPT__") {
                // Legacy support for old marker format
                console.log("[VideoAvatar] 🔍 Legacy __TRANSCRIPT__ marker, using subtitles")

                if (transcript && transcript.length > 0) {
                    const lowerTranscript = transcript.toLowerCase()
                    for (const mapping of KEYWORD_TO_INTENT) {
                        if (mapping.keywords.some(kw => lowerTranscript.includes(kw))) {
                            console.log(`[VideoAvatar] ✅ Keyword match: "${transcript}" → ${mapping.intent}`)
                            validIntents.push(mapping.intent)
                            break
                        }
                    }
                }
            } else {
                // Regular intent resolution (for direct intents like "THANK_YOU")
                const intent = resolveIntent(item, transcript)
                if (intent) {
                    validIntents.push(intent)
                }
            }
        }

        if (validIntents.length === 0) {
            console.log("[VideoAvatar] ❌ No valid intents from sequence:", signSequence, "transcript:", transcript)
            return
        }

        // Cache the animation result
        avatarCache.setAvatarAnimation(cacheKey, {
            text: transcript,
            signSequence: validIntents as any[],
            videoPath: undefined,
        })

        // Queue and play
        signQueueRef.current = validIntents
        console.log(`[VideoAvatar] ▶️ Playing queue: [${validIntents.join(", ")}]`)

        idleManagerRef.current?.signalActivity()
        processQueue()

    }, [signSequence, subtitles, resolveIntent, stopCurrentSign, processQueue])

    // ========================================================================
    // IDLE VIDEO CONTROL WITH ACTIVITY DETECTION
    // ========================================================================

    useEffect(() => {
        const idleVideo = idleVideoRef.current
        if (!idleVideo) return

        // Detect avatar activity
        const isActive = detectAvatarActivity({
            isSigningActive: avatarState === "signing",
            signSequence: signSequence,
        })

        if (isActive) {
            idleManagerRef.current?.signalActivity()
        }

        // Play idle video when in idle state
        if (avatarState === "idle" && idleManagerRef.current?.isIdle()) {
            idleVideo.play().catch(() => { })
        } else {
            idleVideo.pause()
        }
    }, [avatarState, signSequence])

    // ========================================================================
    // VIDEO ERROR HANDLING
    // ========================================================================

    const handleVideoError = useCallback((key: string, event: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = event.currentTarget
        console.error(`[VideoAvatar] ❌ Video error for ${key}:`, video.error?.message || "Unknown error")
    }, [])

    const handleVideoCanPlay = useCallback((key: string) => {
        console.log(`[VideoAvatar] ✅ Ready: ${key}`)
    }, [])

    // ========================================================================
    // RENDER - ALL videos pre-mounted
    // ========================================================================

    const isSigning = avatarState === "signing"

    return (
        <div className={cn("relative w-full h-full overflow-hidden bg-slate-900", className)}>
            {/* IDLE VIDEO - always mounted, hidden when signing */}
            <video
                ref={idleVideoRef}
                src={IDLE_VIDEO_PATH}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    opacity: isSigning ? 0 : 1,
                    transition: "opacity 150ms ease-out",
                    zIndex: 1,
                }}
                muted
                loop
                playsInline
                autoPlay
                onError={(e) => handleVideoError("idle", e)}
                onCanPlay={() => handleVideoCanPlay("idle")}
            />

            {/* ALL SIGN VIDEOS - pre-mounted, only active one visible */}
            {ALL_SIGN_KEYS.map((key) => (
                <video
                    key={key}
                    ref={(el) => { signVideoRefs.current[key] = el }}
                    src={SIGN_VIDEO_PATHS[key]}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        opacity: activeSignKey === key ? 1 : 0,
                        transition: "opacity 150ms ease-out",
                        zIndex: activeSignKey === key ? 10 : 0,
                        pointerEvents: activeSignKey === key ? "auto" : "none",
                    }}
                    muted
                    playsInline
                    onEnded={handleSignEnded}
                    onError={(e) => handleVideoError(key, e)}
                    onCanPlay={() => handleVideoCanPlay(key)}
                />
            ))}

            {/* Debug overlay */}
            {process.env.NODE_ENV === "development" && (
                <div className="absolute bottom-2 left-2 text-xs text-white/70 font-mono bg-black/50 px-2 py-1 rounded">
                    {isSigning
                        ? `▶️ ${activeSignKey} (Q: ${signQueueRef.current.length})`
                        : "⏸️ IDLE"
                    }
                </div>
            )}
        </div>
    )
}
