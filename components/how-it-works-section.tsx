"use client"

import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { useRef } from "react"
import { Camera, Brain, User, Volume2 } from "lucide-react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

/**
 * HOW IT WORKS SECTION COMPONENT
 * 
 * Educational section explaining the 4-stage AI mediation process.
 * Features animated timeline with scroll-triggered reveals.
 * 
 * ACCESSIBILITY (WCAG 2.1 AA):
 * - Section has aria-label for screen reader context
 * - Timeline uses semantic list structure (ol/li)
 * - Respects prefers-reduced-motion preference
 * - Icons have aria-hidden="true"
 * - Step numbers announced via sr-only text
 * - Color contrast meets 4.5:1 ratio
 * 
 * FOUR STAGES OF AI MEDIATION:
 * 1. Capture - Video/audio input from both participants
 * 2. Understand - AI processes sign language, speech, and medical context
 * 3. Mediate - 3D avatar presents information in appropriate modality
 * 4. Communicate - Bidirectional output with subtitles and voice
 * 
 * ANIMATION FEATURES:
 * - Vertical timeline with animated progress line
 * - Scroll-triggered stage reveals with staggered timing
 * - Alternating left/right layout for visual rhythm
 * - Glowing orb follows progress down the timeline
 * - Icon scanning effects when stages are in view
 * - Data flow visualization showing bidirectional communication
 * 
 * INTEGRATION NOTES:
 * - This section is purely educational/marketing
 * - No direct AI integration points
 * - Animations demonstrate the system's capabilities
 */

const stages = [
  {
    icon: Camera,
    title: "Capture",
    description: "Real-time video and audio capture from both Deaf and Hearing participants",
    color: "primary",
  },
  {
    icon: Brain,
    title: "Understand",
    description: "AI processes sign language, speech, and contextual medical terminology",
    color: "accent",
  },
  {
    icon: User,
    title: "Mediate",
    description: "3D avatar presents information in the appropriate modality for each participant",
    color: "primary",
  },
  {
    icon: Volume2,
    title: "Communicate",
    description: "Seamless bidirectional communication with live subtitles and voice synthesis",
    color: "accent",
  },
]

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const lineProgress = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"])
  const sectionY = useTransform(scrollYProgress, [0, 0.2], isReducedMotion ? [0, 0] : [100, 0])
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.15], isReducedMotion ? [1, 1] : [0, 1])

  return (
    <motion.section
      ref={containerRef}
      style={{ y: sectionY, opacity: sectionOpacity }}
      className="relative bg-transparent py-32 -mt-20"
      aria-label="How SignBridge works - Four step process"
      role="region"
    >
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl px-6 text-center relative z-10"
      >
        <motion.span
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
          transition={{ duration: 0.8 }}
          className="text-sm font-medium uppercase tracking-widest text-primary"
        >
          How It Works
        </motion.span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
          Intelligent Communication in Four Steps
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          Our AI-powered system transforms how Deaf and Hearing individuals communicate in high-stakes medical
          environments.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative mx-auto mt-24 max-w-6xl px-6">
        {/* Decorative timeline line - hidden from screen readers */}
        <div 
          className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border md:block"
          aria-hidden="true"
        >
          <motion.div
            style={{ height: isReducedMotion ? "100%" : lineProgress }}
            className="w-full bg-gradient-to-b from-primary via-accent to-primary relative"
          >
            {/* Glowing orb at the end of progress */}
            {!isReducedMotion && (
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary"
                animate={{
                  boxShadow: [
                    "0 0 10px 2px var(--primary)",
                    "0 0 20px 5px var(--primary)",
                    "0 0 10px 2px var(--primary)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
          </motion.div>
        </div>

        {/* Stages - semantic ordered list for accessibility */}
        <ol 
          className="space-y-24 md:space-y-32 list-none"
          aria-label="Four stages of AI mediation"
        >
          {stages.map((stage, index) => (
            <TimelineStage 
              key={stage.title} 
              stage={stage} 
              index={index} 
              isReducedMotion={isReducedMotion}
            />
          ))}
        </ol>
      </div>



      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </motion.section>
  )
}

interface TimelineStageProps {
  stage: (typeof stages)[0]
  index: number
  isReducedMotion: boolean
}

function TimelineStage({ stage, index, isReducedMotion }: TimelineStageProps) {
  const ref = useRef<HTMLLIElement>(null)
  const isInView = useInView(ref, { once: false, margin: "-20%" })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  })

  // Disable animations when reduced motion is preferred
  const x = useTransform(
    scrollYProgress, 
    [0, 1], 
    isReducedMotion ? [0, 0] : [index % 2 === 0 ? -100 : 100, 0]
  )
  const opacity = useTransform(
    scrollYProgress, 
    [0, 0.5, 1], 
    isReducedMotion ? [1, 1, 1] : [0, 0.5, 1]
  )
  const scale = useTransform(
    scrollYProgress, 
    [0, 1], 
    isReducedMotion ? [1, 1] : [0.8, 1]
  )
  const rotate = useTransform(
    scrollYProgress, 
    [0, 1], 
    isReducedMotion ? [0, 0] : [index % 2 === 0 ? -5 : 5, 0]
  )

  const Icon = stage.icon
  const isEven = index % 2 === 0

  return (
    <motion.li
      ref={ref}
      style={{ opacity }}
      className={`relative flex flex-col items-center gap-8 md:flex-row ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
      aria-label={`Step ${index + 1}: ${stage.title}`}
    >
      {/* Icon container */}
      <motion.div 
        style={isReducedMotion ? {} : { scale, rotate }} 
        className="relative z-10"
      >
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-lg relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          whileHover={isReducedMotion ? {} : { scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {/* Scanning line effect when in view - disabled for reduced motion */}
          {isInView && !isReducedMotion && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-b ${stage.color === "primary" ? "from-primary/20" : "from-accent/20"} to-transparent`}
              initial={{ y: "-100%" }}
              animate={{ y: "200%" }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
              aria-hidden="true"
            />
          )}
          <Icon 
            className={`h-8 w-8 relative z-10 ${stage.color === "primary" ? "text-primary" : "text-accent"}`} 
            aria-hidden="true"
          />
        </motion.div>

        {/* Glow effect - decorative, hidden from screen readers */}
        {!isReducedMotion && (
          <motion.div
            className={`absolute -inset-2 -z-10 rounded-2xl ${stage.color === "primary" ? "bg-primary/30" : "bg-accent/30"} blur-xl`}
            animate={
              isInView
                ? {
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }
                : { opacity: 0.3 }
            }
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            aria-hidden="true"
          />
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        style={isReducedMotion ? {} : { x }}
        className={`flex-1 text-center md:max-w-md ${isEven ? "md:text-left" : "md:text-right"}`}
      >
        {/* Screen reader only: full step announcement */}
        <span className="sr-only">Step {index + 1} of 4:</span>
        
        <motion.span
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          animate={isReducedMotion ? {} : (isInView ? { opacity: 1 } : { opacity: 0.5 })}
          aria-hidden="true"
        >
          Step {index + 1}
        </motion.span>
        <motion.h3
          className="mt-2 text-2xl font-bold text-foreground"
          animate={isReducedMotion ? {} : (isInView ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 10 })}
          transition={{ duration: 0.5 }}
          id={`stage-title-${index}`}
        >
          {stage.title}
        </motion.h3>
        <motion.p
          className="mt-2 text-foreground/80"
          animate={isReducedMotion ? {} : (isInView ? { opacity: 1 } : { opacity: 0.5 })}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stage.description}
        </motion.p>
      </motion.div>
    </motion.li>
  )
}


