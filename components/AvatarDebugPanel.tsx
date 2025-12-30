/**
 * AVATAR DEBUG PANEL
 * 
 * Development-only component to display avatar cache metrics and idle state.
 * Shows cache hit rates, memory usage, and idle state transitions.
 */

"use client"

import { useState, useEffect } from "react"
import { avatarCache, type CacheMetrics } from "@/lib/avatarCache"
import { cn } from "@/lib/utils"

interface AvatarDebugPanelProps {
  className?: string
  isVisible?: boolean
}

export function AvatarDebugPanel({ className, isVisible = true }: AvatarDebugPanelProps) {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [mostUsed, setMostUsed] = useState<{ signs: string[], animations: string[] }>({ signs: [], animations: [] })

  // Update metrics every 2 seconds
  useEffect(() => {
    if (!isVisible) return

    const updateMetrics = () => {
      setMetrics(avatarCache.getMetrics())
      setMostUsed(avatarCache.getMostUsed())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={cn(
      "fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-sm z-50",
      className
    )}>
      <div className="mb-2 font-semibold text-green-400">Avatar Cache Debug</div>
      
      {metrics && (
        <div className="space-y-1">
          <div>Hit Rate: {(metrics.hitRate * 100).toFixed(1)}%</div>
          <div>Requests: {metrics.totalRequests} ({metrics.totalHits} hits)</div>
          <div>Cache Size: {metrics.cacheSize} entries</div>
          <div>Memory: {metrics.memoryUsage.toFixed(2)} MB</div>
          
          {mostUsed.signs.length > 0 && (
            <div className="mt-2">
              <div className="text-blue-400">Top Signs:</div>
              <div className="text-xs opacity-75">
                {mostUsed.signs.slice(0, 3).join(", ")}
              </div>
            </div>
          )}
          
          {mostUsed.animations.length > 0 && (
            <div className="mt-1">
              <div className="text-purple-400">Top Animations:</div>
              <div className="text-xs opacity-75">
                {mostUsed.animations.slice(0, 3).join(", ")}
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              avatarCache.clearAll()
              setMetrics(avatarCache.getMetrics())
              setMostUsed(avatarCache.getMostUsed())
            }}
            className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  )
}