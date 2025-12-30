import WebSocket from 'ws';
import { roomManager } from './roomManager';

export interface SignalingMessage {
  type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'ping' | 'pong' | 'error' | 'status';
  roomCode?: string;
  clientId?: string;
  deviceType?: 'web' | 'android';
  payload?: any;
  error?: string;
  paired?: boolean;
  message?: string;
}

export class SignalingManager {
  private wss: WebSocket.Server;
  private clientConnections: Map<string, WebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocket.Server) {
    this.wss = wss;
    this.setupHeartbeat();
    this.attachWSHandlers();
  }

  /**
   * Attach WebSocket handlers
   */
  private attachWSHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      this.clientConnections.set(clientId, ws);

      console.log(`[SignalingManager] New connection: ${clientId}`);

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: SignalingMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error(`[SignalingManager] Invalid message from ${clientId}:`, error);
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log(`[SignalingManager] Client disconnected: ${clientId}`);
        roomManager.removeClient(clientId);
        this.clientConnections.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`[SignalingManager] WebSocket error for ${clientId}:`, error);
      });

      // Send welcome message with clientId
      ws.send(JSON.stringify({ 
        type: 'status', 
        clientId,
        message: 'Connected to signaling server'
      }));
    });
  }

  /**
   * Handle incoming signaling messages
   */
  private handleMessage(clientId: string, ws: WebSocket, message: SignalingMessage): void {
    switch (message.type) {
      case 'join':
        this.handleJoin(clientId, ws, message);
        break;
      case 'offer':
        this.forwardMessage(clientId, message);
        break;
      case 'answer':
        this.forwardMessage(clientId, message);
        break;
      case 'ice-candidate':
        this.forwardMessage(clientId, message);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.warn(`[SignalingManager] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle join room request
   */
  private handleJoin(clientId: string, ws: WebSocket, message: SignalingMessage): void {
    const { roomCode, deviceType } = message;

    if (!roomCode || !deviceType || !['web', 'android'].includes(deviceType)) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Missing or invalid roomCode/deviceType',
      }));
      return;
    }

    // Register client to room
    const registered = roomManager.registerClient(roomCode, clientId, deviceType);
    if (!registered) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to join room. Room may be full or expired.',
      }));
      return;
    }

    const room = roomManager.getRoomForClient(clientId);
    console.log(`[SignalingManager] Client ${clientId} (${deviceType}) joined room ${roomCode}`);

    // Notify the client that they joined
    ws.send(JSON.stringify({
      type: 'status',
      roomCode,
      deviceType,
      paired: room?.paired || false,
      message: 'Joined room successfully',
    }));

    // If the room is now paired, notify both clients
    if (room?.paired) {
      this.notifyPaired(roomCode);
    }
  }

  /**
   * Forward SDP/ICE messages to peer
   */
  private forwardMessage(clientId: string, message: SignalingMessage): void {
    const peerClientId = roomManager.getPeerClient(clientId);

    if (!peerClientId) {
      console.warn(`[SignalingManager] No peer found for client ${clientId}`);
      const ws = this.clientConnections.get(clientId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Peer not connected',
        }));
      }
      return;
    }

    const peerWs = this.clientConnections.get(peerClientId);
    if (!peerWs || peerWs.readyState !== WebSocket.OPEN) {
      console.warn(`[SignalingManager] Peer ${peerClientId} not connected`);
      return;
    }

    console.log(`[SignalingManager] Forwarding ${message.type} from ${clientId} to ${peerClientId}`);

    // Forward the message to the peer
    peerWs.send(JSON.stringify({
      ...message,
      fromClientId: clientId,
    }));
  }

  /**
   * Notify both clients that room is paired
   */
  private notifyPaired(roomCode: string): void {
    const room = roomManager.getRoomForClient(
      roomManager.getRoomForClient('dummy')?.webClient || ''
    );

    if (!room) return;

    const statusMessage: SignalingMessage = {
      type: 'status',
      roomCode,
      paired: true,
      message: 'Room is now paired. WebRTC connection can begin.',
    };

    if (room.webClient) {
      const ws = this.clientConnections.get(room.webClient);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(statusMessage));
      }
    }

    if (room.androidClient) {
      const ws = this.clientConnections.get(room.androidClient);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(statusMessage));
      }
    }
  }

  /**
   * Setup heartbeat to keep connections alive and cleanup
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      // Send ping to all connected clients
      this.clientConnections.forEach((ws, clientId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });

      // Cleanup expired rooms
      const deleted = roomManager.cleanupExpiredRooms();
      if (deleted > 0) {
        console.log(`[SignalingManager] Cleaned up ${deleted} expired rooms`);
      }

      // Log stats every minute
      if (Math.random() < 0.05) { // ~5% chance per heartbeat
        const stats = roomManager.getStats();
        console.log('[SignalingManager] Stats:', stats);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Shutdown gracefully
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.clientConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.clientConnections.clear();
  }

  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
