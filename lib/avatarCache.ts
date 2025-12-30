/**
 * AVATAR CACHE SYSTEM
 * 
 * Provides efficient caching for both communication modes:
 * 1. Deaf→Hearing: Cache processed sign recognition results
 * 2. Hearing→Deaf: Cache avatar animations/videos for text input
 * 
 * Features:
 * - LRU eviction policy
 * - Memory usage monitoring
 * - Performance metrics
 * - Persistent storage using localStorage
 */

import type { ISLGloss } from "@/lib/islSignLibrary"

// ============================================================================
// TYPES
// ============================================================================

export interface SignRecognitionCache {
  gestureData: string // Serialized gesture/hand pose data
  recognizedSigns: string[]
  confidence: number
  timestamp: number
  usageCount: number
}

export interface AvatarAnimationCache {
  text: string
  signSequence: ISLGloss[]
  videoPath?: string // For VideoAvatarRenderer
  animationData?: any // For 3D AvatarRenderer
  timestamp: number
  usageCount: number
}

export interface CacheMetrics {
  hitRate: number
  totalRequests: number
  totalHits: number
  cacheSize: number
  memoryUsage: number
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  MAX_SIGN_CACHE_SIZE: 100, // Maximum cached sign recognition results
  MAX_ANIMATION_CACHE_SIZE: 50, // Maximum cached animations
  MAX_MEMORY_MB: 10, // Maximum memory usage in MB
  CACHE_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
  STORAGE_KEY_SIGNS: 'signbridge_sign_cache',
  STORAGE_KEY_ANIMATIONS: 'signbridge_animation_cache',
} as const

// ============================================================================
// AVATAR CACHE MANAGER
// ============================================================================

export class AvatarCacheManager {
  private signCache = new Map<string, SignRecognitionCache>()
  private animationCache = new Map<string, AvatarAnimationCache>()
  private metrics = {
    signRequests: 0,
    signHits: 0,
    animationRequests: 0,
    animationHits: 0,
  }

  constructor() {
    this.loadFromStorage()
  }

  // ========================================================================
  // SIGN RECOGNITION CACHE (Deaf → Hearing)
  // ========================================================================

  /**
   * Check if gesture data has been processed before
   */
  getSignRecognition(gestureKey: string): SignRecognitionCache | null {
    this.metrics.signRequests++
    
    const cached = this.signCache.get(gestureKey)
    if (cached && this.isValidCache(cached.timestamp)) {
      // Update usage stats
      cached.usageCount++
      cached.timestamp = Date.now()
      this.metrics.signHits++
      
      console.log(`[Cache] Sign recognition HIT: ${gestureKey}`)
      return cached
    }

    console.log(`[Cache] Sign recognition MISS: ${gestureKey}`)
    return null
  }

  /**
   * Cache sign recognition result
   */
  setSignRecognition(gestureKey: string, result: Omit<SignRecognitionCache, 'timestamp' | 'usageCount'>): void {
    const cacheEntry: SignRecognitionCache = {
      ...result,
      timestamp: Date.now(),
      usageCount: 1,
    }

    this.signCache.set(gestureKey, cacheEntry)
    this.evictLRUIfNeeded(this.signCache, CACHE_CONFIG.MAX_SIGN_CACHE_SIZE)
    this.saveToStorage()

    console.log(`[Cache] Cached sign recognition: ${gestureKey}`)
  }

  // ========================================================================
  // AVATAR ANIMATION CACHE (Hearing → Deaf)
  // ========================================================================

  /**
   * Check if text input has been processed before
   */
  getAvatarAnimation(textKey: string): AvatarAnimationCache | null {
    this.metrics.animationRequests++
    
    const cached = this.animationCache.get(textKey)
    if (cached && this.isValidCache(cached.timestamp)) {
      // Update usage stats
      cached.usageCount++
      cached.timestamp = Date.now()
      this.metrics.animationHits++
      
      console.log(`[Cache] Avatar animation HIT: ${textKey}`)
      return cached
    }

    console.log(`[Cache] Avatar animation MISS: ${textKey}`)
    return null
  }

  /**
   * Cache avatar animation result
   */
  setAvatarAnimation(textKey: string, result: Omit<AvatarAnimationCache, 'timestamp' | 'usageCount'>): void {
    const cacheEntry: AvatarAnimationCache = {
      ...result,
      timestamp: Date.now(),
      usageCount: 1,
    }

    this.animationCache.set(textKey, cacheEntry)
    this.evictLRUIfNeeded(this.animationCache, CACHE_CONFIG.MAX_ANIMATION_CACHE_SIZE)
    this.saveToStorage()

    console.log(`[Cache] Cached avatar animation: ${textKey}`)
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  /**
   * Generate cache key from gesture/hand pose data
   */
  generateGestureKey(handPoseData: any): string {
    // Create a stable hash from hand pose coordinates
    const dataStr = JSON.stringify(handPoseData)
    return this.simpleHash(dataStr)
  }

  /**
   * Generate cache key from text input
   */
  generateTextKey(text: string, context?: string): string {
    const normalizedText = text.toLowerCase().trim()
    const contextStr = context || 'default'
    return this.simpleHash(`${normalizedText}:${contextStr}`)
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_CONFIG.CACHE_EXPIRY_MS
  }

  /**
   * Evict least recently used entries if cache is full
   */
  private evictLRUIfNeeded<T extends { timestamp: number; usageCount: number }>(
    cache: Map<string, T>,
    maxSize: number
  ): void {
    if (cache.size <= maxSize) return

    // Find least recently used entry
    let lruKey: string | null = null
    let lruTimestamp = Date.now()

    for (const [key, entry] of cache.entries()) {
      if (entry.timestamp < lruTimestamp) {
        lruTimestamp = entry.timestamp
        lruKey = key
      }
    }

    if (lruKey) {
      cache.delete(lruKey)
      console.log(`[Cache] Evicted LRU entry: ${lruKey}`)
    }
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      // Load sign cache
      const signCacheData = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_SIGNS)
      if (signCacheData) {
        const parsed = JSON.parse(signCacheData)
        this.signCache = new Map(Object.entries(parsed))
        console.log(`[Cache] Loaded ${this.signCache.size} sign cache entries`)
      }

      // Load animation cache
      const animationCacheData = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_ANIMATIONS)
      if (animationCacheData) {
        const parsed = JSON.parse(animationCacheData)
        this.animationCache = new Map(Object.entries(parsed))
        console.log(`[Cache] Loaded ${this.animationCache.size} animation cache entries`)
      }
    } catch (error) {
      console.warn('[Cache] Failed to load from storage:', error)
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      // Save sign cache
      const signCacheObj = Object.fromEntries(this.signCache.entries())
      localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_SIGNS, JSON.stringify(signCacheObj))

      // Save animation cache
      const animationCacheObj = Object.fromEntries(this.animationCache.entries())
      localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_ANIMATIONS, JSON.stringify(animationCacheObj))
    } catch (error) {
      console.warn('[Cache] Failed to save to storage:', error)
    }
  }

  // ========================================================================
  // METRICS AND UTILITIES
  // ========================================================================

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.signRequests + this.metrics.animationRequests
    const totalHits = this.metrics.signHits + this.metrics.animationHits
    
    return {
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalRequests,
      totalHits,
      cacheSize: this.signCache.size + this.animationCache.size,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * Estimate memory usage in MB
   */
  private estimateMemoryUsage(): number {
    const signCacheSize = JSON.stringify(Object.fromEntries(this.signCache.entries())).length
    const animationCacheSize = JSON.stringify(Object.fromEntries(this.animationCache.entries())).length
    return (signCacheSize + animationCacheSize) / (1024 * 1024) // Convert to MB
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.signCache.clear()
    this.animationCache.clear()
    
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_SIGNS)
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_ANIMATIONS)
    }
    
    console.log('[Cache] Cleared all caches')
  }

  /**
   * Get most frequently used entries for debugging
   */
  getMostUsed(): { signs: string[], animations: string[] } {
    const sortByUsage = <T extends { usageCount: number }>(entries: [string, T][]) =>
      entries.sort(([, a], [, b]) => b.usageCount - a.usageCount).slice(0, 10)

    return {
      signs: sortByUsage([...this.signCache.entries()]).map(([key]) => key),
      animations: sortByUsage([...this.animationCache.entries()]).map(([key]) => key),
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const avatarCache = new AvatarCacheManager()