/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoBackgroundProvider, useVideoBackground } from '../VideoBackgroundProvider'

// Mock the hooks
vi.mock('@/hooks/useScrollProgress', () => ({
  useScrollProgress: vi.fn(() => ({
    progress: 0,
    scrollY: 0,
    isIntersecting: true,
  })),
}))

vi.mock('@/hooks/useVideoScrubber', () => ({
  useVideoScrubber: vi.fn(),
}))

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}))

import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useVideoScrubber } from '@/hooks/useVideoScrubber'
import { useReducedMotion } from '@/hooks/useReducedMotion'

describe('VideoBackgroundProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Video Element Configuration', () => {
    it('should render a video element with correct attributes', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const video = document.querySelector('video')
      expect(video).toBeTruthy()
      expect(video?.muted).toBe(true)
      expect(video?.getAttribute('playsinline')).toBe('')
      expect(video?.getAttribute('preload')).toBe('metadata')
    })

    it('should render video source with correct src', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const source = document.querySelector('source')
      expect(source?.getAttribute('src')).toBe('/video/test.mp4')
      expect(source?.getAttribute('type')).toBe('video/mp4')
    })

    it('should set video poster for immediate visual', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const video = document.querySelector('video')
      expect(video?.getAttribute('poster')).toBe('/video/test.mp4#t=0.001')
    })
  })

  describe('Z-Index Layering', () => {
    it('should render video background at z-index 0', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      expect(videoContainer).toBeTruthy()
      expect(videoContainer?.getAttribute('style')).toContain('z-index: 0')
    })

    it('should render content layer at z-index 1', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div data-testid="content">Content</div>
        </VideoBackgroundProvider>
      )

      const content = screen.getByTestId('content')
      const contentWrapper = content.parentElement
      expect(contentWrapper?.getAttribute('style')).toContain('z-index: 1')
    })

    it('should render children above video background', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div data-testid="child-content">Child Content</div>
        </VideoBackgroundProvider>
      )

      expect(screen.getByTestId('child-content')).toBeTruthy()
      expect(screen.getByText('Child Content')).toBeTruthy()
    })
  })

  describe('Video Visibility and Opacity', () => {
    it('should show video at full opacity when intersecting at progress 0', () => {
      vi.mocked(useScrollProgress).mockReturnValue({
        progress: 0,
        scrollY: 0,
        isIntersecting: true,
      })

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      expect(videoContainer?.getAttribute('style')).toContain('opacity: 1')
    })

    it('should fade video as progress approaches 1', () => {
      vi.mocked(useScrollProgress).mockReturnValue({
        progress: 0.9,
        scrollY: 900,
        isIntersecting: true,
      })

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      const style = videoContainer?.getAttribute('style') || ''
      // At progress 0.9, opacity should be partially faded
      // fadeStartProgress = 0.85, so (0.9 - 0.85) / (1 - 0.85) = 0.333
      // opacity = 1 - 0.333 = 0.667
      expect(style).toMatch(/opacity: 0\.\d+/)
    })

    it('should hide video when not intersecting', () => {
      vi.mocked(useScrollProgress).mockReturnValue({
        progress: 0.5,
        scrollY: 500,
        isIntersecting: false,
      })

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      expect(videoContainer?.getAttribute('style')).toContain('opacity: 0')
    })
  })

  describe('Reduced Motion Support', () => {
    it('should pass reduced motion state to useVideoScrubber', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true)

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      expect(useVideoScrubber).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false, // !isReducedMotion
        })
      )
    })

    it('should enable video scrubbing when reduced motion is off', () => {
      vi.mocked(useReducedMotion).mockReturnValue(false)

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      expect(useVideoScrubber).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      )
    })
  })

  describe('Scroll Progress Integration', () => {
    it('should pass progress to useVideoScrubber', () => {
      vi.mocked(useScrollProgress).mockReturnValue({
        progress: 0.5,
        scrollY: 500,
        isIntersecting: true,
      })

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      expect(useVideoScrubber).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 0.5,
        })
      )
    })

    it('should pass isIntersecting to useVideoScrubber', () => {
      vi.mocked(useScrollProgress).mockReturnValue({
        progress: 0.5,
        scrollY: 500,
        isIntersecting: false,
      })

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      expect(useVideoScrubber).toHaveBeenCalledWith(
        expect.objectContaining({
          isIntersecting: false,
        })
      )
    })
  })

  describe('Context Provider', () => {
    function TestConsumer() {
      const context = useVideoBackground()
      return (
        <div>
          <span data-testid="progress">{context.progress}</span>
          <span data-testid="isIntersecting">{String(context.isIntersecting)}</span>
          <span data-testid="isReducedMotion">{String(context.isReducedMotion)}</span>
          <span data-testid="videoOpacity">{context.videoOpacity}</span>
        </div>
      )
    }

    it('should provide context values to children', () => {
      vi.mocked(useScrollProgress).mockReturnValue({
        progress: 0.3,
        scrollY: 300,
        isIntersecting: true,
      })
      vi.mocked(useReducedMotion).mockReturnValue(false)

      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <TestConsumer />
        </VideoBackgroundProvider>
      )

      expect(screen.getByTestId('progress').textContent).toBe('0.3')
      expect(screen.getByTestId('isIntersecting').textContent).toBe('true')
      expect(screen.getByTestId('isReducedMotion').textContent).toBe('false')
    })

    it('should throw error when useVideoBackground is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useVideoBackground must be used within a VideoBackgroundProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Fixed Position Video', () => {
    it('should render video container with fixed position', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      expect(videoContainer).toBeTruthy()
      expect(videoContainer?.classList.contains('inset-0')).toBe(true)
      expect(videoContainer?.classList.contains('w-screen')).toBe(true)
      expect(videoContainer?.classList.contains('h-screen')).toBe(true)
    })

    it('should have pointer-events-none on video container', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      expect(videoContainer?.classList.contains('pointer-events-none')).toBe(true)
    })

    it('should have aria-hidden on video container', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const videoContainer = document.querySelector('.fixed')
      expect(videoContainer?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('Gradient Overlays', () => {
    it('should render dark gradient overlay for text readability', () => {
      render(
        <VideoBackgroundProvider videoSrc="/video/test.mp4">
          <div>Content</div>
        </VideoBackgroundProvider>
      )

      const gradientOverlay = document.querySelector('.bg-gradient-to-b')
      expect(gradientOverlay).toBeTruthy()
    })
  })
})
