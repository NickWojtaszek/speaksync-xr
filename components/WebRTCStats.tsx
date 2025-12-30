import React, { useEffect, useRef, useState } from 'react';
import { ConnectionState } from '../services/remoteMicrophoneService';

interface WebRTCStatsProps {
  peerConnection: RTCPeerConnection | null;
  connectionState: ConnectionState;
}

interface Stats {
  bitrate: number;
  latency: number;
  packetLoss: number;
  codec: string;
  jitter: number;
  bytesReceived: number;
}

/**
 * Displays real-time WebRTC connection statistics
 */
export const WebRTCStats: React.FC<WebRTCStatsProps> = ({
  peerConnection,
  connectionState,
}) => {
  const [stats, setStats] = useState<Stats>({
    bitrate: 0,
    latency: 0,
    packetLoss: 0,
    codec: 'Unknown',
    jitter: 0,
    bytesReceived: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const prevBytesRef = useRef(0);
  const statsIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!peerConnection || connectionState !== ConnectionState.CONNECTED) {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      return;
    }

    const updateStats = async () => {
      try {
        const report = await peerConnection.getStats();
        let audioCodec = 'Unknown';
        let totalBitrate = 0;
        let roundTripTime = 0;
        let jitter = 0;
        let packetsLost = 0;
        let bytesReceived = 0;

        report.forEach((stat) => {
          // Inbound RTP stats
          if (stat.type === 'inbound-rtp' && stat.mediaType === 'audio') {
            bytesReceived = stat.bytesReceived || 0;
            packetsLost = stat.packetsLost || 0;
            jitter = ((stat.jitter || 0) * 1000).toFixed(2);
          }

          // Candidate pair stats (for RTT and bitrate)
          if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
            roundTripTime = ((stat.currentRoundTripTime || 0) * 1000).toFixed(1);
            // Calculate bitrate from available-outbound-bitrate
            if (stat.availableOutgoingBitrate) {
              totalBitrate = (stat.availableOutgoingBitrate / 1000).toFixed(0);
            }
          }

          // Codec info
          if (stat.type === 'inbound-rtp' && stat.mediaType === 'audio') {
            const codecReport = report.get(stat.codecId || '');
            if (codecReport && 'mimeType' in codecReport) {
              audioCodec = codecReport.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown';
            }
          }
        });

        // Calculate packet loss percentage
        let packetLossPercentage = 0;
        report.forEach((stat) => {
          if (stat.type === 'inbound-rtp' && stat.mediaType === 'audio') {
            const packetsReceived = (stat.packetsReceived || 0);
            if (packetsReceived + packetsLost > 0) {
              packetLossPercentage = (
                (packetsLost / (packetsReceived + packetsLost)) * 100
              ).toFixed(2);
            }
          }
        });

        setStats({
          bitrate: Number(totalBitrate),
          latency: Number(roundTripTime),
          packetLoss: Number(packetLossPercentage),
          codec: audioCodec,
          jitter: Number(jitter),
          bytesReceived,
        });
      } catch (error) {
        console.error('Error fetching WebRTC stats:', error);
      }
    };

    updateStats();
    statsIntervalRef.current = setInterval(updateStats, 1000);

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [peerConnection, connectionState]);

  if (connectionState !== ConnectionState.CONNECTED) {
    return null;
  }

  return (
    <div className="w-full space-y-2 border-t border-gray-700 pt-3 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors"
      >
        <span>📊 Connection Stats</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="bg-gray-900/50 rounded border border-gray-700 p-3 space-y-2 text-xs text-gray-300">
          <div className="grid grid-cols-2 gap-2">
            <StatItem label="Bitrate" value={`${stats.bitrate} Kbps`} />
            <StatItem label="Latency" value={`${stats.latency} ms`} />
            <StatItem label="Packet Loss" value={`${stats.packetLoss}%`} />
            <StatItem label="Jitter" value={`${stats.jitter} ms`} />
          </div>
          <div className="border-t border-gray-700 pt-2 space-y-1">
            <StatItem label="Codec" value={stats.codec} full />
            <StatItem label="Total Bytes" value={formatBytes(stats.bytesReceived)} full />
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string | number; full?: boolean }> = ({
  label,
  value,
  full,
}) => (
  <div className={full ? 'w-full' : ''}>
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-200">{value}</span>
    </div>
  </div>
);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default WebRTCStats;
