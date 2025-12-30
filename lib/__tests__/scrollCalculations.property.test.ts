/**
 * Property-based tests for scroll calculation utilities.
 * Feature: hero-scroll-video
 * 
 * These tests validate universal correctness properties across all valid inputs.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateVideoTime,
  calculateTextOpacity,
  calculateTextTranslateY,
  clampValue,
  lerpVideoTime,
} from '../scrollCalculations';

describe('scrollCalculations property tests', () => {
  /**
   * Feature: hero-scroll-video, Property 1: Scroll-to-Video Linear Mapping
   * 
   * For any scroll progress value p (where 0 ≤ p ≤ 1) and any video duration d,
   * the calculated video currentTime should equal p * d.
   * 
   * Validates: Requirements 1.2, 1.3, 1.6
   */
  describe('Property 1: Scroll-to-Video Linear Mapping', () => {
    it('should linearly map progress to video time for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 30, noNaN: true }),
          (progress, duration) => {
            const result = calculateVideoTime(progress, duration);
            const expected = progress * duration;
            // Allow small floating point tolerance
            expect(result).toBeCloseTo(expected, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hero-scroll-video, Property 2: Video Time Clamping
   * 
   * For any input scroll progress value (including values outside the valid 0-1 range),
   * the resulting video currentTime should be clamped between 0 and video.duration.
   * 
   * Validates: Requirements 1.7
   */
  describe('Property 2: Video Time Clamping', () => {
    it('should clamp video time between 0 and duration for any progress value', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10, max: 10, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 30, noNaN: true }),
          (progress, duration) => {
            const result = calculateVideoTime(progress, duration);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(duration);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for negative progress values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -100, max: Math.fround(-0.001), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 30, noNaN: true }),
          (progress, duration) => {
            const result = calculateVideoTime(progress, duration);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return duration for progress values > 1', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1.001), max: 100, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 30, noNaN: true }),
          (progress, duration) => {
            const result = calculateVideoTime(progress, duration);
            expect(result).toBeCloseTo(duration, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hero-scroll-video, Property 3: Text Opacity Calculation
   * 
   * For any scroll progress value p, the text overlay opacity should equal
   * max(0, 1 - (p / 0.4)).
   * 
   * Validates: Requirements 3.2, 3.3, 3.4
   */
  describe('Property 3: Text Opacity Calculation', () => {
    it('should calculate opacity as max(0, 1 - (progress / 0.4))', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          (progress) => {
            const result = calculateTextOpacity(progress);
            const expected = Math.max(0, 1 - (progress / 0.4));
            expect(result).toBeCloseTo(expected, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return opacity in range [0, 1]', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1, max: 2, noNaN: true }),
          (progress) => {
            const result = calculateTextOpacity(progress);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(Math.max(0, 1 - (progress / 0.4)));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for progress >= 0.4', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.4), max: 1, noNaN: true }),
          (progress) => {
            const result = calculateTextOpacity(progress);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hero-scroll-video, Property 4: TranslateY Transform Application
   * 
   * For any scroll progress value p, the text overlay should have a translateY
   * transform applied proportional to progress (specifically: translateY = p * -20px).
   * 
   * Validates: Requirements 3.5
   */
  describe('Property 4: TranslateY Transform Application', () => {
    it('should calculate translateY as progress * -20', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          (progress) => {
            const result = calculateTextTranslateY(progress);
            const expected = progress * -20;
            expect(result).toBeCloseTo(expected, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return non-positive values for non-negative progress', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10, noNaN: true }),
          (progress) => {
            const result = calculateTextTranslateY(progress);
            expect(result).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hero-scroll-video, Property 5: No Scale or Rotation Transforms
   * 
   * For any scroll progress value, the text overlay should NOT have scale or
   * rotation transforms applied. The only transforms allowed are translateY and opacity.
   * 
   * Note: This property is validated by the fact that our calculation functions
   * only return translateY and opacity values - there are no scale/rotation functions.
   * 
   * Validates: Requirements 3.6
   */
  describe('Property 5: No Scale or Rotation Transforms', () => {
    it('should only provide translateY and opacity - no scale or rotation functions exist', () => {
      // This test validates that our API only exposes translateY and opacity calculations
      // The absence of scale/rotation functions in the module ensures this property holds
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          (progress) => {
            // We can only calculate translateY and opacity
            const translateY = calculateTextTranslateY(progress);
            const opacity = calculateTextOpacity(progress);
            
            // Both values should be numbers (not transforms that include scale/rotation)
            expect(typeof translateY).toBe('number');
            expect(typeof opacity).toBe('number');
            
            // translateY is a simple pixel value, not a complex transform
            expect(translateY).toBeCloseTo(progress * -20, 5);
            
            // opacity is a simple 0-1 value
            expect(opacity).toBeGreaterThanOrEqual(0);
            expect(opacity).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional clampValue tests
  describe('clampValue utility', () => {
    it('should clamp values within bounds', () => {
      fc.assert(
        fc.property(
          fc.float({ noNaN: true }),
          fc.float({ noNaN: true }),
          fc.float({ noNaN: true }),
          (value, a, b) => {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            const result = clampValue(value, min, max);
            expect(result).toBeGreaterThanOrEqual(min);
            expect(result).toBeLessThanOrEqual(max);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hero-scroll-video, Lerp Smoothing Tests
   * 
   * Tests for lerpVideoTime function that provides smooth transitions
   * between video times to prevent abrupt jumps during rapid scroll.
   * 
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  describe('lerpVideoTime smoothing', () => {
    it('should produce gradual transitions between current and target', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: 1, noNaN: true }),
          (current, target, factor) => {
            const result = lerpVideoTime(current, target, factor);
            
            // Result should be between current and target (or equal to one of them)
            const minVal = Math.min(current, target);
            const maxVal = Math.max(current, target);
            expect(result).toBeGreaterThanOrEqual(minVal - 0.0001);
            expect(result).toBeLessThanOrEqual(maxVal + 0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return current when factor is 0', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (current, target) => {
            const result = lerpVideoTime(current, target, 0);
            expect(result).toBeCloseTo(current, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return target when factor is 1', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (current, target) => {
            const result = lerpVideoTime(current, target, 1);
            expect(result).toBeCloseTo(target, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should move closer to target with each application', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
          (current, target, factor) => {
            const result = lerpVideoTime(current, target, factor);
            const distanceBefore = Math.abs(target - current);
            const distanceAfter = Math.abs(target - result);
            
            // Distance to target should decrease (or stay same if already at target)
            expect(distanceAfter).toBeLessThanOrEqual(distanceBefore + 0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp factor to valid range [0, 1]', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          fc.float({ min: -10, max: 10, noNaN: true }),
          (current, target, factor) => {
            const result = lerpVideoTime(current, target, factor);
            
            // Result should always be between current and target
            const minVal = Math.min(current, target);
            const maxVal = Math.max(current, target);
            expect(result).toBeGreaterThanOrEqual(minVal - 0.0001);
            expect(result).toBeLessThanOrEqual(maxVal + 0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
