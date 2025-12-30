"use client"

import React, { useRef, createContext, useContext, RefObject } from "react"
import { useScrollProgress } from "@/hooks/useScrollProgress"
import { useVideoScrubber } from "@/hooks/useVideoScrubber"
import { useReducedMotion } from "@/hooks/useReducedMotion"

/**
 * Context for sharing video background state with child components.
 */
interface VideoBackgroundContextValue {
  /** Current scroll progress (0-1) across the video-enabled sections */
  progress: number
  /** Whether the video section is currently intersecting the viewport */
  isIntersecting: boolean
  /** Whether reduced motion is enabled */
  isReducedMotion: boolean
  /** Reference to the wrapper element for scroll calculations */
  wrapperRef: RefObject<HTMLDivElement | null>
  /** Opacity for video fade-out transition */
  videoOpacity: number
}

const VideoBackgroundContext = createContext<VideoBackgroundContextValue | null>(null)

/**
 * Hook to access video background context from child components.
 */
export function useVideoBackground() {
  const context = useContext(VideoBackgroundContext)
  if (!context) {
    throw new Error("useVideoBackground must be used within a VideoBackgroundProvider")
  }
  return context
}

export interface VideoBackgroundProviderProps {
  /** Path to the video source file */
  videoSrc: string
  /** Children components to render above the video */
  children: React.ReactNode
  /** Optional className for the wrapper */
  className?: string
}

/**
 * VideoBackgroundProvider Component
 * 
 * Renders a single fixed-position video element at z-index 0 that covers
 * the full viewport. Children are rendered in a content layer above the video.
 * 
 * The video scrubs based on scroll progress through the wrapped sections
 * (Hero + Application Interface). When the user scrolls past the cutoff
 * marker, the video freezes at its last frame and fades out.
 * 
 * Features:
 * - Fixed-position video covering 100vw x 100vh
 * - Scroll-controlled video scrubbing
 * - Smooth fade-out transition at section boundary
 * - Reduced motion support (shows static first frame)
 * - Context provider for child components to access scroll state
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function VideoBackgroundProvider({
  videoSrc,
  children,
  className = "",
}: VideoBackgroundProviderProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Detect user's motion preference
  const isReducedMotion = useReducedMotion()

  // Track scroll progress through the video-enabled sections
  const { progress, isIntersecting } = useScrollProgress({
    targetRef: wrapperRef,
    offset: ["start start", "end start"],
  })

  // Synchronize video playback with scroll progress
  useVideoScrubber({
    videoRef,
    progress,
    enabled: !isReducedMotion,
    isIntersecting,
  })

  // Calculate video opacity for fade-out transition
  // Video starts fading at progress 0.85 and is fully hidden at progress 1.0
  const fadeStartProgress = 0.85
  const videoOpacity = isIntersecting 
    ? Math.max(0, 1 - Math.max(0, (progress - fadeStartProgress) / (1 - fadeStartProgress)))
    : 0

  const contextValue: VideoBackgroundContextValue = {
    progress,
    isIntersecting,
    isReducedMotion,
    wrapperRef,
    videoOpacity,
  }

  return (
    <VideoBackgroundContext.Provider value={contextValue}>
      {/* Fixed Video Background Layer - z-index 0 */}
      <div
        className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none"
        style={{
          zIndex: 0,
          opacity: videoOpacity,
          transition: "opacity 0.3s ease-out",
        }}
        aria-hidden="true"
      >
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-[1]" />
        
        {/* HTML5 Video Element - scroll controlled */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          poster={`${videoSrc}#t=0.001`}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Additional dark teal/black gradient aesthetic */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent z-[2]" />
      </div>

      {/* Content Layer - scrolls normally above fixed video */}
      <div
        ref={wrapperRef}
        className={`relative ${className}`}
        style={{ zIndex: 1 }}
      >
        {children}
      </div>
    </VideoBackgroundContext.Provider>
  )
}

export default VideoBackgroundProvider
