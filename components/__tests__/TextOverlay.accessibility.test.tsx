/**
 * Accessibility Tests for TextOverlay Component
 * 
 * WCAG 2.1 AA Compliance Tests:
 * - aria-hidden behavior when content is visually hidden
 * - Reduced motion support
 * - Keyboard focus prevention when hidden
 * - Screen reader accessibility
 * 
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { TextOverlay } from "../TextOverlay";

// Mock the scroll calculations
vi.mock("@/lib/scrollCalculations", () => ({
  calculateTextOpacity: (progress: number) => Math.max(0, 1 - progress / 0.4),
  calculateTextTranslateY: (progress: number) => progress * -20,
}));

describe("TextOverlay Accessibility", () => {
  describe("ARIA attributes", () => {
    it("should have role='region' for screen reader context", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toBeInTheDocument();
    });

    it("should have aria-label for screen reader identification", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveAttribute("aria-label", "Hero content overlay");
    });

    it("should set aria-hidden='false' when visible (progress=0)", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveAttribute("aria-hidden", "false");
    });

    it("should set aria-hidden='true' when fully hidden (progress >= 0.4)", () => {
      const { container } = render(
        <TextOverlay progress={0.5} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      // When aria-hidden is true, getByRole won't find it
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Reduced motion support", () => {
    it("should keep content visible when reduced motion is enabled", () => {
      render(
        <TextOverlay progress={0.5} isReducedMotion={true}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveStyle({ opacity: "1" });
    });

    it("should not apply translateY when reduced motion is enabled", () => {
      render(
        <TextOverlay progress={0.5} isReducedMotion={true}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveStyle({ transform: "translateY(0px)" });
    });

    it("should never set aria-hidden when reduced motion is enabled", () => {
      render(
        <TextOverlay progress={1} isReducedMotion={true}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveAttribute("aria-hidden", "false");
    });
  });

  describe("Keyboard focus prevention", () => {
    it("should have pointer-events: auto when visible", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <button>Focusable button</button>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveStyle({ pointerEvents: "auto" });
    });

    it("should have pointer-events: none when hidden", () => {
      const { container } = render(
        <TextOverlay progress={0.5} isReducedMotion={false}>
          <button>Focusable button</button>
        </TextOverlay>
      );

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveStyle({ pointerEvents: "none" });
    });

    it("should have inert attribute when hidden", () => {
      const { container } = render(
        <TextOverlay progress={0.5} isReducedMotion={false}>
          <button>Focusable button</button>
        </TextOverlay>
      );

      const overlay = container.firstChild as HTMLElement;
      // Check that inert is set (jsdom may not fully support inert property)
      expect(overlay.getAttribute("inert")).not.toBeNull();
    });

    it("should not have inert attribute when visible", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <button>Focusable button</button>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).not.toHaveAttribute("inert");
    });
  });

  describe("Opacity transitions", () => {
    it("should have full opacity at progress=0", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveStyle({ opacity: "1" });
    });

    it("should have partial opacity at progress=0.2", () => {
      render(
        <TextOverlay progress={0.2} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      // opacity = 1 - (0.2 / 0.4) = 0.5
      expect(overlay).toHaveStyle({ opacity: "0.5" });
    });

    it("should have zero opacity at progress=0.4", () => {
      const { container } = render(
        <TextOverlay progress={0.4} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveStyle({ opacity: "0" });
    });

    it("should have zero opacity at progress > 0.4", () => {
      const { container } = render(
        <TextOverlay progress={0.8} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveStyle({ opacity: "0" });
    });
  });

  describe("Transform behavior", () => {
    it("should have no translateY at progress=0", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveStyle({ transform: "translateY(0px)" });
    });

    it("should have negative translateY as progress increases", () => {
      render(
        <TextOverlay progress={0.5} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByLabelText("Hero content overlay");
      // translateY = 0.5 * -20 = -10
      expect(overlay).toHaveStyle({ transform: "translateY(-10px)" });
    });
  });

  describe("GPU acceleration", () => {
    it("should have will-change property for performance", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveStyle({ willChange: "transform, opacity" });
    });
  });

  describe("Content accessibility", () => {
    it("should render children content", () => {
      render(
        <TextOverlay progress={0} isReducedMotion={false}>
          <h1>SignBridge</h1>
          <p>Real-Time AI Mediation</p>
        </TextOverlay>
      );

      expect(screen.getByText("SignBridge")).toBeInTheDocument();
      expect(screen.getByText("Real-Time AI Mediation")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <TextOverlay
          progress={0}
          isReducedMotion={false}
          className="custom-class flex items-center"
        >
          <p>Test content</p>
        </TextOverlay>
      );

      const overlay = screen.getByRole("region");
      expect(overlay).toHaveClass("custom-class", "flex", "items-center");
    });
  });
});
