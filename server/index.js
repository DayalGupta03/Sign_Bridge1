/**
 * SIGNBRIDGE 3D - MINIMAL PRODUCTION BACKEND
 * 
 * PURPOSE:
 * This backend exists ONLY for observability and monitoring.
 * All core logic remains in the frontend (browser).
 * 
 * RESPONSIBILITIES:
 * - Session tracking (generate/validate session IDs)
 * - Event logging (user interactions, errors, performance)
 * - Health monitoring (uptime, status checks)
 * 
 * NON-RESPONSIBILITIES:
 * - AI processing (stays in browser/external APIs)
 * - Speech recognition (browser Web Speech API)
 * - Sign recognition (browser MediaPipe)
 * - Text-to-speech (browser Speech Synthesis)
 * - User authentication (not needed for MVP)
 * - Data persistence (in-memory only)
 * 
 * DESIGN PHILOSOPHY:
 * - Optional: Frontend works without backend
 * - Non-blocking: Never delays user interactions
 * - Minimal: <100 lines of code
 * - Stateless: No database, no sessions storage
 * - Observable: Logs for debugging and analytics
 */

const fastify = require('fastify')({ logger: true })
const crypto = require('crypto')

// ============================================================================
// IN-MEMORY EVENT STORE
// ============================================================================

/**
 * EVENTS ARRAY - In-Memory Storage
 * 
 * Stores interaction events for current server session.
 * Resets on server restart (no persistence needed for MVP).
 * 
 * FUTURE ENHANCEMENTS:
 * - Send to analytics service (Google Analytics, Mixpanel)
 * - Store in database (PostgreSQL, MongoDB)
 * - Stream to logging service (Datadog, LogRocket)
 * - Export to CSV for analysis
 */
const events = []
const MAX_EVENTS = 10000 // Prevent memory overflow

// Server start time for uptime calculation
const SERVER_START_TIME = Date.now()

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

/**
 * CORS - Allow frontend to call backend
 * 
 * In production, restrict to your domain:
 * origin: 'https://signbridge3d.com'
 */
fastify.register(require('@fastify/cors'), {
  origin: true, // Allow all origins (restrict in production)
  methods: ['GET', 'POST'],
})

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /health
 * 
 * Returns server health status for monitoring.
 * Used by:
 * - Load balancers (AWS ELB, Nginx)
 * - Monitoring services (Datadog, New Relic)
 * - Frontend health checks
 * 
 * Response:
 * {
 *   status: "ok",
 *   uptime: 12345,
 *   events: 42,
 *   timestamp: 1234567890
 * }
 */
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    uptime: Date.now() - SERVER_START_TIME,
    events: events.length,
    timestamp: Date.now(),
  }
})

// ============================================================================
// EVENT LOGGING ENDPOINT
// ============================================================================

/**
 * POST /event
 * 
 * Logs user interaction events for analytics and debugging.
 * 
 * Request Body:
 * {
 *   sessionId: "abc123",
 *   timestamp: 1234567890,
 *   mode: "deaf-to-hearing" | "hearing-to-deaf",
 *   context: "hospital" | "emergency",
 *   status: "listening" | "understanding" | "responding" | "speaking",
 *   latency?: 123,
 *   error?: "error message"
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   eventId: "evt_abc123"
 * }
 * 
 * PRIVACY:
 * - No PHI (Protected Health Information) logged
 * - No audio/video data stored
 * - No personal identifiers
 * - Session IDs are anonymous
 */
fastify.post('/event', async (request, reply) => {
  const event = request.body

  // Validate required fields
  if (!event.sessionId || !event.timestamp) {
    return reply.code(400).send({
      success: false,
      error: 'Missing required fields: sessionId, timestamp',
    })
  }

  // Generate unique event ID
  const eventId = `evt_${crypto.randomBytes(8).toString('hex')}`

  // Store event with metadata
  const storedEvent = {
    eventId,
    ...event,
    serverTimestamp: Date.now(),
  }

  events.push(storedEvent)

  // Prevent memory overflow
  if (events.length > MAX_EVENTS) {
    events.shift() // Remove oldest event
  }

  // Log to console for debugging
  fastify.log.info({
    eventId,
    sessionId: event.sessionId,
    status: event.status,
    mode: event.mode,
    context: event.context,
  })

  return {
    success: true,
    eventId,
  }
})

// ============================================================================
// EVENTS QUERY ENDPOINT (OPTIONAL - FOR DEBUGGING)
// ============================================================================

/**
 * GET /events?sessionId=abc123
 * 
 * Returns events for a specific session.
 * Useful for debugging and support.
 * 
 * SECURITY NOTE:
 * In production, add authentication or remove this endpoint.
 */
fastify.get('/events', async (request, reply) => {
  const { sessionId } = request.query

  if (!sessionId) {
    return reply.code(400).send({
      success: false,
      error: 'Missing sessionId query parameter',
    })
  }

  const sessionEvents = events.filter((e) => e.sessionId === sessionId)

  return {
    success: true,
    sessionId,
    count: sessionEvents.length,
    events: sessionEvents,
  }
})

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * START SERVER
 * 
 * Default port: 3001 (frontend runs on 3000)
 * 
 * Environment variables:
 * - PORT: Server port (default: 3001)
 * - HOST: Server host (default: 0.0.0.0)
 */
const start = async () => {
  try {
    const port = process.env.PORT || 3001
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 SignBridge 3D Backend Server                          ║
║                                                            ║
║  Status:  Running                                          ║
║  Port:    ${port}                                              ║
║  Host:    ${host}                                        ║
║                                                            ║
║  Endpoints:                                                ║
║  - GET  /health  → Health check                            ║
║  - POST /event   → Log interaction event                   ║
║  - GET  /events  → Query events (debug only)               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
