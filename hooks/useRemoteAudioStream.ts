import { useState, useCallback, useEffect } from 'react';
import {
  remoteMicrophoneService,
  ConnectionState,
  type RemoteMicrophoneConfig,
} from '../services/remoteMicrophoneService';

interface UseRemoteAudioStreamReturn {
  remoteAudioStream: MediaStream | null;
  connectionState: ConnectionState;
  isPaired: boolean;
  error: string | null;
  createRoom: (signalingServerUrl: string) => Promise<string>;
  connect: (config: RemoteMicrophoneConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
  getPeerConnection: () => RTCPeerConnection | null;
}

/**
 * Hook to manage remote audio stream from Android phone
 */
export const useRemoteAudioStream = (): UseRemoteAudioStreamReturn => {
  const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isPaired, setIsPaired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection listeners
  useEffect(() => {
    const handleConnectionStateChange = (state: ConnectionState) => {
      setConnectionState(state);
      if (state === ConnectionState.ERROR) {
        setError('Connection failed');
      }
    };

    const handleRemoteAudioStream = (stream: MediaStream) => {
      console.log('[useRemoteAudioStream] Remote audio stream received');
      setRemoteAudioStream(stream);
      setError(null);
    };

    const handlePaired = (paired: boolean) => {
      setIsPaired(paired);
    };

    const handleError = (errorMsg: string) => {
      console.error('[useRemoteAudioStream] Error:', errorMsg);
      setError(errorMsg);
    };

    remoteMicrophoneService.addListener('connectionStateChange', handleConnectionStateChange);
    remoteMicrophoneService.addListener('remoteAudioStream', handleRemoteAudioStream);
    remoteMicrophoneService.addListener('paired', handlePaired);
    remoteMicrophoneService.addListener('error', handleError);

    return () => {
      remoteMicrophoneService.removeListener('connectionStateChange', handleConnectionStateChange);
      remoteMicrophoneService.removeListener('remoteAudioStream', handleRemoteAudioStream);
      remoteMicrophoneService.removeListener('paired', handlePaired);
      remoteMicrophoneService.removeListener('error', handleError);
    };
  }, []);

  const connect = useCallback(async (config: RemoteMicrophoneConfig) => {
    try {
      setError(null);
      await remoteMicrophoneService.connect(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await remoteMicrophoneService.disconnect();
      setRemoteAudioStream(null);
      setIsPaired(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

  const createRoom = useCallback(async (signalingServerUrl: string): Promise<string> => {
    try {
      const roomCode = await remoteMicrophoneService.createRoom(signalingServerUrl);
      return roomCode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    remoteAudioStream,
    connectionState,
    isPaired,
    error,
    createRoom,
    connect,
    disconnect,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isConnected: connectionState === ConnectionState.CONNECTED,
    getPeerConnection: () => remoteMicrophoneService.getPeerConnection(),
  };
};
