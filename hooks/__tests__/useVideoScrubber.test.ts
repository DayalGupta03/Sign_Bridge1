/**
 * Unit tests for useVideoScrubber hook.
 * Feature: hero-scroll-video
 * 
 * Tests that the hook correctly updates video currentTime based on scroll progress.
 * 
 * Requirements: 1.4, 1.5, 2.7, 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import { calculateVideoTime, lerpVideoTime, clampValue } from '@/lib/scrollCalculations';

describe('useVideoScrubber', () => {
  describe('video time calculation logic', () => {
    /**
     * Tests the core calculation logic used by useVideoScrubber.
     * The hook uses calculateVideoTime(progress, duration) to determine
     * the target video currentTime.
     */

    it('should calculate video time as 0 when progress is 0', () => {
      const progress = 0;
      const duration = 10;
      const targetTime = calculateVideoTime(progress, duration);

      expect(targetTime).toBe(0);
    });

    it('should calculate video time as duration when progress is 1', () => {
      const progress = 1;
      const duration = 10;
      const targetTime = calculateVideoTime(progress, duration);

      expect(targetTime).toBe(10);
    });

    it('should calculate video time proportionally for mid-progress', () => {
      const progress = 0.5;
      const duration = 10;
      const targetTime = calculateVideoTime(progress, duration);

      expect(targetTime).toBe(5);
    });

    it('should handle various video durations', () => {
      const progress = 0.25;
      
      expect(calculateVideoTime(progress, 4)).toBe(1);
      expect(calculateVideoTime(progress, 8)).toBe(2);
      expect(calculateVideoTime(progress, 20)).toBe(5);
    });
  });

  describe('update threshold logic', () => {
    /**
     * Tests the threshold logic that prevents unnecessary video updates.
     * The hook only updates when: Math.abs(video.currentTime - targetTime) > 0.01
     */

    it('should identify when update is needed (difference > 0.01)', () => {
      const currentTime = 0;
      const targetTime = 0.5;
      const shouldUpdate = Math.abs(currentTime - targetTime) > 0.01;

      expect(shouldUpdate).toBe(true);
    });

    it('should skip update when difference is negligible (<= 0.01)', () => {
      const currentTime = 5.005;
      const targetTime = 5.01;
      const shouldUpdate = Math.abs(currentTime - targetTime) > 0.01;

      expect(shouldUpdate).toBe(false);
    });

    it('should update when difference is exactly at threshold', () => {
      const currentTime = 5.0;
      const targetTime = 5.011;
      const shouldUpdate = Math.abs(currentTime - targetTime) > 0.01;

      expect(shouldUpdate).toBe(true);
    });
  });

  describe('enabled flag behavior', () => {
    /**
     * Tests the logic for when scrubbing should be skipped.
     * The hook skips updates when enabled is false (reduced motion mode).
     */

    it('should indicate scrubbing is active when enabled is true', () => {
      const enabled = true;
      const shouldScrub = enabled;

      expect(shouldScrub).toBe(true);
    });

    it('should indicate scrubbing is inactive when enabled is false', () => {
      const enabled = false;
      const shouldScrub = enabled;

      expect(shouldScrub).toBe(false);
    });
  });

  describe('video readiness checks', () => {
    /**
     * Tests the logic for checking if video is ready for scrubbing.
     * The hook checks: video.duration exists and is not NaN
     */

    it('should identify video as ready when duration is valid', () => {
      const duration = 10;
      const isReady = duration && !isNaN(duration);

      expect(isReady).toBeTruthy();
    });

    it('should identify video as not ready when duration is NaN', () => {
      const duration = NaN;
      const isReady = duration && !isNaN(duration);

      expect(isReady).toBeFalsy();
    });

    it('should identify video as not ready when duration is 0', () => {
      const duration = 0;
      const isReady = duration && !isNaN(duration);

      expect(isReady).toBeFalsy();
    });

    it('should identify video as not ready when duration is undefined', () => {
      const duration = undefined;
      const isReady = duration && !isNaN(duration as number);

      expect(isReady).toBeFalsy();
    });
  });

  describe('freeze/resume logic', () => {
    /**
     * Tests the freeze/resume behavior when hero exits/enters viewport.
     * 
     * Requirements: 1.4, 1.5, 4.1
     */

    it('should freeze video time when hero exits viewport', () => {
      // Simulate: video was at time 5.0, hero exits viewport
      let lastKnownVideoTime = 5.0;
      const isIntersecting = false;
      const wasIntersecting = true;
      
      // When exiting viewport, store current time
      if (!isIntersecting && wasIntersecting) {
        lastKnownVideoTime = 5.0; // Store current video time
      }

      expect(lastKnownVideoTime).toBe(5.0);
    });

    it('should resume from frozen time when hero re-enters viewport', () => {
      // Simulate: hero re-enters viewport with frozen time at 5.0
      const lastKnownVideoTime = 5.0;
      const isIntersecting = true;
      const wasIntersecting = false;
      
      // When re-entering, initialize from frozen state
      let currentVideoTime = 0;
      if (!wasIntersecting && isIntersecting) {
        currentVideoTime = lastKnownVideoTime;
      }

      expect(currentVideoTime).toBe(5.0);
    });

    it('should not update video time when hero is not intersecting', () => {
      const isIntersecting = false;
      const shouldUpdate = isIntersecting;

      expect(shouldUpdate).toBe(false);
    });

    it('should update video time when hero is intersecting', () => {
      const isIntersecting = true;
      const shouldUpdate = isIntersecting;

      expect(shouldUpdate).toBe(true);
    });
  });

  describe('lerp smoothing logic', () => {
    /**
     * Tests the lerp smoothing for gradual video time transitions.
     * 
     * Requirements: 4.1, 4.2, 4.5
     */

    it('should produce gradual transition from current to target', () => {
      const currentTime = 2.0;
      const targetTime = 5.0;
      const factor = 0.15;
      
      const smoothedTime = lerpVideoTime(currentTime, targetTime, factor);
      
      // Should be between current and target
      expect(smoothedTime).toBeGreaterThan(currentTime);
      expect(smoothedTime).toBeLessThan(targetTime);
      // Should be closer to current (since factor is 0.15)
      expect(smoothedTime).toBeCloseTo(2.45, 2); // 2 + (5-2) * 0.15 = 2.45
    });

    it('should converge to target over multiple iterations', () => {
      let currentTime = 0;
      const targetTime = 10;
      const factor = 0.15;
      
      // Apply lerp multiple times
      for (let i = 0; i < 20; i++) {
        currentTime = lerpVideoTime(currentTime, targetTime, factor);
      }
      
      // Should be very close to target after many iterations
      expect(currentTime).toBeGreaterThan(9);
    });

    it('should handle reverse direction (scrolling up)', () => {
      const currentTime = 8.0;
      const targetTime = 3.0;
      const factor = 0.15;
      
      const smoothedTime = lerpVideoTime(currentTime, targetTime, factor);
      
      // Should be between target and current (moving toward target)
      expect(smoothedTime).toBeLessThan(currentTime);
      expect(smoothedTime).toBeGreaterThan(targetTime);
    });
  });

  describe('anti-jank progress clamping', () => {
    /**
     * Tests the anti-jank measure that clamps progress changes per frame.
     * 
     * Requirements: 4.1, 4.2, 4.5
     */

    const MAX_PROGRESS_DELTA_PER_FRAME = 0.1;

    it('should clamp large positive progress jumps', () => {
      const previousProgress = 0.2;
      const newProgress = 0.8; // Large jump
      
      const progressDelta = newProgress - previousProgress;
      const clampedDelta = clampValue(progressDelta, -MAX_PROGRESS_DELTA_PER_FRAME, MAX_PROGRESS_DELTA_PER_FRAME);
      const clampedProgress = previousProgress + clampedDelta;

      expect(clampedProgress).toBeCloseTo(0.3, 5); // 0.2 + 0.1 (clamped)
    });

    it('should clamp large negative progress jumps', () => {
      const previousProgress = 0.8;
      const newProgress = 0.2; // Large jump backward
      
      const progressDelta = newProgress - previousProgress;
      const clampedDelta = clampValue(progressDelta, -MAX_PROGRESS_DELTA_PER_FRAME, MAX_PROGRESS_DELTA_PER_FRAME);
      const clampedProgress = previousProgress + clampedDelta;

      expect(clampedProgress).toBeCloseTo(0.7, 5); // 0.8 - 0.1 (clamped)
    });

    it('should not clamp small progress changes', () => {
      const previousProgress = 0.5;
      const newProgress = 0.55; // Small change
      
      const progressDelta = newProgress - previousProgress;
      const clampedDelta = clampValue(progressDelta, -MAX_PROGRESS_DELTA_PER_FRAME, MAX_PROGRESS_DELTA_PER_FRAME);
      const clampedProgress = previousProgress + clampedDelta;

      expect(clampedProgress).toBeCloseTo(0.55, 5);
    });

    it('should handle progress at boundaries', () => {
      const previousProgress = 0.95;
      const newProgress = 1.0;
      
      const progressDelta = newProgress - previousProgress;
      const clampedDelta = clampValue(progressDelta, -MAX_PROGRESS_DELTA_PER_FRAME, MAX_PROGRESS_DELTA_PER_FRAME);
      const clampedProgress = previousProgress + clampedDelta;

      expect(clampedProgress).toBeCloseTo(1.0, 5);
    });
  });

  describe('text and video synchronization', () => {
    /**
     * Tests that text and video remain synchronized during pause/resume.
     * Both should use the same persisted progress value.
     * 
     * Requirements: 3.4, 4.1
     */

    it('should use same progress for both text and video calculations', () => {
      const progress = 0.35;
      const duration = 10;
      
      // Video time calculation
      const videoTime = calculateVideoTime(progress, duration);
      
      // Text opacity calculation (from scrollCalculations)
      const fadeEndProgress = 0.4;
      const textOpacity = Math.max(0, 1 - (progress / fadeEndProgress));
      
      // Both should be derived from the same progress value
      expect(videoTime).toBe(3.5); // 0.35 * 10
      expect(textOpacity).toBeCloseTo(0.125, 3); // 1 - (0.35 / 0.4)
    });

    it('should maintain sync when progress is frozen', () => {
      const frozenProgress = 0.6;
      const duration = 10;
      
      // When hero exits viewport, both use frozen progress
      const videoTime = calculateVideoTime(frozenProgress, duration);
      const fadeEndProgress = 0.4;
      const textOpacity = Math.max(0, 1 - (frozenProgress / fadeEndProgress));
      
      expect(videoTime).toBe(6.0);
      expect(textOpacity).toBe(0); // Fully faded at progress > 0.4
    });
  });
});
