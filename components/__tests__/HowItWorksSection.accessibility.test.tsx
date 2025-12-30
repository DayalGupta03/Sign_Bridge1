/**
 * Accessibility Tests for HowItWorksSection Component
 * 
 * WCAG 2.1 AA Compliance Tests:
 * - Section has proper ARIA labeling
 * - Semantic list structure for timeline stages
 * - Reduced motion support for all animations
 * - Icons have aria-hidden
 * - Screen reader friendly step announcements
 * - Focus indicators visible
 * 
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HowItWorksSection } from "../how-it-works-section";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <section {...props}>{children}</section>
    ),
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    li: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <li {...props}>{children}</li>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
    h3: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h3 {...props}>{children}</h3>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: (_: unknown, __: unknown, output: unknown[]) => output[output.length - 1],
  useInView: () => true,
}));

// Mock useReducedMotion hook
const mockUseReducedMotion = vi.fn(() => false);
vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe("HowItWorksSection Accessibility", () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ARIA attributes", () => {
    it("should have role='region' on the section", () => {
      render(<HowItWorksSection />);
      const section = screen.getByRole("region");
      expect(section).toBeInTheDocument();
    });

    it("should have descriptive aria-label on section", () => {
      render(<HowItWorksSection />);
      const section = screen.getByRole("region");
      expect(section).toHaveAttribute(
        "aria-label",
        "How SignBridge works - Four step process"
      );
    });

    it("should have aria-label on the stages list", () => {
      render(<HowItWorksSection />);
      const list = screen.getByRole("list");
      expect(list).toHaveAttribute("aria-label", "Four stages of AI mediation");
    });

    it("should have aria-label on each stage item", () => {
      render(<HowItWorksSection />);
      const items = screen.getAllByRole("listitem");
      
      expect(items[0]).toHaveAttribute("aria-label", "Step 1: Capture");
      expect(items[1]).toHaveAttribute("aria-label", "Step 2: Understand");
      expect(items[2]).toHaveAttribute("aria-label", "Step 3: Mediate");
      expect(items[3]).toHaveAttribute("aria-label", "Step 4: Communicate");
    });
  });

  describe("Semantic structure", () => {
    it("should use ordered list for timeline stages", () => {
      render(<HowItWorksSection />);
      const list = screen.getByRole("list");
      expect(list.tagName).toBe("OL");
    });

    it("should have exactly 4 list items for the 4 stages", () => {
      render(<HowItWorksSection />);
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });

    it("should have proper heading hierarchy with h2 for section title", () => {
      render(<HowItWorksSection />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Intelligent Communication in Four Steps");
    });

    it("should have h3 headings for each stage", () => {
      render(<HowItWorksSection />);
      const stageHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(stageHeadings).toHaveLength(4);
      expect(stageHeadings[0]).toHaveTextContent("Capture");
      expect(stageHeadings[1]).toHaveTextContent("Understand");
      expect(stageHeadings[2]).toHaveTextContent("Mediate");
      expect(stageHeadings[3]).toHaveTextContent("Communicate");
    });
  });

  describe("Icon accessibility", () => {
    it("should have aria-hidden on all decorative icons", () => {
      render(<HowItWorksSection />);
      const icons = document.querySelectorAll("svg");
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("Screen reader support", () => {
    it("should have sr-only text for step announcements", () => {
      render(<HowItWorksSection />);
      const srOnlyTexts = document.querySelectorAll(".sr-only");
      
      // Should have sr-only step announcements
      const stepAnnouncements = Array.from(srOnlyTexts).filter(
        (el) => el.textContent?.includes("Step") && el.textContent?.includes("of 4")
      );
      expect(stepAnnouncements.length).toBeGreaterThanOrEqual(4);
    });

    it("should have unique IDs for stage titles", () => {
      render(<HowItWorksSection />);
      const ids = ["stage-title-0", "stage-title-1", "stage-title-2", "stage-title-3"];
      
      ids.forEach((id) => {
        const element = document.getElementById(id);
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe("Reduced motion support", () => {
    it("should respect prefers-reduced-motion preference", () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(<HowItWorksSection />);
      
      // Component should render without errors when reduced motion is enabled
      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("should not render scanning animation when reduced motion is enabled", () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(<HowItWorksSection />);
      
      // Scanning animation divs should not be present
      const scanningDivs = document.querySelectorAll('[class*="from-primary/20"], [class*="from-accent/20"]');
      expect(scanningDivs.length).toBe(0);
    });

    it("should not render glow effects when reduced motion is enabled", () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(<HowItWorksSection />);
      
      // Blur glow divs should not be present
      const glowDivs = document.querySelectorAll('[class*="blur-xl"]');
      expect(glowDivs.length).toBe(0);
    });
  });

  describe("Color contrast", () => {
    it("should use text-foreground for main headings (high contrast)", () => {
      render(<HowItWorksSection />);
      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toHaveClass("text-foreground");
    });

    it("should use text-foreground/80 for descriptions (improved contrast)", () => {
      render(<HowItWorksSection />);
      const items = screen.getAllByRole("listitem");
      
      items.forEach((item) => {
        const description = within(item).getByText(/Real-time|AI processes|3D avatar|Seamless/);
        expect(description).toHaveClass("text-foreground/80");
      });
    });
  });

  describe("Content completeness", () => {
    it("should render all stage titles", () => {
      render(<HowItWorksSection />);
      
      expect(screen.getByText("Capture")).toBeInTheDocument();
      expect(screen.getByText("Understand")).toBeInTheDocument();
      expect(screen.getByText("Mediate")).toBeInTheDocument();
      expect(screen.getByText("Communicate")).toBeInTheDocument();
    });

    it("should render all stage descriptions", () => {
      render(<HowItWorksSection />);
      
      expect(screen.getByText(/Real-time video and audio capture/)).toBeInTheDocument();
      expect(screen.getByText(/AI processes sign language/)).toBeInTheDocument();
      expect(screen.getByText(/3D avatar presents information/)).toBeInTheDocument();
      expect(screen.getByText(/Seamless bidirectional communication/)).toBeInTheDocument();
    });

    it("should render section introduction text", () => {
      render(<HowItWorksSection />);
      
      expect(screen.getByText("How It Works")).toBeInTheDocument();
      expect(screen.getByText(/AI-powered system transforms/)).toBeInTheDocument();
    });
  });

  describe("Focus management", () => {
    it("should have focus-visible styles on icon containers", () => {
      render(<HowItWorksSection />);
      const iconContainers = document.querySelectorAll('[class*="focus-visible:outline"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe("Decorative elements", () => {
    it("should mark timeline line as aria-hidden", () => {
      render(<HowItWorksSection />);
      const timelineLine = document.querySelector('[class*="bg-border"][aria-hidden="true"]');
      expect(timelineLine).toBeInTheDocument();
    });

    it("should mark gradient overlays as pointer-events-none", () => {
      render(<HowItWorksSection />);
      const gradients = document.querySelectorAll('[class*="pointer-events-none"]');
      expect(gradients.length).toBeGreaterThan(0);
    });
  });
});
