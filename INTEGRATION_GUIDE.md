# SignBridge 3D - AI Integration Guide

This guide provides step-by-step instructions for integrating AI, vision, and speech systems into the SignBridge 3D interface.

## Quick Start Checklist

- [ ] Set up WebSocket connection for real-time communication
- [ ] Integrate speech-to-text API
- [ ] Integrate sign language recognition model
- [ ] Replace avatar placeholder with 3D renderer
- [ ] Connect camera and microphone hardware
- [ ] Implement context detection logic
- [ ] Add error handling and fallbacks
- [ ] Test end-to-end communication flow

## Integration Points

### 1. Speech-to-Text Integration

**Location**: `components/application-interface.tsx`

**Current Code** (lines ~60-75):
```typescript
// TODO: Replace with real-time transcription from speech-to-text AI
useEffect(() => {
  const messages = [
    "Patient reporting chest discomfort...",
    // ... simulated messages
  ]
  // Simulated subtitle updates
}, [context])
```

**Integration Steps**:

```typescript
import { useEffect, useRef } from 'react'

export function ApplicationInterface() {
  const [subtitles, setSubtitles] = useState<string[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Option A: Web Speech API (browser-native)
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        
        setSubtitles(prev => {
          const newSubtitles = [...prev, transcript]
          return newSubtitles.slice(-3) // Keep last 3 lines
        })
      }
      
      recognition.start()
      recognitionRef.current = recognition
    }
    
    // Option B: External API (Whisper, Google Speech, etc.)
    // const ws = new WebSocket('wss://your-api.com/speech')
    // ws.onmessage = (event) => {
    //   const { transcript } = JSON.parse(event.data)
    //   setSubtitles(prev => [...prev, transcript].slice(-3))
    // }
    
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])
  
  // ... rest of component
}
```

**Recommended APIs**:
- **OpenAI Whisper**: High accuracy, medical terminology support
- **Google Cloud Speech-to-Text**: Real-time streaming, custom vocabulary
- **Azure Speech Services**: HIPAA-compliant, low latency
- **Web Speech API**: Free, browser-native, limited accuracy

---

### 2. Sign Language Recognition

**Location**: `components/application-interface.tsx`

**Current Code** (lines ~45-55):
```typescript
// TODO: Replace with actual AI status updates from processing pipeline
useEffect(() => {
  const statuses: SystemStatus[] = ["listening", "understanding", "responding", "speaking"]
  // Simulated status cycling
}, [])
```

**Integration Steps**:

```typescript
import { useEffect, useRef } from 'react'

export function ApplicationInterface() {
  const [status, setStatus] = useState<SystemStatus>("listening")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!cameraActive) return

    // Step 1: Get camera stream
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })

    // Step 2: Process frames with vision model
    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return
      
      const ctx = canvasRef.current.getContext('2d')
      ctx?.drawImage(videoRef.current, 0, 0)
      
      // Update status based on processing stage
      setStatus("listening")
      
      // Send frame to vision API
      const imageData = canvasRef.current.toDataURL('image/jpeg')
      
      setStatus("understanding")
      
      const response = await fetch('/api/sign-recognition', {
        method: 'POST',
        body: JSON.stringify({ image: imageData })
      })
      
      const { sign, confidence } = await response.json()
      
      if (confidence > 0.8) {
        setStatus("responding")
        
        // Generate response
        const translation = await translateSign(sign)
        
        setStatus("speaking")
        
        // Update subtitles
        setSubtitles(prev => [...prev, translation].slice(-3))
      }
      
      // Reset to listening
      setTimeout(() => setStatus("listening"), 1000)
    }

    // Process at 10 FPS (adjust based on model speed)
    const interval = setInterval(processFrame, 100)
    
    return () => {
      clearInterval(interval)
      const stream = videoRef.current?.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
    }
  }, [cameraActive])

  return (
    <>
      {/* Hidden video and canvas for processing */}
      <video ref={videoRef} style={{ display: 'none' }} autoPlay />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* ... rest of UI */}
    </>
  )
}
```

**Recommended Models**:
- **MediaPipe Hands**: Real-time hand tracking, free
- **OpenPose**: Full body pose estimation
- **Custom TensorFlow.js Model**: Train on ASL/BSL dataset
- **Cloud Vision API**: Google/Azure sign language recognition

---

### 3. 3D Avatar Replacement

**Location**: `components/application-interface.tsx` → `AvatarPlaceholder` function

**Current Code** (lines ~400-500):
```typescript
function AvatarPlaceholder({ context, status }: { context: Context; status: SystemStatus }) {
  // Placeholder silhouette with animations
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      {/* Placeholder avatar */}
    </div>
  )
}
```

**Integration Steps**:

#### Option A: Three.js + Ready Player Me

```typescript
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef } from 'react'

function Avatar3D({ status }: { status: SystemStatus }) {
  const group = useRef()
  const { scene, animations } = useGLTF('/avatar.glb')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    // Play animation based on status
    switch (status) {
      case "listening":
        actions?.idle?.play()
        break
      case "understanding":
        actions?.thinking?.play()
        break
      case "speaking":
        actions?.speaking?.play()
        break
    }
  }, [status, actions])

  return <primitive ref={group} object={scene} />
}

function AvatarPlaceholder({ context, status }: { context: Context; status: SystemStatus }) {
  return (
    <div className="relative h-48 w-48">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} />
        <Avatar3D status={status} />
      </Canvas>
    </div>
  )
}
```

**Install Dependencies**:
```bash
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

#### Option B: Unity WebGL

```typescript
import { Unity, useUnityContext } from 'react-unity-webgl'

function AvatarPlaceholder({ context, status }: { context: Context; status: SystemStatus }) {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "/unity/Build.loader.js",
    dataUrl: "/unity/Build.data",
    frameworkUrl: "/unity/Build.framework.js",
    codeUrl: "/unity/Build.wasm",
  })

  useEffect(() => {
    // Send status updates to Unity
    sendMessage("AvatarController", "SetStatus", status)
  }, [status, sendMessage])

  return (
    <div className="relative h-48 w-48">
      <Unity unityProvider={unityProvider} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
```

**Install Dependencies**:
```bash
pnpm add react-unity-webgl
```

---

### 4. WebSocket Real-Time Connection

**Location**: Create new file `lib/websocket.ts`

```typescript
// lib/websocket.ts
import { useEffect, useRef, useState } from 'react'

export type WSMessage = {
  type: 'status' | 'subtitle' | 'context' | 'mode'
  data: any
}

export function useSignBridgeWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  useEffect(() => {
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    ws.current.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data)
      setLastMessage(message)
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          ws.current = new WebSocket(url)
        }
      }, 3000)
    }

    return () => {
      ws.current?.close()
    }
  }, [url])

  const sendMessage = (message: WSMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return { isConnected, lastMessage, sendMessage }
}
```

**Usage in ApplicationInterface**:

```typescript
import { useSignBridgeWebSocket } from '@/lib/websocket'

export function ApplicationInterface() {
  const { isConnected, lastMessage, sendMessage } = useSignBridgeWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
  )

  useEffect(() => {
    if (!lastMessage) return

    switch (lastMessage.type) {
      case 'status':
        setStatus(lastMessage.data)
        break
      case 'subtitle':
        setSubtitles(prev => [...prev, lastMessage.data].slice(-3))
        break
      case 'context':
        setContext(lastMessage.data)
        break
      case 'mode':
        setMode(lastMessage.data)
        break
    }
  }, [lastMessage])

  // Send updates to server
  const handleContextChange = (newContext: Context) => {
    setContext(newContext)
    sendMessage({ type: 'context', data: newContext })
  }

  // ... rest of component
}
```

---

### 5. Context Detection

**Location**: `components/application-interface.tsx`

**Current Code**:
```typescript
const [context, setContext] = useState<Context>("hospital")
```

**Integration Steps**:

```typescript
import { useEffect } from 'react'

export function ApplicationInterface() {
  const [context, setContext] = useState<Context>("hospital")

  useEffect(() => {
    // Option A: Geolocation-based detection
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      
      const response = await fetch(`/api/detect-context`, {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude })
      })
      
      const { context: detectedContext } = await response.json()
      setContext(detectedContext)
    })

    // Option B: Audio analysis for emergency keywords
    const detectEmergency = (transcript: string) => {
      const emergencyKeywords = [
        'emergency', 'urgent', 'critical', 'code blue',
        'cardiac arrest', 'trauma', 'stroke', 'seizure'
      ]
      
      const isEmergency = emergencyKeywords.some(keyword =>
        transcript.toLowerCase().includes(keyword)
      )
      
      if (isEmergency && context !== 'emergency') {
        setContext('emergency')
        
        // Auto-revert after 5 minutes
        setTimeout(() => setContext('hospital'), 5 * 60 * 1000)
      }
    }

    // Option C: Manual override with confirmation
    const handleEmergencyButton = () => {
      if (confirm('Switch to emergency mode?')) {
        setContext('emergency')
      }
    }
  }, [])

  // ... rest of component
}
```

---

### 6. Camera and Microphone Controls

**Location**: `components/application-interface.tsx`

**Current Code**:
```typescript
const [cameraActive, setCameraActive] = useState(true)
const [micActive, setMicActive] = useState(true)
```

**Integration Steps**:

```typescript
import { useEffect, useRef } from 'react'

export function ApplicationInterface() {
  const [cameraActive, setCameraActive] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        streamRef.current = stream
        setCameraActive(true)
        setMicActive(true)
      } catch (error) {
        console.error('Permission denied:', error)
        alert('Camera and microphone access required for SignBridge 3D')
      }
    }

    requestPermissions()

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  // Toggle camera
  const handleCameraToggle = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setCameraActive(videoTrack.enabled)
    }
  }

  // Toggle microphone
  const handleMicToggle = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setMicActive(audioTrack.enabled)
    }
  }

  return (
    // ... UI with updated handlers
    <Button onClick={handleCameraToggle}>
      <Camera className="h-5 w-5" />
    </Button>
    <Button onClick={handleMicToggle}>
      <Mic className="h-5 w-5" />
    </Button>
  )
}
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local`:

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=https://api.signbridge3d.com
NEXT_PUBLIC_WS_URL=wss://ws.signbridge3d.com

# Speech Recognition
NEXT_PUBLIC_SPEECH_API_KEY=your_api_key_here
NEXT_PUBLIC_SPEECH_REGION=us-east-1

# Sign Language Recognition
NEXT_PUBLIC_VISION_API_KEY=your_api_key_here
NEXT_PUBLIC_VISION_ENDPOINT=https://vision.api.com

# Avatar CDN
NEXT_PUBLIC_AVATAR_CDN=https://cdn.signbridge3d.com

# Feature Flags
NEXT_PUBLIC_ENABLE_CONTEXT_DETECTION=true
NEXT_PUBLIC_ENABLE_EMERGENCY_MODE=true
```

---

## Testing Your Integration

### 1. Test Speech Recognition

```typescript
// Test in browser console
const recognition = new (window as any).webkitSpeechRecognition()
recognition.onresult = (e) => console.log(e.results[0][0].transcript)
recognition.start()
// Speak into microphone
```

### 2. Test Camera Access

```typescript
// Test in browser console
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()
    document.body.appendChild(video)
  })
```

### 3. Test WebSocket Connection

```typescript
// Test in browser console
const ws = new WebSocket('ws://localhost:8080')
ws.onopen = () => console.log('Connected')
ws.onmessage = (e) => console.log('Message:', e.data)
ws.send(JSON.stringify({ type: 'test', data: 'hello' }))
```

---

## Common Issues & Solutions

### Issue: Camera permission denied

**Solution**: Check browser settings, ensure HTTPS (required for getUserMedia)

```typescript
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  alert('HTTPS required for camera access')
}
```

### Issue: WebSocket connection fails

**Solution**: Check CORS headers, ensure WSS for production

```typescript
// Backend (Node.js example)
const wss = new WebSocketServer({
  server: httpsServer,
  verifyClient: (info) => {
    const origin = info.origin
    return origin === 'https://signbridge3d.com'
  }
})
```

### Issue: Avatar not rendering

**Solution**: Check WebGL support, fallback to 2D

```typescript
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

if (!gl) {
  console.warn('WebGL not supported, using 2D fallback')
  // Render 2D avatar instead
}
```

---

## Performance Optimization

### 1. Throttle Vision Processing

```typescript
import { throttle } from 'lodash'

const processFrame = throttle(async () => {
  // Vision processing
}, 100) // Max 10 FPS
```

### 2. Debounce Subtitle Updates

```typescript
import { debounce } from 'lodash'

const updateSubtitles = debounce((text: string) => {
  setSubtitles(prev => [...prev, text].slice(-3))
}, 500) // Wait 500ms after last word
```

### 3. Lazy Load Avatar

```typescript
import dynamic from 'next/dynamic'

const Avatar3D = dynamic(() => import('./Avatar3D'), {
  ssr: false,
  loading: () => <AvatarPlaceholder />
})
```

---

## Next Steps

1. ✅ Complete this integration guide
2. ⬜ Set up backend API endpoints
3. ⬜ Train/fine-tune sign language model
4. ⬜ Create 3D avatar assets
5. ⬜ Implement HIPAA-compliant data handling
6. ⬜ Add comprehensive error handling
7. ⬜ Write integration tests
8. ⬜ Deploy to staging environment
9. ⬜ Conduct user acceptance testing
10. ⬜ Launch to production

---

**Questions?** Refer to inline comments in component files or check ARCHITECTURE.md for system overview.
