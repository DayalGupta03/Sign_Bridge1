# SignBridge 3D - Backend Server

**Purpose**: Minimal production backend for observability and monitoring  
**Status**: Optional (frontend works without it)  
**Size**: <100 lines of code

---

## Overview

This is a **lightweight Node.js backend** whose sole purpose is observability:
- Session tracking
- Event logging
- Health monitoring

**All core logic remains in the frontend** (browser). This backend does NOT:
- Process AI/ML
- Handle speech recognition
- Perform sign language recognition
- Store user data
- Require authentication

---

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on **port 3001** by default.

### 3. Verify Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 12345,
  "events": 0,
  "timestamp": 1234567890
}
```

---

## API Endpoints

### GET /health

Health check endpoint for monitoring.

**Response**:
```json
{
  "status": "ok",
  "uptime": 12345,
  "events": 42,
  "timestamp": 1234567890
}
```

### POST /event

Log interaction event.

**Request**:
```json
{
  "sessionId": "sess_1234567890_abc123",
  "timestamp": 1234567890,
  "mode": "deaf-to-hearing",
  "context": "hospital",
  "status": "speaking",
  "latency": 123,
  "error": "optional error message"
}
```

**Response**:
```json
{
  "success": true,
  "eventId": "evt_abc123def456"
}
```

### GET /events?sessionId=xxx

Query events for a specific session (debugging only).

**Response**:
```json
{
  "success": true,
  "sessionId": "sess_1234567890_abc123",
  "count": 5,
  "events": [...]
}
```

---

## Environment Variables

```bash
# Server port (default: 3001)
PORT=3001

# Server host (default: 0.0.0.0)
HOST=0.0.0.0
```

---

## Frontend Integration

The frontend automatically sends events to the backend if it's running.

**No configuration needed** - it just works!

If the backend is down:
- Frontend continues normally
- Events are silently ignored
- No user-facing errors

---

## Data Storage

**In-Memory Only** - No database required.

Events are stored in a JavaScript array:
- Max 10,000 events
- Oldest events are removed when limit reached
- All data lost on server restart

**Why no database?**
- Simplicity: No setup, no maintenance
- Privacy: No persistent storage of user data
- Performance: Fast, no I/O overhead
- Cost: Free, no database hosting

**Future**: Send events to analytics service (Google Analytics, Mixpanel, Datadog).

---

## Privacy & Security

### What We Log
- Session IDs (anonymous)
- Timestamps
- Status changes
- Mode/context
- Latency metrics
- Error messages

### What We DON'T Log
- PHI (Protected Health Information)
- Audio/video data
- Personal identifiers
- User names or emails
- IP addresses (Fastify logs them, but we don't store)

### HIPAA Compliance
This backend is **not HIPAA-compliant** as-is. For production:
- Add authentication
- Encrypt data in transit (HTTPS)
- Add audit logging
- Implement access controls
- Sign Business Associate Agreement

---

## Deployment

### Local Development

```bash
npm run dev
```

### Production (Node.js)

```bash
npm start
```

### Production (Docker)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t signbridge-backend .
docker run -p 3001:3001 signbridge-backend
```

### Production (Cloud)

**AWS Elastic Beanstalk**:
```bash
eb init
eb create signbridge-backend
eb deploy
```

**Heroku**:
```bash
heroku create signbridge-backend
git push heroku main
```

**Vercel** (Serverless):
```bash
vercel deploy
```

---

## Monitoring

### Health Checks

Most cloud providers support health check endpoints:

**AWS ELB**:
- Path: `/health`
- Interval: 30s
- Timeout: 5s

**Kubernetes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30
```

### Logging

Fastify provides structured logging out of the box:

```bash
# View logs
npm start | pino-pretty
```

### Metrics

Track these metrics:
- Request rate (events/second)
- Error rate (errors/total)
- Latency (p50, p95, p99)
- Uptime (%)

---

## Scaling

### Horizontal Scaling

This backend is **stateless** and can be scaled horizontally:

```bash
# Run multiple instances
pm2 start index.js -i 4
```

### Load Balancing

Use Nginx or AWS ELB to distribute traffic:

```nginx
upstream signbridge {
  server localhost:3001;
  server localhost:3002;
  server localhost:3003;
}

server {
  listen 80;
  location / {
    proxy_pass http://signbridge;
  }
}
```

### Caching

No caching needed - all endpoints are dynamic.

---

## Future Enhancements

### 1. Analytics Integration

Send events to analytics service:

```javascript
// Google Analytics
gtag('event', 'status_change', {
  mode: event.mode,
  context: event.context,
  status: event.status
})

// Mixpanel
mixpanel.track('Status Change', event)
```

### 2. Database Storage

Store events in PostgreSQL or MongoDB:

```javascript
await db.events.insert(event)
```

### 3. Real-Time Dashboard

WebSocket endpoint for live monitoring:

```javascript
fastify.get('/ws', { websocket: true }, (connection) => {
  connection.on('message', (message) => {
    // Broadcast events to dashboard
  })
})
```

### 4. Error Monitoring

Integrate with Sentry or Datadog:

```javascript
Sentry.captureException(error)
```

### 5. Rate Limiting

Prevent abuse:

```javascript
fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
})
```

---

## Troubleshooting

### Backend won't start

**Error**: `EADDRINUSE: address already in use`

**Solution**: Port 3001 is already in use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Frontend can't connect

**Error**: `Failed to fetch` or `CORS error`

**Solution**: Check CORS configuration
```javascript
// In server/index.js
fastify.register(require('@fastify/cors'), {
  origin: 'http://localhost:3000', // Your frontend URL
  methods: ['GET', 'POST'],
})
```

### Events not logging

**Check**:
1. Backend is running: `curl http://localhost:3001/health`
2. Frontend has correct URL: Check `NEXT_PUBLIC_BACKEND_URL`
3. Tracking is enabled: Check `NEXT_PUBLIC_ENABLE_TRACKING`
4. Browser console for errors

---

## Development

### Code Structure

```
server/
├── index.js          # Main server file (<100 lines)
├── package.json      # Dependencies
└── README.md         # This file
```

### Dependencies

- **fastify**: Fast web framework
- **@fastify/cors**: CORS support
- **nodemon**: Auto-reload (dev only)

### Testing

```bash
# Manual testing
curl -X POST http://localhost:3001/event \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_123",
    "timestamp": 1234567890,
    "mode": "deaf-to-hearing",
    "context": "hospital",
    "status": "speaking"
  }'
```

---

## License

MIT

---

## Support

For issues or questions:
1. Check this README
2. Check server logs: `npm start`
3. Check frontend console
4. Open GitHub issue

---

**Remember**: This backend is **optional**. The frontend works perfectly without it!
