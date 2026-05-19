import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socketService } from '../services/socket';

export function useWebRTC(sessionId: string, isInitiator: boolean) {
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const socket = socketService.connect();

  useEffect(() => {
    socket.emit('join-session', sessionId);

    const initPeer = (initiator: boolean, initialStream: MediaStream | null) => {
      const p = new Peer({
        initiator,
        trickle: true, // Recommended for better NAT traversal
        stream: initialStream || undefined,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      p.on('signal', (data) => {
        socket.emit('signal', { sessionId, signal: data });
      });

      p.on('stream', (remote) => {
        setRemoteStream(remote);
      });

      p.on('connect', () => {
        setIsConnected(true);
        console.log('Peer connected');
      });

      p.on('close', () => {
        setIsConnected(false);
        console.log('Peer closed');
      });

      p.on('error', (err) => {
        console.error('Peer error:', err);
      });

      peerRef.current = p;
      setPeer(p);
    };

    if (!isInitiator) {
      // Agent side doesn't necessarily start with a stream, 
      // but usually the Agent is the one providing the screen.
      initPeer(false, null);
    } else {
      // Admin side starts as initiator
      initPeer(true, null);
    }

    const handleSignal = ({ signal }: { signal: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    };

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [sessionId, isInitiator]);

  const addStream = (newStream: MediaStream) => {
    setStream(newStream);
    if (peerRef.current) {
      peerRef.current.addStream(newStream);
    }
  };

  return { peer, stream, remoteStream, isConnected, addStream };
}
