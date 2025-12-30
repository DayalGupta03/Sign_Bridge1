'use client'

import { useState, useEffect, useCallback, useRef, RefObject, useLayoutEffect } from 'react'
import { clampValue } from '@/lib/scrollCalculations'

export interface UseScrollProgressOptions {
  /** Reference to the target element (hero section) */
  targetRef: RefObject<HTMLElement | null>
  /** Scroll offset configuration [start, end] - not currently used but reserved for future */
  offset?: [string, string]
}

export interface UseScrollProgressReturn {
  /** Normalized scroll progress (0-1) */
  progress: number
  /** Raw scroll position in pixels */
  scrollY: number
  /** Whether the hero section is currently intersecting the viewport */
  isIntersecting: boolean
}

/**
 * Custom hook that tracks scroll progress through a target element.
 * Calculates normalized progress (0-1) based on how far the user has scrolled
 * through the hero section.
 * 
 * ZERO-STALL ARCHITECTURE:
 * - Progress ALWAYS updated on every scroll (even when hero not visible)
 * - This ensures virtualVideoTime in useVideoScrubber is always current
 * - Enables instant resume when hero re-enters viewport
 * 
 * OVERSCROLL PROTECTION:
 * - Progress ALWAYS clamped to [0, 1]
 * - Ignores negative scrollY (iOS elastic bounce)
 * - Handles page-bottom and page-top bounce explicitly
 * - Updates on scroll, resize, mount, AND visibility change
 * - FORBIDDEN: Setting video.currentTime directly (handled by useVideoScrubber)
 * 
 * Uses requestAnimationFrame for throttled updates to maintain 60fps.
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.5
 */
export function useScrollProgress(options: UseScrollProgressOptions): UseScrollProgressReturn {
  const { targetRef } = options
  const [progress, setProgress] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [isIntersecting, setIsIntersecting] = useState(true)
  
  // Persist last known progress when hero exits viewport
  const lastKnownProgressRef = useRef(0)
  // Cache element dimensions to avoid reads in scroll loop
  const elementHeightRef = useRef(0)
  const elementTopRef = useRef(0)

  // Calculate element dimensions (called on mount and resize only)
  const updateElementDimensions = useCallback(() => {
    if (!targetRef.current) return;
    
    const element = targetRef.current;
    elementHeightRef.current = element.offsetHeight;
    // Get initial top position relative to document
    const rect = element.getBoundingClientRect();
    elementTopRef.current = rect.top + window.scrollY;
  }, [targetRef]);

  const calculateProgress = useCallback(() => {
    if (!targetRef.current) return;

    // Get current scroll position
    // Handle iOS elastic bounce: clamp to 0 for negative values (top bounce)
    // Handle page-bottom bounce: scrollY can exceed document height, but progress is clamped
    const currentScrollY = Math.max(0, window.scrollY);
    setScrollY(currentScrollY);

    const element = targetRef.current;
    const rect = element.getBoundingClientRect();
    const elementHeight = elementHeightRef.current || element.offsetHeight;

    // Check if hero is intersecting viewport using bounding rect
    // Hero is intersecting if any part of it is visible
    const heroIsIntersecting = rect.bottom > 0 && rect.top < window.innerHeight;
    setIsIntersecting(heroIsIntersecting);

    // Calculate progress based on scroll position
    // When element top is at viewport top, progress starts
    // When element bottom reaches viewport top, progress is complete
    const scrollableDistance = elementHeight;
    const scrolled = -rect.top;

    // Normalize to 0-1 range with strict clamping
    let normalizedProgress = 0;
    if (scrollableDistance > 0) {
      normalizedProgress = scrolled / scrollableDistance;
    }

    // CRITICAL: Always clamp progress to [0, 1]
    // This handles:
    // - iOS elastic bounce at top (negative scrollY → progress clamped to 0)
    // - Page-bottom bounce (scrollY exceeds document → progress clamped to 1)
    // - Overscroll in any direction
    const clampedProgress = clampValue(normalizedProgress, 0, 1);
    
    // ZERO-STALL: ALWAYS update progress, even when hero is not intersecting
    // This ensures virtualVideoTime in useVideoScrubber is always current
    // and enables instant resume when hero re-enters viewport
    setProgress(clampedProgress);
    lastKnownProgressRef.current = clampedProgress;
  }, [targetRef]);

  // Initialize dimensions and progress synchronously before first paint
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    
    updateElementDimensions();
    calculateProgress();
  }, [updateElementDimensions, calculateProgress]);

  useEffect(() => {
    // Handle SSR
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleResize = () => {
      // Update cached dimensions on resize
      updateElementDimensions();
      // Recalculate progress without snapping
      calculateProgress();
    };

    // Recompute progress on visibility change (tab switch)
    // This ensures progress is current when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - recompute progress immediately
        // This handles cases where user scrolled in another tab or
        // the page state changed while hidden
        updateElementDimensions();
        calculateProgress();
      }
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [calculateProgress, updateElementDimensions]);

  return { progress, scrollY, isIntersecting };
}
