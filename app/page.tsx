import { HeroSection } from "@/components/hero-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { ApplicationInterface } from "@/components/application-interface"
import { Footer } from "@/components/footer"

/**
 * HOME PAGE - SignBridge 3D Landing Page
 * 
 * Single-page application structure with four main sections:
 * 
 * 1. HeroSection - Landing with value proposition and CTA (with scroll-controlled video)
 * 2. HowItWorksSection - Educational timeline of AI process (static background)
 * 3. ApplicationInterface - Interactive demo of the communication system (static background)
 * 4. Footer - Trust badges and company info
 * 
 * SECTION ORDER: Hero → How It Works → Application Interface → Footer
 * 
 * VIDEO BACKGROUND SYSTEM:
 * - Video is rendered ONLY in HeroSection
 * - Video mounts immediately on first render (visible without scroll)
 * - Video fades out smoothly when Hero section leaves viewport
 * - How It Works and Application Interface have static dark backgrounds
 * - No video layer overlap with other sections
 * 
 * All sections use scroll-based animations for smooth transitions.
 * The page is fully responsive and optimized for performance.
 */
export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      {/* Hero Section - with scroll-controlled video background */}
      <HeroSection videoSrc="/video/signbridge-hero-scroll.mp4" />
      
      {/* Static background sections - no video */}
      <HowItWorksSection />
      
      {/* Communication Hub - Application Interface */}
      <div id="communication-hub">
        <ApplicationInterface />
      </div>
      
      <Footer />
    </main>
  )
}
