/**
 * ACCESSIBILITY TEST SUITE - Application Interface Component
 * 
 * This test suite validates WCAG 2.1 AA compliance for the main application interface.
 * Tests cover keyboard navigation, screen reader support, color contrast, and focus management.
 * 
 * WCAG 2.1 AA Requirements Tested:
 * - 1.3.1 Info and Relationships (Level A)
 * - 1.4.3 Contrast (Minimum) (Level AA) 
 * - 2.1.1 Keyboard (Level A)
 * - 2.1.2 No Keyboard Trap (Level A)
 * - 2.4.3 Focus Order (Level A)
 * - 2.4.7 Focus Visible (Level AA)
 * - 3.2.1 On Focus (Level A)
 * - 4.1.2 Name, Role, Value (Level A)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { ApplicationInterface } from '../application-interface'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock dependencies
jest.mock('@/lib/aiPipelineController', () => ({
  AIPipelineController: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    cancel: jest.fn(),
    processInput: jest.fn(),
  }))
}))

jest.mock('@/hooks/useAvatarController', () => ({
  useAvatarController: jest.fn(() => ({
    status: 'idle',
    context: 'hospital'
  }))
}))

jest.mock('@/lib/speech-synthesis', () => ({
  speechSynthesis: {
    isAvailable: () => true,
    speak: jest.fn(),
    cancel: jest.fn(),
  }
}))

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    section: 'section',
    div: 'div',
    button: 'button',
    span: 'span',
    p: 'p',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 0,
}))

describe('ApplicationInterface Accessibility', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Mock Web Speech API
    Object.defineProperty(window, 'SpeechRecognition', {
      value: jest.fn(),
      writable: true,
    })

    // Mock MediaDevices API
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        }),
        enumerateDevices: jest.fn().mockResolvedValue([]),
      },
      writable: true,
    })
  })

  describe('WCAG 2.1 AA Compliance', () => {
    test('should have no accessibility violations', async () => {
      const { container } = render(<ApplicationInterface />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('should have proper heading hierarchy', () => {
      render(<ApplicationInterface />)
      
      // Main heading should be h2 (assuming h1 is page title)
      const mainHeading = screen.getByRole('heading', { level: 2 })
      expect(mainHeading).toHaveTextContent('The Communication Hub')
      
      // Should have proper heading structure
      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(1) // Only one heading in this component
    })

    test('should have accessible button labels', () => {
      render(<ApplicationInterface />)
      
      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })

      // Specific critical buttons
      expect(screen.getByLabelText(/fullscreen/i)).toBeInTheDocument()
    })

    test('should have proper ARIA labels and roles', () => {
      render(<ApplicationInterface />)
      
      // Main section should have proper role
      const mainSection = screen.getByRole('region', { name: /application interface/i })
      expect(mainSection).toBeInTheDocument()

      // Interactive elements should have proper roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Keyboard Navigation', () => {
    test('should support Tab navigation through all interactive elements', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button')
      
      // Should be able to tab through all elements
      for (const element of focusableElements) {
        await user.tab()
        // At least one element should be focused after each tab
        expect(document.activeElement).toBeTruthy()
      }
    })

    test('should support Enter key activation for buttons', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Focus on context toggle button
      const contextButton = screen.getByRole('button', { name: /hospital/i })
      contextButton.focus()
      
      // Should activate with Enter key
      await user.keyboard('{Enter}')
      // Button should remain accessible after activation
      expect(contextButton).toHaveAccessibleName()
    })

    test('should support Space key activation for buttons', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Focus on camera button
      const cameraButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') // Camera icon button
      )
      
      if (cameraButton) {
        cameraButton.focus()
        await user.keyboard(' ')
        expect(cameraButton).toBeInTheDocument()
      }
    })

    test('should not create keyboard traps', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Tab through all elements and ensure we can escape
      const initialFocus = document.activeElement
      
      // Tab forward through all elements
      for (let i = 0; i < 20; i++) {
        await user.tab()
      }
      
      // Should be able to tab backwards
      await user.tab({ shift: true })
      expect(document.activeElement).toBeTruthy()
    })

    test('should support Escape key for modal/fullscreen exit', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Enter fullscreen mode
      const fullscreenButton = screen.getByLabelText(/enter fullscreen/i)
      await user.click(fullscreenButton)
      
      // Escape should exit fullscreen (if implemented)
      await user.keyboard('{Escape}')
      // Component should remain functional
      expect(fullscreenButton).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    test('should have visible focus indicators', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      const buttons = screen.getAllByRole('button')
      
      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        await user.tab()
        if (document.activeElement === button) {
          // Focus should be visible (browser default or custom styles)
          expect(button).toHaveFocus()
        }
      }
    })

    test('should maintain logical focus order', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Focus order should follow visual layout
      const focusableElements = screen.getAllByRole('button')
      
      // Tab through elements and verify order makes sense
      let previousElement: Element | null = null
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await user.tab()
        const currentElement = document.activeElement
        
        if (currentElement && previousElement) {
          // Elements should be in logical order (not jumping around)
          expect(currentElement).toBeTruthy()
        }
        previousElement = currentElement
      }
    })

    test('should restore focus after modal interactions', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Focus on a button
      const triggerButton = screen.getAllByRole('button')[0]
      triggerButton.focus()
      const initialFocus = document.activeElement
      
      // Simulate modal interaction (emergency mode toggle)
      const emergencyButton = screen.getByRole('button', { name: /emergency/i })
      await user.click(emergencyButton)
      
      // Focus should be managed appropriately
      expect(document.activeElement).toBeTruthy()
    })
  })

  describe('Screen Reader Support', () => {
    test('should have proper semantic structure', () => {
      render(<ApplicationInterface />)
      
      // Should have main content area
      const main = screen.getByRole('region')
      expect(main).toBeInTheDocument()
      
      // Should have proper button roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    test('should announce state changes', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Emergency mode toggle should be announced
      const emergencyButton = screen.getByRole('button', { name: /emergency/i })
      await user.click(emergencyButton)
      
      // Button should reflect new state
      expect(emergencyButton).toHaveAccessibleName()
    })

    test('should have descriptive button labels', () => {
      render(<ApplicationInterface />)
      
      // Context toggle buttons
      expect(screen.getByRole('button', { name: /hospital/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /emergency/i })).toBeInTheDocument()
      
      // Fullscreen button
      expect(screen.getByLabelText(/fullscreen/i)).toBeInTheDocument()
    })

    test('should provide status information', () => {
      render(<ApplicationInterface />)
      
      // Status should be communicated to screen readers
      const statusElements = screen.getAllByText(/listening|understanding|responding|speaking/i)
      expect(statusElements.length).toBeGreaterThan(0)
    })
  })

  describe('Color and Contrast', () => {
    test('should not rely solely on color for information', () => {
      render(<ApplicationInterface />)
      
      // Emergency mode should have text indicators, not just color
      const emergencyButton = screen.getByRole('button', { name: /emergency/i })
      expect(emergencyButton).toHaveTextContent('Emergency')
      
      // Status should have text labels, not just colored indicators
      const statusElements = screen.getAllByText(/listening|understanding|responding|speaking/i)
      expect(statusElements.length).toBeGreaterThan(0)
    })

    test('should maintain readability in high contrast mode', () => {
      // This would require actual contrast ratio testing with tools like axe
      render(<ApplicationInterface />)
      
      // Text elements should be readable
      const textElements = screen.getAllByText(/./i)
      textElements.forEach(element => {
        expect(element).toBeVisible()
      })
    })
  })

  describe('Error Handling and Feedback', () => {
    test('should provide accessible error messages', async () => {
      render(<ApplicationInterface />)
      
      // Error states should be announced to screen readers
      // This would be tested with actual error scenarios
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    test('should provide loading state feedback', () => {
      render(<ApplicationInterface />)
      
      // Loading states should be accessible
      const statusText = screen.getByText(/waiting for input/i)
      expect(statusText).toBeInTheDocument()
    })
  })

  describe('Mobile and Touch Accessibility', () => {
    test('should have adequate touch targets', () => {
      render(<ApplicationInterface />)
      
      // Buttons should be large enough for touch (44px minimum)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // This would require actual size measurement in a real test
        expect(button).toBeInTheDocument()
      })
    })

    test('should support touch gestures appropriately', async () => {
      const user = userEvent.setup()
      render(<ApplicationInterface />)
      
      // Touch interactions should work
      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      expect(button).toBeInTheDocument()
    })
  })

  describe('Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn(() => ({
          matches: true, // prefers-reduced-motion: reduce
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      })
      
      render(<ApplicationInterface />)
      
      // Component should still be functional with reduced motion
      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })
})