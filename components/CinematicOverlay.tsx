"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  calculateOverlayOpacity,
  calculateVideoScale,
  lerpOverlayOpacity,
  lerpVideoScale,
  clampValue,
} from "@/lib/scrollCalculations"

/**
 * Props for the CinematicOverlay component.
 */
export interface CinematicOverlayProps {
  /** Whether the overlay effects are enabled (disabled for reduced motion) */
  enabled: boolean
  /** Hero scroll progress (0-1), scoped to Hero section only */
  heroProgress: number
  /** Whether the Hero section is currently intersecting the viewport */
  isHeroIntersecting: boolean
}

/** Lerp factor for smooth interpolation */
const LERP_FACTOR = 0.1

/** Max delta per frame for opacity (prevents banding) */
const MAX_OPACITY_DELTA = 0.03

/** Max delta per frame for scale (prevents hard edges) */
const MAX_SCALE_DELTA = 0.01

/**
 * CINEMATIC OVERLAY COMPONENT - HERO-SCOPED
 * 
 * Dark overlay layer scoped to Hero section ONLY.
 * Provides cinematic zoom and darkening effects driven by Hero scroll progress.
 * 
 * SCOPING RULES (Task 12):
 * - Overlay affects ONLY video pixels underneath, never text or UI
 * - Active range: Top of Hero Section to Bottom of Hero Section ONLY
 * - Post-hero behavior: opacity = 0, visibility = hidden (hard cutoff)
 * - No carryover: opacity resets to 0 immediately after Hero section
 * - No opacity leakage into How It Works or Application Interface
 * 
 * Z-INDEX CONTRACT:
 * - Video layer: z-index 0
 * - Overlay layer: z-index 0.5 (between video and content)
 * - Content layer: z-index 1+
 * - Pointer-events: none (doesn't block interactions)
 * 
 * SCROLL-DRIVEN EFFECTS (HERO-SCOPED):
 * - Active range: Top of Hero to Bottom of Hero ONLY
 * - Overlay opacity: 0.0 → 0.85 with easeInOutCubic
 * - Video scale: 1.0 → 1.08 from center with easeInOutCubic
 * - Bidirectional: works smoothly in both scroll directions
 * - Hard cutoff: opacity = 0, scale = 1.0 after Hero section
 * 
 * LERP SMOOTHING:
 * - Update driver: requestAnimationFrame
 * - Lerp factor: 0.1 for smooth interpolation
 * - Max delta per frame: opacity 0.03, scale 0.01
 * - No hard edges, no banding
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 6.1, 8.1, 8.2
 */
export function CinematicOverlay({ enabled, heroProgress, isHeroIntersecting }: CinematicOverlayProps) {
  // Current rendered values (smoothed)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [videoScale, setVideoScale] = useState(1)
  
  // Target values (calculated from Hero scroll progress)
  const targetOpacityRef = useRef(0)
  const targetScaleRef = useRef(1)
  
  // Current rendered values for lerp calculations
  const currentOpacityRef = useRef(0)
  const currentScaleRef = useRef(1)
  
  // rAF loop control
  const rafIdRef = useRef<number | null>(null)
  const isRunningRef = useRef(false)

  /**
   * Calculate Hero-scoped scroll progress for cinematic transition.
   * Range: 0 = Hero top, 1 = Hero bottom
   * SCOPED TO HERO SECTION ONLY - no extended range into other sections
   */
  const calculateHeroScopedProgress = useCallback(() => {
    // Use the heroProgress prop directly - it's already scoped to Hero section
    // This ensures no opacity leakage into other sections
    return clampValue(heroProgress, 0, 1)
  }, [heroProgress])

  /**
   * Update target values based on Hero scroll progress.
   * HERO-SCOPED: Only active during Hero section scroll range.
   * Post-hero: opacity = 0, scale = 1.0 (hard cutoff)
   */
  const updateTargets = useCallback(() => {
    if (!enabled) {
      targetOpacityRef.current = 0
      targetScaleRef.current = 1
      return
    }

    // HERO-SCOPED: Use Hero progress directly, not extended range
    const progress = calculateHeroScopedProgress()
    
    // Post-hero behavior: hard cutoff when Hero is not intersecting
    // This prevents opacity leakage into other sections
    if (!isHeroIntersecting && progress >= 1) {
      // Hero section has been scrolled past - reset to defaults
      targetOpacityRef.current = 0
      targetScaleRef.current = 1
      return
    }
    
    targetOpacityRef.current = calculateOverlayOpacity(progress)
    targetScaleRef.current = calculateVideoScale(progress)
  }, [enabled, calculateHeroScopedProgress, isHeroIntersecting])

  /**
   * rAF convergence loop - smoothly interpolates toward target values.
   */
  const convergenceLoop = useCallback(() => {
    if (!isRunningRef.current) return

    // Lerp toward target values with max delta constraints
    const newOpacity = lerpOverlayOpacity(
      currentOpacityRef.current,
      targetOpacityRef.current,
      LERP_FACTOR,
      MAX_OPACITY_DELTA
    )
    const newScale = lerpVideoScale(
      currentScaleRef.current,
      targetScaleRef.current,
      LERP_FACTOR,
      MAX_SCALE_DELTA
    )

    // Update refs
    currentOpacityRef.current = newOpacity
    currentScaleRef.current = newScale

    // Update state only if there's meaningful change (prevents unnecessary re-renders)
    if (Math.abs(newOpacity - overlayOpacity) > 0.001) {
      setOverlayOpacity(newOpacity)
    }
    if (Math.abs(newScale - videoScale) > 0.001) {
      setVideoScale(newScale)
    }

    // Continue loop
    rafIdRef.current = requestAnimationFrame(convergenceLoop)
  }, [overlayOpacity, videoScale])

  /**
   * Start the rAF convergence loop.
   */
  const startLoop = useCallback(() => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    rafIdRef.current = requestAnimationFrame(convergenceLoop)
  }, [convergenceLoop])

  /**
   * Stop the rAF convergence loop.
   */
  const stopLoop = useCallback(() => {
    isRunningRef.current = false
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  // Handle scroll events to update targets
  // Note: We now receive heroProgress as a prop, so we just need to trigger updates
  useEffect(() => {
    if (typeof window === "undefined") return

    // Update targets whenever heroProgress or isHeroIntersecting changes
    updateTargets()
  }, [updateTargets, heroProgress, isHeroIntersecting])

  // Start/stop convergence loop based on enabled state
  useEffect(() => {
    if (enabled) {
      startLoop()
    } else {
      stopLoop()
      // Reset to defaults when disabled
      setOverlayOpacity(0)
      setVideoScale(1)
      currentOpacityRef.current = 0
      currentScaleRef.current = 1
    }

    return () => {
      stopLoop()
    }
  }, [enabled, startLoop, stopLoop])

  // Don't render anything if disabled
  if (!enabled) return null

  // Calculate visibility for hard cutoff after Hero section
  // Post-hero: visibility = hidden to ensure no opacity leakage
  const isVisible = isHeroIntersecting || heroProgress < 1

  return (
    <>
      {/* 
        Video Scale CSS Variable Provider
        This component sets a CSS custom property that the video container can use
        for the cinematic zoom effect. This avoids prop drilling through components.
        
        HERO-SCOPED: Scale resets to 1.0 after Hero section
      */}
      <style jsx global>{`
        :root {
          --cinematic-video-scale: ${videoScale};
          --cinematic-overlay-opacity: ${overlayOpacity};
          --cinematic-overlay-visible: ${isVisible ? 1 : 0};
        }
      `}</style>
    </>
  )
}
