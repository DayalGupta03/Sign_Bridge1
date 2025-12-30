"use client"

import React, { useState, useEffect } from 'react'
import { AlertTriangle, MessageSquare, RefreshCw, Mic, MicOff, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { motion, AnimatePresence } from 'framer-motion'

interface EmergencyFallbackSystemProps {
  onFallbackActivated: (mode: FallbackMode) => void
  onRetryRequested: () => void
  currentMode: FallbackMode
}

export type FallbackMode = 'none' | 'text-only' | 'offline' | 'emergency-chat'

/**
 * EMERGENCY FALLBACK SYSTEM
 * 
 * Provides multiple layers of fallback functionality when the main system fails.
 * Ensures communication is always possible, even in worst-case scenarios.
 * 
 * FALLBACK HIERARCHY:
 * 1. Text Input Fallback - When speech processing fails
 * 2. Offline Cached Mode - When network fails
 * 3. Emergency Text Chat - When everything else fails
 * 4. Emoji Signs - When avatar fails
 * 
 * FEATURES:
 * - Automatic fallback detection and activation
 * - Manual fallback selection
 * - Offline capability with cached phrases
 * - Emergency contact integration
 * - Accessibility compliance
 */
export function EmergencyFallbackSystem({ 
  onFallbackActivated, 
  onRetryRequested, 
  currentMode 
}: EmergencyFallbackSystemProps) {
  const [textInput, setTextInput] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [emergencyMessages, setEmergencyMessages] = useState<string[]>([])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-activate offline mode when network fails
  useEffect(() => {
    if (!isOnline && currentMode === 'none') {
      onFallbackActivated('offline')
    }
  }, [isOnline, currentMode, onFallbackActivated])

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setEmergencyMessages(prev => [...prev, textInput.trim()])
      setTextInput('')
      
      // Trigger text-to-speech if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textInput.trim())
        utterance.rate = 0.8
        utterance.volume = 0.8
        speechSynthesis.speak(utterance)
      }
    }
  }

  const quickPhrases = [
    "I need help",
    "Call a doctor",
    "Emergency",
    "I'm in pain",
    "Can't breathe",
    "Call 911",
    "Yes",
    "No",
    "Thank you"
  ]

  const emojiSigns = [
    { emoji: "🆘", meaning: "Help/Emergency" },
    { emoji: "😷", meaning: "Sick/Unwell" },
    { emoji: "💊", meaning: "Medicine/Pills" },
    { emoji: "🏥", meaning: "Hospital" },
    { emoji: "👨‍⚕️", meaning: "Doctor" },
    { emoji: "🚑", meaning: "Ambulance" },
    { emoji: "❤️", meaning: "Heart/Love" },
    { emoji: "😢", meaning: "Pain/Sad" },
    { emoji: "👍", meaning: "Yes/Good" },
    { emoji: "👎", meaning: "No/Bad" }
  ]

  if (currentMode === 'none') {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full space-y-6">
          {/* Fallback Mode Header */}
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Emergency Fallback Mode Active</strong>
              <br />
              {currentMode === 'text-only' && "Speech processing unavailable. Using text input."}
              {currentMode === 'offline' && "Network connection lost. Using offline mode."}
              {currentMode === 'emergency-chat' && "All systems unavailable. Emergency text chat active."}
            </AlertDescription>
          </Alert>

          {/* Network Status */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Offline</span>
              </>
            )}
          </div>

          {/* Text Input Fallback */}
          {(currentMode === 'text-only' || currentMode === 'emergency-chat') && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Text Communication</h3>
              
              <div className="space-y-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[100px] text-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleTextSubmit()
                    }
                  }}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTextSubmit}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={!textInput.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setTextInput('')}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Quick Phrases */}
              <div className="space-y-2">
                <h4 className="font-medium">Quick Phrases</h4>
                <div className="grid grid-cols-3 gap-2">
                  {quickPhrases.map((phrase, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setTextInput(phrase)}
                      className="text-xs"
                    >
                      {phrase}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Offline Cached Mode */}
          {currentMode === 'offline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Offline Emergency Mode</h3>
              <p className="text-sm text-muted-foreground">
                Using cached emergency phrases. Network connection will be restored automatically.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {quickPhrases.map((phrase, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      setEmergencyMessages(prev => [...prev, phrase])
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(phrase)
                        speechSynthesis.speak(utterance)
                      }
                    }}
                  >
                    {phrase}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Signs Fallback */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visual Communication</h3>
            <div className="grid grid-cols-5 gap-3">
              {emojiSigns.map((sign, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => {
                    setEmergencyMessages(prev => [...prev, sign.meaning])
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(sign.meaning)
                      speechSynthesis.speak(utterance)
                    }
                  }}
                >
                  <span className="text-2xl">{sign.emoji}</span>
                  <span className="text-xs">{sign.meaning}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Message History */}
          {emergencyMessages.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Message History</h4>
              <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-muted rounded-lg">
                {emergencyMessages.map((message, index) => (
                  <div key={index} className="text-sm p-2 bg-background rounded">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onFallbackActivated('text-only')}
                className={currentMode === 'text-only' ? 'bg-primary text-primary-foreground' : ''}
              >
                Text Only
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onFallbackActivated('offline')}
                className={currentMode === 'offline' ? 'bg-primary text-primary-foreground' : ''}
              >
                Offline Mode
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onFallbackActivated('emergency-chat')}
                className={currentMode === 'emergency-chat' ? 'bg-primary text-primary-foreground' : ''}
              >
                Emergency Chat
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onRetryRequested}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry System
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onFallbackActivated('none')}
              >
                Close Fallback
              </Button>
            </div>
          </div>

          {/* Emergency Contact Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Emergency Contact:</strong> If this is a life-threatening emergency, 
              call 911 immediately or ask someone nearby to call for you.
            </AlertDescription>
          </Alert>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * FALLBACK DETECTION HOOK
 * 
 * Monitors system health and automatically activates fallbacks when needed.
 */
export function useFallbackDetection() {
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>('none')
  const [errorCount, setErrorCount] = useState(0)

  // Auto-activate fallbacks based on error patterns
  useEffect(() => {
    if (errorCount >= 3 && fallbackMode === 'none') {
      console.warn('🚨 Multiple errors detected, activating text fallback')
      setFallbackMode('text-only')
    }
  }, [errorCount, fallbackMode])

  const reportError = (error: string) => {
    console.error('Fallback system error:', error)
    setErrorCount(prev => prev + 1)
  }

  const activateFallback = (mode: FallbackMode) => {
    console.log('🚨 Activating fallback mode:', mode)
    setFallbackMode(mode)
    if (mode === 'none') {
      setErrorCount(0) // Reset error count when returning to normal
    }
  }

  const retrySystem = () => {
    console.log('🔄 Retrying main system')
    setFallbackMode('none')
    setErrorCount(0)
  }

  return {
    fallbackMode,
    errorCount,
    reportError,
    activateFallback,
    retrySystem
  }
}