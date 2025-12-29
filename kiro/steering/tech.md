# SignBridge 3D - Technology Stack

## Framework & Core Technologies

- **Next.js 16** (App Router) - React framework with SSR/SSG
- **React 19** - UI library with latest concurrent features
- **TypeScript 5** - Type safety and developer experience
- **Tailwind CSS 4** - Utility-first styling with OKLCH color space
- **Framer Motion 12** - GPU-accelerated animations (60fps)

## Package Manager & Build System

- **pnpm** - Fast, disk-efficient package manager (preferred)
- **PostCSS** - CSS processing with Tailwind integration
- **ESLint** - Code quality and consistency

## UI Component System

- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Custom Design System** - OKLCH color tokens, 8px grid spacing

## AI/ML Integration Stack

- **Google Gemini AI** - Context-aware mediation and medical terminology
- **Web Speech API** - Browser speech recognition (Chrome/Edge/Safari)
- **MediaPipe Hands** - Google's hand tracking for sign language
- **Web Speech Synthesis** - Text-to-speech output

## 3D Graphics (Planned)

- **Three.js** - 3D rendering engine
- **React Three Fiber** - React wrapper for Three.js
- **@react-three/drei** - Useful helpers and abstractions

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Optional backend server (logging)
cd server && npm start
```

## Environment Variables

```bash
# Required for AI mediation
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Optional backend integration
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_TRACKING=true

# Optional analytics
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

## Browser Compatibility

- **Chrome/Edge**: Full feature support (recommended)
- **Safari**: Speech recognition supported
- **Firefox**: Limited (no continuous speech recognition)

## Performance Targets

- **Animation**: 60fps with GPU acceleration
- **AI Latency**: <200ms for real-time communication
- **Bundle Size**: <50KB main bundle
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1