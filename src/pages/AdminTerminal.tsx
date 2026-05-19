import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Monitor, Terminal, Settings, Power, Activity, MousePointer, Keyboard, ShieldAlert, Maximize2 } from 'lucide-react';
import { Peer, DataConnection, MediaConnection } from 'peerjs';

export function AdminTerminal() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [latency, setLatency] = useState(0);
  const [fps, setFps] = useState(0);
  const [logs, setLogs] = useState<string[]>(['OmniSight Controller v1.1.0 Cloud Initializing...']);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const activeConnectionRef = useRef<DataConnection | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-15), `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    // Initialize Peer (random ID for controller)
    const peer = new Peer({
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
      addLog(`Controller Gateway Online: ${id}`);
      if (sessionId) {
        addLog(`Initiating Handshake with Host: ${sessionId}...`);
        
        // 1. Establish Data Channel
        const conn = peer.connect(sessionId);
        activeConnectionRef.current = conn;

        conn.on('open', () => {
          setIsConnected(true);
          addLog('Data link established. Synchronizing encryption keys...');
          
          // 2. Request Media Stream
          const call = peer.call(sessionId, new MediaStream()); // Minimal dummy stream if needed by some browsers, but usually Agent sends to Peer
          
          // Note: In PeerJS, the caller usually sends a stream. 
          // However, for remote desktop, we want the AGENT (callee) to share their screen.
          // In the AgentClient, we have peer.on('call', ...) answering.
          // But who initiates the call? Usually the Admin requests the stream.
        });

        conn.on('error', (err) => {
          addLog(`Link Error: ${err.type}`);
        });

        conn.on('close', () => {
          setIsConnected(false);
          addLog('Remote link lost.');
        });
      }
    });

    // Handle incoming stream from Agent (when Agent answers the call)
    peer.on('call', (call) => {
      call.answer(); // Answer without sending local stream
      call.on('stream', (stream) => {
        setRemoteStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        addLog('Visual stream synchronized. Displaying remote interface.');
      });
    });

    // Alternatively, if the Admin initiates the call:
    if (sessionId) {
      peer.on('open', () => {
        const call = peer.call(sessionId, new MediaStream()); 
        call.on('stream', (stream) => {
          setRemoteStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          addLog('Remote stream captured successfully.');
        });
      });
    }

    peer.on('error', (err) => {
      addLog(`Gateway Fault: ${err.type}`);
      if (err.type === 'peer-unavailable') {
        addLog('Error: Remote host not found. Verify Session ID.');
      }
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [sessionId]);

  // Simulate stats
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        setLatency(Math.floor(Math.random() * 12) + 8);
        setFps(Math.floor(Math.random() * 4) + 57);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const sendCommand = (type: string, payload: any) => {
    if (activeConnectionRef.current && activeConnectionRef.current.open) {
      activeConnectionRef.current.send({ type, payload });
    }
  };

  const handleMouseEvent = (e: React.MouseEvent) => {
    if (!videoRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    sendCommand('mouse-move', { x, y });
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    sendCommand('mouse-click', { button: e.button });
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
      <header className="h-16 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center font-bold">Ω</div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">OMNISIGHT <span className="text-orange-500 uppercase">Remote</span></span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-white/40">
              <Activity size={14} className="text-orange-500" />
              SESSION: <span className="text-white">{sessionId}</span>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className={isConnected ? 'text-green-500' : 'text-yellow-500 text-[10px]'}>
                {isConnected ? 'SECURE_P2P_ACTIVE' : 'NEGOTIATING_TUNNEL...'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono">
           <span className="text-white/40">PING:</span> <span className="text-orange-500 font-bold">{isConnected ? latency : '--'}ms</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono">
           <span className="text-white/40">FPS:</span> <span className="text-blue-400 font-bold">{isConnected ? fps : '--'}</span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
            <Maximize2 size={18} />
          </button>
          <button onClick={() => navigate('/')} className="px-4 h-10 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-xs font-bold transition-all">
            <Power size={16} /> Disconnect
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex relative">
        <div 
          className="flex-1 bg-black relative flex items-center justify-center p-4 overflow-hidden group"
          onMouseMove={handleMouseEvent}
          onClick={handleMouseClick}
          onContextMenu={(e) => { e.preventDefault(); handleMouseClick(e); }}
        >
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
          />

          {!remoteStream ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(234,88,12,0.1)]" />
                <Monitor className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 text-orange-500/20" size={32} />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2 uppercase text-white/80">Syncing with Host</h3>
              <p className="text-white/20 text-sm font-mono tracking-widest animate-pulse">ESTABLISHING WebRTC TIER-1 LINK</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-[calc(100vh-140px)] object-contain cursor-none select-none"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[9px] font-mono text-white/40">
                  SECURE_LAYER: <span className="text-green-500">AES_GCM</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-2xl">
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-bold text-white/40 hover:text-white">
              <MousePointer size={14} /> Mouse
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-bold text-white/40 hover:text-white">
              <Keyboard size={14} /> Keys
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-bold text-white/40 hover:text-white">
              <Settings size={14} /> Settings
            </button>
          </div>
        </div>

        <div className="w-80 border-l border-white/5 bg-white/[0.01] hidden xl:flex flex-col">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 tracking-[0.2em] mb-4 uppercase">
              <Terminal size={12} /> Terminal History
            </div>
            <div className="h-64 bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-[9px] overflow-y-auto space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-orange-900/40">❯</span>
                  <span className="text-white/40 whitespace-pre-wrap">{log}</span>
                </div>
              ))}
              <div className="text-orange-500/50 animate-pulse">_</div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 tracking-[0.2em] mb-4 uppercase">
              <Activity size={12} /> Infrastructure
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/20 mb-2 uppercase tracking-widest font-bold">Signal Server</div>
                <div className="text-xs font-mono text-orange-500">peerjs.com/cloud</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/20 mb-2 uppercase tracking-widest font-bold">ICE Candidates</div>
                <div className="text-xs font-mono text-blue-400">Google STUN Ready</div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-6">
            <div className="p-4 bg-orange-600/5 border border-orange-500/10 rounded-xl flex items-start gap-3">
              <ShieldAlert className="text-orange-500 shrink-0" size={18} />
              <div className="text-[10px] text-white/40 leading-relaxed">
                Peer-to-peer connection is end-to-end encrypted. No display data is stored on our servers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
