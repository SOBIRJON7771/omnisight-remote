import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, StopCircle, Shield, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { socketService } from '../services/socket';

export function AgentClient() {
  const { sessionId: paramSessionId } = useParams();
  const [sessionId] = useState(paramSessionId || '');
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>(['OmniSight Agent v1.0.0 initialized']);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, addStream, isConnected } = useWebRTC(sessionId, false);
  const socket = socketService.getSocket();

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const startSharing = async () => {
    try {
      addLog('Requesting screen capture permission...');
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        } as any,
        audio: false
      });
      
      setIsSharing(true);
      addStream(media);
      
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
      
      addLog('Screen share active. Stream added to peer connection.');

      media.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        addLog('PERMISSION DENIED: You must allow screen access in the browser prompt.');
        addLog('TIP: If no prompt appeared, try opening the app in a NEW TAB.');
      } else {
        addLog(`Error: ${err.message}`);
      }
      console.error('Display media error:', err);
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsSharing(false);
    addLog('Screen share stopped.');
  };

  const copyId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('Session ID copied to clipboard');
  };

  useEffect(() => {
    if (isConnected) {
      addLog('Remote controller connected. Transmitting data...');
    }
  }, [isConnected]);

  // Handle incoming remote commands
  useEffect(() => {
    if (!socket) return;

    const handleCommand = (command: any) => {
      // In a real agent (Electron), we would use RobotJS here.
      // In the browser, we just log it for the demo.
      addLog(`Remote Command Received: ${command.type}`);
    };

    socket.on('signal', (data: any) => {
      if (data.signal?.type === 'command') {
        handleCommand(data.signal.payload);
      }
    });

    return () => {
      socket.off('signal');
    };
  }, [socket]);

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
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl text-center">
                <div className="w-20 h-20 bg-orange-600/20 border border-orange-500/20 rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-8">
                  <Share2 size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-4">Start Hosting</h2>
                <p className="text-white/40 mb-10 leading-relaxed">
                  Generate a secure session code and share your display to allow remote control access.
                </p>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <span className="font-mono text-xl tracking-wider text-orange-500 font-bold">{sessionId}</span>
                    <button onClick={copyId} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all">
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>

                  <button 
                    onClick={startSharing}
                    className="w-full py-5 bg-orange-600 hover:bg-orange-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-colors"
                  >
                    <Share2 size={24} /> Share Your Screen
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
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <h2 className="text-2xl font-bold">Live Stream Active</h2>
                </div>
                <button 
                  onClick={stopSharing}
                  className="px-6 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-500 rounded-2xl font-bold flex items-center gap-2 transition-all"
                >
                  <StopCircle size={20} /> Stop Sharing
                </button>
              </div>

              <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium">
                    Content is being shared securely
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
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Connection Stats</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-xs text-white/40 mb-1">Status</div>
              <div className={`font-bold ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                {isConnected ? 'CONNECTED' : 'WAITING'}
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-xs text-white/40 mb-1">Peers</div>
              <div className="font-bold">{isConnected ? '2' : '1'}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Agent Terminal</div>
          <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-6 font-mono text-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 text-white/60">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-orange-900 leading-tight">$</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2 text-orange-500 animate-pulse">
              <div className="w-1.5 h-4 bg-orange-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Listening for commands</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-orange-600/5 border border-orange-500/10 rounded-2xl flex items-start gap-4">
          <Shield className="text-orange-500 shrink-0" size={24} />
          <div>
            <h4 className="text-sm font-bold mb-1">Security Notice</h4>
            <p className="text-xs text-white/40 leading-relaxed">
              For complete OS control, download the OmniSight Desktop Agent. The web client is limited to view-only and restricted input demonstration.
            </p>
            <a href="#" className="mt-3 text-orange-500 text-[10px] font-bold uppercase flex items-center gap-1 hover:underline">
              Download Agent <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
