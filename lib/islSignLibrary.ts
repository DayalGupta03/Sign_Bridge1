
import { ISLGloss, ISLSign, ASLStep } from "./islCore"
import { SIGNS_PART_1 } from "./islSigns1"
import { SIGNS_PART_2 } from "./islSigns2"
import { ASL_STEP_LIBRARY, ASL_SIGN_SEQUENCES, ASLStepDefinition } from "./aslSignLibrary"

export * from "./islCore"
export { ASL_STEP_LIBRARY, ASL_SIGN_SEQUENCES } from "./aslSignLibrary"

export const ISL_SIGN_LIBRARY: Record<ISLGloss, ISLSign> = {
    ...SIGNS_PART_1,
    ...SIGNS_PART_2
} as Record<ISLGloss, ISLSign>

/**
 * Expands semantic glosses into animation step sequences.
 * 
 * EXTERNAL API: Pass semantic glosses only (e.g., ["HELLO", "GOODBYE"])
 * INTERNAL EXPANSION: Multi-step signs expand to animation steps
 *   - HELLO → [HELLO_START, HELLO_END]
 *   - GOODBYE → [GOODBYE_1, GOODBYE_2, GOODBYE_3]
 *   - PLEASE → [PLEASE_1, PLEASE_2, PLEASE_3]
 *   - etc.
 * 
 * TIMING: Call this ONCE before Phase 3 state machine, NOT in useFrame.
 * Expansion inside render loop causes sequence resets and jitter.
 * 
 * @param glosses Semantic ISL/ASL glosses from subtitle layer
 * @returns Strongly-typed animation step array for Phase 3 sequencer
 */
export function expandSignSequence(glosses: ISLGloss[]): ASLStep[] {
    const expanded: ASLStep[] = []

    for (const gloss of glosses) {
        const sequence = ASL_SIGN_SEQUENCES[gloss]
        if (sequence) {
            // Multi-step sign: expand to sub-steps
            expanded.push(...sequence)
        } else {
            // Single-pose sign: use gloss as-is (cast safe because all ISLGloss are in COMBINED_SIGN_LIBRARY)
            expanded.push(gloss as any as ASLStep)
        }
    }

    return expanded
}

/**
 * Combined lookup table for the Phase 3 sequencer.
 * 
 * RESPONSIBILITY:
 * - Resolves semantic glosses and animation steps to pose definitions
 * - Provides unified lookup for both ISL signs and ASL sub-steps
 * 
 * DOES NOT CONTROL:
 * - Timing (managed by Phase 3 sequencer state machine)
 * - Transitions (managed by AvatarRenderer interpolation)
 * - Playback order (managed by sequence queue)
 * 
 * KEY SAFETY: All ASLStep keys MUST exist in this library.
 * Missing keys indicate a sign definition bug, not a runtime error.
 * 
 * READ-ONLY: Do not mutate at runtime.
 */
function buildCombinedLibrary(): Record<string, ASLStepDefinition> {
    const combined: Record<string, ASLStepDefinition> = {}

    // Add all ISL signs
    for (const [key, sign] of Object.entries(ISL_SIGN_LIBRARY)) {
        combined[key] = {
            rightTarget: sign.rightTarget,
            leftTarget: sign.leftTarget,
            rightFingers: sign.rightFingers,
            leftFingers: sign.leftFingers,
            rightPalm: sign.rightPalm,
            leftPalm: sign.leftPalm,
        }
    }

    // Add all ASL animation steps
    for (const [key, step] of Object.entries(ASL_STEP_LIBRARY)) {
        combined[key] = step
    }

    return combined
}

export const COMBINED_SIGN_LIBRARY = buildCombinedLibrary()
