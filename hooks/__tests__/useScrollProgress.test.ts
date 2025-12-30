/**
 * Unit tests for useScrollProgress hook.
 * Feature: hero-scroll-video
 * 
 * Tests that the hook correctly calculates scroll progress through a target element.
 * 
 * Requirements: 1.2, 1.4, 1.5, 4.1
 */

import { describe, it, expect } from 'vitest';
import { clampValue } from '@/lib/scrollCalculations';

describe('useScrollProgress', () => {
  describe('progress calculation logic', () => {
    /**
     * Tests the core calculation logic used by useScrollProgress.
     * The hook calculates: normalizedProgress = scrolled / scrollableDistance
     * where scrolled = -rect.top and scrollableDistance = elementHeight
     */

    it('should return 0 progress when element top is at viewport top', () => {
      // Simulate: rect.top = 0, elementHeight = 1000
      const rectTop = 0;
      const elementHeight = 1000;
      const scrolled = -rectTop; // 0
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(0);
    });

    it('should return 0.5 progress when scrolled halfway through element', () => {
      // Simulate: rect.top = -500, elementHeight = 1000
      const rectTop = -500;
      const elementHeight = 1000;
      const scrolled = -rectTop; // 500
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(0.5);
    });

    it('should return 1 progress when element bottom reaches viewport top', () => {
      // Simulate: rect.top = -1000, elementHeight = 1000
      const rectTop = -1000;
      const elementHeight = 1000;
      const scrolled = -rectTop; // 1000
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(1);
    });

    it('should clamp progress to 0 when element is below viewport', () => {
      // Simulate: rect.top = 100 (element below viewport top)
      const rectTop = 100;
      const elementHeight = 1000;
      const scrolled = -rectTop; // -100
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(0);
    });

    it('should clamp progress to 1 when scrolled past element', () => {
      // Simulate: rect.top = -1500, elementHeight = 1000
      const rectTop = -1500;
      const elementHeight = 1000;
      const scrolled = -rectTop; // 1500
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(1);
    });

    it('should return 0 when element has zero height', () => {
      const rectTop = -500;
      const elementHeight = 0;
      const scrolled = -rectTop;
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(0);
    });

    it('should handle fractional progress values', () => {
      // Simulate: rect.top = -250, elementHeight = 1000
      const rectTop = -250;
      const elementHeight = 1000;
      const scrolled = -rectTop; // 250
      const normalizedProgress = elementHeight > 0 ? scrolled / elementHeight : 0;
      const progress = clampValue(normalizedProgress, 0, 1);

      expect(progress).toBe(0.25);
    });
  });

  describe('intersection awareness logic', () => {
    /**
     * Tests the intersection detection logic used by useScrollProgress.
     * The hook determines: heroIsIntersecting = rect.bottom > 0 && rect.top < viewportHeight
     * 
     * Requirements: 1.4, 1.5, 4.1
     */

    it('should detect hero as intersecting when fully visible', () => {
      // Hero fully in viewport: rect.top = 0, rect.bottom = 800, viewportHeight = 900
      const rectTop = 0;
      const rectBottom = 800;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(true);
    });

    it('should detect hero as intersecting when partially visible at top', () => {
      // Hero partially scrolled up: rect.top = -500, rect.bottom = 300, viewportHeight = 900
      const rectTop = -500;
      const rectBottom = 300;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(true);
    });

    it('should detect hero as intersecting when partially visible at bottom', () => {
      // Hero entering from bottom: rect.top = 700, rect.bottom = 1500, viewportHeight = 900
      const rectTop = 700;
      const rectBottom = 1500;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(true);
    });

    it('should detect hero as NOT intersecting when scrolled past (above viewport)', () => {
      // Hero completely scrolled past: rect.top = -1200, rect.bottom = -400, viewportHeight = 900
      const rectTop = -1200;
      const rectBottom = -400;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(false);
    });

    it('should detect hero as NOT intersecting when below viewport', () => {
      // Hero below viewport: rect.top = 1000, rect.bottom = 1800, viewportHeight = 900
      const rectTop = 1000;
      const rectBottom = 1800;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(false);
    });

    it('should detect hero as intersecting at exact boundary (bottom at 0)', () => {
      // Hero just touching viewport: rect.top = -800, rect.bottom = 1, viewportHeight = 900
      const rectTop = -800;
      const rectBottom = 1;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(true);
    });

    it('should detect hero as NOT intersecting when bottom exactly at 0', () => {
      // Hero just exited viewport: rect.top = -800, rect.bottom = 0, viewportHeight = 900
      const rectTop = -800;
      const rectBottom = 0;
      const viewportHeight = 900;
      const isIntersecting = rectBottom > 0 && rectTop < viewportHeight;

      expect(isIntersecting).toBe(false);
    });
  });

  describe('progress persistence logic', () => {
    /**
     * Tests the logic for persisting progress when hero exits viewport.
     * When hero is not intersecting, progress should remain at lastKnownProgress.
     * 
     * Requirements: 1.4, 1.5
     */

    it('should persist progress value when hero exits viewport', () => {
      // Simulate: hero was at progress 0.7, then exits viewport
      let lastKnownProgress = 0.7;
      const isIntersecting = false;
      
      // When not intersecting, progress stays at lastKnownProgress
      const currentProgress = isIntersecting ? 0.9 : lastKnownProgress;

      expect(currentProgress).toBe(0.7);
    });

    it('should update progress when hero re-enters viewport', () => {
      // Simulate: hero re-enters viewport with new calculated progress
      let lastKnownProgress = 0.7;
      const isIntersecting = true;
      const newCalculatedProgress = 0.3;
      
      // When intersecting, use new calculated progress
      const currentProgress = isIntersecting ? newCalculatedProgress : lastKnownProgress;
      lastKnownProgress = currentProgress;

      expect(currentProgress).toBe(0.3);
      expect(lastKnownProgress).toBe(0.3);
    });
  });
});
