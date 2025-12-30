"use client";

import React from "react";
import { calculateTextOpacity, calculateTextTranslateY } from "@/lib/scrollCalculations";

/**
 * Props for the TextOverlay component.
 */
export interface TextOverlayProps {
  /** Scroll progress value (0-1) for calculating fade and transform */
  progress: number;
  /** Whether reduced motion is enabled - skips animations if true */
  isReducedMotion: boolean;
  /** Content to render within the overlay */
  children: React.ReactNode;
  /** Optional additional className for styling */
  className?: string;
}

/**
 * TextOverlay component for hero section text elements.
 * 
 * Handles the fade behavior of hero text elements based on scroll progress.
 * Uses only transform and opacity for GPU-accelerated performance.
 * 
 * - At progress 0: opacity 1.0 (fully visible)
 * - At progress 0.4+: opacity 0 (fully hidden)
 * - Applies subtle translateY transform during fade
 * - Skips all animations when reduced motion is enabled
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.4, 6.6
 */
export function TextOverlay({
  progress,
  isReducedMotion,
  children,
  className = "",
}: TextOverlayProps) {
  // When reduced motion is enabled, keep text fully visible without animations
  const opacity = isReducedMotion ? 1 : calculateTextOpacity(progress);
  const translateY = isReducedMotion ? 0 : calculateTextTranslateY(progress);

  // Content is considered hidden when opacity is very low (handles floating-point)
  const isHidden = opacity < 0.01;

  return (
    <div
      className={`absolute inset-0 z-10 ${className}`}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        // GPU acceleration hints
        willChange: "transform, opacity",
        // Prevent pointer events when hidden to avoid invisible click targets
        pointerEvents: isHidden ? "none" : "auto",
      }}
      // Hide from assistive technology when visually hidden
      aria-hidden={isHidden}
      // Prevent keyboard focus when hidden (React 19 requires boolean for inert)
      inert={isHidden ? true : undefined}
      // Semantic role for screen readers
      role="region"
      aria-label="Hero content overlay"
    >
      {children}
    </div>
  );
}

export default TextOverlay;
