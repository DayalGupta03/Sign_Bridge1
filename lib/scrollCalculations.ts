/**
 * Pure calculation functions for scroll-controlled video hero section.
 * These functions are stateless and deterministic for easy testing.
 * 
 * VIRTUAL TIMELINE ARCHITECTURE:
 * - virtualVideoTime: Authoritative timeline driven by scroll progress [0, video.duration]
 * - renderedVideoTime: Actual video.currentTime that eases toward virtualVideoTime
 * - Scroll does NOT directly set video.currentTime (decoupled architecture)
 * 
 * Requirements: 1.2, 1.3, 1.6, 1.7, 4.1, 4.2
 */

/**
 * Calculates video currentTime based on scroll progress.
 * Uses linear mapping: progress (0-1) maps to time (0-duration).
 * 
 * @param progress - Normalized scroll progress (0-1)
 * @param duration - Video duration in seconds
 * @returns Video currentTime in seconds
 * 
 * Requirements: 1.2, 1.3, 1.6
 */
export function calculateVideoTime(progress: number, duration: number): number {
  return clampValue(progress * duration, 0, duration);
}

/**
 * Calculates the virtual video time (authoritative timeline) from scroll progress.
 * This is the target time that the rendered video time should ease toward.
 * 
 * virtualVideoTime = clamp(progress * duration, 0, duration)
 * 
 * @param progress - Normalized scroll progress (0-1), will be clamped
 * @param duration - Video duration in seconds
 * @returns Virtual video time in seconds [0, duration]
 * 
 * Requirements: 1.2, 1.3, 1.6, 1.7
 */
export function calculateVirtualVideoTime(progress: number, duration: number): number {
  // Clamp progress to [0, 1] to handle overscroll/iOS bounce
  const clampedProgress = clampValue(progress, 0, 1);
  return clampValue(clampedProgress * duration, 0, duration);
}

/**
 * Calculates the rendered video time by easing toward the virtual time.
 * Uses exponential smoothing (lerp) for cinematic-grade smoothness.
 * 
 * @param currentRendered - Current rendered video time
 * @param virtualTime - Target virtual video time
 * @param lerpFactor - Smoothing factor (0-1), higher = faster convergence
 * @param maxDelta - Maximum time change per frame (prevents jumps)
 * @returns New rendered video time
 * 
 * Requirements: 4.1, 4.2, 4.5
 */
export function calculateRenderedVideoTime(
  currentRendered: number,
  virtualTime: number,
  lerpFactor: number = 0.08,
  maxDelta: number = 0.04
): number {
  // Calculate the raw lerp result
  const lerpedTime = currentRendered + (virtualTime - currentRendered) * lerpFactor;
  
  // Apply max delta guard to prevent large jumps
  const delta = lerpedTime - currentRendered;
  const clampedDelta = clampValue(delta, -maxDelta, maxDelta);
  
  return currentRendered + clampedDelta;
}

/**
 * Determines the adaptive lerp factor based on scroll velocity.
 * Fast scroll → higher factor (0.15) for responsiveness
 * Slow scroll → lower factor (0.06) for smoothness
 * 
 * @param scrollVelocity - Absolute scroll velocity (pixels per frame or similar)
 * @param fastThreshold - Velocity threshold for "fast" scroll (default 50)
 * @param slowThreshold - Velocity threshold for "slow" scroll (default 10)
 * @returns Adaptive lerp factor between 0.06 and 0.15
 * 
 * Requirements: 4.1, 4.2, 4.5
 */
export function getAdaptiveLerpFactor(
  scrollVelocity: number,
  fastThreshold: number = 50,
  slowThreshold: number = 10
): number {
  const FAST_LERP = 0.15;
  const BASE_LERP = 0.08;
  const SLOW_LERP = 0.06;
  
  const absVelocity = Math.abs(scrollVelocity);
  
  if (absVelocity >= fastThreshold) {
    return FAST_LERP;
  } else if (absVelocity <= slowThreshold) {
    return SLOW_LERP;
  }
  
  // Linear interpolation between slow and fast based on velocity
  const t = (absVelocity - slowThreshold) / (fastThreshold - slowThreshold);
  return SLOW_LERP + t * (BASE_LERP - SLOW_LERP);
}

/**
 * Calculates text overlay opacity based on scroll progress.
 * Fades from 1.0 at progress 0 to 0 at progress 0.4+.
 * Formula: max(0, 1 - (progress / 0.4))
 * 
 * @param progress - Normalized scroll progress (0-1)
 * @returns Opacity value (0-1)
 * 
 * Requirements: 3.2, 3.3
 */
export function calculateTextOpacity(progress: number): number {
  const fadeEndProgress = 0.4;
  return Math.max(0, 1 - (progress / fadeEndProgress));
}

/**
 * Calculates text overlay translateY transform based on scroll progress.
 * Applies subtle upward movement as user scrolls.
 * 
 * @param progress - Normalized scroll progress (0-1)
 * @returns TranslateY value in pixels (negative = upward)
 * 
 * Requirements: 3.5
 */
export function calculateTextTranslateY(progress: number): number {
  return progress * -20;
}

/**
 * Clamps a value between min and max bounds.
 * 
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 * 
 * Requirements: 1.7
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linearly interpolates between current and target video time for smooth transitions.
 * Uses lerp formula: current + (target - current) * factor
 * 
 * This prevents abrupt jumps during rapid scroll by gradually moving toward
 * the target time rather than snapping directly to it.
 * 
 * @param current - Current video time in seconds
 * @param target - Target video time in seconds
 * @param factor - Interpolation factor (0-1), default 0.15 for smooth feel
 * @returns Interpolated video time in seconds
 * 
 * Requirements: 4.1, 4.2, 4.5
 */
export function lerpVideoTime(current: number, target: number, factor: number = 0.15): number {
  // Clamp factor to valid range
  const clampedFactor = clampValue(factor, 0, 1);
  
  // Linear interpolation: current + (target - current) * factor
  return current + (target - current) * clampedFactor;
}

/**
 * Cubic ease-in-out function for smooth cinematic transitions.
 * Provides acceleration at start and deceleration at end.
 * 
 * @param t - Input value (0-1)
 * @returns Eased value (0-1)
 * 
 * Requirements: 4.1, 4.2
 */
export function easeInOutCubic(t: number): number {
  const clamped = clampValue(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Calculates the dark overlay opacity based on scroll progress.
 * Active range: Top of Hero to midpoint of How It Works
 * Start opacity: 0.0, End opacity: 0.85
 * Uses easeInOutCubic for smooth cinematic curve.
 * 
 * @param progress - Extended scroll progress (0 = Hero top, 1 = How It Works midpoint)
 * @returns Overlay opacity (0 to 0.85)
 * 
 * Requirements: 4.1, 4.2, 6.1
 */
export function calculateOverlayOpacity(progress: number): number {
  const MAX_OPACITY = 0.85;
  const clampedProgress = clampValue(progress, 0, 1);
  return easeInOutCubic(clampedProgress) * MAX_OPACITY;
}

/**
 * Calculates the video scale for cinematic zoom effect.
 * Start scale: 1.0, End scale: 1.08
 * Uses easeInOutCubic for smooth cinematic curve.
 * Transform-origin should be center center.
 * 
 * @param progress - Extended scroll progress (0 = Hero top, 1 = How It Works midpoint)
 * @returns Video scale (1.0 to 1.08)
 * 
 * Requirements: 4.1, 4.2, 4.4
 */
export function calculateVideoScale(progress: number): number {
  const START_SCALE = 1.0;
  const SCALE_DELTA = 0.08;
  const clampedProgress = clampValue(progress, 0, 1);
  return START_SCALE + easeInOutCubic(clampedProgress) * SCALE_DELTA;
}

/**
 * Lerp smoothing for overlay opacity with max delta constraint.
 * Prevents hard edges and banding during transitions.
 * 
 * @param current - Current opacity value
 * @param target - Target opacity value
 * @param factor - Lerp factor (default 0.1)
 * @param maxDelta - Maximum change per frame (default 0.03)
 * @returns Smoothed opacity value
 * 
 * Requirements: 4.1, 4.2, 4.5
 */
export function lerpOverlayOpacity(
  current: number,
  target: number,
  factor: number = 0.1,
  maxDelta: number = 0.03
): number {
  const delta = (target - current) * factor;
  const clampedDelta = clampValue(delta, -maxDelta, maxDelta);
  return current + clampedDelta;
}

/**
 * Lerp smoothing for video scale with max delta constraint.
 * Prevents hard edges during zoom transitions.
 * 
 * @param current - Current scale value
 * @param target - Target scale value
 * @param factor - Lerp factor (default 0.1)
 * @param maxDelta - Maximum change per frame (default 0.01)
 * @returns Smoothed scale value
 * 
 * Requirements: 4.1, 4.2, 4.5
 */
export function lerpVideoScale(
  current: number,
  target: number,
  factor: number = 0.1,
  maxDelta: number = 0.01
): number {
  const delta = (target - current) * factor;
  const clampedDelta = clampValue(delta, -maxDelta, maxDelta);
  return current + clampedDelta;
}
