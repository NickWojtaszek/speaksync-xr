/**
 * Remote Microphone Service
 * Manages WebRTC connection between web app and Android phone
 */

export interface SignalingMessage {
  type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'ping' | 'pong' | 'error' | 'status';
  roomCode?: string;
  clientId?: string;
  deviceType?: 'web' | 'android';
  payload?: any;
  error?: string;
  paired?: boolean;
  message?: string;
  fromClientId?: string;
}

export interface RemoteMicrophoneConfig {
  signalingServerUrl: string; // e.g., 'ws://localhost:8080' or 'wss://signaling.example.com'
  roomCode: string;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

type ConnectionStateChangeListener = (state: ConnectionState) => void;
type RemoteAudioStreamListener = (stream: MediaStream) => void;
type PairedListener = (paired: boolean) => void;
type ErrorListener = (error: string) => void;

class RemoteMicrophoneService {
  private signalingSocket: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private remoteAudioStream: MediaStream | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private currentRoomCode: string | null = null;
  private clientId: string | null = null;
  private isPaired: boolean = false;

  private listeners = {
    connectionStateChange: new Set<ConnectionStateChangeListener>(),
    remoteAudioStream: new Set<RemoteAudioStreamListener>(),
    paired: new Set<PairedListener>(),
    error: new Set<ErrorListener>(),
  };

  private peerConnectionConfig: RTCConfiguration = {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
      { urls: ['stun:stun2.l.google.com:19302'] },
    ],
  };

  /**
   * Create a new room on the signaling server
   */
  async createRoom(signalingServerUrl: string): Promise<string> {
    const httpUrl = signalingServerUrl
      .replace('ws://', 'http://')
      .replace('wss://', 'https://');
    
    const response = await fetch(`${httpUrl}/create-room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[RemoteMicrophoneService] Room created:', data.roomCode);
    return data.roomCode;
  }

  /**
   * Connect to signaling server and join a room
   */
  async connect(config: RemoteMicrophoneConfig): Promise<void> {
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      throw new Error('Already connected or connecting');
    }

    this.setConnectionState(ConnectionState.CONNECTING);
    this.currentRoomCode = config.roomCode;
    console.log(`[RemoteMicrophoneService] Connecting to room: ${config.roomCode}`);

    return new Promise((resolve, reject) => {
      try {
        this.signalingSocket = new WebSocket(config.signalingServerUrl);

        this.signalingSocket.onopen = () => {
          console.log('[RemoteMicrophoneService] Connected to signaling server');
          const joinMsg = {
            type: 'join',
            roomCode: config.roomCode,
            deviceType: 'web',
          };
          console.log('[RemoteMicrophoneService] Sending join message:', joinMsg);
          this.sendSignalingMessage(joinMsg);
        };

        this.signalingSocket.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            this.handleSignalingMessage(message);
          } catch (error) {
            console.error('[RemoteMicrophoneService] Failed to parse message:', error);
          }
        };

        this.signalingSocket.onerror = (error) => {
          console.error('[RemoteMicrophoneService] WebSocket error:', error);
          this.setConnectionState(ConnectionState.ERROR);
          reject(new Error('WebSocket connection failed'));
        };

        this.signalingSocket.onclose = () => {
          console.log('[RemoteMicrophoneService] Disconnected from signaling server');
          this.cleanup();
        };

        // Wait for join confirmation
        const joinTimeout = setTimeout(() => {
          reject(new Error('Join request timeout'));
        }, 30000); // 30 second timeout

        // Temporary listener for join confirmation
        const tempListener = (state: ConnectionState) => {
          if (state !== ConnectionState.CONNECTING) {
            this.removeListener('connectionStateChange', tempListener);
            clearTimeout(joinTimeout);
            if (state === ConnectionState.CONNECTED) {
              resolve();
            } else if (state === ConnectionState.ERROR) {
              reject(new Error('Failed to connect'));
            }
          }
        };

        this.addListener('connectionStateChange', tempListener);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from remote microphone
   */
  async disconnect(): Promise<void> {
    this.cleanup();
  }

  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(message: SignalingMessage): void {
    console.log('[RemoteMicrophoneService] Received:', message.type);

    switch (message.type) {
      case 'status':
        this.handleStatusMessage(message);
        break;
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      default:
        console.warn('[RemoteMicrophoneService] Unknown message type:', message.type);
    }
  }

  /**
   * Handle status messages
   */
  private handleStatusMessage(message: SignalingMessage): void {
    if (message.clientId) {
      this.clientId = message.clientId;
      console.log('[RemoteMicrophoneService] Assigned client ID:', this.clientId);
    }

    if (message.paired !== undefined) {
      this.isPaired = message.paired;
      console.log('[RemoteMicrophoneService] Room paired:', this.isPaired);
      this.notifyPairedListeners();

      if (this.isPaired && !this.peerConnection) {
        this.setupPeerConnection();
        this.createOffer();
      }
    }
  }

  /**
   * Setup WebRTC peer connection
   */
  private setupPeerConnection(): void {
    if (this.peerConnection) {
      return;
    }

    this.peerConnection = new RTCPeerConnection(this.peerConnectionConfig);

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      console.log('[RemoteMicrophoneService] Received remote audio track');
      if (event.streams[0]) {
        this.remoteAudioStream = event.streams[0];
        this.notifyRemoteAudioStreamListeners();
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log(
        '[RemoteMicrophoneService] Peer connection state:',
        this.peerConnection?.connectionState
      );

      switch (this.peerConnection?.connectionState) {
        case 'connected':
          this.setConnectionState(ConnectionState.CONNECTED);
          break;
        case 'failed':
        case 'disconnected':
        case 'closed':
          this.setConnectionState(ConnectionState.DISCONNECTED);
          break;
      }
    };

    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log('[RemoteMicrophoneService] Sending ICE candidate');
        this.sendSignalingMessage({
          type: 'ice-candidate',
          payload: {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          },
        });
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('[RemoteMicrophoneService] ICE gathering state:', this.peerConnection?.iceGatheringState);
    };
  }

  /**
   * Create WebRTC offer
   */
  private async createOffer(): Promise<void> {
    if (!this.peerConnection) {
      return;
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: 'offer',
        payload: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });

      console.log('[RemoteMicrophoneService] Created and sent offer');
    } catch (error) {
      console.error('[RemoteMicrophoneService] Failed to create offer:', error);
      this.setConnectionState(ConnectionState.ERROR);
    }
  }

  /**
   * Handle WebRTC offer from Android
   */
  private async handleOffer(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection) {
      this.setupPeerConnection();
    }

    if (!this.peerConnection || !message.payload) {
      return;
    }

    try {
      const offer = new RTCSessionDescription(message.payload);
      await this.peerConnection.setRemoteDescription(offer);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'answer',
        payload: {
          type: answer.type,
          sdp: answer.sdp,
        },
      });

      console.log('[RemoteMicrophoneService] Created and sent answer');
    } catch (error) {
      console.error('[RemoteMicrophoneService] Failed to handle offer:', error);
      this.setConnectionState(ConnectionState.ERROR);
    }
  }

  /**
   * Handle WebRTC answer from Android
   */
  private async handleAnswer(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection || !message.payload) {
      return;
    }

    try {
      const answer = new RTCSessionDescription(message.payload);
      await this.peerConnection.setRemoteDescription(answer);
      console.log('[RemoteMicrophoneService] Applied remote answer');
    } catch (error) {
      console.error('[RemoteMicrophoneService] Failed to handle answer:', error);
      this.setConnectionState(ConnectionState.ERROR);
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection || !message.payload) {
      return;
    }

    try {
      const candidate = new RTCIceCandidate(message.payload);
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('[RemoteMicrophoneService] Failed to add ICE candidate:', error);
    }
  }

  /**
   * Handle error messages
   */
  private handleError(message: SignalingMessage): void {
    console.error('[RemoteMicrophoneService] Server error:', message.error);
    this.notifyErrorListeners(message.error || 'Unknown error');
    this.setConnectionState(ConnectionState.ERROR);
  }

  /**
   * Get remote audio stream
   */
  getRemoteAudioStream(): MediaStream | null {
    return this.remoteAudioStream;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if room is paired
   */
  isPairedRoom(): boolean {
    return this.isPaired;
  }

  /**
   * Send signaling message to server
   */
  private sendSignalingMessage(message: SignalingMessage): void {
    if (!this.signalingSocket || this.signalingSocket.readyState !== WebSocket.OPEN) {
      console.error('[RemoteMicrophoneService] WebSocket not connected');
      return;
    }

    this.signalingSocket.send(JSON.stringify(message));
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log('[RemoteMicrophoneService] Connection state changed to:', state);
      this.notifyConnectionStateChangeListeners();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    this.remoteAudioStream = null;
    this.isPaired = false;
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  // Event listeners

  addListener(event: keyof typeof this.listeners, listener: any): void {
    this.listeners[event].add(listener);
  }

  removeListener(event: keyof typeof this.listeners, listener: any): void {
    this.listeners[event].delete(listener);
  }

  private notifyConnectionStateChangeListeners(): void {
    this.listeners.connectionStateChange.forEach(listener => listener(this.connectionState));
  }

  private notifyRemoteAudioStreamListeners(): void {
    if (this.remoteAudioStream) {
      this.listeners.remoteAudioStream.forEach(listener => listener(this.remoteAudioStream!));
    }
  }

  private notifyPairedListeners(): void {
    this.listeners.paired.forEach(listener => listener(this.isPaired));
  }

  private notifyErrorListeners(error: string): void {
    this.listeners.error.forEach(listener => listener(error));
  }

  /**
   * Get the RTCPeerConnection for stats retrieval
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
}

export const remoteMicrophoneService = new RemoteMicrophoneService();
