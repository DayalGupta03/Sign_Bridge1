# SignBridge 3D - Quick Start Guide

**For developers who need to get up to speed FAST** ⚡

---

## 🎯 What is This Project? (30-second version)

SignBridge is a **real-time AI translator** between Deaf and Hearing people in hospitals.

- **Deaf person signs** → Camera captures → AI recognizes → **Hearing person hears speech**
- **Hearing person speaks** → Microphone captures → AI processes → **Deaf person sees text/avatar**

---

## 🏗️ System Architecture (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│                         SIGNBRIDGE 3D                            │
└─────────────────────────────────────────────────────────────────┘

    DEAF USER                                      HEARING USER
    👤 (signs)                                     👤 (speaks)
        │                                              │
        ▼                                              ▼
    📹 Camera                                      🎤 Microphone
        │                                              │
        └──────────────────┬───────────────────────────┘
                           ▼
        ┌──────────────────────────────────────────┐
        │  1. CAPTURE (Listening)                  │
        │  - MediaPipe Hands (sign detection)      │
        │  - Web Speech API (speech recognition)   │
        └──────────────────┬───────────────────────┘
                           ▼
        ┌──────────────────────────────────────────┐
        │  2. UNDERSTAND (Understanding)           │
        │  - Gesture Recognition (geometric rules) │
        │  - Speech-to-Text conversion             │
        │  - Context detection                     │
        └──────────────────┬───────────────────────┘
                           ▼
        ┌──────────────────────────────────────────┐
        │  3. MEDIATE (Responding)                 │
        │  - Gemini AI (medical context)           │
        │  - Simplify medical terminology          │
        │  - Generate appropriate response         │
        └──────────────────┬───────────────────────┘
                           ▼
        ┌──────────────────────────────────────────┐
        │  4. COMMUNICATE (Speaking)               │
        │  - Text-to-Speech (voice output)         │
        │  - Subtitles display                     │
        │  - 3D Avatar (future)                    │
        └──────────────────┬───────────────────────┘
                           │
        ┌──────────────────┴───────────────────────┐
        ▼                                          ▼
    📺 Display                                 🔊 Speaker
    (Deaf sees text)                          (Hearing hears)
```

---

## 📂 File Structure (What to Look At)

```
SignBridge/
│
├── 🔥 components/application-interface.tsx  ← START HERE (main logic)
│   └── 2080 lines - all the AI pipeline code
│
├── app/
│   ├── page.tsx                 ← Landing page (simple)
│   └── globals.css              ← All animations & styles
│
├── lib/
│   ├── aiPipelineController.ts  ← AI orchestration
│   └── speech-synthesis.ts      ← Text-to-speech
│
├── components/
│   ├── AvatarRenderer.tsx       ← 3D avatar (placeholder)
│   ├── hero-section.tsx         ← Landing section
│   ├── how-it-works-section.tsx ← Educational timeline
│   └── ui/                      ← 50+ reusable components
│
└── 📚 Documentation/
    ├── PROJECT_EXPLANATION.md   ← Full explanation (read this!)
    ├── README.md                ← Project overview
    ├── ARCHITECTURE.md          ← Deep dive
    ├── HANDOFF_SUMMARY.md       ← Onboarding
    └── MVP_STATUS.md            ← Current status
```

---

## 🚀 Run It in 3 Steps

```bash
# 1. Go to project
cd /Users/ayushpatel/Documents/Projects/SignBridge/SignBridge

# 2. Install dependencies (first time only)
pnpm install

# 3. Run development server
pnpm dev

# Open http://localhost:3000 in Chrome/Edge/Safari
```

---

## 🎮 How to Test It

### Test Speech Recognition (Hearing → Deaf)
1. Open http://localhost:3000
2. Scroll to the interactive demo section
3. Click the **microphone icon** (should be active)
4. **Speak into your microphone**: "Hello, how are you?"
5. Watch the **subtitles appear** in real-time
6. See the **status change**: Listening → Understanding → Responding → Speaking

### Test Sign Language Recognition (Deaf → Hearing)
1. Click the **mode toggle** to switch to "Deaf to Hearing"
2. Click the **camera icon** (should be active)
3. **Show your hands** to the camera
4. Try these gestures:
   - ✋ **Raise hand** → Detects "I need help"
   - 👍 **Thumbs up** → Detects "Yes/Okay"
   - 👎 **Thumbs down** → Detects "No"
   - ✊ **Closed fist** → Detects "Pain"
5. Watch the **subtitles show** what you signed

### Test Context Switching
1. Click the **Hospital/Emergency toggle**
2. Notice:
   - **Hospital mode**: Blue/calm colors, slower animations
   - **Emergency mode**: Red colors, faster pulsing, urgent feel

---

## 🧠 Key Concepts to Understand

### 1. State Management (The Brain)
All the app's "memory" is stored in React state:

```typescript
// Where are we? (hospital or ER)
const [context, setContext] = useState("hospital")

// Who's talking? (deaf→hearing or hearing→deaf)
const [mode, setMode] = useState("deaf-to-hearing")

// What's happening now? (listening, understanding, responding, speaking)
const [status, setStatus] = useState("listening")

// What's being said/signed?
const [subtitles, setSubtitles] = useState([])
```

### 2. The AI Pipeline (The Flow)
Every communication goes through 4 stages:

```
LISTENING → UNDERSTANDING → RESPONDING → SPEAKING
   (1s)         (1.2s)          (0.8s)       (0.6s)
```

### 3. Two Modes (The Direction)

**Mode 1: Deaf → Hearing**
```
Sign Language → Camera → AI → Speech
```

**Mode 2: Hearing → Deaf**
```
Speech → Microphone → AI → Text/Avatar
```

---

## 🔧 Common Tasks

### Change UI Colors
**File**: `app/globals.css` (lines 20-30)
```css
:root {
  --primary: oklch(0.65 0.18 195);  /* Change this number */
}
```

### Add a New Gesture
**File**: `components/application-interface.tsx` (around line 1200)
```typescript
if (/* your detection logic */) {
  return { intent: "help", phrase: "I need help" }
}
```

### Change Animation Speed
**File**: `app/globals.css`
```css
.animate-breathing {
  animation: breathing 4s ease-in-out infinite;
  /* Change 4s to 2s for faster */
}
```

---

## 📊 What's Working vs What's Not

### ✅ Working (You Can Use Now)
- Beautiful UI with smooth animations
- Speech recognition (Chrome/Edge/Safari)
- Basic sign language recognition (~10 gestures)
- AI mediation with Gemini
- Text-to-speech output
- Mode switching
- Context switching
- Demo mode for presentations

### 🔄 Partially Working (Needs Improvement)
- Sign language recognition (only basic gestures)
- Medical terminology processing (basic AI)
- Avatar (placeholder only, no 3D)

### ❌ Not Working (Needs to be Built)
- Full ASL vocabulary recognition
- 3D avatar signing
- User authentication
- HIPAA compliance
- Database storage
- Mobile app
- Multi-language support

---

## 🎯 Your First Tasks

### Day 1: Exploration
- [ ] Run the app locally
- [ ] Test speech recognition
- [ ] Test sign language recognition
- [ ] Read `PROJECT_EXPLANATION.md`
- [ ] Explore `application-interface.tsx`

### Day 2: Understanding
- [ ] Read inline comments in code
- [ ] Understand the state management
- [ ] Understand the AI pipeline flow
- [ ] Read `ARCHITECTURE.md`

### Day 3: Small Changes
- [ ] Change a UI color
- [ ] Modify an animation speed
- [ ] Add a console.log to see data flow
- [ ] Try adding a simple gesture

### Week 2+: Real Work
Pick one of these based on your skills:
- **Frontend**: Improve UI, add error notifications
- **AI/ML**: Enhance gesture recognition, train ML model
- **3D Graphics**: Implement avatar with Three.js
- **Backend**: Add authentication, HIPAA compliance

---

## 🐛 Troubleshooting

### App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Speech Recognition Not Working
- ✅ Use Chrome, Edge, or Safari (NOT Firefox)
- ✅ Allow microphone permission
- ✅ Check browser console for errors (F12)

### Camera Not Working
- ✅ Allow camera permission
- ✅ Check if another app is using camera
- ✅ Try restarting browser

### Build Errors
```bash
# Check for TypeScript errors
pnpm run lint

# Try building
pnpm build
```

---

## 📚 Essential Reading (In Order)

1. **This file** (QUICK_START_GUIDE.md) ← You are here
2. **PROJECT_EXPLANATION.md** ← Full explanation (30 min read)
3. **README.md** ← Project overview (10 min read)
4. **HANDOFF_SUMMARY.md** ← Onboarding guide (15 min read)
5. **ARCHITECTURE.md** ← Deep dive (20 min read)
6. **MVP_STATUS.md** ← Current status (10 min read)

---

## 💡 Pro Tips

1. **Browser DevTools is Your Friend**: Press F12 to see console logs, errors, and network requests
2. **Read the Comments**: The code has extensive inline documentation
3. **Start Small**: Don't try to understand everything at once
4. **Test Frequently**: Make a change → Save → See it live (hot reload)
5. **Use Git**: Commit often so you can revert mistakes
6. **Ask Questions**: Check documentation files first, then ask

---

## 🎓 Learning Path

### Beginner Level
- Understand what SignBridge does
- Run the app locally
- Navigate the codebase
- Make small UI changes

### Intermediate Level
- Understand React state management
- Understand the AI pipeline
- Modify gesture recognition
- Add new features

### Advanced Level
- Implement 3D avatar
- Train ML models
- Add HIPAA compliance
- Deploy to production

---

## 🔗 Important Links

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Framer Motion](https://www.framer.com/motion/)
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)

### Tools
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [VS Code](https://code.visualstudio.com/)
- [pnpm](https://pnpm.io/)

---

## ✅ Success Checklist

You're ready to work on this project when you can:
- [ ] Explain what SignBridge does in 30 seconds
- [ ] Run the app without errors
- [ ] Test speech and sign recognition
- [ ] Find the main component (`application-interface.tsx`)
- [ ] Understand the 4-stage AI pipeline
- [ ] Change a UI color or animation
- [ ] Read and understand the state variables
- [ ] Use browser DevTools to debug

---

## 🎉 You're Ready!

**Next Steps:**
1. ✅ Read `PROJECT_EXPLANATION.md` for full details
2. ✅ Explore the code in `application-interface.tsx`
3. ✅ Pick a task from "Your First Tasks"
4. ✅ Start coding!

**Remember**: This is a complex project, but it's well-documented. Take it one step at a time, and you'll be productive in no time!

---

**Good luck! 🚀**

---

**Document Version**: 1.0  
**Last Updated**: December 29, 2024  
**Estimated Reading Time**: 10 minutes
