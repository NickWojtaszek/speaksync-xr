# Remote Microphone Architecture - SpeakSync XR

## Overview
Enable Android phones to act as remote microphones for the web app via WebRTC audio streaming.

---

## System Architecture

### High-Level Flow
```
Android Phone (Microphone Source)
    ↓
[Audio Capture] → [WebRTC Data Channel] → [Web App]
    ↓
[Speech Recognition] → [Gemini API] → [App Logic]
```

---

## Components

### 1. **Signaling Server** (Node.js/Express)
- Handles WebRTC signaling (SDP offer/answer exchange)
- Manages session pairing between web app and Android app
- Maintains connection state and room management

**Key Features:**
- Room-based pairing (generate unique room codes)
- WebSocket-based real-time signaling
- Connection status tracking
- Heartbeat/keep-alive mechanism

### 2. **Web App Changes** (React/TypeScript)
**New Files:**
- `services/remoteMicrophoneService.ts` - WebRTC connection management
- `components/RemoteMicrophonePanel.tsx` - UI for connecting to remote microphone
- `hooks/useRemoteAudioStream.ts` - Hook to manage remote audio stream

**Modifications:**
- `hooks/useSpeechRecognition.ts` - Accept both local and remote audio streams
- `components/SettingsPage.tsx` - Add remote microphone configuration

**Key Features:**
- Pairing UI (enter room code or generate code)
- Connection status display
- Audio level visualization
- Fallback to local microphone

### 3. **Android App** (Kotlin)
**Architecture:**
- Uses Google's WebRTC library
- Captures microphone audio
- Establishes WebRTC connection
- Streams audio to web app

**Key Components:**
- `SignalingClient` - WebSocket connection to signaling server
- `AudioCapture` - Microphone input
- `WebRTCManager` - Manages peer connection
- `MainActivity` - Displays connection code and status
- `PeerConnectionFactory` - Creates WebRTC connections

---

## Data Flow

### Connection Establishment
```
1. User opens web app → clicks "Connect Remote Microphone"
2. Web app generates unique room code (UUID)
3. Web app displays code to user
4. User opens Android app → enters room code
5. Android app connects to signaling server with room code
6. Signaling server exchanges WebRTC SDP offers/answers
7. ICE candidates exchanged via WebSocket
8. Peer connection established
9. Android phone streams audio to web app
```

### Audio Streaming
```
Android Microphone
    ↓
[AudioTrack] (WebRTC)
    ↓
[RTCPeerConnection]
    ↓
[WebSocket/STUN/TURN] (Internet)
    ↓
[RTCPeerConnection] (Web App)
    ↓
[MediaStream/AudioContext]
    ↓
[Web Speech API]
    ↓
[Transcript Processing]
```

---

## Implementation Details

### Signaling Server Structure
```
signaling-server/
├── index.js
├── package.json
├── src/
│   ├── signalingManager.ts
│   ├── roomManager.ts
│   └── routes/
│       ├── health.ts
│       └── signaling.ts
└── .env
```

### Web App Service (`services/remoteMicrophoneService.ts`)
```typescript
class RemoteMicrophoneService {
  private peerConnection: RTCPeerConnection | null = null;
  private signalingSocket: WebSocket | null = null;
  private remoteAudioStream: MediaStream | null = null;
  
  async connect(signalingServerUrl: string, roomCode: string): Promise<void>
  async disconnect(): Promise<void>
  async createOffer(): Promise<RTCSessionDescriptionInit>
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void>
  getRemoteAudioStream(): MediaStream | null
}
```

### Android App Class (`WebRTCManager.kt`)
```kotlin
class WebRTCManager(context: Context) {
  private val peerConnectionFactory: PeerConnectionFactory
  private val peerConnection: PeerConnection
  private val audioSource: AudioSource
  private val audioTrack: AudioTrack
  
  fun createOffer(onOfferCreated: (SessionDescription) -> Unit)
  fun setRemoteDescription(sdp: SessionDescription)
  fun addIceCandidate(iceCandidate: IceCandidate)
  fun startAudioCapture()
  fun stopAudioCapture()
}
```

---

## Implementation Phases

### Phase 1: Signaling Server
1. Create Node.js/Express signaling server
2. Implement WebSocket for real-time signaling
3. Room management with unique codes
4. Deploy to cloud (AWS/Heroku/Railway)

### Phase 2: Web App Integration
1. Create `remoteMicrophoneService.ts`
2. Implement `useRemoteAudioStream.ts` hook
3. Create pairing UI component
4. Modify `useSpeechRecognition.ts` to support remote streams
5. Update settings page with remote microphone options

### Phase 3: Android App
1. Create Android app with WebRTC library
2. Implement audio capture
3. Implement WebRTC peer connection
4. Create simple UI (room code input, status display)
5. Test connection and audio streaming

### Phase 4: Testing & Optimization
1. Test over WiFi and cellular
2. Implement reconnection logic
3. Add audio quality settings
4. Performance optimization
5. Error handling and user feedback

---

## Technical Specifications

### WebRTC Configuration
```javascript
const peerConnectionConfig = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    // Optional TURN server for NAT traversal
    // { urls: ['turn:turnserver.com'], username: 'user', credential: 'pass' }
  ]
};
```

### Audio Constraints
```javascript
// Android capture
const audioConstraints = {
  mandatory: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
};

// Web app receive
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: false
};
```

### Signaling Protocol
```json
{
  "type": "offer|answer|ice-candidate",
  "roomCode": "UUID-string",
  "deviceType": "web|android",
  "payload": {
    "sdp": "...",
    "candidate": "...",
    "sdpMLineIndex": 0
  }
}
```

---

## Security Considerations

1. **Room Code Security**
   - Generate cryptographically secure UUIDs
   - Expire room codes after 24 hours
   - Single-use room codes (pair once, then delete)

2. **Signaling Encryption**
   - Use WSS (WebSocket Secure) instead of WS
   - TLS certificates for signaling server

3. **WebRTC Security**
   - DTLS-SRTP encryption for audio stream (built-in)
   - Verify peer identity through room code matching

4. **Network**
   - Restrict to same network (optional)
   - Implement rate limiting on signaling server

---

## Fallback & Error Handling

```typescript
// Fallback to local microphone if remote connection fails
if (!remoteAudioAvailable) {
  useSpeechRecognition({ source: 'local' });
} else {
  useSpeechRecognition({ source: 'remote', stream: remoteStream });
}

// Auto-reconnect logic
const maxRetries = 3;
const reconnectDelay = 5000; // ms
```

---

## UI/UX Flow

### Web App
```
Settings/Microphone Menu
  ↓
[Local Microphone] [Remote Microphone]
  ↓
Remote Microphone:
- "Generate Code" button
- Display code: "ABC-123-XYZ"
- QR code to scan with Android app
- Connection status (Waiting/Connected/Disconnected)
- Audio level indicator
- Audio settings (gain, echo cancellation)
```

### Android App
```
Home Screen
  ↓
[Manual Code Entry] [Scan QR Code]
  ↓
Input room code or scan QR
  ↓
[Connect] button
  ↓
Status: "Connecting..." → "Connected"
  ↓
Microphone indicator
Keep screen on (while connected)
```

---

## Deployment Recommendations

### Signaling Server
- **Cloud Provider:** AWS (EC2), Heroku, Railway, or DigitalOcean
- **Runtime:** Node.js 18+
- **Database:** Redis for room state (optional)
- **Load Balancing:** Horizontal scaling with Socket.io adapter

### Web App
- No changes to current deployment
- New service works transparently

### Android App
- Publish to Google Play Store
- Auto-update mechanism

---

## Performance & Limitations

### Expected Performance
- Latency: 50-200ms (depending on network)
- Audio quality: 16 kHz (standard for speech recognition)
- Bandwidth: ~40 kbps audio + signaling

### Limitations
- Requires stable internet on both devices
- Same WiFi not required, but low-latency networks preferred
- Battery drain on Android phone (consider charging)

---

## Future Enhancements

1. **Multiple Remote Microphones** - Connect multiple phones
2. **Audio Quality Settings** - Adjust bitrate/sample rate
3. **Recording** - Save remote audio stream
4. **Noise Filtering** - Advanced audio processing
5. **Mobile Web Version** - Connect to web app from mobile browser
6. **Wake Word Detection** - "Hey SpeakSync" activation
7. **Offline Mode** - Cache and sync when reconnected

---

## Testing Strategy

### Unit Tests
- Signaling protocol validation
- Room code generation
- Connection state management

### Integration Tests
- Web app ↔ Signaling server
- Android app ↔ Signaling server
- End-to-end connection flow

### Functional Tests
- Audio streaming quality
- Reconnection scenarios
- Error handling
- Multiple concurrent connections

### Load Tests
- Multiple concurrent rooms
- Bandwidth usage
- Server resource consumption
