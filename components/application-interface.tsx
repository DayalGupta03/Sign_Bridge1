"use client"

import { useState, useEffect, useReducer } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { Camera, Mic, Maximize, Minimize, ArrowLeftRight, Activity, Waves, BrainCircuit, Sparkles, Volume2, Shield } from "lucide-react"
import { EmergencyErrorBoundary, EmergencyFallback } from "./EmergencyErrorBoundary"
import { EmergencyFallbackSystem, useFallbackDetection, type FallbackMode } from "./EmergencyFallbackSystem"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRef } from "react"
import { type MediationContext, type MediationMode } from "@/lib/mediator"
import { speechSynthesis } from "@/lib/speech-synthesis"
import { trackStatusChange, trackError } from "@/lib/analytics"
import { AIPipelineController } from "@/lib/aiPipelineController"
import { useAvatarController } from "@/hooks/useAvatarController"
import { AvatarRenderer, type HandPoseTargets, type ISLGloss } from "@/components/AvatarRenderer"
import { VideoAvatarRenderer } from "@/components/VideoAvatarRenderer"
// Note: extractASLIntents/intentsToGlosses not used directly - video avatar uses raw transcript matching
import { avatarCache } from "@/lib/avatarCache"
import { AvatarDebugPanel } from "@/components/AvatarDebugPanel"
import { medicalTermCache } from "@/lib/medicalTermCache"
import { performanceTimer } from "@/lib/performanceTimer"

/**
 * APPLICATION INTERFACE COMPONENT
 * 
 * This is the main interactive demo of the SignBridge 3D communication system.
 * It simulates the real-time AI mediation interface between Deaf and Hearing users.
 * 
 * KEY STATE VARIABLES (Integration Points for AI/Vision/Speech):
 * 
 * @state context - "hospital" | "emergency"
 *   - Controls the visual theme and urgency level
 *   - INTEGRATION: Connect to context detection AI that analyzes environment
 *   - Emergency mode triggers faster animations and red color scheme
 * 
 * @state mode - "deaf-to-hearing" | "hearing-to-deaf"
 *   - Determines the direction of communication flow
 *   - INTEGRATION: Connect to user role detection or manual toggle
 *   - Controls which input modality is primary (sign language vs speech)
 * 
 * @state status - "listening" | "understanding" | "responding" | "speaking"
 *   - Represents the current AI processing stage
 *   - INTEGRATION: Connect to AI pipeline status updates
 *   - Each status triggers unique avatar animations and visual feedback
 * 
 * @state subtitles - string[]
 *   - Live transcription/translation text displayed to users
 *   - INTEGRATION: Connect to speech-to-text and sign-to-text AI outputs
 *   - Currently simulated with medical scenario dialogue
 * 
 * @state cameraActive - boolean
 *   - Controls video capture for sign language recognition
 *   - INTEGRATION: Connect to camera hardware and vision AI pipeline
 * 
 * @state micActive - boolean
 *   - Controls audio capture for speech recognition
 *   - INTEGRATION: Connect to microphone hardware and speech AI pipeline
 * 
 * ANIMATION SYSTEM:
 * - All animations use Framer Motion for smooth, performant transitions
 * - Avatar responds to status changes with unique visual states
 * - Scroll-based parallax effects for depth and engagement
 * - Emergency context triggers pulsing effects and color shifts
 */

type Context = "hospital" | "emergency"
type Mode = "deaf-to-hearing" | "hearing-to-deaf"
type SystemStatus = "listening" | "understanding" | "responding" | "speaking"

// ============================================================================
// EMERGENCY STATE MANAGEMENT - useReducer Implementation
// ============================================================================

interface EmergencyState {
  context: Context
  isTransitioning: boolean
  lastToggleTime: number
  errorCount: number
  fallbackMode: 'none' | 'text-only' | 'offline' | 'emergency-chat'
}

type EmergencyAction =
  | { type: 'TOGGLE_EMERGENCY' }
  | { type: 'COMPLETE_TRANSITION' }
  | { type: 'ERROR_OCCURRED'; error: string }
  | { type: 'ACTIVATE_FALLBACK'; mode: EmergencyState['fallbackMode'] }
  | { type: 'RESET_STATE' }
  | { type: 'LOAD_FROM_STORAGE'; state: EmergencyState }

const EMERGENCY_STORAGE_KEY = 'signbridge-emergency-state'

const initialEmergencyState: EmergencyState = {
  context: 'hospital',
  isTransitioning: false,
  lastToggleTime: 0,
  errorCount: 0,
  fallbackMode: 'none'
}

function emergencyReducer(state: EmergencyState, action: EmergencyAction): EmergencyState {
  switch (action.type) {
    case 'TOGGLE_EMERGENCY':
      const newContext: Context = state.context === 'emergency' ? 'hospital' : 'emergency'
      const newState = {
        ...state,
        context: newContext,
        isTransitioning: true,
        lastToggleTime: Date.now()
      }

      // Persist to localStorage immediately
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(newState))
        }
      } catch (error) {
        console.warn('Failed to persist emergency state:', error)
      }

      return newState

    case 'COMPLETE_TRANSITION':
      const completedState = {
        ...state,
        isTransitioning: false
      }

      // Persist to localStorage
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(completedState))
        }
      } catch (error) {
        console.warn('Failed to persist emergency state:', error)
      }

      return completedState

    case 'ERROR_OCCURRED':
      console.error('🚨 Emergency state error:', action.error)
      return {
        ...state,
        errorCount: state.errorCount + 1
      }

    case 'ACTIVATE_FALLBACK':
      return {
        ...state,
        fallbackMode: action.mode
      }

    case 'RESET_STATE':
      // Clear localStorage
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(EMERGENCY_STORAGE_KEY)
        }
      } catch (error) {
        console.warn('Failed to clear emergency state:', error)
      }

      return initialEmergencyState

    case 'LOAD_FROM_STORAGE':
      return action.state

    default:
      return state
  }
}

// Helper function to load state from localStorage
function loadEmergencyStateFromStorage(): EmergencyState {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(EMERGENCY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate the stored state structure
        if (parsed && typeof parsed === 'object' &&
          (parsed.context === 'hospital' || parsed.context === 'emergency')) {
          return {
            ...initialEmergencyState,
            ...parsed
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load emergency state from storage:', error)
  }

  return initialEmergencyState
}

const statusMessages = ["Listening...", "Understanding context...", "Processing response...", "Speaking..."]

// ============================================================================
// DEMO ORCHESTRATION MODE - Configuration
// ============================================================================
/**
 * DEMO MODE CONFIGURATION
 * 
 * Enables automatic orchestration of realistic Deaf ↔ Hearing interactions
 * for live demonstrations. When enabled, the system walks through a complete
 * conversation scenario with proper timing and realistic medical dialogue.
 * 
 * USAGE:
 * - Set DEMO_MODE_ENABLED to true to activate
 * - Choose a scenario from DEMO_SCENARIOS
 * - System will automatically cycle through conversation turns
 * - All existing animations and timing are preserved
 * 
 * SAFE DEFAULTS:
 * - Demo mode is OFF by default
 * - When disabled, system behaves exactly as before
 * - No UI changes, only orchestration logic
 */

const DEMO_MODE_ENABLED = false // Set to true for live demos

type DemoScenario = {
  name: string
  context: Context
  turns: Array<{
    mode: Mode
    dialogue: string[]
    duration: number // milliseconds per subtitle
  }>
}

const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  hospitalCheckup: {
    name: "Hospital Routine Checkup",
    context: "hospital",
    turns: [
      {
        mode: "deaf-to-hearing",
        dialogue: [
          "Good morning, I'm here for my appointment.",
          "I've been experiencing some discomfort.",
          "It started about three days ago.",
        ],
        duration: 3500,
      },
      {
        mode: "hearing-to-deaf",
        dialogue: [
          "Thank you for coming in today.",
          "Can you describe the discomfort?",
          "Where exactly do you feel it?",
        ],
        duration: 3500,
      },
      {
        mode: "deaf-to-hearing",
        dialogue: [
          "It's in my lower back, left side.",
          "The pain is dull but constant.",
          "It gets worse when I stand up.",
        ],
        duration: 3500,
      },
      {
        mode: "hearing-to-deaf",
        dialogue: [
          "I understand. Let me examine you.",
          "We'll run some tests to be sure.",
          "This should only take a few minutes.",
        ],
        duration: 3500,
      },
    ],
  },
  emergencyChestPain: {
    name: "Emergency: Chest Pain",
    context: "emergency",
    turns: [
      {
        mode: "deaf-to-hearing",
        dialogue: [
          "I have severe chest pain!",
          "It started suddenly about 20 minutes ago.",
          "The pain is radiating to my left arm.",
        ],
        duration: 2000,
      },
      {
        mode: "hearing-to-deaf",
        dialogue: [
          "Stay calm, we're here to help.",
          "On a scale of 1-10, how severe is the pain?",
          "Do you have any history of heart problems?",
        ],
        duration: 2000,
      },
      {
        mode: "deaf-to-hearing",
        dialogue: [
          "The pain is about 8 out of 10.",
          "Yes, I have high blood pressure.",
          "I'm also feeling short of breath.",
        ],
        duration: 2000,
      },
      {
        mode: "hearing-to-deaf",
        dialogue: [
          "We're starting treatment immediately.",
          "I'm ordering an EKG and blood work.",
          "The cardiac team is on their way.",
        ],
        duration: 2000,
      },
    ],
  },
  emergencyAllergy: {
    name: "Emergency: Allergic Reaction",
    context: "emergency",
    turns: [
      {
        mode: "deaf-to-hearing",
        dialogue: [
          "My throat is swelling!",
          "I ate something with peanuts by mistake.",
          "I'm having trouble breathing.",
        ],
        duration: 2000,
      },
      {
        mode: "hearing-to-deaf",
        dialogue: [
          "This is a severe allergic reaction.",
          "I'm administering epinephrine right now.",
          "Do you have an EpiPen with you?",
        ],
        duration: 2000,
      },
      {
        mode: "deaf-to-hearing",
        dialogue: [
          "No, I left it at home.",
          "The swelling is getting worse.",
          "I feel dizzy and nauseous.",
        ],
        duration: 2000,
      },
      {
        mode: "hearing-to-deaf",
        dialogue: [
          "The medication is working, stay with me.",
          "Your breathing should improve shortly.",
          "We'll monitor you closely for the next hour.",
        ],
        duration: 2000,
      },
    ],
  },
}

// Select active demo scenario (change this to switch scenarios)
const ACTIVE_DEMO_SCENARIO = "emergencyChestPain"

interface SubtitleEntry {
  primary: string
  // secondary removed as we single-stream now
}

export function ApplicationInterface() {
  // ============================================================================
  // STATE MANAGEMENT - AI Integration Points
  // ============================================================================

  // Emergency state management with useReducer for reliability
  const [emergencyState, dispatchEmergency] = useReducer(emergencyReducer, initialEmergencyState)
  const { context } = emergencyState

  // Emergency siren audio beep
  const playEmergencyBeep = () => {
    try {
      // Create audio context for emergency beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Emergency siren sound: alternating high-low tones
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.6)
    } catch (error) {
      console.warn('Emergency beep audio failed:', error)
    }
  }

  const [mode, setMode] = useState<Mode>("deaf-to-hearing")
  const [status, setStatus] = useState<SystemStatus>("listening")
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([])
  const [cameraActive, setCameraActive] = useState(true)
  const [micActive, setMicActive] = useState(true)
  const [handPoseTargets, setHandPoseTargets] = useState<HandPoseTargets | undefined>(undefined)
  const [activeISLSign, setActiveISLSign] = useState<ISLGloss | undefined>(undefined)
  // Phase 3 sign sequence for speech-to-sign pipeline (Hearing → Deaf)
  const [signSequence, setSignSequence] = useState<ISLGloss[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const interfaceContainerRef = useRef<HTMLDivElement>(null)

  // Emergency fallback system
  const {
    fallbackMode,
    errorCount,
    reportError,
    activateFallback,
    retrySystem
  } = useFallbackDetection()

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      interfaceContainerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  // Monitor fullscreen change events (e.g. user pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // ============================================================================
  // EMERGENCY STATE PERSISTENCE - Load from localStorage on mount
  // ============================================================================
  useEffect(() => {
    const storedState = loadEmergencyStateFromStorage()
    if (storedState.context !== initialEmergencyState.context ||
      storedState.lastToggleTime !== initialEmergencyState.lastToggleTime) {
      dispatchEmergency({ type: 'LOAD_FROM_STORAGE', state: storedState })
    }
  }, []) // Run only once on mount

  // ============================================================================
  // EMERGENCY TRANSITION COMPLETION - Handle transition cleanup
  // ============================================================================
  useEffect(() => {
    if (emergencyState.isTransitioning) {
      // Play emergency beep when switching to emergency mode
      if (emergencyState.context === 'emergency') {
        playEmergencyBeep()
      }

      // Complete transition after 300ms (smooth animation time)
      const timer = setTimeout(() => {
        dispatchEmergency({ type: 'COMPLETE_TRANSITION' })
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [emergencyState.isTransitioning, emergencyState.context])

  // ============================================================================
  // AI PIPELINE CONTROLLER - Centralized orchestration
  // ============================================================================
  /**
   * PIPELINE CONTROLLER INTEGRATION
   * 
   * Replaces scattered timing and state logic with a centralized orchestrator.
   * The controller manages the flow: ingest → understand → generate → deliver
   * 
   * BENEFITS:
   * - Single source of truth for all timing values
   * - Event-driven architecture for clean separation
   * - Easy to extend for NLP, vision, avatar systems
   * - Testable in isolation from UI
   * 
   * DATA FLOW:
   * Input (STT/Gesture) → Controller.processInput() → Events → UI Updates
   */
  const pipelineController = useRef(new AIPipelineController())

  // Subscribe to pipeline events on mount
  useEffect(() => {
    const controller = pipelineController.current

    // PHASE 4 OPTIMIZATION: Warm medical term cache in background
    medicalTermCache.warmCache().catch(error => {
      console.warn("⚠️ Cache warming failed:", error)
    })

    // Status updates - pipeline controls UI status transitions
    const handleStatus = (newStatus: SystemStatus) => {
      setStatus(newStatus)
    }

    // Subtitle updates - pipeline emits mediated text for UI display
    // Updated for DUAL RESPONSE (Gemini + OpenAI)
    const handleSubtitle = (data: { text: string, secondary?: string }) => {
      setSubtitles((prev) => {
        const newEntry: SubtitleEntry = {
          primary: data.text,
        }
        const newSubtitles = [...prev, newEntry]
        return newSubtitles.slice(-3) // Keep last 3 lines for readability
      })
    }

    // Raw input updates - pipeline emits original unmediated input
    // CRITICAL: Used for video avatar keyword matching because:
    // - Mediated text: "Your name is being requested for your record"
    // - Raw input: "What is your name?"
    // - Keywords ("your name", "what is your name") match raw input, NOT mediated text
    const handleRawInput = (rawText: string) => {
      console.log("📺 Video avatar: raw input for keyword matching:", rawText)
      setSignSequence([`__TEXT:${rawText}`] as any) // Pass raw transcript with marker

      // PHASE 4 OPTIMIZATION: Learn from successful mediation
      // If we have recent mediated output, add mapping to cache
      if (mode === "hearing-to-deaf" && subtitles.length > 0) {
        const recentMediatedOutput = subtitles[subtitles.length - 1].primary
        if (recentMediatedOutput && recentMediatedOutput !== rawText) {
          medicalTermCache.addTerm(rawText, recentMediatedOutput, undefined, 0.9)
        }
      }
    }

    // Error handling - pipeline emits errors for logging/display
    const handleError = (error: string) => {
      console.error('❌ Pipeline error:', error)
      reportError(error) // Report to fallback system
      trackError(`Pipeline error: ${error}`, { mode, context })

      // Log emergency state error if in emergency mode
      if (context === 'emergency') {
        dispatchEmergency({ type: 'ERROR_OCCURRED', error })
      }

      // TODO: Show user-friendly error message in UI
    }

    // Subscribe to events
    controller.on('status', handleStatus)
    controller.on('subtitle', handleSubtitle as any) // Cast to any to match simple callback signature if needed, or update controller
    controller.on('rawInput', handleRawInput)
    controller.on('error', handleError)

    // Cleanup on unmount
    return () => {
      controller.off('status', handleStatus)
      controller.off('subtitle', handleSubtitle as any)
      controller.off('rawInput', handleRawInput)
      controller.off('error', handleError)
      controller.cancel()
    }
  }, [mode, context, dispatchEmergency]) // Re-run when mode or context changes

  // ============================================================================
  // AVATAR CONTROLLER - Contract layer integration
  // ============================================================================
  /**
   * AVATAR CONTROLLER INTEGRATION
   * 
   * Translates pipeline status into AvatarState contract.
   * This is the ONLY way avatar accesses pipeline data.
   * 
   * ARCHITECTURE:
   * Pipeline Status → useAvatarController → AvatarState → AvatarRenderer
   *     (input)          (translator)       (contract)     (renderer)
   * 
   * BENEFITS:
   * - Avatar can't access pipeline internals
   * - Future features (lip-sync, signing) plug into AvatarState
   * - Renderer is pure and deterministic
   * - Easy to test in isolation
   */
  const avatarState = useAvatarController({ status, context })

  // ============================================================================
  // ANALYTICS TRACKING - Optional Backend Integration
  // ============================================================================
  /**
   * TRACK STATUS CHANGES
   * 
   * Sends status change events to backend for observability.
   * 
   * BEHAVIOR:
   * - Non-blocking: Never delays status transitions
   * - Silent failures: Backend errors don't affect UX
   * - Optional: Frontend works without backend
   * 
   * PRIVACY:
   * - No PHI (Protected Health Information)
   * - No audio/video data
   * - Anonymous session IDs only
   * 
   * FUTURE ENHANCEMENTS:
   * - Send to analytics service (Google Analytics, Mixpanel)
   * - Track user journey and conversion funnels
   * - Monitor error rates and performance
   */
  useEffect(() => {
    // Track status changes for observability
    trackStatusChange(status, mode, context)
  }, [status, mode, context])

  // ============================================================================
  // KEYBOARD SHORTCUTS FOR TESTING ASL SIGNS
  // ============================================================================
  /**
   * KEYBOARD SIGN TESTING
   * 
   * Allows testing all 27 ASL signs via keyboard shortcuts.
   * Press number keys to trigger different signs:
   * 
   * 1 = HELLO, 2 = GOODBYE, 3 = THANK_YOU, 4 = PLEASE, 5 = SORRY
   * 6 = GOOD, 7 = BAD, 8 = YES, 9 = NO, 0 = idle (clear sign)
   * q = I_ME, w = YOU, e = WE_US, r = THEY_THEM, t = MY_MINE
   * a = HAPPY, s = SAD, d = LOVE, f = EAT, g = DRINK
   * z = WATER, x = SLEEP, c = WANT, v = LIKE, b = UNDERSTAND
   * h = HELP, j = STOP
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // ========================================================================
      // KEYBOARD SHORTCUTS FOR TESTING ALL 45 ASL SIGNS
      // ========================================================================
      // Numbers: Greetings & Basic Responses
      // QWERTY row: Pronouns
      // ASDFGH row: Emotions & Basic Actions
      // ZXCVBNM row: Needs & Actions
      // Shift + key: New ASL signs (Actions, Sensory, Time, Education)
      // ========================================================================

      const signMap: Record<string, ISLGloss | undefined> = {
        // === Numbers: Greetings & Responses ===
        '1': 'HELLO',
        '2': 'GOODBYE',
        '3': 'THANK_YOU',
        '4': 'PLEASE',
        '5': 'SORRY',
        '6': 'GOOD',
        '7': 'BAD',
        '8': 'YES',
        '9': 'NO',
        '0': undefined, // Return to idle

        // === Q-row: Pronouns ===
        'q': 'I_ME',
        'w': 'YOU',
        'e': 'WE_US',
        'r': 'THEY_THEM',
        't': 'MY_MINE',

        // === A-row: Emotions & Actions ===
        'a': 'HAPPY',
        's': 'SAD',
        'd': 'LOVE',
        'f': 'EAT',
        'g': 'DRINK',
        'h': 'HELP',
        'j': 'STOP',

        // === Z-row: Basic Actions ===
        'z': 'WATER',
        'x': 'SLEEP',
        'c': 'WANT',
        'v': 'LIKE',
        'b': 'UNDERSTAND',
      }

      // === NEW SIGNS with Shift modifier ===
      const shiftSignMap: Record<string, ISLGloss> = {
        // Shift + Number: Actions & States
        '!': 'WAIT',      // Shift+1
        '@': 'FINISH',    // Shift+2
        '#': 'NEED',      // Shift+3
        '$': 'DONT_LIKE', // Shift+4
        '%': 'HAVE',      // Shift+5
        '^': 'GET',       // Shift+6
        '&': 'GIVE',      // Shift+7
        '*': 'TAKE',      // Shift+8

        // Shift + Q-row: Sensory
        'Q': 'LOOK',
        'W': 'LISTEN',
        'E': 'THINK',
        'R': 'KNOW',

        // Shift + A-row: Time
        'A': 'NOW',
        'S': 'YESTERDAY',
        'D': 'TOMORROW',

        // Shift + Z-row: Education & Work
        'Z': 'WORK',
        'X': 'LEARN',
        'C': 'TEACH',
        'V': 'READ',
        'B': 'WRITE',
      }

      const key = e.key
      const lowerKey = key.toLowerCase()

      // Check shift+key combinations first (for new signs)
      if (key in shiftSignMap) {
        const sign = shiftSignMap[key]
        setActiveISLSign(sign)
        console.log(`🤟 Sign triggered: ${sign}`)
        return
      }

      // Then check regular keys
      if (lowerKey in signMap) {
        const sign = signMap[lowerKey]
        setActiveISLSign(sign)
        console.log(`🤟 Sign triggered: ${sign ?? 'IDLE'}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // Empty deps - keyboard shortcuts don't depend on state

  // ============================================================================
  // DEMO ORCHESTRATION STATE - Only active when DEMO_MODE_ENABLED = true
  // ============================================================================

  const [demoTurnIndex, setDemoTurnIndex] = useState(0)
  const [demoDialogueIndex, setDemoDialogueIndex] = useState(0)

  // ============================================================================
  // SCROLL ANIMATIONS - Parallax entrance effect
  // ============================================================================

  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  })

  const sectionY = useTransform(scrollYProgress, [0, 0.3], [80, 0])
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

  // ============================================================================
  // DEMO ORCHESTRATION LOGIC - Automatic conversation flow
  // ============================================================================

  useEffect(() => {
    if (!DEMO_MODE_ENABLED) return

    const scenario = DEMO_SCENARIOS[ACTIVE_DEMO_SCENARIO]
    if (!scenario) return

    // Set initial context from scenario using emergency dispatch
    if (scenario.context !== context) {
      if (scenario.context === 'emergency') {
        dispatchEmergency({ type: 'TOGGLE_EMERGENCY' })
      } else {
        // Reset to hospital if needed
        if (context === 'emergency') {
          dispatchEmergency({ type: 'TOGGLE_EMERGENCY' })
        }
      }
    }

    const currentTurn = scenario.turns[demoTurnIndex]
    if (!currentTurn) {
      // Restart demo from beginning when all turns complete
      setDemoTurnIndex(0)
      setDemoDialogueIndex(0)
      setSubtitles([])
      return
    }

    // Set mode for current turn
    setMode(currentTurn.mode)

    // Cycle through AI processing states with realistic timing
    const statuses: SystemStatus[] = ["listening", "understanding", "responding", "speaking"]
    let statusIndex = 0

    const statusInterval = setInterval(() => {
      setStatus(statuses[statusIndex])
      statusIndex = (statusIndex + 1) % statuses.length
    }, 2500) // Matches existing animation timing

    // Add dialogue subtitles progressively
    const dialogueInterval = setInterval(() => {
      if (demoDialogueIndex < currentTurn.dialogue.length) {
        setSubtitles((prev) => {
          const newSubtitles = [...prev, { primary: currentTurn.dialogue[demoDialogueIndex] }]
          return newSubtitles.slice(-3) // Keep last 3 lines
        })
        setDemoDialogueIndex((prev) => prev + 1)
      } else {
        // Move to next turn after dialogue completes
        clearInterval(dialogueInterval)
        setTimeout(() => {
          setDemoTurnIndex((prev) => prev + 1)
          setDemoDialogueIndex(0)
          setSubtitles([]) // Clear subtitles between turns
        }, currentTurn.duration)
      }
    }, currentTurn.duration)

    return () => {
      clearInterval(statusInterval)
      clearInterval(dialogueInterval)
    }
  }, [demoTurnIndex, demoDialogueIndex, context, dispatchEmergency])

  // ============================================================================
  // PRODUCTION SUBTITLE PIPELINE - Real signal paths only
  // ============================================================================
  /**
   * SUBTITLE SOURCES IN PRODUCTION MODE (DEMO_MODE_ENABLED === false)
   * 
   * Subtitles are ONLY updated by the following real signal paths:
   * 
   * 1. SPEECH-TO-TEXT (Hearing → Deaf)
   *    - Source: Web Speech API recognition.onresult
   *    - Location: Line ~522 in STT integration effect
   *    - Writes: Mediated transcript from hearing user's speech
   * 
   * 2. GESTURE RECOGNITION (Deaf → Hearing)
   *    - Source: MediaPipe Hands gesture classification
   *    - Location: Line ~832 in sign language recognition effect
   *    - Writes: Mediated intent text from Deaf user's signing
   * 
   * 3. LLM MEDIATION OUTPUT
   *    - Source: Gemini API mediation layer (mediateIntent)
   *    - Location: Line ~494 (STT) and Line ~802 (gesture)
   *    - Writes: Context-aware, professional medical communication
   * 
   * NO HARDCODED TEXT should appear in production mode.
   * NO TIMED INJECTIONS should execute when demo mode is off.
   * NO PLACEHOLDER ARRAYS should be used for subtitle generation.
   * 
   * If subtitles are empty, the system is waiting for real input:
   * - Hearing user to speak (microphone active)
   * - Deaf user to sign (camera active)
   * 
   * Demo mode (DEMO_MODE_ENABLED === true) uses orchestrated scenarios
   * defined in DEMO_SCENARIOS and managed by lines 262-315.
   */


  // ============================================================================
  // REAL SPEECH-TO-TEXT INTEGRATION - Production MVP
  // ============================================================================
  /**
   * SPEECH-TO-TEXT (STT) FOR HEARING → DEAF COMMUNICATION
   * 
   * This effect replaces demo subtitle injection with real browser-based
   * speech recognition when:
   * - Demo mode is OFF (DEMO_MODE_ENABLED === false)
   * - Mode is "hearing-to-deaf" (hearing person speaking to Deaf user)
   * - Microphone is active (micActive === true)
   * 
   * INTEGRATION FLOW:
   * 1. Initialize Web Speech API (SpeechRecognition)
   * 2. Request microphone permissions
   * 3. Listen for speech input continuously
   * 4. On speech detected:
   *    - Set status to "listening"
   *    - Capture audio input
   * 5. On speech recognized:
   *    - Set status to "understanding"
   *    - Process transcript
   *    - TODO: Send to NLP for medical term extraction
   * 6. After processing:
   *    - Set status to "responding"
   *    - TODO: Generate sign language animation commands
   * 7. Display output:
   *    - Set status to "speaking"
   *    - Update subtitles with recognized text
   *    - TODO: Trigger 3D avatar signing animation
   * 
   * FUTURE INTEGRATION POINTS:
   * - Line 380: Add NLP medical terminology extraction
   * - Line 385: Add context-aware response generation
   * - Line 390: Connect to 3D avatar sign language renderer
   * 
   * GRACEFUL DEGRADATION:
   * - If SpeechRecognition unavailable, logs warning and falls back to demo
   * - If microphone permission denied, shows user-friendly error
   */
  useEffect(() => {
    // Guard clauses - only run STT in production mode for hearing-to-deaf
    if (DEMO_MODE_ENABLED) return
    if (mode !== "hearing-to-deaf") return
    if (!micActive) return

    // Check for Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn(
        "⚠️ Speech Recognition API not available in this browser. " +
        "Falling back to demo behavior. " +
        "For production, use Chrome, Edge, or Safari."
      )
      return
    }

    // ========================================================================
    // MICROPHONE PERMISSION CHECK
    // IMPORTANT: Must be called synchronously from user gesture (mic button click)
    // ========================================================================

    const initializeMicrophone = async () => {
      // Step 1: Check permission state (if browser supports it)
      // NOTE: Safari/Firefox may not support permissions.query("microphone")
      // getUserMedia acts as the authoritative permission check in those cases
      try {
        const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName })

        if (permissionStatus.state === "denied") {
          console.error("🚫 Microphone blocked by browser. Check browser settings.")
          // Don't use "listening" status for denied state - mic is NOT active
          return
        }

        if (permissionStatus.state === "prompt") {
          console.log("⏳ Microphone permission will be requested on user interaction")
        }
      } catch (error) {
        // Firefox and some browsers don't support permissions.query for microphone
        console.warn("⚠️ Permission API unavailable, will attempt getUserMedia directly")
      }

      // Step 2: Pre-flight diagnostics - what devices does the browser see?
      // This helps debug issues even before requesting permission
      try {
        const preDevices = await navigator.mediaDevices.enumerateDevices()
        const preAudioInputs = preDevices.filter(d => d.kind === "audioinput")
        console.log("🔍 Pre-permission device scan:", {
          total: preDevices.length,
          audioInputs: preAudioInputs.length,
          devices: preAudioInputs.map(d => ({
            id: d.deviceId.substring(0, 8) + "...",
            label: d.label || "(unlabeled - permission pending)"
          }))
        })
      } catch (e) {
        console.warn("⚠️ Pre-flight device scan failed:", e)
      }

      // Step 3: Request explicit microphone access
      // This triggers browser permission prompt if not yet granted
      let stream: MediaStream | null = null
      try {
        // Try with relaxed constraints - don't require specific sample rate/channels
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true }
          }
        })
        console.log("✅ Microphone permission granted, tracks:", stream.getAudioTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        })))
      } catch (error: any) {
        // Enhanced error diagnostic
        console.error("❌ getUserMedia failed:", {
          name: error.name,
          message: error.message,
          constraint: error.constraint
        })

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          console.error("🚫 Microphone permission denied. Check:", [
            "1. Browser permission prompt (may be in address bar)",
            "2. macOS System Preferences > Security & Privacy > Microphone",
            "3. Browser site settings for localhost"
          ].join("\n"))
          return
        }
        if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          console.error("🎤 No microphone device found. Check:", [
            "1. macOS System Preferences > Sound > Input (select a mic)",
            "2. Physical microphone connection",
            "3. Try: chrome://settings/content/microphone"
          ].join("\n"))
          return
        }
        if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          console.error("🔒 Microphone is in use by another application or hardware issue")
          return
        }
        if (error.name === "OverconstrainedError") {
          console.error("⚙️ Audio constraints too strict:", error.constraint)
          // Retry with minimal constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            console.log("✅ Microphone access succeeded with basic constraints")
          } catch (retryError) {
            console.error("❌ Retry with basic constraints also failed")
            return
          }
        }
        if (!stream) {
          console.error("❌ Microphone access error:", error.message)
          return
        }
      }

      // Step 3: NOW enumerate audio input devices (after permission is granted)
      // Browsers will reveal actual device labels after getUserMedia succeeds
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(d => d.kind === "audioinput")

        console.log("🎤 Available microphones:", audioInputs.map(d => d.label || "Unlabeled"))

        if (audioInputs.length === 0) {
          console.warn("⚠️ No named audio devices found, but microphone access was granted. Continuing...")
          // Don't return - getUserMedia succeeded, so there IS a mic
        }
      } catch (error: any) {
        console.warn("⚠️ Device enumeration failed:", error.message)
        // Continue anyway - getUserMedia already succeeded
      }

      // Stop the stream immediately - we only needed it for permission verification
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      console.log("✅ Microphone initialized, starting recognition...")

      // Permission granted - proceed with speech recognition
      initializeSpeechRecognition()
    }

    const initializeSpeechRecognition = () => {
      // Initialize speech recognition
      const recognition = new SpeechRecognition()

      // PHASE 4 OPTIMIZATION: Configure Web Speech API for ultra-low latency
      recognition.continuous = true // Keep listening continuously (Requirement 1.2)
      recognition.interimResults = true // Show partial results as user speaks (Requirement 1.2)
      recognition.lang = "en-US" // TODO: Make language configurable
      recognition.maxAlternatives = 1 // We only need the best match

      // Performance timing measurements for each pipeline stage
      const performanceTimings = {
        speechStart: 0,
        recognitionComplete: 0,
        cacheCheck: 0,
        pipelineStart: 0,
        pipelineComplete: 0
      }

      // RESTART LOGIC STATE
      let restartTimeout: NodeJS.Timeout | null = null
      let retryCount = 0
      const MAX_RETRIES = 5
      const BASE_DELAY = 1000 // Start with 1s delay

      /**
       * ROBUST RESTART STRATEGY
       * 
       * Handles restarts with exponential backoff to prevent tight loops
       * and respects the global processing state to avoid race conditions.
       */
      const restartRecognition = (delay = 300) => {
        // Clear any pending restarts
        if (restartTimeout) clearTimeout(restartTimeout)

        // Don't restart if:
        // 1. Mic is explicitly turned off
        // 2. Demo mode is enabled (STT should be off)
        // 3. System is currently processing input (unless we want overlap)
        if (!micActive || DEMO_MODE_ENABLED) {
          console.log("🛑 Restart cancelled: Mic off or Demo mode active")
          return
        }

        // Check global pipeline state to avoid race conditions
        // We shouldn't listen while the avatar is speaking (unless duplex is supported)
        if (pipelineController.current.isCurrentlyProcessing()) {
          console.log("⏳ Restart delayed: Pipeline busy processing/speaking")
          // Check again later
          restartTimeout = setTimeout(() => restartRecognition(delay), 1000)
          return
        }

        restartTimeout = setTimeout(() => {
          try {
            // Check one last time before starting
            if (micActive && !DEMO_MODE_ENABLED) {
              console.log(`🔄 Restarting speech recognition (Attempt ${retryCount + 1})...`)
              recognition.start()
            }
          } catch (error) {
            const msg = (error as Error).message
            if (!msg.includes("already started")) {
              console.warn("⚠️ Restart failed:", error)

              // Exponential backoff for repeated failures
              retryCount++
              if (retryCount < MAX_RETRIES) {
                const nextDelay = Math.min(BASE_DELAY * Math.pow(1.5, retryCount), 10000)
                console.log(`⏳ Retrying in ${nextDelay}ms...`)
                restartRecognition(nextDelay)
              } else {
                console.error("❌ Max retries reached. Stopping auto-restart.")
                trackError("Max speech recognition retries reached", { mode, context })
                // TODO: Notify user to toggle mic manually
              }
            }
          }
        }, delay)
      }

      // ========================================================================
      // EVENT: Speech Start - User begins speaking
      // ========================================================================
      recognition.onstart = () => {
        console.log("🎤 Speech recognition started - listening for hearing user...")
        performanceTimings.speechStart = performance.now() // Record speech capture start
        setStatus("listening")

        // Reset retry count on successful start
        retryCount = 0
      }

      // ========================================================================
      // EVENT: Speech Result - Transcript received
      // ========================================================================
      recognition.onresult = async (event: any) => {
        // Extract the latest transcript
        const results = Array.from(event.results)
        const latestResult = results[results.length - 1]
        const transcript = (latestResult as any)[0].transcript.trim()
        const isFinal = (latestResult as any).isFinal
        const isInterim = !isFinal

        // PHASE 4 OPTIMIZATION: Predictive avatar animation during speech
        if (isInterim && transcript.length > 0) {
          // Start predictive avatar preparation during ongoing speech (Requirement 1.4)
          // console.log("🎯 Predictive animation prep:", transcript)
          performanceTimings.cacheCheck = performance.now()

          // Check if this looks like a medical term for early cache preparation
          const cacheResult = medicalTermCache.lookup(transcript)
          if (cacheResult.hit) {
            // console.log("🚀 Early cache hit - preparing avatar for instant playback")
            // TODO: Trigger predictive avatar preparation
          }
        }

        // Only process final results (complete sentences/phrases)
        if (isFinal && transcript.length > 0) {
          console.log("📝 Recognized speech:", transcript)
          performanceTimings.recognitionComplete = performance.now()

          // PHASE 4 OPTIMIZATION: Medical term cache lookup to bypass LLM (Requirement 1.3)
          const cacheResult = medicalTermCache.lookup(transcript)

          if (cacheResult.hit && cacheResult.entry) {
            // Cache HIT - bypass LLM processing entirely for ultra-low latency
            console.log("⚡ Cache HIT - bypassing LLM processing")

            // Update subtitles immediately with cached mediated text
            setSubtitles((prev) => {
              const newEntry: SubtitleEntry = { primary: cacheResult.entry!.mediatedText }
              const newSubtitles = [...prev, newEntry]
              return newSubtitles.slice(-3)
            })

            // Trigger sign sequence if available
            if (cacheResult.entry.signIntent) {
              try {
                const glosses = [cacheResult.entry.signIntent as ISLGloss]
                console.log("🤟 Triggering cached sign sequence:", glosses)
                setSignSequence(glosses)
              } catch (error) {
                console.warn("⚠️ Cached sign playback failed, continuing without signing")
              }
            }

            // Set status to speaking immediately (skip understanding/responding stages)
            setStatus("speaking")

            // Return to listening after brief display
            setTimeout(() => {
              setStatus("listening")
            }, 2000)

          } else {
            // Cache MISS - use full pipeline with LLM processing
            console.log("❌ Cache MISS - using full LLM pipeline")
            performanceTimings.pipelineStart = performance.now()

            // ====================================================================
            // PIPELINE CONTROLLER INTEGRATION - Speech Input
            // ====================================================================
            // IMPORTANT: The controller handles the "isProcessing" state internally.
            // We just fire and forget here.
            pipelineController.current.processInput(
              {
                type: "speech",
                transcript: transcript,
              },
              {
                mode: mode as MediationMode,
                context: context as MediationContext,
                recentHistory: subtitles.map(s => s.primary).slice(-2), // Last 2 utterances for context
              },
              context === "emergency" // Pass emergency mode flag
            )
          }

          // Performance timing: Log complete recognition timing
          const recognitionDuration = performanceTimings.recognitionComplete - performanceTimings.speechStart
          console.log(`📊 Speech recognition: ${recognitionDuration.toFixed(1)}ms`)
        }
      }

      // ========================================================================
      // EVENT: Speech End - Recognition stopped
      // ========================================================================
      recognition.onend = () => {
        console.log("🎤 Speech recognition ended")

        // Use robust restart logic
        restartRecognition(300) // Short delay to prevent tight loops
      }

      // ========================================================================
      // EVENT: Error Handling
      // ========================================================================
      recognition.onerror = (event: any) => {
        // Handle specific error cases
        switch (event.error) {
          case "no-speech":
            // Normal behavior for silence. 
            // Just restart with a standard check.
            restartRecognition(100)
            break

          case "aborted":
            // Do nothing, likely intentional stop
            break

          case "not-allowed":
          case "permission-denied":
            console.error("🚫 Microphone permission denied.")
            trackError("Microphone permission denied", { mode, context })
            // Stop retrying
            return

          case "audio-capture":
            console.error("🎤 No microphone found.")
            trackError("No microphone found", { mode, context })
            return

          case "network":
            console.error("🌐 Network error - attempting retry...")
            trackError("Speech recognition network error", { mode, context })
            // Retry with longer backoff
            restartRecognition(2000)
            break

          default:
            console.error(`❌ Speech recognition error: ${event.error}`)
            // Attempt recovery for unknown errors
            restartRecognition(1000)
        }
      }

      // ========================================================================
      // Start Recognition
      // ========================================================================
      try {
        recognition.start()
        console.log("✅ Speech-to-Text initialized for Hearing → Deaf communication")
      } catch (error) {
        console.error("Failed to start speech recognition:", error)
      }

      // ========================================================================
      // Cleanup
      // ========================================================================
      return () => {
        console.log("🛑 Stopping speech recognition...")
        if (restartTimeout) clearTimeout(restartTimeout)
        try {
          recognition.stop()
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }

    // Start microphone initialization
    // This must be triggered from user gesture for permission prompt
    initializeMicrophone()

  }, [mode, micActive]) // Re-run when mode or mic state changes

  // ============================================================================
  // REAL SIGN LANGUAGE RECOGNITION - Production MVP (Phase 2B)
  // ============================================================================
  /**
   * SIGN LANGUAGE RECOGNITION FOR DEAF → HEARING COMMUNICATION
   * 
   * This effect implements real-time hand tracking and gesture recognition using
   * MediaPipe Hands when:
   * - Demo mode is OFF (DEMO_MODE_ENABLED === false)
   * - Mode is "deaf-to-hearing" (Deaf person signing to hearing user)
   * - Camera is active (cameraActive === true)
   * 
   * INTEGRATION FLOW:
   * 1. Initialize MediaPipe Hands model
   * 2. Request camera permissions
   * 3. Capture video frames continuously
   * 4. Detect hand landmarks (21 points per hand)
   * 5. On hands detected:
   *    - Set status to "listening"
   *    - Track hand positions and movements
   * 6. On gesture recognized:
   *    - Set status to "understanding"
   *    - Map landmarks to intent (pain, help, yes, no, etc.)
   *    - TODO: Replace heuristics with ML gesture classifier
   * 7. After recognition:
   *    - Set status to "responding"
   *    - Generate text interpretation
   *    - TODO: Add context-aware response generation
   * 8. Display output:
   *    - Set status to "speaking"
   *    - Update subtitles with interpreted phrase
   *    - TODO: Trigger text-to-speech for hearing user
   * 
   * GESTURE RECOGNITION APPROACH:
   * - Intent-level gestures (not full ASL vocabulary)
   * - Examples: pain, help, yes, no, pointing, numbers 1-5
   * - Heuristic-based detection using landmark geometry
   * - Future: Replace with trained ML model for full ASL
   * 
   * FUTURE INTEGRATION POINTS:
   * - Line 620: Replace heuristics with ML gesture classifier
   * - Line 640: Add medical context understanding
   * - Line 650: Connect to text-to-speech for hearing user
   * 
   * GRACEFUL DEGRADATION:
   * - If MediaPipe unavailable, logs warning and falls back to demo
   * - If camera permission denied, shows user-friendly error
   * - If no hands detected, remains in listening state
   */
  useEffect(() => {
    // Guard clauses - only run sign recognition in production mode for deaf-to-hearing
    if (DEMO_MODE_ENABLED) return
    if (mode !== "deaf-to-hearing") return
    if (!cameraActive) return

    // Dynamic import to avoid SSR issues with MediaPipe
    let hands: any = null
    let camera: any = null
    let videoElement: HTMLVideoElement | null = null
    let canvasElement: HTMLCanvasElement | null = null
    let isProcessing = false
    let processingTimeout: NodeJS.Timeout | null = null
    let lastGestureTime = 0
    const GESTURE_COOLDOWN = 2000 // Minimum 2s between gesture recognitions

    // Motion tracking for dynamic gestures
    let previousLandmarks: any[] | null = null
    let motionHistory: { x: number; y: number; z: number; timestamp: number }[] = []
    const MOTION_HISTORY_LENGTH = 10 // Track last 10 frames for motion analysis

    // Prediction stabilization - require consistent predictions across frames
    const STABILITY_THRESHOLD = 3 // Require 3 consecutive identical predictions
    let predictionBuffer: string[] = []
    let lastStableGesture: string | null = null
    let confidenceHistory: number[] = []

    // Get stable gesture from prediction buffer
    const getStableGesture = (prediction: string, confidence: number): string | null => {
      predictionBuffer.push(prediction)
      confidenceHistory.push(confidence)

      if (predictionBuffer.length > STABILITY_THRESHOLD) {
        predictionBuffer.shift()
        confidenceHistory.shift()
      }

      // All predictions must match for stability
      if (predictionBuffer.length === STABILITY_THRESHOLD &&
        predictionBuffer.every(p => p === prediction)) {
        // Average confidence must be above threshold
        const avgConfidence = confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length
        if (avgConfidence >= 0.7) {
          // Only return if different from last stable gesture (prevent repeats)
          if (prediction !== lastStableGesture) {
            lastStableGesture = prediction
            return prediction
          }
        }
      }
      return null
    }

    // Reset stabilization when gesture is processed
    const resetStabilization = () => {
      predictionBuffer = []
      confidenceHistory = []
      // Keep lastStableGesture to prevent immediate re-trigger
    }

    const initializeMediaPipe = async () => {
      try {
        // Dynamically import MediaPipe modules
        const { Hands } = await import("@mediapipe/hands")
        const { Camera } = await import("@mediapipe/camera_utils")

        console.log("📹 Initializing MediaPipe Hands for sign language recognition...")

        // Create visible video/canvas elements using refs if available, or fallback to hidden
        videoElement = videoRef.current
        if (!videoElement) {
          videoElement = document.createElement("video")
          videoElement.style.display = "none"
          videoElement.setAttribute("playsinline", "true")
          document.body.appendChild(videoElement)
        }

        canvasElement = canvasRef.current
        if (!canvasElement) {
          canvasElement = document.createElement("canvas")
          canvasElement.style.display = "none"
          canvasElement.width = 640
          canvasElement.height = 480
          document.body.appendChild(canvasElement)
        } else {
          // Ensure canvas resolution matches internal processing resolution
          canvasElement.width = 640
          canvasElement.height = 480
        }

        // ====================================================================
        // MEDIAPIPE HANDS CONFIGURATION
        // ====================================================================
        hands = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          },
        })

        // Configure for optimal performance and accuracy
        hands.setOptions({
          maxNumHands: 2, // Track both hands
          modelComplexity: 1, // 0=lite, 1=full (balanced)
          minDetectionConfidence: 0.7, // Higher = fewer false positives
          minTrackingConfidence: 0.5, // Lower = smoother tracking
        })

        // ====================================================================
        // HAND LANDMARK PROCESSING
        // ====================================================================
        hands.onResults(async (results: any) => {
          if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            // No hands detected - clear hand pose targets and remain in listening state
            setHandPoseTargets(undefined)

            // Clear canvas
            if (canvasElement) {
              const ctx = canvasElement.getContext('2d')
              if (ctx) ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
            }

            if (!isProcessing) {
              setStatus("listening")
            }
            return
          }

          // Draw landmarks on canvas for visual feedback
          if (canvasElement) {
            const ctx = canvasElement.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

              // Draw each hand
              if (results.multiHandLandmarks) {
                for (const landmarks of results.multiHandLandmarks) {
                  // Draw dots for joints
                  ctx.fillStyle = "rgba(0, 255, 128, 0.8)" // Bright teal-green
                  for (const landmark of landmarks) {
                    const x = landmark.x * canvasElement.width
                    const y = landmark.y * canvasElement.height

                    ctx.beginPath()
                    ctx.arc(x, y, 4, 0, 2 * Math.PI)
                    ctx.fill()
                  }
                }
              }
            }
          }

          // ================================================================
          // EXTRACT WRIST LANDMARKS FOR AVATAR IK
          // ================================================================
          const newTargets: HandPoseTargets = {}

          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i]
            const handedness = results.multiHandedness?.[i]?.label || "Unknown"
            const wrist = landmarks[0] // Landmark 0 is always wrist

            if (handedness === "Left") {
              // MediaPipe "Left" label means user's left hand (mirrored in camera)
              newTargets.leftWrist = { x: wrist.x, y: wrist.y, z: wrist.z || 0 }
            } else if (handedness === "Right") {
              newTargets.rightWrist = { x: wrist.x, y: wrist.y, z: wrist.z || 0 }
            }
          }

          setHandPoseTargets(newTargets)

          // Hands detected - process gestures
          if (!isProcessing) {
            setStatus("listening")
          }

          // Throttle gesture recognition to avoid spam
          const now = Date.now()
          if (now - lastGestureTime < GESTURE_COOLDOWN) {
            return
          }

          // ================================================================
          // GESTURE RECOGNITION - With Stabilization and Caching
          // ================================================================

          // Check cache first for deaf→hearing mode
          const gestureKey = avatarCache.generateGestureKey(results.multiHandLandmarks)
          const cachedRecognition = avatarCache.getSignRecognition(gestureKey)

          if (cachedRecognition && !isProcessing) {
            console.log("👋 Using cached gesture recognition:", cachedRecognition.recognizedSigns)

            // Use cached result directly
            lastGestureTime = now
            isProcessing = true

            pipelineController.current.processInput(
              {
                type: "gesture",
                intent: cachedRecognition.recognizedSigns[0] || "unknown",
                phrase: cachedRecognition.recognizedSigns.join(" "),
              },
              {
                mode: mode as MediationMode,
                context: context as MediationContext,
                recentHistory: subtitles.slice(-2),
              },
              context === "emergency" // Pass emergency mode flag
            )
            return
          }

          const gestureResult = recognizeGesture(results.multiHandLandmarks, results.multiHandedness)

          if (gestureResult && !isProcessing) {
            // Apply stabilization - require consistent predictions
            const stableIntent = getStableGesture(gestureResult.intent, gestureResult.confidence || 0.8)

            if (stableIntent) {
              lastGestureTime = now
              isProcessing = true
              resetStabilization()

              console.log("👋 Stable gesture recognized:", stableIntent, "confidence:", gestureResult.confidence?.toFixed(2))

              // Cache the recognition result for future use
              avatarCache.setSignRecognition(gestureKey, {
                gestureData: JSON.stringify(results.multiHandLandmarks),
                recognizedSigns: [gestureResult.intent],
                confidence: gestureResult.confidence || 0.8,
              })

              // ================================================================
              // PIPELINE CONTROLLER INTEGRATION - Gesture Input
              // ================================================================
              // Instead of manually managing state transitions with nested setTimeout,
              // we delegate to the pipeline controller which handles:
              // - AI mediation (understanding stage)
              // - Response preparation (generating stage)
              // - Subtitle emission (delivering stage)
              // - Automatic return to listening
              //
              // All timing values are centralized in PIPELINE_TIMINGS configuration.
              // ================================================================

              pipelineController.current.processInput(
                {
                  type: "gesture",
                  intent: gestureResult.intent,
                  phrase: gestureResult.phrase,
                },
                {
                  mode: mode as MediationMode,
                  context: context as MediationContext,
                  recentHistory: subtitles.map(s => s.primary).slice(-2), // Last 2 utterances for context
                },
                context === "emergency" // Pass emergency mode flag
              )

              // Reset processing flag after pipeline completes
              // Pipeline handles all timing internally
              setTimeout(() => {
                isProcessing = false
              }, 4000) // Total pipeline duration (1200 + 800 + 2000)

              // TODO: INTEGRATION POINT - Medical Context Analysis
              // Hook into pipeline controller's 'understand' stage for medical analysis
              // Example:
              // pipelineController.current.onUnderstand = async (input) => {
              //   const analysis = await analyzeMedicalGesture(gesture)
              //   if (analysis.isEmergency) setContext("emergency")
              //   return analysis
              // }

              // TODO: INTEGRATION POINT - Text-to-Speech
              // TTS is currently handled separately in useEffect (lines 1027-1082)
              // Could be integrated into pipeline controller for better encapsulation
            }
          }
        })

        // ====================================================================
        // CAMERA INITIALIZATION
        // ====================================================================
        camera = new Camera(videoElement, {
          onFrame: async () => {
            if (hands && videoElement) {
              await hands.send({ image: videoElement })
            }
          },
          width: 640,
          height: 480,
        })

        await camera.start()
        console.log("✅ Sign language recognition initialized for Deaf → Hearing communication")
        setStatus("listening")
      } catch (error: any) {
        console.error("❌ Failed to initialize MediaPipe Hands:", error)

        // Handle specific error cases
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          console.error(
            "🚫 Camera permission denied. " +
            "Please allow camera access in browser settings."
          )
          trackError("Camera permission denied", { mode, context })
          // TODO: Show user-friendly error message in UI
        } else if (error.name === "NotFoundError") {
          console.error("📹 No camera found. Please connect a camera and refresh.")
          trackError("No camera found", { mode, context })
          // TODO: Show user-friendly error message in UI
        } else {
          console.error("Unknown error during MediaPipe initialization:", error)
          trackError(`MediaPipe initialization error: ${error.message}`, { mode, context })
        }
      }
    }

    // Start initialization
    initializeMediaPipe()

    // ========================================================================
    // CLEANUP
    // ========================================================================
    return () => {
      console.log("🛑 Stopping sign language recognition...")

      if (processingTimeout) {
        clearTimeout(processingTimeout)
      }

      if (camera) {
        try {
          camera.stop()
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      if (hands) {
        try {
          hands.close()
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      if (videoElement && videoElement.parentNode && videoElement !== videoRef.current) {
        videoElement.parentNode.removeChild(videoElement)
      }

      if (canvasElement && canvasElement.parentNode && canvasElement !== canvasRef.current) {
        canvasElement.parentNode.removeChild(canvasElement)
      }
    }
  }, [mode, cameraActive]) // Re-run when mode or camera state changes

  // ============================================================================
  // TEXT-TO-SPEECH OUTPUT - Production MVP (Phase 4)
  // ============================================================================
  /**
   * TEXT-TO-SPEECH (TTS) FOR HEARING USER OUTPUT
   * 
   * This effect converts mediated text to speech when:
   * - Demo mode is OFF (DEMO_MODE_ENABLED === false)
   * - Status is "speaking" (AI is delivering output)
   * - Subtitles are available (there's text to speak)
   * 
   * DUPLICATE PREVENTION:
   * - Tracks last-spoken text using useRef
   * - Only speaks if text has changed
   * - Prevents repeated playback of same subtitle
   * 
   * INTEGRATION FLOW:
   * 1. Monitor status changes
   * 2. When status becomes "speaking":
   *    - Extract latest subtitle line
   *    - Check if already spoken (duplicate prevention)
   *    - Pass to TTS with context-aware parameters
   *    - Hospital: slower, calmer voice (rate 0.9)
   *    - Emergency: faster, urgent voice (rate 1.1)
   * 3. When status/mode/context changes:
   *    - Cancel any ongoing speech immediately
   *    - Reset last-spoken tracker
   * 4. On component unmount:
   *    - Clean up and cancel speech
   * 
   * CONTEXT-AWARE VOICE PARAMETERS:
   * - Hospital context: Calm, reassuring, slightly slower
   * - Emergency context: Urgent, direct, slightly faster
   * 
   * FUTURE ENHANCEMENTS:
   * - Replace browser TTS with premium service (ElevenLabs, Google Cloud TTS)
   * - Add voice customization (user preferences)
   * - Add multi-language support
   * - Add SSML for medical term pronunciation
   * 
   * See lib/speech-synthesis.ts for detailed TTS implementation notes.
   */

  // Track last-spoken text to prevent duplicates
  const lastSpokenTextRef = useRef<string>("")

  useEffect(() => {
    // Guard clauses - only run TTS in production mode when speaking
    if (DEMO_MODE_ENABLED) return
    if (status !== "speaking") {
      // CRITICAL FIX: Only cancel speech when NOT in deaf-to-hearing mode
      // In deaf-to-hearing mode, speech must complete fully before being canceled
      if (mode !== "deaf-to-hearing") {
        speechSynthesis.cancel()
      }
      // Reset last-spoken tracker when not speaking
      lastSpokenTextRef.current = ""
      return
    }
    if (subtitles.length === 0) return

    // Check if TTS is available in this browser
    if (!speechSynthesis.isAvailable()) {
      console.warn(
        "⚠️ Text-to-Speech not available in this browser. " +
        "For production, use Chrome, Edge, Safari, or Firefox."
      )
      return
    }

    // Extract the latest subtitle line to speak
    const latestSubtitle = subtitles[subtitles.length - 1]
    const latestSubtitleText = latestSubtitle.primary

    // DUPLICATE PREVENTION: Only speak if text has changed
    if (latestSubtitleText === lastSpokenTextRef.current) {
      // Already spoken this text, skip to prevent repetition
      return
    }

    // CRITICAL FIX: Prevent interrupting ongoing speech
    // If TTS is already speaking, do NOT start new speech
    // Latest recognition must wait, not cancel
    if (speechSynthesis.isSpeaking()) {
      console.log("🔊 Speech already in progress, queuing new text")
      return
    }

    // Update last-spoken tracker
    lastSpokenTextRef.current = latestSubtitleText

    console.log(`🔊 Speaking (${context} context):`, latestSubtitleText)

    // Speak the text with context-aware parameters
    speechSynthesis.speak({
      text: latestSubtitleText,
      context: context, // "hospital" or "emergency"
      variant: mode === "deaf-to-hearing" ? "sweet" : "default", // Use "sweet" voice for sign recognition
      onStart: () => {
        console.log("✅ TTS started")
      },
      onEnd: () => {
        console.log("✅ TTS completed")
        // CRITICAL FIX: In deaf-to-hearing mode, restart listening ONLY after speech completes
        // This ensures sequential flow: recognize → speak → listen
        if (mode === "deaf-to-hearing") {
          console.log("🎤 Speech complete, resuming listening...")
          setStatus("listening")
        }
      },
      onError: (error) => {
        console.error("❌ TTS error:", error.message)
        // Graceful degradation - continue without speech
        // Log emergency state error if in emergency mode
        if (context === 'emergency') {
          dispatchEmergency({ type: 'ERROR_OCCURRED', error: `TTS error: ${error.message}` })
        }
      },
    })

    // CRITICAL FIX: Do NOT cancel speech in cleanup for deaf-to-hearing mode
    // Speech must complete fully before being interrupted
    return () => {
      if (mode !== "deaf-to-hearing") {
        speechSynthesis.cancel()
      }
    }
  }, [status, subtitles, context, mode, dispatchEmergency]) // Added mode dependency

  // Cancel speech immediately when mode changes (user switches communication direction)
  useEffect(() => {
    speechSynthesis.cancel()
    lastSpokenTextRef.current = ""
  }, [mode])

  // ============================================================================
  // GESTURE RECOGNITION LOGIC - Enhanced ASL Sign Detection
  // ============================================================================
  /**
   * ENHANCED GESTURE RECOGNITION FUNCTION
   * 
   * Analyzes hand landmarks to recognize ASL signs using:
   * - Geometric heuristics for hand shape detection
   * - Palm orientation analysis
   * - Position-based detection (near face, chest, etc.)
   * - Two-hand coordination for complex signs
   * 
   * SUPPORTED SIGNS:
   * - Basic: HELLO, GOODBYE, THANK_YOU, PLEASE, SORRY, GOOD, BAD
   * - Pronouns: I_ME, YOU, WE_US, THEY_THEM, MY_MINE
   * - Emotions: HAPPY, SAD, LOVE
   * - Actions: EAT, DRINK, SLEEP, WANT, LIKE, UNDERSTAND, HELP, STOP
   * - Numbers: ONE, TWO, THREE, FOUR, FIVE
   * 
   * @param landmarks - Array of hand landmark arrays (21 points per hand)
   * @param handedness - Array indicating left/right hand
   * @returns Recognized gesture with intent, phrase, and confidence, or null
   */
  function recognizeGesture(landmarks: any[], handedness: any[]): { intent: string; phrase: string; confidence: number } | null {
    if (!landmarks || landmarks.length === 0) return null

    const firstHand = landmarks[0]
    const secondHand = landmarks.length > 1 ? landmarks[1] : null
    const handLabel = handedness?.[0]?.label || "Unknown"

    // ========================================================================
    // LANDMARK INDICES (MediaPipe Hands standard)
    // ========================================================================
    // 0: Wrist
    // 1-4: Thumb (CMC, MCP, IP, TIP)
    // 5-8: Index finger (MCP, PIP, DIP, TIP)
    // 9-12: Middle finger (MCP, PIP, DIP, TIP)
    // 13-16: Ring finger (MCP, PIP, DIP, TIP)
    // 17-20: Pinky (MCP, PIP, DIP, TIP)

    const wrist = firstHand[0]
    const thumbCMC = firstHand[1]
    const thumbMCP = firstHand[2]
    const thumbIP = firstHand[3]
    const thumbTip = firstHand[4]
    const indexMCP = firstHand[5]
    const indexPIP = firstHand[6]
    const indexDIP = firstHand[7]
    const indexTip = firstHand[8]
    const middleMCP = firstHand[9]
    const middlePIP = firstHand[10]
    const middleDIP = firstHand[11]
    const middleTip = firstHand[12]
    const ringMCP = firstHand[13]
    const ringPIP = firstHand[14]
    const ringDIP = firstHand[15]
    const ringTip = firstHand[16]
    const pinkyMCP = firstHand[17]
    const pinkyPIP = firstHand[18]
    const pinkyDIP = firstHand[19]
    const pinkyTip = firstHand[20]

    // ========================================================================
    // HAND SIZE NORMALIZATION
    // ========================================================================
    // Normalize all distances by hand size (wrist to middle fingertip)
    // This makes recognition consistent across different hand sizes and distances
    const handSize = Math.sqrt(
      Math.pow(middleTip.x - wrist.x, 2) +
      Math.pow(middleTip.y - wrist.y, 2) +
      Math.pow((middleTip.z || 0) - (wrist.z || 0), 2)
    )
    const normalizer = handSize > 0.01 ? handSize : 0.2 // Prevent division by zero

    // ========================================================================
    // HELPER: Create gesture result with confidence
    // ========================================================================
    // Confidence is calculated based on how many matching criteria are satisfied
    const makeGesture = (intent: string, phrase: string, matchScore: number = 0.85) => ({
      intent,
      phrase,
      confidence: Math.min(1.0, Math.max(0.5, matchScore))
    })

    // ========================================================================
    // HELPER FUNCTIONS - Geometric calculations
    // ========================================================================
    const distance = (p1: any, p2: any) => {
      return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow((p1.z || 0) - (p2.z || 0), 2)
      )
    }

    const distance2D = (p1: any, p2: any) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    }

    // Improved finger extension detection with angle calculation
    const getFingerCurlAngle = (tip: any, pip: any, mcp: any): number => {
      // Calculate vectors
      const v1 = { x: pip.x - mcp.x, y: pip.y - mcp.y, z: (pip.z || 0) - (mcp.z || 0) }
      const v2 = { x: tip.x - pip.x, y: tip.y - pip.y, z: (tip.z || 0) - (pip.z || 0) }

      // Dot product and magnitudes
      const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z)
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z)

      if (mag1 < 0.001 || mag2 < 0.001) return 0

      // Angle in radians (0 = straight, PI = fully curled)
      const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
      return Math.acos(cosAngle)
    }

    const isFingerExtended = (tip: any, pip: any, mcp: any) => {
      const angle = getFingerCurlAngle(tip, pip, mcp)
      return angle < 0.7 // Less than ~40 degrees = extended
    }

    const isFingerCurled = (tip: any, pip: any, mcp: any) => {
      const angle = getFingerCurlAngle(tip, pip, mcp)
      return angle > 1.2 // More than ~70 degrees = curled
    }

    // Palm orientation detection
    const getPalmOrientation = () => {
      // Use the palm plane defined by wrist, index MCP, and pinky MCP
      const v1 = { x: indexMCP.x - wrist.x, y: indexMCP.y - wrist.y, z: (indexMCP.z || 0) - (wrist.z || 0) }
      const v2 = { x: pinkyMCP.x - wrist.x, y: pinkyMCP.y - wrist.y, z: (pinkyMCP.z || 0) - (wrist.z || 0) }

      // Cross product for palm normal
      const normal = {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
      }

      // Determine primary direction
      const absX = Math.abs(normal.x)
      const absY = Math.abs(normal.y)
      const absZ = Math.abs(normal.z)

      if (absZ > absX && absZ > absY) {
        return normal.z > 0 ? 'out' : 'in' // Palm facing camera or away
      } else if (absY > absX) {
        return normal.y > 0 ? 'down' : 'up' // Palm facing down or up
      } else {
        return 'side' // Palm facing sideways
      }
    }

    // Position detection (relative to normalized coordinates)
    const isNearFace = (point: any) => point.y < 0.4 // Upper 40% of frame
    const isNearChest = (point: any) => point.y > 0.4 && point.y < 0.7
    const isNearForehead = (point: any) => point.y < 0.25
    const isNearChin = (point: any) => point.y > 0.25 && point.y < 0.45
    const isNearMouth = (point: any) => point.y > 0.3 && point.y < 0.5

    // ========================================================================
    // FINGER STATE DETECTION
    // ========================================================================
    const indexExtended = isFingerExtended(indexTip, indexPIP, indexMCP)
    const middleExtended = isFingerExtended(middleTip, middlePIP, middleMCP)
    const ringExtended = isFingerExtended(ringTip, ringPIP, ringMCP)
    const pinkyExtended = isFingerExtended(pinkyTip, pinkyPIP, pinkyMCP)
    const thumbExtended = distance(thumbTip, wrist) > distance(thumbMCP, wrist) * 1.5

    const indexCurled = isFingerCurled(indexTip, indexPIP, indexMCP)
    const middleCurled = isFingerCurled(middleTip, middlePIP, middleMCP)
    const ringCurled = isFingerCurled(ringTip, ringPIP, ringMCP)
    const pinkyCurled = isFingerCurled(pinkyTip, pinkyPIP, pinkyMCP)

    const allFingersExtended = indexExtended && middleExtended && ringExtended && pinkyExtended
    const allFingersCurled = indexCurled && middleCurled && ringCurled && pinkyCurled
    const palmOrientation = getPalmOrientation()

    // Count extended fingers (excluding thumb)
    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length

    // ========================================================================
    // TWO-HAND GESTURE DETECTION
    // ========================================================================
    if (secondHand) {
      const wrist2 = secondHand[0]
      const indexTip2 = secondHand[8]
      const middleTip2 = secondHand[12]

      // LOVE: Both arms crossed over chest (fists with arms crossed)
      const handsCrossed = Math.abs(wrist.x - wrist2.x) < 0.3 &&
        Math.abs(wrist.y - wrist2.y) < 0.2 &&
        isNearChest(wrist) && isNearChest(wrist2)
      if (handsCrossed && allFingersCurled) {
        return makeGesture("love", "Love")
      }

      // HAPPY: Both hands brushing upward on chest
      const bothNearChest = isNearChest(wrist) && isNearChest(wrist2)
      if (bothNearChest && allFingersExtended) {
        return makeGesture("happy", "Happy")
      }

      // SAD: Both hands sliding down in front of face
      const bothNearFace = isNearFace(wrist) && isNearFace(wrist2)
      if (bothNearFace && allFingersExtended && palmOrientation === 'in') {
        return makeGesture("sad", "Sad")
      }

      // WANT: Both hands pulling toward self (open hands, palms up)
      if (bothNearChest && palmOrientation === 'up') {
        return makeGesture("want", "I want")
      }

      // HELP: Fist on open palm (one hand flat, one fist)
      const hand1Fist = allFingersCurled
      const hand2Open = distance(secondHand[8], secondHand[5]) > distance(secondHand[6], secondHand[5]) * 1.3
      if ((hand1Fist && hand2Open) || (hand2Open && hand1Fist)) {
        return makeGesture("help", "I need help")
      }
    }

    // ========================================================================
    // SINGLE-HAND GESTURE DETECTION (Priority Order)
    // ========================================================================

    // ----- GESTURES NEAR FOREHEAD -----

    // HELLO: Flat hand salute near forehead, palm out
    if (allFingersExtended && isNearForehead(indexTip) && palmOrientation === 'out') {
      return makeGesture("hello", "Hello")
    }

    // UNDERSTAND: Finger at temple pointing up
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      if (isNearForehead(indexTip) && indexTip.y < indexMCP.y) {
        return makeGesture("understand", "I understand")
      }
    }

    // ----- GESTURES NEAR CHIN/MOUTH -----

    // THANK_YOU: Flat hand from chin outward
    if (allFingersExtended && isNearChin(indexTip) && palmOrientation === 'in') {
      return makeGesture("thank_you", "Thank you")
    }

    // GOOD: Flat hand touching chin, palm in
    if (allFingersExtended && isNearChin(middleTip) && palmOrientation === 'in') {
      return makeGesture("good", "Good")
    }

    // BAD: Flat hand from chin with palm facing down
    if (allFingersExtended && isNearChin(wrist) && palmOrientation === 'down') {
      return makeGesture("bad", "Bad")
    }

    // EAT: Fingertips to mouth (all fingers together, pointing at face)
    const fingertipsClose = distance2D(indexTip, middleTip) < 0.05 &&
      distance2D(middleTip, ringTip) < 0.05
    if (fingertipsClose && isNearMouth(indexTip)) {
      return makeGesture("eat", "Eat / Food")
    }

    // DRINK: C-hand shape near mouth (curved hand)
    const cHandShape = thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended
    if (cHandShape && isNearMouth(indexTip)) {
      return makeGesture("drink", "Drink")
    }

    // WATER: W-hand (three fingers) at chin
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended && isNearChin(indexTip)) {
      return makeGesture("water", "Water")
    }

    // ----- GESTURES NEAR CHEST -----

    // PLEASE: Flat palm on chest, circular motion (detected as palm in, near chest)
    if (allFingersExtended && isNearChest(wrist) && palmOrientation === 'in') {
      return makeGesture("please", "Please")
    }

    // SORRY: Fist on chest (circular motion detected as fist near chest)
    if (allFingersCurled && isNearChest(wrist) && palmOrientation === 'in') {
      return makeGesture("sorry", "Sorry")
    }

    // MY_MINE: Flat palm pressed on chest
    if (allFingersExtended && isNearChest(indexTip) && palmOrientation === 'in') {
      return makeGesture("my_mine", "My / Mine")
    }

    // I_ME: Index finger pointing to self (toward chest)
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      if (isNearChest(indexTip) && palmOrientation === 'in') {
        return makeGesture("i_me", "I / Me")
      }
    }

    // LIKE: Pinching pull from chest (thumb and middle finger extend)
    if (thumbExtended && middleExtended && !indexExtended && isNearChest(wrist)) {
      return makeGesture("like", "Like")
    }

    // ----- GESTURES IN NEUTRAL SPACE -----

    // GOODBYE: Flat hand waving (all fingers extended, palm out)
    if (allFingersExtended && palmOrientation === 'out' && !isNearFace(wrist) && !isNearChest(wrist)) {
      return makeGesture("goodbye", "Goodbye")
    }

    // STOP: Flat hand forward, palm out (like pushing)
    if (allFingersExtended && thumbExtended && palmOrientation === 'out') {
      return makeGesture("stop", "Stop")
    }

    // YES: Fist nodding (fist with palm facing side)
    if (allFingersCurled && palmOrientation === 'side') {
      return makeGesture("yes", "Yes")
    }

    // NO: Two fingers pinching (index and middle extended, coming together)
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
      const fingersClose = distance2D(indexTip, middleTip) < 0.08
      if (fingersClose) {
        return makeGesture("no", "No")
      }
    }

    // YOU: Index finger pointing forward
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      if (palmOrientation === 'side' || palmOrientation === 'up') {
        return makeGesture("you", "You")
      }
    }

    // WE_US: Index finger arcing (detected as pointing with palm in)
    if (indexExtended && !middleExtended && palmOrientation === 'in' && isNearChest(wrist)) {
      return makeGesture("we_us", "We / Us")
    }

    // THEY_THEM: Index sweeping outward (pointing with palm up, away from body)
    if (indexExtended && !middleExtended && palmOrientation === 'up' && !isNearChest(wrist)) {
      return makeGesture("they_them", "They / Them")
    }

    // SLEEP: Open hand closing in front of face
    if (isNearFace(wrist) && palmOrientation === 'in') {
      return makeGesture("sleep", "Sleep")
    }

    // ----- NUMBER GESTURES -----

    // Number 1: Index finger only
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return makeGesture("number_1", "One")
    }

    // Number 2: Index and middle fingers (V sign)
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return makeGesture("number_2", "Two")
    }

    // Number 3: Index, middle, ring fingers OR thumb, index, middle (ASL style)
    if (extendedCount === 3 && !pinkyExtended) {
      return makeGesture("number_3", "Three")
    }

    // Number 4: All fingers except thumb
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return makeGesture("number_4", "Four")
    }

    // Number 5: All fingers including thumb
    if (allFingersExtended && thumbExtended) {
      return makeGesture("number_5", "Five")
    }

    // ----- FALLBACK GESTURES -----

    // Thumbs up (thumb extended, all others closed)
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const thumbUp = thumbTip.y < thumbMCP.y
      if (thumbUp) {
        return makeGesture("thumbs_up", "Good / Yes")
      }
    }

    // Pain: Fist near body
    if (allFingersCurled && wrist.z > 0) {
      return makeGesture("pain", "I'm experiencing pain")
    }

    // Pointing gestures
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const pointingUp = indexTip.y < wrist.y - 0.15
      const pointingDown = indexTip.y > wrist.y + 0.15

      if (pointingUp) {
        return makeGesture("pointing_up", "Pointing up")
      } else if (pointingDown) {
        return makeGesture("pointing_down", "Pointing down")
      }
    }

    // No recognized gesture
    return null
  }

  return (
    <motion.section
      ref={sectionRef}
      style={{ y: sectionY, opacity: sectionOpacity }}
      className="relative bg-background/80 backdrop-blur-sm py-32 -mt-16"
    >
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl px-6 text-center"
      >
        <motion.span
          className="text-sm font-medium uppercase tracking-widest text-primary"
          initial={{ letterSpacing: "0.1em" }}
          whileInView={{ letterSpacing: "0.2em" }}
        >
          Application Interface
        </motion.span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
          The Communication Hub
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          A unified interface where AI mediates real-time communication between Deaf and Hearing participants.
        </p>
      </motion.div>

      {/* Main interface */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-16 max-w-5xl px-6"
      >
        <motion.div
          ref={interfaceContainerRef}
          className={cn(
            "relative overflow-hidden transition-all duration-700 emergency-container",
            isFullscreen
              ? "rounded-none border-0 w-screen h-screen flex flex-col bg-background"
              : "rounded-2xl border bg-card shadow-2xl",
            (!isFullscreen && context === "hospital") ? "border-border shadow-primary/10" : "",
            (!isFullscreen && context !== "hospital") ? "border-destructive/50 shadow-destructive/20 emergency-active" : "",
          )}
          animate={
            context === "emergency" && !isFullscreen
              ? {
                boxShadow: [
                  "0 25px 50px -12px rgba(var(--destructive), 0.2)",
                  "0 25px 50px -12px rgba(var(--destructive), 0.35)",
                  "0 25px 50px -12px rgba(var(--destructive), 0.2)",
                ],
              }
              : {}
          }
          transition={{ type: "tween", duration: 1.5, repeat: context === "emergency" ? Number.POSITIVE_INFINITY : 0 }}
        >
          {/* Emergency Mode Banner */}
          <AnimatePresence>
            {context === "emergency" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="emergency-banner overflow-hidden"
              >
                <div className="bg-destructive text-destructive-foreground px-6 py-3 text-center emergency-siren">
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      🚨
                    </motion.div>
                    <span className="font-bold text-lg emergency-text-scale emergency-active">
                      EMERGENCY MODE ACTIVE
                    </span>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      🚨
                    </motion.div>
                  </div>
                  <p className="text-sm mt-1 opacity-90">
                    Priority communication mode - Enhanced speed and reliability
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Interface Content */}
          <div
            className={cn(
              "flex items-center justify-between border-b px-6 py-4 transition-colors duration-500",
              context === "hospital" ? "border-border bg-secondary/30" : "border-destructive/30 bg-destructive/5",
            )}
          >
            {/* Context toggle */}
            <div className="flex items-center gap-2">
              <EmergencyErrorBoundary
                fallback={<EmergencyFallback />}
                onError={(error, errorInfo) => {
                  console.error('🚨 Emergency mode toggle error:', error)
                  reportError(`Emergency toggle: ${error.message}`) // Report to fallback system
                  dispatchEmergency({ type: 'ERROR_OCCURRED', error: error.message })
                }}
              >
                <ContextToggle
                  context={context}
                  onChange={() => dispatchEmergency({ type: 'TOGGLE_EMERGENCY' })}
                  isTransitioning={emergencyState.isTransitioning}
                />
              </EmergencyErrorBoundary>
            </div>

            {/* Mode indicator */}
            <div className="flex items-center gap-3">
              <ModeIndicator mode={mode} onChange={setMode} context={context} />

              {/* Emergency/Performance Badge */}
              <motion.div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
                  context === "emergency"
                    ? "bg-destructive text-destructive-foreground emergency-pulse"
                    : "bg-primary/10 text-primary"
                )}
                animate={context === "emergency" ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: context === "emergency" ? Infinity : 0 }}
              >
                {context === "emergency" ? "🚨 PRIORITY MODE" : "⚡ READY"}
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </motion.div>
          </div>

          <div
            className={cn(
              "relative w-full transition-all duration-700",
              isFullscreen ? "flex-1" : "aspect-video",
              context === "hospital"
                ? "bg-gradient-to-br from-secondary via-background to-secondary"
                : "bg-gradient-to-br from-destructive/10 via-background to-destructive/10",
            )}
          >
            {/* Animated grid overlay */}
            <motion.div
              className="absolute inset-0 opacity-[0.03]"
              animate={context === "emergency" ? { opacity: [0.03, 0.06, 0.03] } : { opacity: 0.03 }}
              transition={{ duration: 0.5, repeat: context === "emergency" ? Number.POSITIVE_INFINITY : 0 }}
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            <AnimatePresence>
              {status === "listening" && (
                <motion.div
                  className={cn(
                    "absolute left-0 right-0 h-px",
                    context === "hospital" ? "bg-primary/50" : "bg-destructive/50",
                  )}
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              )}
            </AnimatePresence>

            {/* Avatar Renderer - Video for Hearing→Deaf, 3D for Deaf→Hearing */}
            <div className="absolute inset-0 flex items-center justify-center">
              {mode === "hearing-to-deaf" ? (
                <VideoAvatarRenderer
                  signSequence={signSequence}
                  subtitles={subtitles.map(s => s.primary)}
                  className="h-48 w-48 md:h-64 md:w-64 rounded-full overflow-hidden"
                  onSignComplete={() => setSignSequence([])}
                />
              ) : (
                <div className="relative h-full w-full max-h-[80vh] max-w-[80vw] flex items-center justify-center overflow-hidden rounded-xl">
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10 bg-black/5">
                      <Camera className="w-12 h-12 mb-2 opacity-50" />
                      <p>Camera Off</p>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    className={cn("absolute inset-0 h-full w-full object-contain", !cameraActive && "opacity-0")}
                    style={{ transform: "scaleX(-1)" }} // Mirror effect
                    playsInline
                    muted
                    autoPlay
                  />

                  {/* 3D Avatar removed as per user request */}

                  <canvas
                    ref={canvasRef}
                    className={cn("absolute inset-0 h-full w-full object-contain pointer-events-none", !cameraActive && "opacity-0")}
                    style={{ transform: "scaleX(-1)" }} // Mirror effect to match video
                  />
                </div>
              )}
            </div>

            <motion.div
              className="absolute left-4 top-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm transition-colors duration-300",
                  cameraActive ? "bg-background/80" : "bg-background/50",
                )}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className={cn("h-2 w-2 rounded-full", cameraActive ? "bg-accent" : "bg-muted-foreground")}
                  animate={
                    cameraActive
                      ? {
                        boxShadow: ["0 0 0 0 var(--accent)", "0 0 8px 2px var(--accent)", "0 0 0 0 var(--accent)"],
                      }
                      : {}
                  }
                  transition={{ type: "tween", duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
                <span className="text-xs text-foreground">{cameraActive ? "Camera Active" : "Camera Off"}</span>
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute right-4 top-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm transition-colors duration-300",
                  micActive ? "bg-background/80" : "bg-background/50",
                )}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className={cn("h-2 w-2 rounded-full", micActive ? "bg-accent" : "bg-muted-foreground")}
                  animate={
                    micActive
                      ? {
                        boxShadow: ["0 0 0 0 var(--accent)", "0 0 8px 2px var(--accent)", "0 0 0 0 var(--accent)"],
                      }
                      : {}
                  }
                  transition={{ type: "tween", duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                />
                <span className="text-xs text-foreground">{micActive ? "Mic Active" : "Mic Off"}</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Subtitle panel */}
          <SubtitlePanel subtitles={subtitles} context={context} status={status} />

          {/* Bottom bar */}
          <div
            className={cn(
              "flex items-center justify-between border-t px-6 py-4 transition-colors duration-500",
              context === "hospital" ? "border-border bg-secondary/30" : "border-destructive/30 bg-destructive/5",
            )}
          >
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92, y: 2 }}>
                <Button
                  variant={cameraActive ? "default" : "secondary"}
                  size="icon"
                  onClick={() => setCameraActive(!cameraActive)}
                  className="relative overflow-hidden"
                >
                  <motion.span
                    className="absolute inset-0 bg-primary-foreground/10"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 2, opacity: [0, 0.3, 0] }}
                    transition={{ duration: 0.4 }}
                  />
                  <Camera className="h-5 w-5 relative z-10" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92, y: 2 }}>
                <Button
                  variant={micActive ? "default" : "secondary"}
                  size="icon"
                  onClick={() => setMicActive(!micActive)}
                  className="relative overflow-hidden"
                >
                  <motion.span
                    className="absolute inset-0 bg-primary-foreground/10"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 2, opacity: [0, 0.3, 0] }}
                    transition={{ duration: 0.4 }}
                  />
                  <Mic className="h-5 w-5 relative z-10" />
                </Button>
              </motion.div>
            </div>

            {/* System status */}
            <StatusPills status={status} context={context} />
          </div>
        </motion.div>
      </motion.div>

      {/* Debug Panel - Development Only */}
      <AvatarDebugPanel />

      {/* Emergency Fallback System */}
      <EmergencyFallbackSystem
        currentMode={fallbackMode}
        onFallbackActivated={(mode) => {
          activateFallback(mode)
          dispatchEmergency({ type: 'ACTIVATE_FALLBACK', mode })
        }}
        onRetryRequested={() => {
          retrySystem()
          dispatchEmergency({ type: 'RESET_STATE' })
        }}
      />

      {/* HIPAA Disclaimer */}
      <div className="w-full py-2 text-center pointer-events-none opacity-50">
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase flex items-center justify-center gap-2">
          <Shield className="w-3 h-3" />
          HIPAA Compliant • End-to-End Encrypted • No PHI Stored
        </p>
      </div>

      {/* Bottom gradient fade for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </motion.section>
  )
}

function ContextToggle({
  context,
  onChange,
  isTransitioning = false,
}: {
  context: Context
  onChange: () => void
  isTransitioning?: boolean
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-background p-1 relative">
      <motion.button
        onClick={() => context === "emergency" ? onChange() : undefined}
        className={cn(
          "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors z-10",
          context === "hospital" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        whileHover={{ scale: context === "hospital" ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isTransitioning}
      >
        {context === "hospital" && (
          <motion.div
            layoutId="context-bg"
            className="absolute inset-0 rounded-full bg-primary"
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          />
        )}
        <span className="relative z-10">Hospital</span>
      </motion.button>
      <motion.button
        onClick={() => context === "hospital" ? onChange() : undefined}
        className={cn(
          "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors z-10",
          context === "emergency" ? "text-destructive-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        whileHover={{ scale: context === "emergency" ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isTransitioning}
      >
        {context === "emergency" && (
          <motion.div
            layoutId="context-bg"
            className="absolute inset-0 rounded-full bg-destructive"
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 var(--destructive)",
                  "0 0 15px 3px var(--destructive)",
                  "0 0 0 0 var(--destructive)",
                ],
              }}
              transition={{ type: "tween", duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        )}
        <span className="relative z-10">
          {isTransitioning ? "Switching..." : "Emergency"}
        </span>
      </motion.button>
    </div>
  )
}

function ModeIndicator({
  mode,
  onChange,
  context,
}: {
  mode: Mode
  onChange: (mode: Mode) => void
  context: Context
}) {
  const toggleMode = () => {
    onChange(mode === "deaf-to-hearing" ? "hearing-to-deaf" : "deaf-to-hearing")
  }

  return (
    <motion.button
      onClick={toggleMode}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all duration-300",
        context === "hospital"
          ? "border-border bg-background hover:bg-secondary hover:border-primary/50"
          : "border-destructive/30 bg-background hover:bg-destructive/10 hover:border-destructive/50",
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.span
        className="text-sm font-medium text-foreground"
        key={mode}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {mode === "deaf-to-hearing" ? "Deaf" : "Hearing"}
      </motion.span>
      <motion.div
        animate={{ rotate: mode === "deaf-to-hearing" ? 0 : 180, scale: [1, 1.2, 1] }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ArrowLeftRight
          className={cn("h-4 w-4 transition-colors", context === "hospital" ? "text-primary" : "text-destructive")}
        />
      </motion.div>
      <motion.span
        className="text-sm font-medium text-foreground"
        key={`${mode}-2`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {mode === "deaf-to-hearing" ? "Hearing" : "Deaf"}
      </motion.span>
    </motion.button>
  )
}

/**
 * AVATAR PLACEHOLDER COMPONENT
 * 
 * Visual representation of the AI mediator with state-driven animations.
 * This is where the 3D avatar will be rendered in production.
 * 
 * ANIMATION STATES:
 * - listening: Soft wave scan effect - AI is capturing input
 * - understanding: Focusing rings - AI is processing context and meaning
 * - responding: Expansion rings - AI is generating response
 * - speaking: Rhythmic pulse - AI is delivering output
 * 
 * INTEGRATION POINTS:
 * - Replace the placeholder silhouette with actual 3D avatar renderer
 * - Connect avatar lip-sync to speech synthesis output
 * - Connect avatar signing animations to sign language generation
 * - Maintain the ambient glow and status-based animation system
 */
function AvatarPlaceholder({ context, status }: { context: Context; status: SystemStatus }) {
  const isActive = status === "responding" || status === "speaking"
  const primaryColor = context === "hospital" ? "primary" : "destructive"

  // Dynamic animation based on current AI processing status
  const getStateAnimation = () => {
    switch (status) {
      case "listening":
        return {
          scale: [1, 1.02, 1],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
        }
      case "understanding":
        return {
          scale: [1, 0.97, 1],
          transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
        }
      case "responding":
        return {
          scale: [1, 1.04, 1],
          transition: { duration: 0.8, repeat: Infinity, ease: "easeOut" as const },
        }
      case "speaking":
        return {
          scale: [1, 1.02, 0.99, 1.01, 1],
          transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const },
        }
      default:
        return {}
    }
  }

  return (
    <motion.div className="relative" {...getStateAnimation()}>
      <motion.div
        className={cn(
          "absolute -inset-16 rounded-full blur-3xl transition-colors duration-500",
          context === "hospital" ? "bg-primary/15" : "bg-destructive/15",
        )}
        animate={
          status === "understanding"
            ? {
              scale: [1, 0.9, 1],
              opacity: [0.15, 0.25, 0.15],
            }
            : status === "responding"
              ? {
                scale: [1, 1.3, 1],
                opacity: [0.15, 0.05, 0.15],
              }
              : {
                opacity: [0.15, 0.25, 0.15],
              }
        }
        transition={{
          duration: context === "emergency" ? 1 : 2,
          repeat: Number.POSITIVE_INFINITY,
        }}
      />

      <motion.div
        className={cn(
          "absolute -inset-8 rounded-full blur-2xl transition-colors duration-500",
          context === "hospital" ? "bg-primary/25" : "bg-destructive/25",
        )}
        animate={{
          opacity: [0.25, 0.4, 0.25],
          scale: status === "listening" ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: context === "emergency" ? 0.8 : 1.5, repeat: Number.POSITIVE_INFINITY }}
      />

      <motion.div
        className="absolute -inset-4 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <div
          className={cn(
            "h-full w-full rounded-full opacity-20",
            context === "hospital"
              ? "bg-gradient-conic from-primary via-transparent to-primary"
              : "bg-gradient-conic from-destructive via-transparent to-destructive",
          )}
          style={{ maskImage: "radial-gradient(transparent 60%, black 80%)" }}
        />
      </motion.div>

      {/* Avatar container */}
      <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-2 border-border bg-card md:h-64 md:w-64 overflow-hidden">
        {/* Listening: wave scan effect */}
        {status === "listening" && (
          <motion.div
            className={cn("absolute inset-0", context === "hospital" ? "bg-primary/10" : "bg-destructive/10")}
            animate={{
              scaleY: [0.8, 1.2, 0.8],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          />
        )}

        {/* Understanding: focusing effect */}
        {status === "understanding" && (
          <>
            <motion.div
              className={cn(
                "absolute inset-4 rounded-full border-2",
                context === "hospital" ? "border-primary/40" : "border-destructive/40",
              )}
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className={cn(
                "absolute inset-8 rounded-full border",
                context === "hospital" ? "border-primary/60" : "border-destructive/60",
              )}
              animate={{ scale: [1.3, 1, 1.3], opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
            />
          </>
        )}

        {/* Responding: expansion rings */}
        <AnimatePresence>
          {status === "responding" && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.35,
                  }}
                  className={cn(
                    "absolute inset-0 rounded-full border-2",
                    context === "hospital" ? "border-primary" : "border-destructive",
                  )}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Speaking: rhythmic pulse rings */}
        <AnimatePresence>
          {status === "speaking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.25,
                  }}
                  className={cn(
                    "absolute inset-0 rounded-full border-2",
                    context === "hospital" ? "border-primary" : "border-destructive",
                  )}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Avatar silhouette */}
        <div className="relative flex flex-col items-center z-10">
          {/* 
            HEAD WITH LIP-SYNC AND MOTION
            
            CURRENT APPROACH:
            - Simple amplitude-based lip movement (open/close during speech)
            - Subtle head nod during speaking
            - Gentle idle sway during listening
            
            FUTURE UPGRADES:
            - Replace with 3D facial rig (Three.js/Unity)
            - Phoneme-level lip-sync using Web Speech API events
            - Inverse kinematics for natural head/neck movement
            - Facial expressions (smile, concern, focus)
            - Eye tracking and blinking
          */}
          <motion.div
            className="h-16 w-16 rounded-full bg-gradient-to-br from-muted to-muted-foreground/30 md:h-20 md:w-20 relative overflow-hidden"
            animate={
              status === "speaking"
                ? {
                  // Speaking: subtle head nod (forward lean)
                  y: [0, -2, 0, -1, 0],
                  rotateX: [0, 2, 0, 1, 0],
                }
                : status === "listening"
                  ? {
                    // Listening: gentle idle sway
                    y: [0, 1, 0, -1, 0],
                    rotateZ: [0, -1, 0, 1, 0],
                  }
                  : {}
            }
            transition={{
              duration: status === "speaking" ? 0.6 : 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {/* 
              MOUTH - LIP-SYNC ANIMATION
              
              CURRENT APPROACH:
              - Simple open/close based on speaking status
              - Rhythmic movement synced to speech timing
              - No phoneme accuracy (just visual feedback)
              
              FUTURE UPGRADES:
              - Sync to SpeechSynthesisUtterance boundary events
              - Map phonemes to mouth shapes (visemes)
              - Use Web Audio API for amplitude-based movement
              - Connect to premium TTS phoneme data (ElevenLabs)
            */}
            {status === "speaking" && (
              <motion.div
                className={cn(
                  "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full",
                  context === "hospital" ? "bg-primary/40" : "bg-destructive/40"
                )}
                animate={{
                  // Lip-sync: open/close mouth during speech
                  width: ["8px", "12px", "8px", "10px", "8px"],
                  height: ["3px", "6px", "3px", "5px", "3px"],
                  scaleY: [1, 1.5, 1, 1.3, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Mouth closed when not speaking */}
            {status !== "speaking" && (
              <div
                className={cn(
                  "absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-0.5 rounded-full",
                  "bg-muted-foreground/30"
                )}
              />
            )}
          </motion.div>

          {/* 
            BODY - SUBTLE BREATHING AND POSTURE
            
            CURRENT APPROACH:
            - Slight scale variation to simulate breathing
            - More pronounced during speaking (engaged posture)
            
            FUTURE UPGRADES:
            - Full body IK for natural posture shifts
            - Hand gestures during speaking
            - Shoulder movement for emphasis
          */}
          <motion.div
            className="mt-2 h-20 w-24 rounded-t-3xl bg-gradient-to-br from-muted to-muted-foreground/30 md:h-24 md:w-28"
            animate={
              status === "speaking"
                ? {
                  // Speaking: engaged posture with breathing
                  scaleY: [1, 1.02, 1, 0.98, 1],
                  y: [0, -1, 0, -0.5, 0],
                }
                : status === "listening"
                  ? {
                    // Listening: relaxed breathing
                    scaleY: [1, 1.01, 1],
                  }
                  : {}
            }
            transition={{
              duration: status === "speaking" ? 0.6 : 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Status dot */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: context === "emergency" ? 0.4 : 1,
              repeat: Number.POSITIVE_INFINITY,
            }}
            className={cn("h-4 w-4 rounded-full", context === "hospital" ? "bg-primary" : "bg-destructive")}
          />
        </div>
      </div>

      <motion.div
        className="mt-6 text-center"
        key={status}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2">
          {status === "listening" && <Waves className="h-4 w-4 text-muted-foreground" />}
          {status === "understanding" && <BrainCircuit className="h-4 w-4 text-muted-foreground" />}
          {status === "responding" && <Sparkles className="h-4 w-4 text-muted-foreground" />}
          {status === "speaking" && <Volume2 className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium text-muted-foreground capitalize">{status}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}



function SubtitlePanel({
  subtitles,
  context,
  status,
}: { subtitles: SubtitleEntry[]; context: Context; status: SystemStatus }) {
  return (
    <div
      className={cn(
        "border-t px-6 py-4 transition-colors duration-500",
        context === "hospital" ? "border-border bg-background/50" : "border-destructive/30 bg-destructive/5",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <Activity className="h-3 w-3" />
        </motion.div>
        <span className="uppercase tracking-wider">Live Subtitles</span>
        {status === "speaking" && (
          <motion.div className="flex gap-1 ml-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn("h-1.5 w-1.5 rounded-full", context === "hospital" ? "bg-primary" : "bg-destructive")}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
      </div>
      <div className="mt-3 min-h-[4.5rem] space-y-2">
        <AnimatePresence mode="popLayout">
          {subtitles.map((subtitle, index) => (
            <motion.div
              key={`${index}`}
              initial={{ opacity: 0, y: 15, x: -10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: 10 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "transition-colors duration-300",
                index === subtitles.length - 1
                  ? "opacity-100"
                  : "opacity-60",
              )}
            >
              <p className={cn(
                "text-sm leading-relaxed",
                index === subtitles.length - 1 ? "text-foreground" : "text-muted-foreground"
              )}>
                {subtitle.primary}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        {subtitles.length === 0 && (
          <motion.p
            className="text-sm text-muted-foreground italic"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            Waiting for input...
          </motion.p>
        )}
      </div>
    </div>
  )
}

function StatusPills({ status, context }: { status: SystemStatus; context: Context }) {
  const statuses = [
    { id: "listening", label: "Listening", icon: Waves },
    { id: "understanding", label: "Understanding", icon: BrainCircuit },
    { id: "responding", label: "Responding", icon: Sparkles },
    { id: "speaking", label: "Speaking", icon: Volume2 },
  ]

  return (
    <div className="flex items-center gap-2">
      {statuses.map((s) => {
        const isActive = status === s.id
        const Icon = s.icon
        return (
          <motion.div
            key={s.id}
            animate={{
              scale: isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 relative overflow-hidden",
              isActive
                ? context === "hospital"
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {isActive && (
              <motion.span
                className="absolute inset-0 bg-current opacity-20"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
            <span className="flex items-center gap-1.5 relative z-10">
              {isActive && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
                  <Icon className="h-3 w-3" />
                </motion.span>
              )}
              {s.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}