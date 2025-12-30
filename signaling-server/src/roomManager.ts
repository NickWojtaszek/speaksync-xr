import { v4 as uuidv4 } from 'uuid';

export interface RoomSession {
  roomCode: string;
  webClient: string | null;
  androidClient: string | null;
  createdAt: number;
  expiresAt: number;
  paired: boolean;
}

class RoomManager {
  private rooms: Map<string, RoomSession> = new Map();
  private clientToRoom: Map<string, string> = new Map();
  private readonly ROOM_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a new room and return the room code
   */
  createRoom(): string {
    const roomCode = this.generateRoomCode();
    const now = Date.now();
    
    const session: RoomSession = {
      roomCode,
      webClient: null,
      androidClient: null,
      createdAt: now,
      expiresAt: now + this.ROOM_EXPIRATION_TIME,
      paired: false,
    };

    this.rooms.set(roomCode, session);
    return roomCode;
  }

  /**
   * Register a client (web or android) to a room
   */
  registerClient(roomCode: string, clientId: string, clientType: 'web' | 'android'): boolean {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return false;
    }

    // Check if room has expired
    if (Date.now() > room.expiresAt) {
      this.deleteRoom(roomCode);
      return false;
    }

    if (clientType === 'web') {
      if (room.webClient && room.webClient !== clientId) {
        return false; // Already has a web client
      }
      room.webClient = clientId;
    } else {
      if (room.androidClient && room.androidClient !== clientId) {
        return false; // Already has an android client
      }
      room.androidClient = clientId;
    }

    this.clientToRoom.set(clientId, roomCode);

    // Check if both clients are connected
    if (room.webClient && room.androidClient) {
      room.paired = true;
    }

    return true;
  }

  /**
   * Get room by code
   */
  getRoomByCode(roomCode: string): RoomSession | null {
    const room = this.rooms.get(roomCode);
    if (!room || Date.now() > room.expiresAt) {
      this.deleteRoom(roomCode);
      return null;
    }
    return room;
  }

  /**
   * Get room for a client
   */
  getRoomForClient(clientId: string): RoomSession | null {
    const roomCode = this.clientToRoom.get(clientId);
    if (!roomCode) return null;
    
    const room = this.rooms.get(roomCode);
    if (!room || Date.now() > room.expiresAt) {
      this.deleteRoom(roomCode);
      this.clientToRoom.delete(clientId);
      return null;
    }

    return room;
  }

  /**
   * Get the peer client ID for a given client
   */
  getPeerClient(clientId: string): string | null {
    const room = this.getRoomForClient(clientId);
    if (!room) return null;

    if (room.webClient === clientId) {
      return room.androidClient;
    } else if (room.androidClient === clientId) {
      return room.webClient;
    }

    return null;
  }

  /**
   * Check if a room is fully paired
   */
  isRoomPaired(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    return room ? room.paired : false;
  }

  /**
   * Remove a client from a room
   */
  removeClient(clientId: string): void {
    const roomCode = this.clientToRoom.get(clientId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (room.webClient === clientId) {
      room.webClient = null;
    } else if (room.androidClient === clientId) {
      room.androidClient = null;
    }

    room.paired = false;

    // Delete room if both clients are gone
    if (!room.webClient && !room.androidClient) {
      this.deleteRoom(roomCode);
    }

    this.clientToRoom.delete(clientId);
  }

  /**
   * Delete a room
   */
  deleteRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (room.webClient) this.clientToRoom.delete(room.webClient);
    if (room.androidClient) this.clientToRoom.delete(room.androidClient);

    this.rooms.delete(roomCode);
  }

  /**
   * Cleanup expired rooms (call periodically)
   */
  cleanupExpiredRooms(): number {
    const now = Date.now();
    let deleted = 0;

    for (const [roomCode, room] of this.rooms.entries()) {
      if (now > room.expiresAt) {
        this.deleteRoom(roomCode);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get room statistics
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      pairedRooms: Array.from(this.rooms.values()).filter(r => r.paired).length,
      activeConnections: this.clientToRoom.size,
    };
  }

  /**
   * Generate a unique room code
   */
  private generateRoomCode(): string {
    return uuidv4().substring(0, 8).toUpperCase();
  }
}

export const roomManager = new RoomManager();
