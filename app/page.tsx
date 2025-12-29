import { HeroSection } from "@/components/hero-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { ApplicationInterface } from "@/components/application-interface"
import { Footer } from "@/components/footer"

/**
 * HOME PAGE - SignBridge 3D Landing Page
 * 
 * Single-page application structure with four main sections:
 * 
 * 1. HeroSection - Landing with value proposition and CTA
 * 2. HowItWorksSection - Educational timeline of AI process
 * 3. ApplicationInterface - Interactive demo of the communication system
 * 4. Footer - Trust badges and company info
 * 
 * All sections use scroll-based animations for smooth transitions.
 * The page is fully responsive and optimized for performance.
 */
export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <HeroSection />
      <HowItWorksSection />
      <ApplicationInterface />
      <Footer />
    </main>
  )
}
