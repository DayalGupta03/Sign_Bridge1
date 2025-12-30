'use client'

import { useEffect, useRef, RefObject, useCallback } from 'react'
import { 
  calculateVirtualVideoTime, 
  calculateRenderedVideoTime, 
  getAdaptiveLerpFactor,
  clampValue 
} from '@/lib/scrollCalculations'

export interface UseVideoScrubberOptions {
  /** Reference to the HTML5 video element */
  videoRef: RefObject<HTMLVideoElement | null>
  /** Current scroll progress (0-1) */
  progress: number
  /** Whether video scrubbing is enabled (false when reduced motion is preferred) */
  enabled: boolean
  /** Whether the hero section is currently intersecting the viewport */
  isIntersecting?: boolean
}

/** Base lerp factor for exponential smoothing */
const BASE_LERP_FACTOR = 0.08

/** Maximum time delta per frame to prevent jumps (seconds) */
const MAX_DELTA_PER_FRAME = 0.04

/** Minimum time between frame updates to handle low FPS devices */
const MIN_FRAME_TIME = 1000 / 120 // 120fps max

/** Stall detection threshold - if delta exceeds this, force interpolation */
const STALL_THRESHOLD = 0.001

/**
 * Custom hook that synchronizes video playback with scroll progress using
 * a virtual timeline architecture for ultra-smooth motion.
 * 
 * VIRTUAL TIMELINE SYSTEM:
 * - virtualVideoTime: Authoritative timeline driven by scroll progress
 * - renderedVideoTime: Actual video.currentTime that eases toward virtualVideoTime
 * - Scroll does NOT directly set video.currentTime (decoupled)
 * 
 * ZERO-STALL ARCHITECTURE:
 * - virtualVideoTime is ALWAYS updated from scroll progress (never frozen)
 * - Updates on EVERY scroll, resize, and mount (even when video hidden)
 * - Formula: virtualVideoTime = clamp(progress * video.duration)
 * - Ensures instant resume when hero re-enters viewport
 * 
 * ANTI-STALL GUARDS:
 * - Stall detection: if abs(virtualVideoTime - renderedVideoTime) > 0.001
 * - Action: force rAF interpolation step
 * - No pause state: video visible = motion pipeline active
 * - No dead zone: no scroll region where motion input is ignored
 * 
 * rAF SMOOTHING:
 * - Every frame: renderedVideoTime lerps toward virtualVideoTime
 * - Base lerp factor: 0.08 (exponential smoothing)
 * - Adaptive smoothing: fast scroll → 0.15, slow scroll → 0.06
 * - Max delta guard: 0.04 seconds per frame
 * - Loop runs for ENTIRE page lifetime (visibility-independent)
 * 
 * EDGE CASE PROTECTIONS:
 * - Extreme fast scroll: motion remains continuous, no jumps (max delta guard)
 * - iOS scroll bounce: negative scroll ignored (clamped in useScrollProgress)
 * - Resize mid-scroll: recalculate progress without snapping
 * - Tab switch: pause rAF safely and resume without desync
 * - Low FPS devices: adaptive smoothing prevents stutter
 * 
 * VISIBILITY HANDLING:
 * - Video opacity controlled by isIntersecting (fade in/out)
 * - virtualVideoTime continues updating even when video is hidden
 * - renderedVideoTime continues easing toward virtualVideoTime
 * - On re-entry: instant sync, no waiting for scroll delta
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.7, 4.1, 4.2, 4.5
 */
export function useVideoScrubber(options: UseVideoScrubberOptions): void {
  const { videoRef, progress, enabled, isIntersecting = true } = options
  
  // Virtual timeline state (authoritative)
  const virtualVideoTimeRef = useRef<number>(0)
  // Rendered video time (what's actually displayed)
  const renderedVideoTimeRef = useRef<number>(0)
  // Previous progress for velocity calculation
  const previousProgressRef = useRef<number>(0)
  // Track if we were previously intersecting (for visibility handling only)
  const wasIntersectingRef = useRef<boolean>(true)
  // rAF ID for cleanup
  const rafIdRef = useRef<number | null>(null)
  // Track if rAF loop is running
  const isRunningRef = useRef<boolean>(false)
  // Track tab visibility
  const isVisibleRef = useRef<boolean>(true)
  // Last frame timestamp for adaptive timing
  const lastFrameTimeRef = useRef<number>(0)
  // Track if video duration is valid
  const videoDurationRef = useRef<number>(0)

  // Calculate scroll velocity for adaptive smoothing
  const getScrollVelocity = useCallback(() => {
    const delta = Math.abs(progress - previousProgressRef.current);
    // Convert progress delta to approximate pixel velocity (assuming 1000px hero height)
    return delta * 1000;
  }, [progress]);

  // rAF convergence loop - runs every frame to smooth video time
  // ZERO-STALL: This loop runs for ENTIRE page lifetime (visibility-independent)
  // renderedVideoTime ALWAYS eases toward virtualVideoTime, even when video hidden
  const convergenceLoop = useCallback((timestamp: number) => {
    // Only stop for tab visibility (resource saving) - NOT for hero visibility
    if (!isRunningRef.current || !isVisibleRef.current) return;
    
    const video = videoRef.current;
    if (!video) {
      rafIdRef.current = requestAnimationFrame(convergenceLoop);
      return;
    }

    // Cache video duration to avoid repeated reads
    if (!videoDurationRef.current || isNaN(videoDurationRef.current)) {
      if (video.duration && !isNaN(video.duration)) {
        videoDurationRef.current = video.duration;
      } else {
        rafIdRef.current = requestAnimationFrame(convergenceLoop);
        return;
      }
    }

    // Calculate time since last frame for adaptive smoothing on low FPS devices
    const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 16.67;
    lastFrameTimeRef.current = timestamp;

    // ANTI-STALL GUARD: Detect if there's a meaningful difference between virtual and rendered time
    // If stall detected (delta > threshold), force interpolation step
    const timeDelta = Math.abs(virtualVideoTimeRef.current - renderedVideoTimeRef.current);
    const isStalled = timeDelta > STALL_THRESHOLD;

    // Adaptive lerp factor based on both scroll velocity and frame time
    // Low FPS devices get higher lerp factor to compensate
    const velocity = getScrollVelocity();
    let lerpFactor = getAdaptiveLerpFactor(velocity);
    
    // Compensate for low FPS (if frame took longer than 16.67ms)
    if (deltaTime > 20) {
      // Scale lerp factor up for low FPS to maintain smooth motion
      const fpsCompensation = Math.min(deltaTime / 16.67, 3); // Cap at 3x
      lerpFactor = Math.min(lerpFactor * fpsCompensation, 0.3); // Cap at 0.3
    }

    // ANTI-STALL: If stalled and delta is significant, use higher lerp factor
    // This ensures motion resumes immediately without waiting for scroll delta
    if (isStalled && timeDelta > 0.01) {
      // Use higher lerp factor to catch up faster when stalled
      lerpFactor = Math.max(lerpFactor, 0.12);
    }

    // Calculate new rendered time by easing toward virtual time
    // This happens EVERY frame, regardless of hero visibility
    // NO DEAD ZONE: motion input is never ignored
    const newRenderedTime = calculateRenderedVideoTime(
      renderedVideoTimeRef.current,
      virtualVideoTimeRef.current,
      lerpFactor,
      MAX_DELTA_PER_FRAME
    );

    // Only update video.currentTime if there's a meaningful difference
    // This prevents unnecessary video seeks which can cause micro-stutters
    // Note: We update even when hero is not visible to keep renderedVideoTime in sync
    // ANTI-STALL: Always update if stalled to force motion
    if (isStalled || Math.abs(video.currentTime - newRenderedTime) > 0.001) {
      try {
        video.currentTime = newRenderedTime;
      } catch {
        // Silently handle any video seek errors (e.g., video not ready)
      }
    }
    
    renderedVideoTimeRef.current = newRenderedTime;

    // Continue the loop - NEVER stops except for tab visibility
    // NO PAUSE STATE: video visible = motion pipeline active
    rafIdRef.current = requestAnimationFrame(convergenceLoop);
  }, [videoRef, getScrollVelocity]);

  // Start/stop rAF loop
  const startLoop = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    lastFrameTimeRef.current = 0; // Reset frame timing
    rafIdRef.current = requestAnimationFrame(convergenceLoop);
  }, [convergenceLoop]);

  const stopLoop = useCallback(() => {
    isRunningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Handle tab visibility changes - pause rAF safely and resume without desync
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        // Pause rAF when tab is hidden to save resources
        stopLoop();
      } else if (enabled && !isRunningRef.current) {
        // Resume when tab becomes visible
        // Reset frame timing to prevent large delta on resume
        lastFrameTimeRef.current = 0;
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startLoop, stopLoop]);

  // Update virtual video time based on scroll progress
  // ZERO-STALL ARCHITECTURE: virtualVideoTime is ALWAYS updated, even when video is hidden
  // This ensures instant resume when hero re-enters viewport
  useEffect(() => {
    if (!enabled) return;

    const video = videoRef.current;
    
    // Cache duration if available
    if (video?.duration && !isNaN(video.duration)) {
      videoDurationRef.current = video.duration;
    }
    
    // Need valid duration to calculate virtual time
    if (!videoDurationRef.current) return;

    // ALWAYS update virtual video time from scroll progress
    // virtualVideoTime = clamp(progress * video.duration)
    // This is the authoritative timeline that renderedVideoTime eases toward
    // Progress is already clamped in useScrollProgress, but we clamp again for safety
    // This handles iOS scroll bounce and any other edge cases
    const clampedProgress = clampValue(progress, 0, 1);
    virtualVideoTimeRef.current = calculateVirtualVideoTime(clampedProgress, videoDurationRef.current);

    // Track intersection state changes for visibility handling
    // (but NOT for freezing virtualVideoTime - that's always-on now)
    wasIntersectingRef.current = isIntersecting;

    // Update previous progress for velocity calculation
    previousProgressRef.current = progress;
  }, [videoRef, progress, enabled, isIntersecting]);

  // Start convergence loop on mount and run for ENTIRE page lifetime
  // ZERO-STALL: Loop is visibility-independent (only pauses for tab visibility)
  // This ensures renderedVideoTime always eases toward virtualVideoTime
  useEffect(() => {
    if (enabled && isVisibleRef.current) {
      startLoop();
    } else if (!enabled) {
      stopLoop();
    }

    return () => {
      stopLoop();
    };
  }, [enabled, startLoop, stopLoop]);
}
