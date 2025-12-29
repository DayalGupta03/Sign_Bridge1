# SignBridge 3D - AI-Mediated Communication Interface

This project was developed using an AI-assisted workflow with Kiro for task orchestration and architectural planning. (activity dates: 2025-12-29 — 2025-12-30)

A high-quality Next.js application for real-time AI-mediated communication between Deaf and Hearing users in healthcare and emergency settings.

> **Business Value**: See [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) for revenue streams, market analysis, and commercial viability.

## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Animations**: Framer Motion 12
- **Component Library**: Radix UI primitives
- **Type Safety**: TypeScript 5
- **Package Manager**: pnpm

### Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with fonts and metadata
│   ├── page.tsx            # Home page composition
│   └── globals.css         # Global styles and custom animations
├── components/
│   ├── hero-section.tsx              # Landing section with parallax
│   ├── how-it-works-section.tsx      # Educational timeline
│   ├── application-interface.tsx     # Main interactive demo
│   ├── footer.tsx                    # Trust badges and footer
│   └── ui/                           # Radix UI component library
├── lib/
│   └── utils.ts            # Utility functions (cn helper)
└── public/                 # Static assets and icons
```

## 🎨 UI Architecture

### Design System

The application uses a **dark institutional theme** optimized for medical/emergency environments:

- **Color Palette**: OKLCH color space for perceptual uniformity
  - Primary: `oklch(0.65 0.18 195)` - Cyan blue for trust and clarity
  - Accent: `oklch(0.55 0.15 165)` - Teal for highlights
  - Destructive: `oklch(0.55 0.2 25)` - Red-orange for emergency mode
  - Background: `oklch(0.12 0.01 260)` - Deep blue-black

- **Typography**: 
  - Sans: Inter (body text, UI)
  - Mono: Geist Mono (technical content)

- **Spacing**: Consistent 8px grid system
- **Radius**: 0.75rem base with variants (sm, md, lg, xl)

### Animation System

All animations are GPU-accelerated using Framer Motion:

#### Custom Keyframe Animations (globals.css)

1. **Avatar State Animations**:
   - `breath` - Ambient pulsing for avatar space (4s loop)
   - `listening-wave` - Soft wave scan during audio capture (2s loop)
   - `understanding-focus` - Focusing effect during AI processing (1.5s loop)
   - `responding-expand` - Outward expansion during response generation (1s)
   - `speaking-pulse` - Rhythmic pulse during speech output (0.8s loop)

2. **Background Effects**:
   - `float` / `float-delayed` - Floating orbs with staggered timing (6-8s loops)
   - `rotate-gradient` - Slow conic gradient rotation (20s loop)
   - `scan-line` - Vertical scanning effect (2s loop)

3. **Emergency Mode**:
   - `emergency-pulse` - Rapid pulsing for urgent contexts (0.5s loop)

#### Scroll-Based Animations

- **Parallax**: Multiple layers move at different speeds for depth
- **Fade & Scale**: Content transforms smoothly on scroll
- **Progress Lines**: Animated timeline reveals as user scrolls
- **Staggered Reveals**: Sequential element animations with delays

## 🔌 AI Integration Points

### ApplicationInterface Component

This is the **primary integration point** for AI/vision/speech systems.

#### State Variables (Connect Your AI Here)

```typescript
// Context detection - hospital vs emergency environment
const [context, setContext] = useState<Context>("hospital" | "emergency")
// 🔌 CONNECT: Environment detection AI or manual override

// Communication direction - which user is primary speaker
const [mode, setMode] = useState<Mode>("deaf-to-hearing" | "hearing-to-deaf")
// 🔌 CONNECT: User role detection or toggle control

// AI processing pipeline status
const [status, setStatus] = useState<SystemStatus>(
  "listening" | "understanding" | "responding" | "speaking"
)
// 🔌 CONNECT: Real-time AI pipeline status updates
// - listening: Capturing audio/video input
// - understanding: Processing sign language / speech / context
// - responding: Generating appropriate response
// - speaking: Outputting via avatar / voice / subtitles

// Live transcription display
const [subtitles, setSubtitles] = useState<string[]>([])
// 🔌 CONNECT: Speech-to-text and sign-to-text outputs
// Keep last 3 lines for readability

// Hardware controls
const [cameraActive, setCameraActive] = useState(true)
const [micActive, setMicActive] = useState(true)
// 🔌 CONNECT: Camera and microphone hardware APIs
```

#### Avatar Component

The `AvatarPlaceholder` component is where the **3D avatar will be rendered**:

```typescript
// Current: Animated placeholder silhouette
// TODO: Replace with 3D avatar renderer (Three.js, Unity WebGL, etc.)
// 
// Required integrations:
// - Lip-sync to speech synthesis output
// - Sign language animation playback
// - Facial expressions for emotional context
// - Maintain status-based animation states
```

#### Data Flow

```
User Input (Camera/Mic)
    ↓
[listening] - Capture & buffer input
    ↓
[understanding] - AI processes context, language, medical terms
    ↓
[responding] - Generate appropriate response for target modality
    ↓
[speaking] - Output via avatar, voice synthesis, subtitles
    ↓
Other User Receives Communication
```

## 🎭 Component Breakdown

### 1. HeroSection (`components/hero-section.tsx`)

**Purpose**: Landing section with value proposition

**Features**:
- Parallax scrolling background with multiple layers
- Animated gradient text effects
- Trust badges with pulsing indicators
- Scroll indicator with bounce animation

**No AI integration needed** - purely presentational

---

### 2. HowItWorksSection (`components/how-it-works-section.tsx`)

**Purpose**: Educational timeline explaining the 4-stage process

**Features**:
- Vertical timeline with animated progress line
- 4 stages: Capture → Understand → Mediate → Communicate
- Scroll-triggered reveals with alternating layout
- Data flow visualization with animated particles

**No AI integration needed** - educational content

---

### 3. ApplicationInterface (`components/application-interface.tsx`)

**Purpose**: Interactive demo of the communication system

**Features**:
- Context toggle (hospital / emergency)
- Mode indicator (deaf-to-hearing / hearing-to-deaf)
- Animated 3D avatar placeholder
- Live subtitle panel
- Camera/mic controls
- Status pills showing AI pipeline stage

**PRIMARY AI INTEGRATION POINT** - see section above

---

### 4. Footer (`components/footer.tsx`)

**Purpose**: Trust badges and company information

**Features**:
- HIPAA compliance badge
- End-to-end encryption badge
- <200ms latency badge
- Company branding

**No AI integration needed** - informational

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Development Server

Open [http://localhost:3000](http://localhost:3000) to view the application.

The page auto-updates as you edit files.

## 📝 Development Guidelines

### DO NOT Change

- ✅ UI/UX design and layout
- ✅ Animation timing and easing functions
- ✅ Color scheme and design tokens
- ✅ Component structure and hierarchy
- ✅ Framer Motion animation logic

### DO Change (Integration Points)

- 🔌 Replace simulated state updates with real AI pipeline
- 🔌 Connect camera/mic controls to hardware APIs
- 🔌 Replace avatar placeholder with 3D renderer
- 🔌 Connect subtitle state to speech/sign recognition
- 🔌 Add WebSocket or API connections for real-time data
- 🔌 Implement context detection logic
- 🔌 Add authentication and user management

## 🎯 Next Steps for Production

### Phase 1: Core AI Integration

1. **Speech Recognition**
   - Integrate speech-to-text API (e.g., Whisper, Google Speech)
   - Connect to `subtitles` state
   - Handle medical terminology with custom vocabulary

2. **Sign Language Recognition**
   - Integrate computer vision model for sign detection
   - Connect camera feed to vision pipeline
   - Update `status` state based on processing stages

3. **3D Avatar Rendering**
   - Choose renderer (Three.js, Unity WebGL, Ready Player Me)
   - Replace `AvatarPlaceholder` component
   - Implement lip-sync and signing animations

### Phase 2: Real-Time Communication

4. **WebSocket Connection**
   - Set up real-time bidirectional communication
   - Stream audio/video between participants
   - Sync AI processing status across clients

5. **Context Detection**
   - Implement environment classification (hospital vs emergency)
   - Auto-adjust UI urgency and timing
   - Medical terminology detection for context awareness

### Phase 3: Production Hardening

6. **Security & Compliance**
   - HIPAA-compliant data handling
   - End-to-end encryption for all communications
   - Secure authentication and session management

7. **Performance Optimization**
   - Optimize 3D avatar rendering
   - Reduce AI processing latency to <200ms
   - Implement progressive loading and code splitting

8. **Testing & Monitoring**
   - Unit tests for components
   - Integration tests for AI pipeline
   - Real-time performance monitoring
   - Error tracking and logging

## 📊 Performance Considerations

- All animations use `transform` and `opacity` for GPU acceleration
- Framer Motion's `useTransform` prevents unnecessary re-renders
- Scroll animations use `will-change` hints automatically
- Images and assets should be optimized before deployment
- Consider lazy loading for off-screen components

## 🎨 Customization

### Changing Colors

Edit CSS variables in `app/globals.css`:

```css
:root {
  --primary: oklch(0.65 0.18 195);    /* Main brand color */
  --accent: oklch(0.55 0.15 165);     /* Highlight color */
  --destructive: oklch(0.55 0.2 25);  /* Emergency color */
  /* ... other tokens */
}
```

### Adjusting Animation Speed

Modify duration values in component files:

```typescript
// Slower breathing effect
animate={{ opacity: [0.3, 0.6, 0.3] }}
transition={{ duration: 6 }} // Changed from 4s to 6s
```

### Adding New Status States

Extend the `SystemStatus` type and add corresponding animations:

```typescript
type SystemStatus = "listening" | "understanding" | "responding" | "speaking" | "error"

// Add new animation case in getStateAnimation()
case "error":
  return { scale: [1, 0.95, 1], transition: { duration: 0.3 } }
```

## 📄 License


## 🤝 Support

For questions about the UI architecture or integration points, refer to the inline comments in each component file.

---
