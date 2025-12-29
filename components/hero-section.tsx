"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown, Shield, Zap } from "lucide-react"

/**
 * HERO SECTION COMPONENT
 * 
 * Landing section with animated background and scroll-based parallax effects.
 * Establishes brand identity and value proposition for SignBridge 3D.
 * 
 * ANIMATION SYSTEM:
 * - Parallax scrolling: Multiple layers move at different speeds for depth
 * - Breathing gradient: Ambient pulsing effect in the background
 * - Floating orbs: Decorative elements with staggered animations
 * - Rotating gradient: Slow conic gradient rotation for visual interest
 * - Fade on scroll: Content fades and scales as user scrolls down
 * 
 * SCROLL TRANSFORMS:
 * - y1, y2, y3: Different parallax speeds for layered depth
 * - opacity: Fades content as user scrolls
 * - scale: Subtle zoom effect on scroll
 * - blur: Progressive blur for smooth transition to next section
 * 
 * All animations are performance-optimized using Framer Motion's
 * useTransform for GPU-accelerated transforms.
 */

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)

  // Track scroll progress through this section for parallax effects
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  // Parallax transforms - different speeds create depth perception
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 150])   // Slow layer
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 300])   // Fast layer
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 200])   // Medium layer
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const blur = useTransform(scrollYProgress, [0, 0.8], [0, 10])

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        {/* Radial gradient core - breathing */}
        <motion.div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent animate-breath" />

        {/* Grid pattern with depth */}
        <motion.div style={{ y: y1 }} className="absolute inset-0 opacity-[0.04]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </motion.div>

        <motion.div
          style={{ y: y2 }}
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl animate-float"
        />
        <motion.div
          style={{ y: y3 }}
          className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-accent/12 blur-3xl animate-float-delayed"
        />
        <motion.div
          style={{ y: y1, animationDelay: "2s" }}
          className="absolute left-1/3 bottom-1/4 h-64 w-64 rounded-full bg-primary/8 blur-2xl animate-float"
        />
        <motion.div
          style={{ animationDelay: "4s" }}
          className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full bg-accent/10 blur-2xl animate-float-delayed"
        />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] animate-rotate-slow opacity-20">
            <div
              className="h-full w-full rounded-full bg-gradient-conic from-primary via-transparent to-accent"
              style={{ maskImage: "radial-gradient(transparent 40%, black 70%)" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity, scale, filter: blur.get() > 0 ? `blur(${blur.get()}px)` : undefined }}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        {/* Product Name Header */}
        <motion.div
          initial={{ opacity: 0, y: -20, letterSpacing: "0em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.05em" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 relative"
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70 sm:text-6xl md:text-7xl lg:text-8xl">
            SignBridge
          </h1>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
            className="absolute -bottom-2 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(var(--primary), 0.3)" }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm transition-all duration-300"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span>Trusted by Healthcare Institutions</span>
          </motion.div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl text-balance"
        >
          Real-Time AI Mediation for{" "}
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Deaf & Hearing
            </span>
            <motion.span
              className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </span>{" "}
          Communication
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-pretty"
        >
          Bridging communication gaps in hospitals and emergency response systems through intelligent 3D avatar
          mediation. When every second counts, clarity saves lives.
        </motion.p>



        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground"
        >
          {[
            { label: "HIPAA Compliant", color: "bg-accent" },
            { label: "<200ms Latency", color: "bg-primary" },
            { label: "24/7 Availability", color: "bg-accent" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className={`h-2 w-2 rounded-full ${item.color}`}
                animate={{
                  boxShadow: ["0 0 0 0 currentColor", "0 0 8px 2px currentColor", "0 0 0 0 currentColor"],
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.5 }}
              />
              <span className="text-sm">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <ArrowDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}