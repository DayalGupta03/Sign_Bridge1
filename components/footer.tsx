"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 py-16 relative z-10">
        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 grid gap-8 sm:grid-cols-3"
        >
          {[
            {
              icon: Shield,
              title: "HIPAA Compliant",
              desc: "Full compliance with healthcare privacy regulations",
              color: "primary",
            },
            {
              icon: Lock,
              title: "End-to-End Encrypted",
              desc: "Military-grade encryption for all communications",
              color: "accent",
            },
            {
              icon: Clock,
              title: "<200ms Latency",
              desc: "Real-time communication when every second counts",
              color: "primary",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-start gap-4 group cursor-default"
            >
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300",
                  item.color === "primary"
                    ? "bg-primary/10 group-hover:bg-primary/20"
                    : "bg-accent/10 group-hover:bg-accent/20",
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <item.icon
                  className={cn("h-6 w-6 transition-colors", item.color === "primary" ? "text-primary" : "text-accent")}
                />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-bold text-primary-foreground">SB</span>
            </motion.div>
            <span className="font-semibold text-foreground">SignBridge 3D</span>
          </motion.div>

          <Link href="/team">
            <Button variant="link" className="text-muted-foreground hover:text-primary transition-colors">
              Meet the Team
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SignBridge 3D. Bridging communication, saving lives.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}


