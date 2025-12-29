# SignBridge 3D - Project Structure

## Directory Organization

```
SignBridge/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts/metadata
│   ├── page.tsx           # Landing page composition
│   └── globals.css        # Global styles + custom animations
├── components/            # React components
│   ├── application-interface.tsx  # 🔥 MAIN COMPONENT (2080 lines)
│   ├── hero-section.tsx          # Landing section
│   ├── how-it-works-section.tsx  # Educational timeline
│   ├── footer.tsx               # Trust badges
│   ├── AvatarRenderer.tsx       # 3D avatar (placeholder)
│   ├── VideoAvatarRenderer.tsx  # Video avatar fallback
│   └── ui/                      # Radix UI components (50+ files)
├── lib/                   # Utility libraries
│   ├── aiPipelineController.ts  # AI orchestration
│   ├── mediator.ts             # Gemini AI integration
│   ├── speech-synthesis.ts     # TTS wrapper
│   ├── analytics.ts            # Event tracking
│   ├── aslSignLibrary.ts       # ASL gesture definitions
│   ├── islCore.ts              # ISL gesture core
│   └── utils.ts                # Helper functions
├── hooks/                 # Custom React hooks
│   ├── useAvatarController.ts  # Avatar animation control
│   ├── use-mobile.ts          # Mobile detection
│   └── use-toast.ts           # Toast notifications
├── public/               # Static assets
│   ├── models/           # 3D avatar models
│   └── videos/           # Sign language video clips
└── server/               # Optional Node.js backend
    ├── index.js          # Simple logging server
    └── package.json      # Backend dependencies
```

## Key File Responsibilities

### Core Application
- **`components/application-interface.tsx`** - Main interactive component with AI pipeline integration points
- **`lib/mediator.ts`** - AI-powered communication mediation using Gemini
- **`lib/aiPipelineController.ts`** - Orchestrates the 4-stage AI pipeline

### UI System
- **`components/ui/`** - Reusable Radix UI components with consistent styling
- **`app/globals.css`** - Custom keyframe animations and design tokens
- **`lib/utils.ts`** - `cn()` utility for conditional class merging

### AI Integration
- **`lib/speech-synthesis.ts`** - Text-to-speech with context-aware parameters
- **`lib/aslSignLibrary.ts`** - ASL gesture recognition and intent mapping
- **`hooks/useAvatarController.ts`** - Avatar animation state management

## Code Organization Patterns

### Component Structure
```typescript
// Standard component pattern
"use client"                    // Client component directive
import statements               // External dependencies first
import local components         // Local imports second
import types                   // Type definitions

type LocalTypes = "..."        // Component-specific types
const CONSTANTS = "..."        // Component constants

export default function Component() {
  // State declarations
  // Effect hooks
  // Event handlers
  // Render logic
}
```

### State Management
- **Local State**: `useState` for component-specific state
- **Shared State**: Props drilling (no global state management yet)
- **Future**: Consider Zustand for complex state needs

### File Naming Conventions
- **Components**: `kebab-case.tsx` (e.g., `application-interface.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `aiPipelineController.ts`)
- **Types**: Inline or in component files
- **Constants**: `UPPER_SNAKE_CASE` within files

## Integration Points

### Primary Integration Areas
1. **Speech Recognition** - `application-interface.tsx` lines 370-686
2. **Sign Language Vision** - `application-interface.tsx` lines 779-1247
3. **AI Mediation** - `lib/mediator.ts` `mediateIntent()` function
4. **3D Avatar** - `components/AvatarRenderer.tsx` (placeholder)

### State Flow
```
User Input → State Update → AI Processing → UI Update → Output
```

## Documentation Standards

### Inline Comments
- **Integration Points**: `// INTEGRATION POINT:` for AI connection areas
- **TODO Items**: `// TODO:` for future enhancements
- **Function Docs**: JSDoc format for complex functions

### File Headers
Each major file includes:
- Purpose description
- Key responsibilities
- Integration instructions
- Usage examples

## Development Workflow

### Adding New Features
1. Create component in `components/`
2. Add utilities to `lib/` if needed
3. Update `application-interface.tsx` for integration
4. Test with `pnpm dev`
5. Update documentation

### Modifying AI Pipeline
1. Update state types in `application-interface.tsx`
2. Modify `lib/mediator.ts` for AI logic
3. Update `lib/aiPipelineController.ts` for orchestration
4. Test end-to-end flow

### UI Changes
1. Modify design tokens in `app/globals.css`
2. Update component styles with Tailwind classes
3. Test animations and responsiveness
4. Verify accessibility