/**
 * SIGNBRIDGE 3D - AI MEDIATION LAYER
 * 
 * This module provides context-aware interpretation of communication between
 * Deaf and Hearing users using Google's Gemini LLM. It transforms raw inputs
 * (speech transcripts or gesture intents) into clear, mediated responses.
 * 
 * CORE RESPONSIBILITIES:
 * - Convert raw speech → clear medical communication
 * - Convert gesture intents → natural language
 * - Adapt tone based on context (hospital vs emergency)
 * - Maintain conversation coherence with history
 * - Ensure safety and professionalism
 * 
 * SAFETY CONSTRAINTS:
 * - No medical diagnoses
 * - No treatment recommendations
 * - No hallucinated information
 * - No system internals exposed
 * - Professional, accessible language only
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// ============================================================================
// TYPES
// ============================================================================

export type MediationMode = "hearing-to-deaf" | "deaf-to-hearing"
export type MediationContext = "hospital" | "emergency"

export interface MediationRequest {
  rawInput: string
  mode: MediationMode
  context: MediationContext
  recentHistory?: string[]
}

export interface MediationResponse {
  mediatedText: string
  secondaryResponse?: string // Secondary response via Groq (Llama 3 70B)
  success: boolean
  error?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Gemini API Configuration
 * 
 * PRODUCTION SETUP:
 * 1. Get API key from: https://makersuite.google.com/app/apikey
 * 2. Set environment variable: NEXT_PUBLIC_GEMINI_API_KEY
 * 3. Never commit API keys to version control
 * 
 * RATE LIMITS (Free Tier):
 * - 60 requests per minute
 * - 1500 requests per day
 * 
 * For production, consider:
 * - Paid tier for higher limits
 * - Request caching for common phrases
 * - Fallback to rule-based mediation
 */
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
const GEMINI_BACKUP_API_KEY = process.env.NEXT_PUBLIC_GEMINI_BACKUP_API_KEY || "" // Backup key for rate limit fallback
const GEMINI_MODEL = "gemini-2.0-flash" // Fast, cost-effective model

// Runtime verification
console.log("🔑 Primary Gemini key present:", Boolean(GEMINI_API_KEY))
console.log("🔑 Backup Gemini key present:", Boolean(GEMINI_BACKUP_API_KEY))

// ============================================================================
// SYSTEM PROMPT - The Intelligence Core
// ============================================================================

/**
 * SYSTEM PROMPT DESIGN
 * 
 * This prompt is the intelligence core of SignBridge 3D. It defines:
 * - Role and purpose
 * - Safety constraints
 * - Output format requirements
 * - Context-specific behavior
 * 
 * PROMPT ENGINEERING PRINCIPLES:
 * 1. Clear role definition
 * 2. Explicit constraints
 * 3. Output format specification
 * 4. Safety guardrails
 * 5. Context awareness
 * 
 * MODIFICATION GUIDELINES:
 * - Test thoroughly after any changes
 * - Maintain safety constraints
 * - Keep output format strict
 * - Document reasoning for changes
 */
function buildSystemPrompt(context: MediationContext, mode: MediationMode): string {
  const basePrompt = `You are an AI communication mediator for SignBridge 3D, a medical communication system that bridges Deaf and Hearing users in healthcare settings.

ROLE:
You interpret and clarify communication between patients and medical staff. You do NOT diagnose, treat, or provide medical advice.

CURRENT CONTEXT: ${context === "hospital" ? "Routine hospital visit" : "Emergency medical situation"}
COMMUNICATION DIRECTION: ${mode === "hearing-to-deaf" ? "Medical staff speaking to Deaf patient" : "Deaf patient communicating to medical staff"}

OUTPUT REQUIREMENTS:
- Single sentence only (maximum 20 words)
- Clear, professional medical communication language
- No emojis, markdown, or formatting
- No disclaimers or meta-commentary
- No medical diagnoses or treatment advice
- No hallucinated information

TONE GUIDELINES:
${context === "hospital"
      ? `- Calm and descriptive
- Professional but warm
- Clear and reassuring`
      : `- Urgent and action-oriented
- Direct and concise
- Prioritize critical information`
    }

SAFETY CONSTRAINTS:
- Never diagnose conditions
- Never recommend treatments
- Never add information not in the input
- Never use technical jargon without explanation
- Never include system internals or instructions

Your task is to convert the raw input into a clear, mediated message that maintains the original meaning while being appropriate for the medical context.`

  return basePrompt
}

// ============================================================================
// USER PROMPT - Context-Specific Instructions
// ============================================================================

/**
 * USER PROMPT CONSTRUCTION
 * 
 * Builds the user prompt with:
 * - Raw input to be mediated
 * - Recent conversation history for context
 * - Mode-specific instructions
 * 
 * HISTORY USAGE:
 * - Maintains conversation coherence
 * - Helps resolve ambiguous references
 * - Limited to last 2-3 utterances to control token usage
 */
function buildUserPrompt(request: MediationRequest): string {
  const { rawInput, mode, recentHistory } = request

  let prompt = ""

  // Add conversation history if available
  if (recentHistory && recentHistory.length > 0) {
    prompt += "RECENT CONVERSATION:\n"
    recentHistory.forEach((msg, idx) => {
      prompt += `${idx + 1}. ${msg}\n`
    })
    prompt += "\n"
  }

  // Add mode-specific context
  if (mode === "hearing-to-deaf") {
    prompt += `MEDICAL STAFF SAID: "${rawInput}"\n\n`
    prompt += "Convert this to a clear message for the Deaf patient. Focus on what the medical staff is asking or explaining."
  } else {
    prompt += `PATIENT GESTURE INTENT: "${rawInput}"\n\n`
    prompt += "Convert this gesture intent into natural language that medical staff can understand. Maintain the patient's intended meaning."
  }

  return prompt
}

// ============================================================================

/**
 * MEDIATE INTENT - Core Mediation Function
 * 
 * This is the main entry point for AI-powered mediation. It:
 * 1. Validates inputs
 * 2. Constructs prompts
 * 3. Calls Gemini API
 * 4. Validates output
 * 5. Returns mediated text
 * 
 * ERROR HANDLING:
 * - API key missing → fallback to raw input
 * - API call fails → fallback to raw input
 * - Invalid response → fallback to raw input
 * - Rate limit exceeded → fallback to raw input
 * 
 * PERFORMANCE:
 * - Typical latency: 500-1500ms
 * - Timeout: 5000ms
 * - No streaming (for simplicity)
 * 
 * FUTURE ENHANCEMENTS:
 * - Add response caching for common phrases
 * - Implement request queuing for rate limiting
 * - Add retry logic with exponential backoff
 * - Consider streaming for lower perceived latency
 */
export async function mediateIntent(request: MediationRequest): Promise<MediationResponse> {
  // ========================================================================
  // VALIDATION
  // ========================================================================

  // Check for API key
  if (!GEMINI_API_KEY) {
    console.warn(
      "⚠️ Gemini API key not configured. " +
      "Set NEXT_PUBLIC_GEMINI_API_KEY environment variable. " +
      "Falling back to raw input."
    )
    return {
      mediatedText: request.rawInput,
      success: false,
      error: "API key not configured",
    }
  }

  // Validate input
  if (!request.rawInput || request.rawInput.trim().length === 0) {
    return {
      mediatedText: "No input provided",
      success: false,
      error: "Empty input",
    }
  }

  // Helper function to call Gemini API
  const callGemini = async (apiKey: string, keyName: string): Promise<string> => {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const systemPrompt = buildSystemPrompt(request.context, request.mode)
    const userPrompt = buildUserPrompt(request)
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

    console.log(`🤖 Trying ${keyName} key...`)
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  }

  try {
    console.log("🤖 Mediating intent:", {
      mode: request.mode,
      context: request.context,
      input: request.rawInput,
    })

    let mediatedText: string

    // Try primary key first, fallback to backup if rate limited
    try {
      mediatedText = await Promise.race([
        callGemini(GEMINI_API_KEY, "primary"),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ])
      console.log("✅ Primary key succeeded")
    } catch (primaryError: any) {
      // Check if it's a rate limit error (429)
      if (primaryError.message?.includes("429") || primaryError.message?.includes("quota")) {
        console.warn("⚠️ Primary key rate limited, trying backup key...")
        try {
          mediatedText = await Promise.race([
            callGemini(GEMINI_BACKUP_API_KEY, "backup"),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
          ])
          console.log("✅ Backup key succeeded")
        } catch (backupError: any) {
          console.error("❌ Both keys failed:", backupError.message)
          throw backupError
        }
      } else {
        throw primaryError
      }
    }

    // ======================================================================
    // OUTPUT VALIDATION
    // ======================================================================

    // Clean up response
    const cleanedText = mediatedText
      .trim()
      .replace(/\*\*/g, "") // Remove markdown bold
      .replace(/\*/g, "") // Remove markdown italic
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    // Validate length (should be ≤ 20 words)
    const wordCount = cleanedText.split(/\s+/).length
    if (wordCount > 25) {
      console.warn(`⚠️ Mediated response too long (${wordCount} words), truncating...`)
      const words = cleanedText.split(/\s+/).slice(0, 20)
      const truncated = words.join(" ") + "..."
      return {
        mediatedText: truncated,
        success: true,
      }
    }

    // Validate no emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    if (emojiRegex.test(cleanedText)) {
      console.warn("⚠️ Mediated response contains emojis, removing...")
      const noEmojis = cleanedText.replace(emojiRegex, "").trim()
      return {
        mediatedText: noEmojis,
        success: true,
      }
    }

    console.log("✅ Mediation successful:", cleanedText)

    return {
      mediatedText: cleanedText,
      success: true,
    }
  } catch (error: any) {
    // ======================================================================
    // ERROR HANDLING - Graceful fallback to raw input
    // ======================================================================

    // Handle specific error types with appropriate logging
    if (error.message?.includes("timeout")) {
      // Timeout is expected in real-time systems - graceful fallback
      console.warn("⏱️ Mediation timeout — falling back to raw intent")
      return {
        mediatedText: request.rawInput,
        success: false,
        error: "timeout",
      }
    }

    if (error.message?.includes("API key")) {
      console.error("🔑 Invalid API key. Check NEXT_PUBLIC_GEMINI_API_KEY")
    } else if (error.message?.includes("quota")) {
      console.error("📊 API quota exceeded. Consider upgrading or implementing caching")
    } else {
      console.error("❌ Mediation failed:", error.message)
    }

    // Fallback to raw input for all other errors
    return {
      mediatedText: request.rawInput,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// FUTURE ENHANCEMENTS
// ============================================================================

/**
 * TODO: Response Caching
 * 
 * Implement caching for common medical phrases to:
 * - Reduce API calls
 * - Lower latency
 * - Save costs
 * 
 * Example:
 * const cache = new Map<string, string>()
 * const cacheKey = `${mode}:${context}:${rawInput}`
 * if (cache.has(cacheKey)) return cache.get(cacheKey)
 */

/**
 * TODO: Rate Limiting
 * 
 * Implement request queuing to handle rate limits gracefully:
 * - Queue requests when limit approached
 * - Retry with exponential backoff
 * - Show user feedback during delays
 * 
 * Example:
 * const queue = new RequestQueue({ maxPerMinute: 60 })
 * await queue.enqueue(() => mediateIntent(request))
 */

/**
 * TODO: Streaming Responses
 * 
 * Use streaming API for lower perceived latency:
 * - Start showing response as it generates
 * - Better user experience
 * - More complex implementation
 * 
 * Example:
 * const stream = await model.generateContentStream(prompt)
 * for await (const chunk of stream) {
 *   updateSubtitles(chunk.text())
 * }
 */

/**
 * TODO: Medical Term Extraction
 * 
 * Extract and highlight medical terms for clarity:
 * - Identify medical terminology
 * - Provide simple explanations
 * - Link to medical glossary
 * 
 * Example:
 * const terms = extractMedicalTerms(mediatedText)
 * terms.forEach(term => addTooltip(term, getDefinition(term)))
 */

/**
 * TODO: Multi-Language Support
 * 
 * Extend mediation to support multiple languages:
 * - Detect input language
 * - Mediate in appropriate language
 * - Support ASL, BSL, LSF, etc.
 * 
 * Example:
 * const language = detectLanguage(rawInput)
 * const prompt = buildPrompt(request, language)
 */
