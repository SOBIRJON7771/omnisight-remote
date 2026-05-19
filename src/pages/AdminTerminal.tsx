import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Monitor, Terminal, Settings, Power, Activity, MousePointer, Keyboard, ShieldAlert, Maximize2 } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { socketService } from '../services/socket';

export function AdminTerminal() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [latency, setLatency] = useState(0);
  const [fps, setFps] = useState(0);
  const [logs, setLogs] = useState<string[]>(['OmniSight Controller v1.0.0 initializing...']);
  
  const { remoteStream, isConnected } = useWebRTC(sessionId || '', true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const socket = socketService.getSocket();

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-15), `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream;
      addLog('Remote stream received. Synchronizing frames...');
    }
  }, [remoteStream]);

  useEffect(() => {
    if (isConnected) {
      addLog('Secure tunnel established with Host Agent.');
    }
  }, [isConnected]);

  // Simulate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 15) + 5);
      setFps(Math.floor(Math.random() * 5) + 55);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = (type: string, payload: any) => {
    if (socket) {
      socket.emit('signal', {
        sessionId,
        signal: { type: 'command', payload: { type, ...payload } }
      });
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

  const handleKeyDown = (e: KeyboardEvent) => {
    sendCommand('key-down', { key: e.key, code: e.code });
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
      {/* Top Navigation / Status Bar */}
      <header className="h-16 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6 shrink-0">
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
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              STATUS: <span className="text-green-500 uppercase font-bold">{isConnected ? 'Encrypted' : 'Connecting'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono">
           <span className="text-white/40">LAT:</span> <span className="text-orange-500 font-bold">{latency}ms</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono">
           <span className="text-white/40">FPS:</span> <span className="text-blue-400 font-bold">{fps}</span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
            <Maximize2 size={18} />
          </button>
          <button onClick={() => navigate('/')} className="px-4 h-10 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
            <Power size={16} /> Disconnect
          </button>
        </div>
      </header>

      {/* Main Connection Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Remote Monitor Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 bg-black relative flex items-center justify-center p-8 overflow-hidden group"
          onMouseMove={handleMouseEvent}
          onClick={handleMouseClick}
          onContextMenu={(e) => { e.preventDefault(); handleMouseClick(e); }}
        >
          {/* Grid Pattern overlay for "tech" feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
          />

          {!remoteStream ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-8" />
              <h3 className="text-2xl font-bold tracking-tight mb-2">Establishing Handshake</h3>
              <p className="text-white/40 font-light italic">Waiting for host display stream...</p>
            </div>
          ) : (
            <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.1)] border border-white/10">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-[calc(100vh-200px)] object-contain cursor-none"
              />
              {/* Virtual Cursor */}
              <div className="absolute inset-0 z-50 pointer-events-none transition-opacity duration-300">
                {/* Custom Overlay Icons (Floating menus could go here) */}
              </div>
            </div>
          )}

          {/* Quick Controls Hover Overlay */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-xs font-bold text-white/60 hover:text-white">
              <MousePointer size={14} /> Mouse Control
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-xs font-bold text-white/60 hover:text-white">
              <Keyboard size={14} /> Keyboard Input
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-xs font-bold text-white/60 hover:text-white">
              <Settings size={14} /> Stream Settings
            </button>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="w-80 border-l border-white/5 bg-white/[0.01] hidden xl:flex flex-col">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-white/30 tracking-[0.2em] mb-4">
              <Terminal size={12} /> COMMAND OUTPUT
            </div>
            <div className="h-48 bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[10px] overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-orange-900">$</span>
                  <span className="text-white/60 whitespace-pre-wrap">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-white/30 tracking-[0.2em] mb-4">
              <Monitor size={12} /> HOST SPECS
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">OS</span>
                <span className="text-xs font-medium">Windows 11 Pro 23H2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Resolution</span>
                <span className="text-xs font-medium">2560 x 1440 (16:9)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Connection</span>
                <span className="text-xs font-medium text-blue-400">P2P Direct</span>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 bg-orange-600/[0.03] flex flex-col justify-end">
            <div className="p-4 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="text-orange-500 shrink-0" size={20} />
              <div>
                <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Security Enforcement</h4>
                <p className="text-[10px] text-white/40 leading-relaxed font-light">
                  Input injection is restricted to browser sandbox for demonstration. Use Desktop Controller for native OS execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
