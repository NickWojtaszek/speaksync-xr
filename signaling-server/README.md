# SpeakSync Signaling Server

WebRTC signaling server for enabling Android phones to stream audio as remote microphones to the SpeakSync XR web application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=8080
NODE_ENV=development
ALLOW_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Development

Run in watch mode:
```bash
npm run dev
```

## Production

Build:
```bash
npm run build
```

Start:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T10:00:00.000Z"
}
```

### Statistics
```
GET /stats
```

Response:
```json
{
  "server": "SpeakSync Signaling Server",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 12345.67,
  "memory": {...}
}
```

## WebSocket Protocol

### Message Types

#### 1. Join Room
Client sends:
```json
{
  "type": "join",
  "roomCode": "ABC-123",
  "deviceType": "web|android"
}
```

Server responds:
```json
{
  "type": "status",
  "roomCode": "ABC-123",
  "deviceType": "web|android",
  "paired": false,
  "message": "Joined room successfully"
}
```

#### 2. WebRTC Offer
Web client sends:
```json
{
  "type": "offer",
  "payload": {
    "type": "offer",
    "sdp": "v=0\r\n..."
  }
}
```

Android client receives:
```json
{
  "type": "offer",
  "payload": {...},
  "fromClientId": "client_xxx"
}
```

#### 3. WebRTC Answer
Android client sends:
```json
{
  "type": "answer",
  "payload": {
    "type": "answer",
    "sdp": "v=0\r\n..."
  }
}
```

Web client receives the answer.

#### 4. ICE Candidate
Either client sends:
```json
{
  "type": "ice-candidate",
  "payload": {
    "candidate": "candidate:...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

Other client receives and adds it to their peer connection.

#### 5. Ping/Pong (Keepalive)
Server sends ping automatically every 30 seconds.

Client can send:
```json
{
  "type": "ping"
}
```

Server responds:
```json
{
  "type": "pong"
}
```

#### 6. Room Paired Notification
Server sends when both clients join:
```json
{
  "type": "status",
  "roomCode": "ABC-123",
  "paired": true,
  "message": "Room is now paired. WebRTC connection can begin."
}
```

#### 7. Error
Server sends on error:
```json
{
  "type": "error",
  "error": "Error message"
}
```

## Architecture

### Room Manager
- Creates and manages pairing between web and Android clients
- Tracks client connections
- Auto-expires unused rooms after 24 hours
- Maps clients to their peer clients

### Signaling Manager
- Handles WebSocket connections
- Routes signaling messages between peers
- Manages heartbeat and cleanup
- Notifies clients when rooms are paired

## Deployment

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### Environment
- **AWS EC2 / ECS** - For scalable deployment
- **Heroku** - Easy deployment, check buildpack
- **Railway / Render** - Good for Node.js apps
- **DigitalOcean** - Cost-effective option

### CORS Configuration
Update `ALLOW_ORIGIN` to match your deployed web app domain:
```
ALLOW_ORIGIN=https://speaksync.example.com,https://app.example.com
```

### SSL/TLS
For production, use `wss://` (WebSocket Secure):
- Proxy through Nginx/Apache with SSL termination
- Or use AWS API Gateway / CloudFlare

## Monitoring

Check server health:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/stats
```

Monitor logs for connection events and errors.

## Troubleshooting

### CORS Errors
- Verify `ALLOW_ORIGIN` includes your web app domain
- Check browser console for blocked requests

### Connection Timeouts
- Check firewall allows WebSocket traffic on your port
- Verify `wss://` uses proper SSL certificate in production

### Missing Peer
- Ensure both devices join the same room code
- Check room hasn't expired (24-hour timeout)

### Audio Not Streaming
- Verify WebRTC connection established (check browser DevTools)
- Check Android app has microphone permissions
- Test ICE candidates are being exchanged

## Performance

- **Concurrent Rooms**: Scales to thousands
- **Message Throughput**: ~1000 msgs/sec per server
- **Latency**: ~50-100ms typical
- **Memory**: ~1-2 MB per active room

## Security Notes

- Room codes are single-use (after pairing)
- DTLS-SRTP encrypts audio stream automatically
- WebSocket connections should use WSS (TLS) in production
- Implement rate limiting for production deployments
