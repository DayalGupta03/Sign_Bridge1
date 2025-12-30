/**
 * MEDICAL TERM CACHE TESTS
 * 
 * Tests for the medical term cache system that provides ultra-fast lookup
 * for common medical terms to bypass LLM processing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MedicalTermCache } from '../medicalTermCache'

describe('Medical Term Cache', () => {
  let cache: MedicalTermCache

  beforeEach(() => {
    cache = new MedicalTermCache()
    cache.resetStats() // Reset stats to ensure clean state between tests
  })

  describe('Basic Functionality', () => {
    it('should initialize with medical terms', () => {
      const stats = cache.getStats()
      expect(stats.totalLookups).toBe(0)
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
    })

    it('should find common medical terms', () => {
      const result = cache.lookup('chest pain')
      expect(result.hit).toBe(true)
      expect(result.entry?.mediatedText).toBe('I am experiencing chest pain')
      expect(result.entry?.signIntent).toBe('CHEST_PAIN')
    })

    it('should handle cache misses', () => {
      const result = cache.lookup('extremely rare medical condition')
      expect(result.hit).toBe(false)
      expect(result.entry).toBeUndefined()
    })

    it('should be case insensitive', () => {
      const result1 = cache.lookup('CHEST PAIN')
      const result2 = cache.lookup('chest pain')
      const result3 = cache.lookup('Chest Pain')
      
      expect(result1.hit).toBe(true)
      expect(result2.hit).toBe(true)
      expect(result3.hit).toBe(true)
      
      expect(result1.entry?.mediatedText).toBe(result2.entry?.mediatedText)
      expect(result2.entry?.mediatedText).toBe(result3.entry?.mediatedText)
    })

    it('should handle whitespace and punctuation', () => {
      const result1 = cache.lookup('  chest pain  ')
      const result2 = cache.lookup('chest pain!')
      const result3 = cache.lookup('chest, pain?')
      
      expect(result1.hit).toBe(true)
      expect(result2.hit).toBe(true)
      expect(result3.hit).toBe(true)
    })
  })

  describe('Performance Tracking', () => {
    it('should track cache hits and misses', () => {
      // Perform some lookups
      cache.lookup('chest pain') // hit
      cache.lookup('headache') // hit
      cache.lookup('unknown condition') // miss
      cache.lookup('fever') // hit
      
      const stats = cache.getStats()
      expect(stats.totalLookups).toBe(4)
      expect(stats.cacheHits).toBe(3)
      expect(stats.cacheMisses).toBe(1)
      expect(stats.hitRate).toBe(0.75) // 75%
    })

    it('should track lookup timing', () => {
      const result = cache.lookup('chest pain')
      expect(result.lookupTime).toBeGreaterThan(0)
      expect(result.lookupTime).toBeLessThan(1000) // Should be under 1ms (1000 microseconds)
    })

    it('should update usage counts', () => {
      const result1 = cache.lookup('chest pain')
      const result2 = cache.lookup('chest pain')
      
      expect(result1.entry?.usageCount).toBe(1)
      expect(result2.entry?.usageCount).toBe(2)
    })
  })

  describe('Cache Management', () => {
    it('should add new terms to cache', () => {
      const originalResult = cache.lookup('custom medical term')
      expect(originalResult.hit).toBe(false)
      
      cache.addTerm('custom medical term', 'I have a custom medical condition', 'CUSTOM_CONDITION', 0.9)
      
      const newResult = cache.lookup('custom medical term')
      expect(newResult.hit).toBe(true)
      expect(newResult.entry?.mediatedText).toBe('I have a custom medical condition')
      expect(newResult.entry?.signIntent).toBe('CUSTOM_CONDITION')
      expect(newResult.entry?.confidence).toBe(0.9)
    })

    it('should check if term is cached without updating stats', () => {
      const initialStats = cache.getStats()
      
      const isCached1 = cache.isCached('chest pain')
      const isCached2 = cache.isCached('unknown condition')
      
      expect(isCached1).toBe(true)
      expect(isCached2).toBe(false)
      
      // Stats should not change
      const finalStats = cache.getStats()
      expect(finalStats.totalLookups).toBe(initialStats.totalLookups)
    })

    it('should get most used terms', () => {
      // Use some terms multiple times
      cache.lookup('chest pain')
      cache.lookup('chest pain')
      cache.lookup('chest pain')
      cache.lookup('headache')
      cache.lookup('headache')
      cache.lookup('fever')
      
      const mostUsed = cache.getMostUsedTerms(3)
      expect(mostUsed).toHaveLength(3)
      expect(mostUsed[0].originalText).toBe('chest pain')
      expect(mostUsed[0].usageCount).toBe(3)
      expect(mostUsed[1].originalText).toBe('headache')
      expect(mostUsed[1].usageCount).toBe(2)
    })

    it('should reset statistics', () => {
      // Generate some stats
      cache.lookup('chest pain')
      cache.lookup('unknown condition')
      
      let stats = cache.getStats()
      expect(stats.totalLookups).toBe(2)
      
      cache.resetStats()
      
      stats = cache.getStats()
      expect(stats.totalLookups).toBe(0)
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
      expect(stats.hitRate).toBe(0)
    })
  })

  describe('Medical Term Coverage', () => {
    it('should cover common pain terms', () => {
      const painTerms = [
        'chest pain',
        'severe pain',
        'sharp pain',
        'dull pain',
        'burning pain',
        'throbbing pain',
        'headache',
        'migraine'
      ]
      
      painTerms.forEach(term => {
        const result = cache.lookup(term)
        expect(result.hit).toBe(true)
        expect(result.entry?.mediatedText).toBeTruthy()
      })
    })

    it('should cover body parts', () => {
      const bodyParts = [
        'head',
        'neck',
        'chest',
        'back',
        'stomach',
        'arm',
        'leg',
        'hand',
        'foot'
      ]
      
      bodyParts.forEach(part => {
        const result = cache.lookup(part)
        expect(result.hit).toBe(true)
        expect(result.entry?.mediatedText).toBeTruthy()
      })
    })

    it('should cover emergency situations', () => {
      const emergencyTerms = [
        'help',
        'emergency',
        'urgent',
        'call doctor',
        'call 911',
        'heart attack',
        'stroke',
        'allergic reaction'
      ]
      
      emergencyTerms.forEach(term => {
        const result = cache.lookup(term)
        expect(result.hit).toBe(true)
        expect(result.entry?.mediatedText).toBeTruthy()
      })
    })

    it('should cover pain scale ratings', () => {
      for (let i = 1; i <= 10; i++) {
        const result = cache.lookup(`${i} out of 10`)
        expect(result.hit).toBe(true)
        expect(result.entry?.mediatedText).toBe(`${i} out of 10`)
        expect(result.entry?.signIntent).toBe(`PAIN_${i}`)
      }
    })
  })

  describe('Performance Requirements', () => {
    it('should achieve sub-millisecond lookup times', () => {
      const iterations = 100
      const lookupTimes: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const result = cache.lookup('chest pain')
        lookupTimes.push(result.lookupTime)
      }
      
      const averageLookupTime = lookupTimes.reduce((sum, time) => sum + time, 0) / iterations
      
      // Should be well under 1000 microseconds (1ms)
      expect(averageLookupTime).toBeLessThan(1000)
      
      // Most lookups should be extremely fast
      const fastLookups = lookupTimes.filter(time => time < 100).length
      expect(fastLookups / iterations).toBeGreaterThan(0.8) // 80% under 100 microseconds
    })

    it('should maintain performance under load', () => {
      const startTime = performance.now()
      
      // Perform many lookups
      for (let i = 0; i < 1000; i++) {
        cache.lookup('chest pain')
        cache.lookup('headache')
        cache.lookup('unknown condition')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // 3000 lookups should complete in under 100ms
      expect(totalTime).toBeLessThan(100)
    })
  })
})