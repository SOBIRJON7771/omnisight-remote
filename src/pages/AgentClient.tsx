import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, StopCircle, Shield, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';

export function AgentClient() {
  const { sessionId: paramSessionId } = useParams();
  const [sessionId] = useState(paramSessionId || '');
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>(['OmniSight Agent v1.1.0 (Cloud Enabled) initialized']);
  const [isConnected, setIsConnected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeConnectionRef = useRef<DataConnection | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    // Initialize Peer with public STUN servers for firewall traversal
    const peer = new Peer(sessionId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      addLog(`Gateway open. Remote ID: ${id}`);
    });

    peer.on('connection', (conn) => {
      activeConnectionRef.current = conn;
      setIsConnected(true);
      addLog('Controller connected. Establishing data pipe...');

      conn.on('data', (data: any) => {
        addLog(`Remote Event: ${data.type}`);
      });

      conn.on('close', () => {
        setIsConnected(false);
        addLog('Controller disconnected.');
      });
    });

    peer.on('call', (call) => {
      addLog('Stream request received.');
      if (streamRef.current) {
        call.answer(streamRef.current);
        addLog('Streaming active.');
      } else {
        addLog('Warning: Host stream not active.');
      }
    });

    peer.on('error', (err) => {
      addLog(`ERR: ${err.type}`);
      console.error('Peer error:', err);
    });

    peerRef.current = peer;

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      peer.destroy();
    };
  }, [sessionId]);

  const startSharing = async () => {
    try {
      addLog('Requesting display access...');
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      
      streamRef.current = media;
      setIsSharing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
      
      addLog('Screen share live. Ready for remote connection.');

      media.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        addLog('PERMISSION DENIED.');
      } else {
        addLog(`System Error: ${err.message}`);
      }
    }
  };

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsSharing(false);
    addLog('Sharing terminated.');
  };

  const copyId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('ID copied to clipboard');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_400px] bg-[#050505]">
      {/* Visual Workspace */}
      <div className="p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 to-transparent pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {!isSharing ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md w-full"
            >
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl text-center shadow-2xl">
                <div className="w-20 h-20 bg-orange-600/20 border border-orange-500/20 rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-8">
                  <Share2 size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-4">Remote Hosting</h2>
                <p className="text-white/40 mb-10 leading-relaxed">
                  Allow remote access by sharing your screen. Use the 6-digit code below to connect from another device.
                </p>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <span className="font-mono text-2xl tracking-[0.2em] text-orange-500 font-bold">{sessionId}</span>
                    <button onClick={copyId} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all">
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>

                  <button 
                    onClick={startSharing}
                    className="w-full py-5 bg-orange-600 hover:bg-orange-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,88,12,0.2)]"
                  >
                    <Share2 size={24} /> Initialize Share
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="sharing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                  <h2 className="text-2xl font-bold">Broadcasting Screen</h2>
                </div>
                <button 
                  onClick={stopSharing}
                  className="px-6 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-500 rounded-2xl font-bold flex items-center gap-2 transition-all"
                >
                  <StopCircle size={20} /> Kill Stream
                </button>
              </div>

              <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase">
                    Monitoring Active
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Info & Logs */}
      <div className="bg-white/[0.02] border-l border-white/5 p-8 flex flex-col gap-8">
        <div>
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Cloud Status</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-xs text-white/40 mb-1">Controller</div>
              <div className={`font-bold text-[10px] ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                {isConnected ? 'ONLINE' : 'DISCONNECTED'}
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-xs text-white/40 mb-1">Encrypted</div>
              <div className="font-bold text-[10px] text-blue-400">AES-256</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Agent Terminal Logs</div>
          <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-6 font-mono text-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 text-white/40">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-orange-900 leading-tight">#</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
              <div className="text-orange-500/50 animate-pulse mt-2">_</div>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2 text-green-500/50">
              <Terminal size={12} />
              <span className="text-[9px] uppercase font-bold tracking-widest">Awaiting Remote commands</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-orange-600/5 border border-orange-500/10 rounded-2xl flex items-start gap-4">
          <Shield className="text-orange-500 shrink-0" size={20} />
          <div>
            <h4 className="text-xs font-bold mb-1">Enterprise Mode</h4>
            <p className="text-[10px] text-white/40 leading-relaxed">
              This browser client is intended for demonstration. Use the desktop binary for low-level OS kernel injection and latency optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
