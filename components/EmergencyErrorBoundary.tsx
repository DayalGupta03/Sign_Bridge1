"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

/**
 * EMERGENCY ERROR BOUNDARY
 * 
 * Catches and handles errors during emergency mode switching to prevent
 * system crashes during critical demonstrations. Provides graceful fallback
 * UI and automatic recovery mechanisms.
 * 
 * FEATURES:
 * - Catches JavaScript errors in emergency mode components
 * - Provides user-friendly error display
 * - Automatic retry mechanism with exponential backoff
 * - Fallback to text-only emergency mode
 * - Error reporting for debugging
 * 
 * USAGE:
 * <EmergencyErrorBoundary onError={handleError}>
 *   <EmergencyModeComponent />
 * </EmergencyErrorBoundary>
 */
export class EmergencyErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 Emergency Error Boundary caught error:', error)
    console.error('Error Info:', errorInfo)

    // Update state with error details
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Attempt automatic recovery after delay
    this.scheduleRetry()
  }

  scheduleRetry = () => {
    const { retryCount } = this.state
    
    // Exponential backoff: 1s, 2s, 4s, then stop
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000
      
      this.retryTimeoutId = setTimeout(() => {
        console.log(`🔄 Attempting emergency mode recovery (attempt ${retryCount + 1})`)
        this.handleRetry()
      }, delay)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleManualRetry = () => {
    console.log('🔄 Manual emergency mode recovery initiated')
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default emergency fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4">
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Emergency Mode Error</strong>
                <br />
                The emergency communication system encountered an error. 
                {this.state.retryCount < 3 && " Attempting automatic recovery..."}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button 
                onClick={this.handleManualRetry}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Emergency Mode
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Fallback: Text-only emergency communication available
                </p>
              </div>
            </div>

            {/* Error details for debugging (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-muted rounded-lg text-xs">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-destructive">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * EMERGENCY FALLBACK COMPONENT
 * 
 * Minimal text-only emergency communication interface that works
 * even when the main system fails. Provides basic input/output
 * functionality for critical situations.
 */
export function EmergencyFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="p-4 border-2 border-destructive rounded-lg bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-destructive mb-2">
            Emergency Text Mode
          </h3>
          <p className="text-sm text-muted-foreground">
            Advanced features unavailable. Basic text communication active.
          </p>
        </div>

        <div className="space-y-2">
          <textarea
            placeholder="Type your emergency message here..."
            className="w-full h-24 p-3 border rounded-lg resize-none"
            autoFocus
          />
          <Button className="w-full bg-destructive hover:bg-destructive/90">
            Send Emergency Message
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          System will attempt to restore full functionality automatically.
        </p>
      </div>
    </div>
  )
}