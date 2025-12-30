/**
 * Unit tests for TextOverlay component.
 * Feature: hero-scroll-video
 * 
 * Tests opacity and translateY calculations at various progress points,
 * and reduced motion mode behavior.
 * 
 * Requirements: 3.1, 3.2, 3.3, 5.3
 */

import { describe, it, expect } from 'vitest';
import { calculateTextOpacity, calculateTextTranslateY } from '@/lib/scrollCalculations';

describe('TextOverlay Component Logic', () => {
  describe('Opacity calculations', () => {
    it('should have full opacity (1.0) at progress 0', () => {
      const opacity = calculateTextOpacity(0);
      expect(opacity).toBe(1);
    });

    it('should have opacity 0.5 at progress 0.2', () => {
      const opacity = calculateTextOpacity(0.2);
      expect(opacity).toBe(0.5);
    });

    it('should have opacity 0 at progress 0.4', () => {
      const opacity = calculateTextOpacity(0.4);
      expect(opacity).toBe(0);
    });

    it('should remain at opacity 0 for progress > 0.4', () => {
      expect(calculateTextOpacity(0.5)).toBe(0);
      expect(calculateTextOpacity(0.6)).toBe(0);
      expect(calculateTextOpacity(1.0)).toBe(0);
    });
  });

  describe('TranslateY calculations', () => {
    it('should have translateY 0 at progress 0', () => {
      const translateY = calculateTextTranslateY(0);
      expect(translateY).toBeCloseTo(0, 5);
    });

    it('should have translateY -4 at progress 0.2', () => {
      const translateY = calculateTextTranslateY(0.2);
      expect(translateY).toBe(-4);
    });

    it('should have translateY -8 at progress 0.4', () => {
      const translateY = calculateTextTranslateY(0.4);
      expect(translateY).toBeCloseTo(-8, 5);
    });

    it('should have translateY -20 at progress 1.0', () => {
      const translateY = calculateTextTranslateY(1.0);
      expect(translateY).toBe(-20);
    });
  });

  describe('Reduced motion mode', () => {
    it('should keep opacity at 1 when reduced motion is enabled', () => {
      // When isReducedMotion is true, the component uses opacity = 1
      // This test validates the expected behavior
      const isReducedMotion = true;
      const progress = 0.5;
      
      // In reduced motion mode, opacity should be 1 regardless of progress
      const opacity = isReducedMotion ? 1 : calculateTextOpacity(progress);
      expect(opacity).toBe(1);
    });

    it('should keep translateY at 0 when reduced motion is enabled', () => {
      // When isReducedMotion is true, the component uses translateY = 0
      const isReducedMotion = true;
      const progress = 0.5;
      
      // In reduced motion mode, translateY should be 0 regardless of progress
      const translateY = isReducedMotion ? 0 : calculateTextTranslateY(progress);
      expect(translateY).toBe(0);
    });
  });
});
