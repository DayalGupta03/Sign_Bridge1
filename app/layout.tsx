import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

/**
 * ROOT LAYOUT - Next.js App Router Layout
 * 
 * Provides global configuration and styling for the entire application.
 * 
 * FONTS:
 * - Inter: Primary sans-serif font for body text
 * - Geist Mono: Monospace font for code/technical content
 * 
 * METADATA:
 * - SEO-optimized title and description
 * - Adaptive icons for light/dark mode

 * 
 * ANALYTICS:
 * - Vercel Analytics integrated for performance monitoring
 */

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SignBridge 3D | AI-Mediated Communication for Deaf & Hearing",
  description: "Real-time AI mediation for Deaf and Hearing communication in hospitals and emergency response systems.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
