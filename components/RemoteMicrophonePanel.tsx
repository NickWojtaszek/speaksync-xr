import React, { useState, useCallback } from 'react';
import { useRemoteAudioStream } from '../hooks/useRemoteAudioStream';
import { ConnectionState } from '../services/remoteMicrophoneService';
import { AudioLevelMeter } from './AudioLevelMeter';
import { WebRTCStats } from './WebRTCStats';
import { useTheme } from '../context/ThemeContext';

interface RemoteMicrophonePanelProps {
  signalingServerUrl: string;
  onAudioStreamReceived?: (stream: MediaStream) => void;
  onDisconnect?: () => void;
}

/**
 * Panel for connecting to remote microphone via Android phone
 */
export const RemoteMicrophonePanel: React.FC<RemoteMicrophonePanelProps> = ({
  signalingServerUrl,
  onAudioStreamReceived,
  onDisconnect,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'display' | 'input'>('display');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    remoteAudioStream,
    connectionState,
    isPaired,
    error,
    createRoom,
    connect,
    disconnect,
    isConnecting,
    isConnected,
    getPeerConnection,
  } = useRemoteAudioStream();

  const { currentTheme } = useTheme();

  // Handle audio stream received
  React.useEffect(() => {
    if (remoteAudioStream && onAudioStreamReceived) {
      onAudioStreamReceived(remoteAudioStream);
    }
  }, [remoteAudioStream, onAudioStreamReceived]);

  const generateRoomCode = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const code = await createRoom(signalingServerUrl);
      setDisplayCode(code);
      setInputMode('display');
      // Don't auto-connect - let user click Connect button after sharing code with phone
    } catch (err) {
      console.error('Failed to generate room code:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [createRoom, signalingServerUrl]);

  const handleConnect = useCallback(async (): Promise<void> => {
    const codeToUse = displayCode || roomCode;

    if (!codeToUse) {
      alert('Please generate or enter a room code');
      return;
    }

    try {
      await connect({
        signalingServerUrl,
        roomCode: codeToUse,
      });
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  }, [connect, displayCode, roomCode, signalingServerUrl]);

  const handleDisconnect = useCallback(async (): Promise<void> => {
    await disconnect();
    setDisplayCode(null);
    setRoomCode('');
    setInputMode('display');
    setCopiedCode(false);

    if (onDisconnect) {
      onDisconnect();
    }
  }, [disconnect, onDisconnect]);

  const handleCopyCode = useCallback((): void => {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [displayCode]);

  const getConnectionStatusColor = (): string => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return '#4caf50';
      case ConnectionState.CONNECTING:
        return '#ff9800';
      case ConnectionState.ERROR:
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getConnectionStatusText = (): string => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'Connected';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.ERROR:
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">🎙️ Remote Microphone</h3>
        
        {/* Connection Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              connectionState === ConnectionState.CONNECTED 
                ? 'bg-green-500 animate-pulse' 
                : connectionState === ConnectionState.CONNECTING 
                ? 'bg-yellow-500 animate-pulse' 
                : connectionState === ConnectionState.ERROR 
                ? 'bg-red-500 animate-bounce' 
                : 'bg-gray-500'
            }`}
          />
          <span className={`text-xs font-medium ${
            connectionState === ConnectionState.CONNECTED 
              ? 'text-green-400' 
              : connectionState === ConnectionState.CONNECTING 
              ? 'text-yellow-400' 
              : connectionState === ConnectionState.ERROR 
              ? 'text-red-400' 
              : 'text-gray-400'
          }`}>
            {getConnectionStatusText()}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 mb-3 bg-red-900/30 border border-red-600/50 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Connection Section */}
      {!isConnected ? (
        <div className="space-y-3">
          {displayCode ? (
            <>
              <p className="text-sm text-gray-300">Share this code with your phone:</p>
              <div className="p-4 rounded text-center" style={{ backgroundColor: `${currentTheme.colors.bgTertiary}cc`, borderColor: currentTheme.colors.borderColor, borderWidth: '1px' }}>
                <p className="text-3xl font-bold text-purple-300 tracking-widest">{displayCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="w-full p-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {copiedCode ? '✓ Copied!' : 'Copy Code'}
              </button>
              <p className="text-xs text-gray-400 text-center">Enter this code on your Android phone, then click Connect below</p>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full p-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full p-2 bg-gray-700 text-gray-300 rounded text-sm font-medium hover:bg-gray-600"
              >
                Generate New Code
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300">Generate a code to pair with your phone:</p>
              <button
                onClick={generateRoomCode}
                disabled={isGenerating || isConnecting}
                style={{ backgroundColor: currentTheme.colors.buttonPrimary, color: '#fff', borderRadius: '0.375rem' }} 
                className="w-full p-2 rounded text-sm font-medium disabled:cursor-not-allowed transition-colors" 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary}
              >
                {isGenerating ? 'Generating...' : 'Generate Room Code'}
              </button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>
              <p className="text-sm text-gray-300">Enter code from another device:</p>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                disabled={isConnecting}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500"
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting || !roomCode}
                className="w-full p-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-green-900/30 border border-green-600/50 rounded flex items-center justify-between">
            <p className="text-sm text-green-300">✓ Connected and waiting for audio stream...</p>
            {isPaired && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Paired</span>}
          </div>

          {/* Audio Level Meter */}
          {remoteAudioStream && (
            <AudioLevelMeter
              audioStream={remoteAudioStream}
              label="Incoming Audio Level"
            />
          )}

          {/* WebRTC Stats */}
          <WebRTCStats
            peerConnection={getPeerConnection()}
            connectionState={connectionState}
          />

          <button
            onClick={handleDisconnect}
            className="w-full p-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default RemoteMicrophonePanel;
