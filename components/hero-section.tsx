"use client"

import { useRef, useLayoutEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown, Shield } from "lucide-react"
import { useScrollProgress } from "@/hooks/useScrollProgress"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useVideoScrubber } from "@/hooks/useVideoScrubber"
import { TextOverlay } from "@/components/TextOverlay"
import { CinematicOverlay } from "@/components/CinematicOverlay"

/**
 * Props for the HeroSection component.
 */
export interface HeroSectionProps {
  /** Path to the video source file */
  videoSrc: string
}

/**
 * HERO SECTION COMPONENT - Ultra-Smooth Scroll-Controlled Video
 * 
 * Landing section with scroll-controlled cinematic video background using
 * virtual timeline architecture for cinematic-grade smoothness.
 * 
 * VIRTUAL TIMELINE ARCHITECTURE:
 * - virtualVideoTime: Authoritative timeline driven by scroll progress
 * - renderedVideoTime: Actual video.currentTime that eases toward virtualVideoTime
 * - Scroll does NOT directly set video.currentTime (decoupled)
 * 
 * VIDEO RENDERING:
 * - Video element mounts immediately on first render
 * - Metadata preloaded before first paint
 * - virtualVideoTime initialized synchronously in useLayoutEffect
 * - renderedVideoTime set before first paint (no blank frame)
 * - Video container: position fixed, 100vw x 100vh, object-fit cover
 * - Container dimensions NEVER change (not on scroll, resize, or transition)
 * 
 * ZERO-STALL ARCHITECTURE:
 * - virtualVideoTime ALWAYS updated from scroll progress (never frozen)
 * - rAF loop runs for ENTIRE page lifetime (visibility-independent)
 * - renderedVideoTime always eases toward virtualVideoTime
 * - On re-entry: instant sync, no waiting for scroll delta
 * 
 * rAF SMOOTHING:
 * - Every frame: renderedVideoTime lerps toward virtualVideoTime
 * - Base lerp factor: 0.08 (exponential smoothing)
 * - Adaptive: fast scroll → 0.15, slow scroll → 0.06
 * - Max delta guard: 0.04 seconds per frame
 * 
 * VISIBILITY:
 * - Video visible ONLY while Hero is in view
 * - Exit: fade opacity only, keep virtualVideoTime updating, keep element mounted
 * - Re-entry: video visible instantly, motion resumes smoothly from virtualVideoTime
 * 
 * ACCESSIBILITY:
 * - Respects prefers-reduced-motion: shows static first frame, keeps text visible
 * - Semantic HTML elements (section, h1, p, button)
 * - Keyboard scroll triggers video scrubbing
 * 
 * Requirements: 1.1-1.7, 2.1-2.7, 3.1-3.6, 4.1-4.5, 5.1-5.5, 6.1-6.6, 8.5
 */
export function HeroSection({ videoSrc }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Detect user's motion preference
  const isReducedMotion = useReducedMotion()

  // Track scroll progress through hero section
  const { progress, isIntersecting } = useScrollProgress({
    targetRef: sectionRef,
    offset: ["start start", "end start"],
  })

  // Synchronize video playback with scroll progress using virtual timeline
  useVideoScrubber({
    videoRef,
    progress,
    enabled: !isReducedMotion,
    isIntersecting,
  })

  // Initialize video synchronously before first paint
  // This ensures no blank frame on initial render
  useLayoutEffect(() => {
    const video = videoRef.current
    if (video) {
      // Set initial time to 0 synchronously
      video.currentTime = 0
    }
  }, [])

  // Calculate video opacity for smooth fade-out/fade-in transitions
  // Video fades out when Hero section leaves viewport (isIntersecting = false)
  // Fade duration is handled by CSS transition (~200ms)
  // When reduced motion is enabled, video stays at first frame (poster)
  const videoOpacity = isIntersecting ? 1 : 0

  // Scroll to Communication Hub handler
  const scrollToCommunicationHub = () => {
    const element = document.getElementById('communication-hub')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-transparent"
      aria-label="SignBridge hero section"
      role="banner"
      style={{ zIndex: 1 }}
    >
      {/* 
        Cinematic Overlay - Dark overlay and video scale effects
        HERO-SCOPED: Only affects Hero section, no leakage into other sections
        Disabled when reduced motion is preferred
        
        SCOPING (Task 12):
        - Receives heroProgress and isHeroIntersecting for Hero-scoped calculations
        - Post-hero: opacity = 0, scale = 1.0 (hard cutoff)
        - No carryover into How It Works or Application Interface
      */}
      <CinematicOverlay 
        enabled={!isReducedMotion} 
        heroProgress={progress}
        isHeroIntersecting={isIntersecting}
      />

      {/* 
        Video Background Layer - FIXED positioning for immutable dimensions
        Container dimensions NEVER change (not on scroll, resize, or transition)
        No getBoundingClientRect or offsetHeight reads inside scroll loop
        
        CINEMATIC ZOOM:
        - Video scales from center using CSS custom property --cinematic-video-scale
        - Scale driven by CinematicOverlay component via scroll progress
        - Transform-origin: center center for zoom from center
        - HERO-SCOPED: Scale resets to 1.0 after Hero section
        
        REDUCED MOTION:
        - When prefers-reduced-motion is enabled, video stays at first frame (poster)
        - Video scrubbing is disabled via useVideoScrubber enabled=false
        - Static first frame provides visual context without motion
      */}
      <div
        className="fixed top-0 left-0 overflow-hidden pointer-events-none"
        style={{
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          opacity: videoOpacity,
          transition: "opacity 200ms ease-out",
          // GPU acceleration hints - will-change for transform
          willChange: 'opacity, transform',
          // Cinematic zoom scale from CSS custom property
          transform: `scale(var(--cinematic-video-scale, 1))`,
          transformOrigin: 'center center',
        }}
        aria-hidden="true"
      >
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-[1]" />
        
        {/* 
          HERO-SCOPED Dark Cinematic Overlay (Task 12)
          - Mounted INSIDE Hero video wrapper only (not global)
          - Affects ONLY video pixels underneath, never text or UI
          - Z-index: 0.5 (between video at 0 and content at 1+)
          - Pointer-events: none
          - Active range: Hero section ONLY
          - Post-hero: opacity = 0, visibility = hidden (hard cutoff)
          - No carryover into How It Works or Application Interface
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0.5,
            backgroundColor: "black",
            opacity: `var(--cinematic-overlay-opacity, 0)`,
            willChange: "opacity",
          }}
          aria-hidden="true"
          data-testid="cinematic-overlay"
        />
        
        {/* 
          HTML5 Video Element - scroll controlled via virtual timeline
          Video mounts immediately, currentTime set to 0 in useLayoutEffect
          Object-fit: cover ensures video fills container without distortion
          
          REDUCED MOTION BEHAVIOR:
          - poster attribute shows first frame immediately
          - useVideoScrubber disabled, so video stays at frame 0
          - User sees static first frame as background
        */}
        <video
          ref={videoRef}
          className="absolute inset-0 object-cover"
          style={{
            width: '100%',
            height: '100%',
            // GPU acceleration for smooth rendering
            willChange: 'transform',
          }}
          muted
          playsInline
          preload="metadata"
          poster={`${videoSrc}#t=0.001`}
          aria-hidden="true"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Additional dark teal/black gradient aesthetic */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent z-[2]" />
      </div>

      {/* Screen reader description for scroll-controlled video */}
      <span className="sr-only">
        This section features a cinematic video that responds to scrolling. 
        Scroll down to explore the video and learn about SignBridge.
      </span>

      {/* Text Overlay - fades based on scroll progress */}
      <TextOverlay
        progress={progress}
        isReducedMotion={isReducedMotion}
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        {/* Product Name Header */}
        <header className="mb-6 relative">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70 sm:text-6xl md:text-7xl lg:text-8xl">
            SignBridge
          </h1>
          <div 
            className="absolute -bottom-2 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" 
            aria-hidden="true"
          />
        </header>

        {/* Trust Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Trusted by Healthcare Institutions</span>
          </div>
        </div>

        {/* Main Tagline */}
        <p className="max-w-5xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl text-balance">
          Real-Time AI Mediation for{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Deaf &amp; Hearing
          </span>{" "}
          Communication
        </p>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-pretty">
          Bridging communication gaps in hospitals and emergency response systems through intelligent 3D avatar
          mediation. When every second counts, clarity saves lives.
        </p>

        {/* Communication Hub CTA Button */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button
            size="lg"
            className="rounded-full px-8 text-lg font-bold border-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300 hover:scale-105"
            onClick={scrollToCommunicationHub}
            aria-label="Scroll to Communication Hub section"
          >
            Communication Hub
          </Button>
          <p className="text-sm text-muted-foreground/80 font-medium max-w-md">
            Instantly access the real-time AI mediation interface to bridge communication gaps.
          </p>
        </div>

        {/* Trust Badges */}
        <nav aria-label="Trust indicators" className="mt-16">
          <ul className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground" role="list">
            {[
              { label: "HIPAA Compliant", color: "bg-accent" },
              { label: "<200ms Latency", color: "bg-primary" },
              { label: "24/7 Availability", color: "bg-accent" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2"
              >
                <span
                  className={`h-2 w-2 rounded-full ${item.color}`}
                  aria-hidden="true"
                />
                <span className="text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        {/* Scroll indicator - decorative, keyboard users can scroll naturally */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          aria-hidden="true"
          role="presentation"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <ArrowDown className="h-4 w-4" />
          </div>
        </div>
      </TextOverlay>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-20" />
    </section>
  )
}
