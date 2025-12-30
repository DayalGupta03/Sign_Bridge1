# SignBridge 3D - Technical Architecture

## System Overview

SignBridge 3D is a single-page Next.js application that demonstrates an AI-mediated communication interface for Deaf and Hearing users in healthcare settings.

## Component Hierarchy

```
RootLayout (app/layout.tsx)
│
└── Home (app/page.tsx)
    │
    ├── HeroSection
    │   ├── Parallax Background Layers
    │   ├── Animated Gradient Text
    │   ├── Trust Badges
    │   └── Scroll Indicator
    │
    ├── HowItWorksSection
    │   ├── Timeline Container
    │   ├── TimelineStage (x4)
    │   │   ├── Icon with Scanning Effect
    │   │   └── Stage Description
    │   └── DataFlowVisualization
    │       ├── DataFlowNode (x3)
    │       └── DataFlowLine (x2)
    │
    ├── ApplicationInterface
    │   ├── ContextToggle (hospital/emergency)
    │   ├── ModeIndicator (deaf↔hearing)
    │   ├── AvatarPlaceholder
    │   │   ├── Ambient Glow Layers
    │   │   ├── Status-Based Animations
    │   │   └── Avatar Silhouette
    │   ├── SubtitlePanel
    │   │   └── Live Transcription (x3 lines)
    │   ├── Camera/Mic Controls
    │   └── StatusPills (x4 stages)
    │
    └── Footer
        ├── Trust Badges (x3)
        └── Company Info
```

## Data Flow Architecture

### Current State (Demo Mode)

```
┌─────────────────────────────────────────────────────────────┐
│                    ApplicationInterface                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Context    │    │     Mode     │    │    Status    │ │
│  │   State      │    │    State     │    │    State     │ │
│  │              │    │              │    │              │ │
│  │ hospital/    │    │ deaf-to-     │    │ listening/   │ │
│  │ emergency    │    │ hearing      │    │ understanding│ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         └────────────────────┴────────────────────┘         │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │  Avatar Renderer │                     │
│                    │  (Placeholder)   │                     │
│                    └──────────────────┘                     │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │  Subtitle Panel  │                     │
│                    │  (Simulated)     │                     │
│                    └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Production Architecture (To Be Implemented)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              ApplicationInterface Component                   │ │
│  │                                                               │ │
│  │  Camera Input ──┐                          ┌── 3D Avatar     │ │
│  │  Mic Input ─────┼──► State Management ────┼── Subtitles     │ │
│  │  User Controls ─┘                          └── Status UI     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
                               │ WebSocket / API
                               │
┌──────────────────────────────▼─────────────────────────────────────┐
│                        Backend Services                             │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Sign Language  │  │  Speech-to-Text │  │  Text-to-Speech │  │
│  │  Recognition    │  │  (Whisper, etc) │  │  Synthesis      │  │
│  │  (Vision AI)    │  └─────────────────┘  └─────────────────┘  │
│  └─────────────────┘           │                     │            │
│           │                    │                     │            │
│           └────────────────────┼─────────────────────┘            │
│                                │                                   │
│                    ┌───────────▼──────────┐                       │
│                    │   AI Orchestrator    │                       │
│                    │  - Context Detection │                       │
│                    │  - Medical Terms     │                       │
│                    │  - Response Gen      │                       │
│                    └──────────────────────┘                       │
│                                │                                   │
│                    ┌───────────▼──────────┐                       │
│                    │   Avatar Controller  │                       │
│                    │  - Lip Sync          │                       │
│                    │  - Sign Animation    │                       │
│                    │  - Expressions       │                       │
│                    └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

## State Management

### Current Implementation

All state is managed locally within the `ApplicationInterface` component using React hooks:

```typescript
// Context: Environment type (affects UI theme and timing)
const [context, setContext] = useState<"hospital" | "emergency">("hospital")

// Mode: Communication direction
const [mode, setMode] = useState<"deaf-to-hearing" | "hearing-to-deaf">("deaf-to-hearing")

// Status: Current AI processing stage
const [status, setStatus] = useState<SystemStatus>("listening")

// Subtitles: Live transcription buffer (last 3 lines)
const [subtitles, setSubtitles] = useState<string[]>([])

// Hardware: Camera and microphone states
const [cameraActive, setCameraActive] = useState(true)
const [micActive, setMicActive] = useState(true)
```

### Production Recommendations

For production, consider:

1. **Global State Management**: Use Zustand or Jotai for cross-component state
2. **Real-Time Sync**: WebSocket connection for status updates
3. **Optimistic Updates**: Update UI immediately, sync with backend
4. **Error Boundaries**: Graceful degradation if AI services fail
5. **Offline Support**: Queue messages when connection is lost

## Animation Architecture

### Performance Strategy

All animations use GPU-accelerated CSS properties:

- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ❌ Avoid: `width`, `height`, `top`, `left` (causes layout reflow)

### Animation Layers

1. **Background Layer** (lowest z-index)
   - Floating orbs with `animate-float`
   - Rotating gradients with `animate-rotate-slow`
   - Grid patterns with parallax transforms

2. **Content Layer** (middle z-index)
   - Scroll-triggered reveals with `useInView`
   - Parallax text with `useTransform`
   - Staggered animations with delay props

3. **Interactive Layer** (highest z-index)
   - Button hover/tap effects with `whileHover`/`whileTap`
   - Avatar state transitions with `AnimatePresence`
   - Status indicators with keyframe loops

### Scroll Animation System

Uses Framer Motion's `useScroll` and `useTransform`:

```typescript
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"]
})

// Map scroll progress to visual properties
const y = useTransform(scrollYProgress, [0, 1], [0, 300])
const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
```

Benefits:
- Smooth 60fps animations
- No JavaScript calculation on scroll
- Automatic cleanup and optimization

## Styling Architecture

### Tailwind CSS Configuration

- **Version**: Tailwind CSS 4 (latest)
- **PostCSS**: Integrated via `@tailwindcss/postcss`
- **Custom Plugin**: `tw-animate-css` for additional animations

### Design Token System

All colors use OKLCH color space for perceptual uniformity:

```css
--primary: oklch(0.65 0.18 195);
         /* ↑     ↑    ↑
            L     C    H
         Lightness Chroma Hue */
```

Benefits:
- Consistent perceived brightness
- Predictable color mixing
- Better accessibility

### CSS Architecture

```
globals.css
├── @import "tailwindcss"
├── @import "tw-animate-css"
├── CSS Variables (:root)
│   ├── Color tokens
│   ├── Spacing tokens
│   └── Radius tokens
├── @theme inline (Tailwind mapping)
├── @layer base (resets)
└── Custom Keyframes
    ├── Avatar animations
    ├── Background effects
    └── UI micro-interactions
```

## Integration Points Summary

### High Priority (Core Functionality)

1. **Speech Recognition** → `subtitles` state
2. **Sign Language Vision** → `status` state updates
3. **3D Avatar Renderer** → Replace `AvatarPlaceholder`
4. **WebSocket Connection** → Real-time state sync

### Medium Priority (Enhanced Features)

5. **Context Detection** → Auto-set `context` state
6. **Medical Terminology** → Custom vocabulary for AI
7. **User Authentication** → Session management
8. **Recording/Playback** → Save conversations (HIPAA-compliant)

### Low Priority (Polish)

9. **Analytics** → Track usage patterns
10. **A/B Testing** → Optimize UI/UX
11. **Accessibility** → Screen reader support, keyboard nav
12. **Internationalization** → Multi-language support

## File Size & Performance

### Current Build Output

```
Route (app)
┌ ○ /              ~45 KB (estimated)
└ ○ /_not-found    ~12 KB (estimated)
```

### Optimization Opportunities

1. **Code Splitting**: Lazy load `ApplicationInterface` below fold
2. **Image Optimization**: Use Next.js `<Image>` component
3. **Font Subsetting**: Load only required character sets
4. **Tree Shaking**: Remove unused Radix UI components
5. **Bundle Analysis**: Run `pnpm build --analyze` to identify bloat

## Security Considerations

### Current State (Demo)

- No authentication
- No data persistence
- No external API calls
- Client-side only

### Production Requirements

1. **HIPAA Compliance**
   - Encrypt all data in transit (TLS 1.3)
   - Encrypt all data at rest (AES-256)
   - Audit logging for all access
   - Business Associate Agreements (BAAs)

2. **Authentication**
   - Multi-factor authentication (MFA)
   - Role-based access control (RBAC)
   - Session timeout and refresh

3. **Data Privacy**
   - No PII in client-side logs
   - Secure WebSocket connections (WSS)
   - Content Security Policy (CSP) headers

## Testing Strategy

### Recommended Test Coverage

1. **Unit Tests** (Jest + React Testing Library)
   - Component rendering
   - State management logic
   - Utility functions

2. **Integration Tests** (Playwright)
   - User flows (toggle context, mode)
   - Animation triggers
   - Scroll behavior

3. **E2E Tests** (Playwright)
   - Full communication flow
   - Error handling
   - Cross-browser compatibility

4. **Performance Tests** (Lighthouse)
   - Core Web Vitals
   - Animation frame rate
   - Bundle size monitoring

## Deployment

### Recommended Platforms

1. **Vercel** (Optimal for Next.js)
   - Zero-config deployment
   - Edge network CDN
   - Automatic HTTPS
   - Preview deployments

2. **AWS** (Enterprise)
   - ECS/Fargate for containers
   - CloudFront CDN
   - Route 53 DNS
   - WAF for security

3. **Self-Hosted** (Maximum Control)
   - Docker container
   - Nginx reverse proxy
   - PM2 process manager
   - Custom SSL certificates

### Environment Variables

```bash
# Required for production
NEXT_PUBLIC_API_URL=https://api.signbridge3d.com
NEXT_PUBLIC_WS_URL=wss://ws.signbridge3d.com
NEXT_PUBLIC_AVATAR_CDN=https://cdn.signbridge3d.com

# Optional
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...
```

## Monitoring & Observability

### Recommended Tools

1. **Vercel Analytics** (Already integrated)
   - Core Web Vitals
   - Real User Monitoring (RUM)

2. **Sentry** (Error Tracking)
   - Frontend error capture
   - Performance monitoring
   - User session replay

3. **LogRocket** (Session Replay)
   - Visual debugging
   - Network request logs
   - Console logs

4. **Custom Metrics**
   - AI processing latency
   - Avatar render time
   - WebSocket connection health

---

**Last Updated**: December 23, 2025  
**Version**: 1.0.0  
**Status**: Ready for AI Integration

Kiro index: see .kiro/architecture.md and .kiro/project.yaml (created_at: 2025-12-29T12:00:00+05:30)
