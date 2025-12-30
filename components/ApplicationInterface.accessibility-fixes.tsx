/**
 * ACCESSIBILITY FIXES FOR APPLICATION INTERFACE
 * 
 * This file contains the specific code changes needed to make the ApplicationInterface
 * component WCAG 2.1 AA compliant. Apply these changes to the main component.
 * 
 * Priority: CRITICAL - Healthcare accessibility compliance required
 */

import { useRef, useEffect } from 'react'

// ============================================================================
// 1. CRITICAL FIX: Add ARIA Labels to Interactive Elements
// ============================================================================

// BEFORE: Missing aria-label on fullscreen button
<Button
  variant="ghost"
  size="icon"
  onClick={toggleFullscreen}
  className="text-muted-foreground hover:text-foreground transition-colors"
>
  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
</Button>

// AFTER: With proper aria-label
<Button
  variant="ghost"
  size="icon"
  onClick={toggleFullscreen}
  className="text-muted-foreground hover:text-foreground transition-colors"
  aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
  title={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
>
  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
</Button>

// ============================================================================
// 2. CRITICAL FIX: Context Toggle with Proper State Information
// ============================================================================

function ContextToggle({
  context,
  onChange,
  isTransitioning = false,
}: {
  context: Context
  onChange: () => void
  isTransitioning?: boolean
}) {
  const hospitalButtonRef = useRef<HTMLButtonElement>(null)
  const emergencyButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management for state transitions
  useEffect(() => {
    if (isTransitioning) {
      const activeButton = context === 'hospital' ? hospitalButtonRef.current : emergencyButtonRef.current
      activeButton?.focus()
    }
  }, [isTransitioning, context])

  const handleKeyDown = (event: React.KeyboardEvent, targetContext: Context) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (context !== targetContext) {
        onChange()
      }
    }
    // Escape key exits emergency mode
    if (event.key === 'Escape' && context === 'emergency') {
      onChange()
    }
  }

  return (
    <div 
      className="flex items-center gap-1 rounded-full bg-background p-1 relative"
      role="radiogroup"
      aria-labelledby="context-label"
      aria-describedby="context-description"
    >
      {/* Hidden label for screen readers */}
      <span id="context-label" className="sr-only">
        Communication context selection
      </span>
      <span id="context-description" className="sr-only">
        Choose between hospital routine care or emergency priority mode
      </span>

      <motion.button
        ref={hospitalButtonRef}
        onClick={() => context === "emergency" ? onChange() : undefined}
        onKeyDown={(e) => handleKeyDown(e, 'hospital')}
        className={cn(
          "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors z-10",
          context === "hospital" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        whileHover={{ scale: context === "hospital" ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isTransitioning}
        role="radio"
        aria-checked={context === "hospital"}
        aria-describedby="hospital-description"
        tabIndex={context === "hospital" ? 0 : -1}
      >
        {context === "hospital" && (
          <motion.div
            layoutId="context-bg"
            className="absolute inset-0 rounded-full bg-primary"
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          />
        )}
        <span className="relative z-10">Hospital</span>
        <span id="hospital-description" className="sr-only">
          Routine hospital care mode with calm, measured communication
        </span>
      </motion.button>

      <motion.button
        ref={emergencyButtonRef}
        onClick={() => context === "hospital" ? onChange() : undefined}
        onKeyDown={(e) => handleKeyDown(e, 'emergency')}
        className={cn(
          "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors z-10",
          context === "emergency" ? "text-destructive-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        whileHover={{ scale: context === "emergency" ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isTransitioning}
        role="radio"
        aria-checked={context === "emergency"}
        aria-describedby="emergency-description"
        tabIndex={context === "emergency" ? 0 : -1}
      >
        {context === "emergency" && (
          <motion.div
            layoutId="context-bg"
            className="absolute inset-0 rounded-full bg-destructive"
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 var(--destructive)",
                  "0 0 15px 3px var(--destructive)",
                  "0 0 0 0 var(--destructive)",
                ],
              }}
              transition={{ type: "tween", duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        )}
        <span className="relative z-10">
          {isTransitioning ? "Switching..." : "Emergency"}
        </span>
        <span id="emergency-description" className="sr-only">
          Emergency priority mode with urgent, fast communication
        </span>
      </motion.button>
    </div>
  )
}

// ============================================================================
// 3. CRITICAL FIX: Camera/Microphone Controls with State Information
// ============================================================================

// BEFORE: Missing state information
<Button
  variant={cameraActive ? "default" : "secondary"}
  size="icon"
  onClick={() => setCameraActive(!cameraActive)}
  className="relative overflow-hidden"
>
  <Camera className="h-5 w-5 relative z-10" />
</Button>

// AFTER: With proper state and accessibility
<Button
  variant={cameraActive ? "default" : "secondary"}
  size="icon"
  onClick={() => setCameraActive(!cameraActive)}
  className="relative overflow-hidden"
  aria-label={cameraActive ? "Turn off camera" : "Turn on camera"}
  aria-pressed={cameraActive}
  aria-describedby="camera-status"
  title={cameraActive ? "Camera is active - click to turn off" : "Camera is off - click to turn on"}
>
  <motion.span
    className="absolute inset-0 bg-primary-foreground/10"
    initial={{ scale: 0, opacity: 0 }}
    whileTap={{ scale: 2, opacity: [0, 0.3, 0] }}
    transition={{ duration: 0.4 }}
  />
  <Camera className="h-5 w-5 relative z-10" />
  <span id="camera-status" className="sr-only">
    Camera is {cameraActive ? "active and recording" : "inactive"}
  </span>
</Button>

// Similar fix for microphone button
<Button
  variant={micActive ? "default" : "secondary"}
  size="icon"
  onClick={() => setMicActive(!micActive)}
  className="relative overflow-hidden"
  aria-label={micActive ? "Turn off microphone" : "Turn on microphone"}
  aria-pressed={micActive}
  aria-describedby="mic-status"
  title={micActive ? "Microphone is active - click to mute" : "Microphone is muted - click to unmute"}
>
  <motion.span
    className="absolute inset-0 bg-primary-foreground/10"
    initial={{ scale: 0, opacity: 0 }}
    whileTap={{ scale: 2, opacity: [0, 0.3, 0] }}
    transition={{ duration: 0.4 }}
  />
  <Mic className="h-5 w-5 relative z-10" />
  <span id="mic-status" className="sr-only">
    Microphone is {micActive ? "active and listening" : "muted"}
  </span>
</Button>

// ============================================================================
// 4. CRITICAL FIX: Live Subtitles with ARIA Live Region
// ============================================================================

function SubtitlePanel({
  subtitles,
  context,
  status,
}: { subtitles: string[]; context: Context; status: SystemStatus }) {
  const subtitleRef = useRef<HTMLDivElement>(null)

  // Announce new subtitles to screen readers
  useEffect(() => {
    if (subtitles.length > 0 && subtitleRef.current) {
      const latestSubtitle = subtitles[subtitles.length - 1]
      // Create a temporary announcement element
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = `New message: ${latestSubtitle}`
      document.body.appendChild(announcement)
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }
  }, [subtitles])

  return (
    <div
      className={cn(
        "border-t px-6 py-4 transition-colors duration-500",
        context === "hospital" ? "border-border bg-background/50" : "border-destructive/30 bg-destructive/5",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          aria-hidden="true"
        >
          <Activity className="h-3 w-3" />
        </motion.div>
        <span className="uppercase tracking-wider">Live Subtitles</span>
        {status === "speaking" && (
          <motion.div className="flex gap-1 ml-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn("h-1.5 w-1.5 rounded-full", context === "hospital" ? "bg-primary" : "bg-destructive")}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Main subtitle container with proper ARIA live region */}
      <div 
        ref={subtitleRef}
        className="mt-3 min-h-[4.5rem] space-y-2"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Live conversation subtitles"
        aria-describedby="subtitle-description"
      >
        <span id="subtitle-description" className="sr-only">
          Real-time conversation transcription and translation between participants
        </span>
        
        <AnimatePresence mode="popLayout">
          {subtitles.map((subtitle, index) => (
            <motion.p
              key={`${subtitle}-${index}`}
              initial={{ opacity: 0, y: 15, x: -10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: 10 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "text-sm transition-colors duration-300",
                index === subtitles.length - 1
                  ? "text-foreground"
                  : index === subtitles.length - 2
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60",
              )}
              lang="en"
              aria-live={index === subtitles.length - 1 ? "polite" : "off"}
              aria-label={index === subtitles.length - 1 ? `Latest message: ${subtitle}` : undefined}
            >
              {index === subtitles.length - 1 && status === "speaking" && (
                <motion.span
                  className={cn(
                    "inline-block w-0.5 h-4 ml-1 align-middle",
                    context === "hospital" ? "bg-primary" : "bg-destructive",
                  )}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                  aria-hidden="true"
                />
              )}
              {subtitle}
            </motion.p>
          ))}
        </AnimatePresence>
        
        {subtitles.length === 0 && (
          <motion.p
            className="text-sm text-muted-foreground italic"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            role="status"
            aria-live="polite"
          >
            Waiting for input...
          </motion.p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 5. CRITICAL FIX: Emergency Mode Banner with Alert Role
// ============================================================================

// BEFORE: Missing alert role
<div className="bg-destructive text-destructive-foreground px-6 py-3 text-center emergency-siren">
  <div className="flex items-center justify-center gap-2">
    <span className="font-bold text-lg emergency-text-scale emergency-active">
      EMERGENCY MODE ACTIVE
    </span>
  </div>
  <p className="text-sm mt-1 opacity-90">
    Priority communication mode - Enhanced speed and reliability
  </p>
</div>

// AFTER: With proper alert role and accessibility
<div 
  className="bg-destructive text-destructive-foreground px-6 py-3 text-center emergency-siren"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  aria-describedby="emergency-description"
>
  <div className="flex items-center justify-center gap-2">
    <motion.div
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
      aria-hidden="true"
    >
      🚨
    </motion.div>
    <span className="font-bold text-lg emergency-text-scale emergency-active">
      EMERGENCY MODE ACTIVE
    </span>
    <motion.div
      animate={{ rotate: [0, -10, 10, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
      aria-hidden="true"
    >
      🚨
    </motion.div>
  </div>
  <p id="emergency-description" className="text-sm mt-1 opacity-90">
    Priority communication mode - Enhanced speed and reliability
  </p>
</div>

// ============================================================================
// 6. MODERATE FIX: Status Pills with Semantic Information
// ============================================================================

function StatusPills({ status, context }: { status: SystemStatus; context: Context }) {
  const statuses = [
    { id: "listening", label: "Listening", icon: Waves },
    { id: "understanding", label: "Understanding", icon: BrainCircuit },
    { id: "responding", label: "Responding", icon: Sparkles },
    { id: "speaking", label: "Speaking", icon: Volume2 },
  ]

  return (
    <div 
      className="flex items-center gap-2"
      role="status"
      aria-label="System processing status"
      aria-describedby="status-description"
    >
      <span id="status-description" className="sr-only">
        Current system status: {status}. Processing stages: listening, understanding, responding, speaking.
      </span>
      
      {statuses.map((s) => {
        const isActive = status === s.id
        const Icon = s.icon
        return (
          <motion.div
            key={s.id}
            animate={{
              scale: isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 relative overflow-hidden",
              isActive
                ? context === "hospital"
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
                : "bg-secondary text-muted-foreground",
            )}
            role="status"
            aria-current={isActive ? "step" : undefined}
            aria-label={`${s.label} stage ${isActive ? 'active' : 'inactive'}`}
          >
            {isActive && (
              <motion.span
                className="absolute inset-0 bg-current opacity-20"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                aria-hidden="true"
              />
            )}
            <span className="flex items-center gap-1.5 relative z-10">
              {isActive && (
                <motion.span 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="relative"
                  aria-hidden="true"
                >
                  <Icon className="h-3 w-3" />
                </motion.span>
              )}
              {s.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

// ============================================================================
// 7. MODERATE FIX: Add Skip Links
// ============================================================================

// Add at the beginning of the component return statement
<>
  {/* Skip links for keyboard navigation */}
  <div className="sr-only focus-within:not-sr-only">
    <a 
      href="#main-interface" 
      className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-foreground"
    >
      Skip to main interface
    </a>
    <a 
      href="#subtitle-panel" 
      className="absolute top-4 left-32 z-50 bg-primary text-primary-foreground px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-foreground"
    >
      Skip to subtitles
    </a>
    <a 
      href="#controls" 
      className="absolute top-4 left-60 z-50 bg-primary text-primary-foreground px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-foreground"
    >
      Skip to controls
    </a>
  </div>

  {/* Main component content with proper landmarks */}
  <motion.section
    ref={sectionRef}
    style={{ y: sectionY, opacity: sectionOpacity }}
    className="relative bg-background py-32 -mt-16"
    role="main"
    aria-labelledby="interface-heading"
  >
    {/* Rest of component... */}
  </motion.section>
</>

// ============================================================================
// 8. MODERATE FIX: Enhanced Keyboard Navigation
// ============================================================================

// Add to main component
const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
  // Global keyboard shortcuts
  switch (event.key) {
    case 'Escape':
      // Exit emergency mode or fullscreen
      if (context === 'emergency') {
        dispatchEmergency({ type: 'TOGGLE_EMERGENCY' })
      } else if (isFullscreen) {
        toggleFullscreen()
      }
      break
    
    case 'F11':
      // Toggle fullscreen
      event.preventDefault()
      toggleFullscreen()
      break
    
    case ' ':
      // Space bar toggles camera/mic based on current mode
      if (event.target === document.body) {
        event.preventDefault()
        if (mode === 'deaf-to-hearing') {
          setCameraActive(!cameraActive)
        } else {
          setMicActive(!micActive)
        }
      }
      break
    
    case 'e':
      // 'E' key toggles emergency mode
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        dispatchEmergency({ type: 'TOGGLE_EMERGENCY' })
      }
      break
    
    case 'm':
      // 'M' key toggles mode
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        setMode(mode === "deaf-to-hearing" ? "hearing-to-deaf" : "deaf-to-hearing")
      }
      break
  }
}, [context, isFullscreen, mode, cameraActive, micActive, dispatchEmergency])

// Add event listener
useEffect(() => {
  document.addEventListener('keydown', handleGlobalKeyDown)
  return () => document.removeEventListener('keydown', handleGlobalKeyDown)
}, [handleGlobalKeyDown])

// ============================================================================
// 9. MINOR FIX: Add Reduced Motion Support
// ============================================================================

// Add to component
const prefersReducedMotion = useReducedMotion()

// Use in animations
<motion.div
  animate={prefersReducedMotion ? {} : {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity }
  }}
>
  {/* Content */}
</motion.div>

// ============================================================================
// 10. MINOR FIX: High Contrast Mode Support
// ============================================================================

// Add CSS custom properties for high contrast
const highContrastStyles = {
  '--high-contrast-bg': 'Canvas',
  '--high-contrast-text': 'CanvasText',
  '--high-contrast-border': 'ButtonBorder',
} as React.CSSProperties

// Apply to main container
<motion.div
  style={highContrastStyles}
  className="high-contrast:bg-[Canvas] high-contrast:text-[CanvasText] high-contrast:border-[ButtonBorder]"
>
  {/* Content */}
</motion.div>