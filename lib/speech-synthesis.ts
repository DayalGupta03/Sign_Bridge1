/**
 * SIGNBRIDGE 3D - TEXT-TO-SPEECH MODULE
 * 
 * This module provides browser-native text-to-speech output for the hearing user.
 * When the system reaches "speaking" status, the mediated subtitle is spoken aloud,
 * making the communication more natural and accessible.
 * 
 * CORE RESPONSIBILITIES:
 * - Convert mediated text to speech
 * - Adjust voice parameters based on context (hospital vs emergency)
 * - Prevent overlapping speech
 * - Clean cancellation on status changes
 * 
 * BROWSER API:
 * Uses Web Speech API (SpeechSynthesis) - available in all modern browsers
 * - No external dependencies
 * - No API keys required
 * - Works offline
 * - Free to use
 * 
 * FUTURE ENHANCEMENTS:
 * This module is designed to be easily replaced with premium TTS services:
 * - ElevenLabs (high-quality, natural voices)
 * - Google Cloud TTS (multilingual, customizable)
 * - Amazon Polly (medical-specific voices)
 * - Azure Speech Services (HIPAA-compliant)
 */

// ============================================================================
// TYPES
// ============================================================================

export type TTSContext = "hospital" | "emergency"


export interface TTSOptions {
  text: string
  context: TTSContext
  variant?: "default" | "sweet"
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}


// ============================================================================
// SPEECH SYNTHESIS MANAGER
// ============================================================================

/**
 * SPEECH SYNTHESIS MANAGER CLASS
 * 
 * Manages text-to-speech output with context-aware voice parameters.
 * Ensures clean cancellation and prevents overlapping speech.
 * 
 * DESIGN DECISIONS:
 * - Singleton pattern to prevent multiple instances
 * - Automatic voice selection (best available)
 * - Context-aware rate and pitch
 * - Clean cancellation on status changes
 * 
 * VOICE PARAMETERS:
 * Hospital Context:
 * - Rate: 0.9 (slightly slower, calmer)
 * - Pitch: 1.0 (neutral)
 * - Volume: 1.0 (full)
 * 
 * Emergency Context:
 * - Rate: 1.1 (slightly faster, urgent)
 * - Pitch: 1.0 (neutral, firm)
 * - Volume: 1.0 (full)
 */
class SpeechSynthesisManager {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isInitialized = false

  constructor() {
    console.log("🔊 SpeechSynthesisManager initializing...")
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      console.log("✅ window.speechSynthesis found")
      this.synthesis = window.speechSynthesis
      this.isInitialized = true
    } else {
      console.log("❌ window.speechSynthesis NOT found")
    }
  }

  /**
   * CHECK AVAILABILITY
   * 
   * Verifies that the browser supports SpeechSynthesis API.
   * 
   * @returns true if TTS is available, false otherwise
   */
  isAvailable(): boolean {
    return this.isInitialized && this.synthesis !== null
  }

  /**
   * GET BEST VOICE
   * 
   * Selects the best available voice for medical communication.
   * Preferences:
   * 1. English (US) voices
   * 2. Female voices (studies show better comprehension in medical settings)
   * 3. High-quality voices (not "novelty" voices)
   * 
   * FUTURE ENHANCEMENT:
   * Allow user to select preferred voice from settings.
   * Store preference in localStorage.
   * 
   * @returns Best available SpeechSynthesisVoice or null
   */
  private getBestVoice(): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null

    const voices = this.synthesis.getVoices()
    if (voices.length === 0) return null

    // Preference order:
    // 1. English (US) female voices
    const enUSFemale = voices.find(
      (voice) =>
        voice.lang.startsWith("en-US") &&
        (voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("samantha"))
    )
    if (enUSFemale) return enUSFemale

    // 2. Any English (US) voice
    const enUS = voices.find((voice) => voice.lang.startsWith("en-US"))
    if (enUS) return enUS

    // 3. Any English voice
    const en = voices.find((voice) => voice.lang.startsWith("en"))
    if (en) return en

    // 4. Default voice
    return voices[0]
  }

  /**
   * GET VOICE FOR VARIANT
   * 
   * Selects appropriate voice based on requested variant.
   */
  private getVoiceForVariant(variant: "default" | "sweet" = "default"): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null
    const voices = this.synthesis?.getVoices() || []
    if (voices.length === 0) return null

    if (variant === "sweet") {
      // Strictly prioritize female voices with "sweet" characteristics
      // 1. "Samantha" (macOS) - very distinct clean female voice
      const samantha = voices.find(v => v.name.includes("Samantha"))
      if (samantha) return samantha

      // 2. "Zira" (Windows)
      const zira = voices.find(v => v.name.includes("Zira"))
      if (zira) return zira

      // 3. "Google US English" - often high quality female
      const googleFemale = voices.find(v => v.name === "Google US English")
      if (googleFemale) return googleFemale

      // 4. Any English Female voice
      const female = voices.find(v =>
        v.lang.startsWith("en") &&
        v.name.toLowerCase().includes("female")
      )
      if (female) return female
    }

    // Fallback to standard selection logic
    return this.getBestVoice()
  }

  /**
   * ASK FOR PERMISSION TO SPEAK
   * 
   * ...
   */

  /**
   * SPEAK TEXT
   * 
   * Converts text to speech with context-aware parameters.
   * 
   * PROCESS:
   * 1. Cancel any ongoing speech
   * 2. Create new utterance
   * 3. Configure voice parameters based on context
   * 4. Set up event handlers
   * 5. Start speaking
   * 
   * CONTEXT-AWARE PARAMETERS:
   * Hospital: Slower (0.9x), calmer, reassuring
   * Emergency: Faster (1.1x), urgent, direct
   * 
   * ERROR HANDLING:
   * - Logs errors but doesn't throw
   * - Calls onError callback if provided
   * - Continues gracefully on failure
   * 
   * @param options - TTS configuration options
   */
  speak(options: TTSOptions): void {
    if (!this.isAvailable()) {
      console.warn("⚠️ Speech synthesis not available in this browser")
      return
    }

    // CRITICAL FIX: Do NOT auto-cancel here
    // The caller controls whether to interrupt via isSpeaking() check
    // This prevents the "canceled" error in deaf-to-hearing mode

    try {
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(options.text)

      // Select voice based on variant
      const voice = this.getVoiceForVariant(options.variant)
      if (voice) {
        utterance.voice = voice
      }

      // Configure voice parameters based on context and variant
      if (options.variant === "sweet") {
        utterance.rate = 1.05 // Slightly faster for energy
        utterance.pitch = 1.3 // Higher pitch for "girly" effect (sweet spot is 1.2-1.4)
        utterance.volume = 1.0
      } else if (options.context === "hospital") {
        // Hospital: Calm, reassuring, slightly slower
        utterance.rate = 0.9 // 10% slower than normal
        utterance.pitch = 1.0 // Neutral pitch
        utterance.volume = 1.0 // Full volume
      } else {
        // Emergency: Urgent, direct, slightly faster
        utterance.rate = 1.1 // 10% faster than normal
        utterance.pitch = 1.0 // Neutral pitch (firm, not high)
        utterance.volume = 1.0 // Full volume
      }

      // Set up event handlers
      utterance.onstart = () => {
        console.log("🔊 Speaking:", options.text)
        options.onStart?.()
      }

      utterance.onend = () => {
        console.log("✅ Speech complete")
        this.currentUtterance = null
        options.onEnd?.()
      }

      utterance.onerror = (event) => {
        // "interrupted" and "canceled" are control flow events, not errors
        // They occur when speech is intentionally stopped or replaced
        if (event.error === "interrupted" || event.error === "canceled") {
          console.debug(`🔇 Speech ${event.error} (expected control flow)`)
          this.currentUtterance = null
          return
        }

        console.error("❌ Speech synthesis error:", event.error)
        this.currentUtterance = null
        options.onError?.(new Error(event.error))
      }

      // Store reference for cancellation
      this.currentUtterance = utterance

      // Start speaking
      this.synthesis!.speak(utterance)
    } catch (error) {
      console.error("❌ Failed to initialize speech:", error)
      options.onError?.(error as Error)
    }
  }

  /**
   * CANCEL SPEECH
   * 
   * Immediately stops any ongoing speech.
   * Called when:
   * - Status changes away from "speaking"
   * - New speech starts (to prevent overlap)
   * - Component unmounts
   * 
   * IMPLEMENTATION:
   * Uses synthesis.cancel() which immediately stops speech.
   * More abrupt than pause(), but necessary for clean transitions.
   */
  cancel(): void {
    if (!this.synthesis) return

    try {
      // Cancel any ongoing speech
      this.synthesis.cancel()
      this.currentUtterance = null
    } catch (error) {
      // Ignore cancellation errors (may occur if nothing is speaking)
    }
  }

  /**
   * IS SPEAKING
   * 
   * Checks if speech is currently in progress.
   * 
   * @returns true if currently speaking, false otherwise
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false
  }

  /**
   * GET AVAILABLE VOICES
   * 
   * Returns list of all available voices for debugging/settings.
   * 
   * NOTE: Voices may not be immediately available on page load.
   * Some browsers require a user interaction before voices load.
   * 
   * @returns Array of available SpeechSynthesisVoice objects
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * SINGLETON PATTERN
 * 
 * Single instance ensures:
 * - No overlapping speech from multiple components
 * - Consistent voice selection
 * - Clean resource management
 * 
 * Export singleton instance for use throughout the app.
 */
export const speechSynthesis = new SpeechSynthesisManager()

// ============================================================================
// REACT HOOK (OPTIONAL)
// ============================================================================

/**
 * USE SPEECH SYNTHESIS HOOK
 * 
 * React hook for easy integration with components.
 * Provides clean API for speaking and cancellation.
 * 
 * USAGE:
 * const { speak, cancel, isAvailable } = useSpeechSynthesis()
 * 
 * speak({
 *   text: "Hello, how can I help you?",
 *   context: "hospital"
 * })
 * 
 * @returns Speech synthesis API
 */
export function useSpeechSynthesis() {
  return {
    speak: (options: TTSOptions) => speechSynthesis.speak(options),
    cancel: () => speechSynthesis.cancel(),
    isSpeaking: () => speechSynthesis.isSpeaking(),
    isAvailable: () => speechSynthesis.isAvailable(),
    getAvailableVoices: () => speechSynthesis.getAvailableVoices(),
  }
}

// ============================================================================
// FUTURE ENHANCEMENTS
// ============================================================================

/**
 * TODO: Premium TTS Integration
 * 
 * Replace browser TTS with premium service for production:
 * 
 * ELEVENLABS INTEGRATION:
 * - High-quality, natural voices
 * - Emotional tone control
 * - Custom voice cloning
 * - API: https://elevenlabs.io/docs
 * 
 * Example:
 * async function speakWithElevenLabs(text: string, context: TTSContext) {
 *   const voice = context === "emergency" ? "urgent-voice-id" : "calm-voice-id"
 *   const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
 *     method: "POST",
 *     headers: {
 *       "xi-api-key": process.env.ELEVENLABS_API_KEY,
 *       "Content-Type": "application/json"
 *     },
 *     body: JSON.stringify({ text, voice_id: voice })
 *   })
 *   const audio = await response.blob()
 *   playAudio(audio)
 * }
 * 
 * GOOGLE CLOUD TTS:
 * - Multilingual support
 * - SSML for fine control
 * - WaveNet voices
 * - API: https://cloud.google.com/text-to-speech
 * 
 * AMAZON POLLY:
 * - Medical-specific voices
 * - Neural voices
 * - HIPAA-compliant
 * - API: https://aws.amazon.com/polly/
 * 
 * AZURE SPEECH SERVICES:
 * - HIPAA-compliant
 * - Custom neural voices
 * - Real-time synthesis
 * - API: https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/
 */

/**
 * TODO: Voice Customization
 * 
 * Allow users to customize voice preferences:
 * - Voice selection (male/female/neutral)
 * - Rate adjustment (0.5x - 2.0x)
 * - Pitch adjustment (0.5 - 2.0)
 * - Volume adjustment (0.0 - 1.0)
 * 
 * Store preferences in localStorage:
 * localStorage.setItem("signbridge-voice-prefs", JSON.stringify(prefs))
 */

/**
 * TODO: Multi-Language Support
 * 
 * Extend TTS to support multiple languages:
 * - Detect language from mediated text
 * - Select appropriate voice for language
 * - Adjust pronunciation rules
 * 
 * Example:
 * const language = detectLanguage(text)
 * const voice = getVoiceForLanguage(language)
 * utterance.lang = language
 * utterance.voice = voice
 */

/**
 * TODO: SSML Support
 * 
 * Use Speech Synthesis Markup Language for fine control:
 * - Emphasis on important words
 * - Pauses for clarity
 * - Pronunciation hints for medical terms
 * 
 * Example:
 * const ssml = `
 *   <speak>
 *     The patient reports <emphasis level="strong">severe</emphasis> pain.
 *     <break time="500ms"/>
 *     Pain level: <prosody rate="slow">eight</prosody> out of ten.
 *   </speak>
 * `
 */
