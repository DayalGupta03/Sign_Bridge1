/**
 * Property-Based Tests for Enhanced Vocabulary Library
 * Feature: phase-2-enhancement
 * 
 * Tests universal properties that must hold across all valid inputs
 * using fast-check for comprehensive input coverage.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { VocabularyLibrary, vocabularyLibrary, type MedicalCategory } from '../vocabularyLibrary'

describe('Enhanced Vocabulary Library - Property Tests', () => {
  let library: VocabularyLibrary

  beforeEach(() => {
    library = new VocabularyLibrary()
  })

  describe('Property 1: Vocabulary Coverage Completeness', () => {
    /**
     * Feature: phase-2-enhancement, Property 1: Vocabulary Coverage Completeness
     * **Validates: Requirements 1.1, 1.2, 1.3**
     * 
     * For any medical vocabulary query in ASL or ISL, the system should either 
     * return a direct sign match or provide the closest available alternative, 
     * ensuring no medical communication is left without a sign language representation.
     */
    it('should always provide a sign representation for any medical term query', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Generate medical terms from known categories
            fc.constantFrom(
              'pain', 'heart', 'emergency', 'help', 'doctor', 'medicine',
              'surgery', 'fever', 'chest', 'breathing', 'blood', 'hospital',
              'injection', 'x-ray', 'anxiety', 'temperature', 'wheelchair'
            ),
            // Generate compound medical terms
            fc.array(
              fc.constantFrom('chest', 'pain', 'heart', 'attack', 'blood', 'pressure'),
              { minLength: 1, maxLength: 3 }
            ).map(terms => terms.join(' ')),
            // Generate unknown terms that should get alternatives
            fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z\s]+$/.test(s))
          ),
          fc.constantFrom('ASL', 'ISL'),
          async (term: string, language: 'ASL' | 'ISL') => {
            // The system should ALWAYS provide a sign, either direct or alternative
            const directSign = await library.getSign(term, language)
            const alternativeSign = await library.getAlternativeSign(term, language)

            // At minimum, getAlternativeSign should always return a sign
            expect(alternativeSign).toBeDefined()
            expect(alternativeSign.term).toBeDefined()
            expect(alternativeSign.language).toBe(language)
            expect(alternativeSign.keyframes).toBeDefined()
            expect(alternativeSign.keyframes.length).toBeGreaterThan(0)

            // If direct sign exists, alternative should be the same or better
            if (directSign) {
              expect(directSign.term).toBe(term)
              expect(directSign.language).toBe(language)
              // When direct sign exists, alternative should be the same
              expect(alternativeSign.term).toBe(term)
            } else {
              // When no direct sign exists, alternative should still be valid
              // but may have a different term (fallback or similar sign)
              expect(alternativeSign.term).toBeDefined()
              expect(alternativeSign.term.length).toBeGreaterThan(0)
            }

            // Alternative sign should have valid structure
            expect(alternativeSign.id).toMatch(new RegExp(`_${language}$`))
            expect(alternativeSign.duration).toBeGreaterThan(0)
            expect(['left', 'right', 'both']).toContain(alternativeSign.handedness)
            expect(alternativeSign.urgencyLevel).toMatch(/^(low|medium|high|critical)$/)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  describe('Property 2: Compound Sign Generation Consistency', () => {
    /**
     * Feature: phase-2-enhancement, Property 2: Compound Sign Generation Consistency
     * **Validates: Requirements 1.4**
     * 
     * For any sequence of basic medical terms, the system should generate compound signs 
     * by combining the individual sign definitions in the correct temporal order, 
     * maintaining semantic meaning.
     */
    it('should generate compound signs with consistent temporal ordering', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'chest', 'pain', 'heart', 'attack', 'blood', 'pressure',
              'shortness', 'breath', 'emergency', 'help', 'doctor', 'nurse',
              'medicine', 'injection', 'surgery', 'fever', 'headache'
            ),
            { minLength: 2, maxLength: 4 }
          ),
          fc.constantFrom('ASL', 'ISL'),
          async (terms: string[], language: 'ASL' | 'ISL') => {
            const compoundSign = await library.generateCompoundSign(terms, language)
            
            // Compound sign should have correct structure
            expect(compoundSign.signs).toBeDefined()
            expect(compoundSign.signs.length).toBe(terms.length)
            expect(compoundSign.totalDuration).toBeGreaterThan(0)
            expect(compoundSign.transitions).toBeDefined()
            expect(compoundSign.transitions.length).toBe(Math.max(0, terms.length - 1))
            
            // Each sign should correspond to the input term in order
            for (let i = 0; i < terms.length; i++) {
              const sign = compoundSign.signs[i]
              expect(sign).toBeDefined()
              expect(sign.language).toBe(language)
              expect(sign.keyframes.length).toBeGreaterThan(0)
              expect(sign.duration).toBeGreaterThan(0)
              
              // Sign should be related to the term (either exact match or alternative)
              const directSign = await library.getSign(terms[i], language)
              if (directSign) {
                expect(sign.term).toBe(terms[i])
              } else {
                // Should be a valid alternative
                expect(sign.term).toBeDefined()
                expect(sign.category).toBeDefined()
              }
            }
            
            // Transitions should connect consecutive signs properly
            for (let i = 0; i < compoundSign.transitions.length; i++) {
              const transition = compoundSign.transitions[i]
              expect(transition.fromSign).toBe(compoundSign.signs[i].id)
              expect(transition.duration).toBeGreaterThan(0)
              expect(['smooth', 'pause', 'emphasis']).toContain(transition.type)
            }
            
            // Total duration should be sum of sign durations plus transitions
            const expectedDuration = compoundSign.signs.reduce((sum, sign) => sum + sign.duration, 0) +
                                   compoundSign.transitions.reduce((sum, trans) => sum + trans.duration, 0)
            expect(Math.abs(compoundSign.totalDuration - expectedDuration)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})