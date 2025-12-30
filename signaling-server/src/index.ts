import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import http from 'http';
import { SignalingManager } from './signalingManager';
import { roomManager } from './roomManager';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_ORIGIN = (process.env.ALLOW_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:5173').split(',');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ 
  origin: ALLOW_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Create WebSocket server
const wss = new WebSocket.Server({ server });
const signalingManager = new SignalingManager(wss);

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/create-room', (req: Request, res: Response) => {
  const roomCode = roomManager.createRoom();
  res.json({ 
    success: true,
    roomCode,
    message: 'Room created successfully'
  });
});

app.get('/room/:roomCode', (req: Request, res: Response) => {
  const { roomCode } = req.params;
  const room = roomManager.getRoomByCode(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    roomCode,
    webClient: room.webClient ? 'connected' : 'waiting',
    androidClient: room.androidClient ? 'connected' : 'waiting',
    paired: room.paired,
    expiresIn: Math.ceil((room.expiresAt - Date.now()) / 1000) + 's'
  });
});

app.get('/stats', (req: Request, res: Response) => {
  res.json({
    server: 'SpeakSync Signaling Server',
    version: '1.0.0',
    environment: NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  signalingManager.shutdown();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  signalingManager.shutdown();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🎙️  SpeakSync Signaling Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`Allowed origins: ${ALLOW_ORIGIN.join(', ')}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST /create-room - Create a new pairing room`);
  console.log(`  GET  /health     - Health check`);
  console.log(`  GET  /stats      - Server statistics`);
  console.log(`\nWebSocket Messages:`);
  console.log(`  {type: 'join', roomCode: 'XXX', deviceType: 'web|android'}`);
  console.log(`  {type: 'offer', payload: {...}}`);
  console.log(`  {type: 'answer', payload: {...}}`);
  console.log(`  {type: 'ice-candidate', payload: {...}}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
