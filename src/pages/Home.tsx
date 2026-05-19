import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Monitor, Shield, Zap, ArrowRight, Laptop, Terminal } from 'lucide-react';
import { nanoid } from 'nanoid';

export function Home() {
  const [sessionId, setSessionId] = useState('');
  const navigate = useNavigate();

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      navigate(`/admin/${sessionId}`);
    }
  };

  const startAsAgent = () => {
    const newId = Math.random().toString().substring(2, 8);
    navigate(`/agent/${newId}`);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-bold text-xl">Ω</div>
          <span className="font-bold text-xl tracking-tight">OMNISIGHT <span className="text-orange-500">REMOTE</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <button onClick={startAsAgent} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/10 transition-all">
            Host Screen
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} /> Ultra-Low Latency Access
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-sans tracking-tight leading-[0.9] mb-8">
              CONTROL <br /> 
              <span className="text-white/40">ANYWHERE.</span>
            </h1>
            <p className="text-xl text-white/50 max-w-lg mb-10 leading-relaxed font-light">
              The next generation of remote desktop access. Secure, encrypted, and designed for the most demanding environments.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleConnect} className="relative flex-1 group">
                <input 
                  type="text" 
                  placeholder="Enter Session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-white/20"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  Connect <ArrowRight size={18} />
                </button>
              </form>
              <button 
                onClick={startAsAgent}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all"
              >
                <Laptop size={20} /> Host This Device
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[2.5rem] p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <div className="text-xs font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={12} /> Secure Terminal Connection
                </div>
              </div>
              
              <div className="space-y-4 font-mono text-sm">
                <div className="flex gap-3">
                  <span className="text-orange-500">▶</span>
                  <span className="text-white/80">initializing_omnishield_v1.0.4...</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-500">✔</span>
                  <span className="text-white/80">handshake_complete: tunnel_established</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-500">✔</span>
                  <span className="text-white/80">encryption: AES-256-GCM Active</span>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                    <span>REMOTE HOST ADDRESS</span>
                    <span className="text-orange-500">CONNECTED</span>
                  </div>
                  <div className="h-40 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 to-transparent" />
                    <Monitor size={48} className="text-white/10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative orbit */}
            <div className="absolute -inset-10 border border-white/5 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
            <div className="absolute -inset-20 border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-40">
          {[
            { icon: Shield, title: "Zero Trust Architecture", desc: "Every connection is verified and encrypted end-to-end using state-of-the-art protocols." },
            { icon: Zap, title: "Nano-Latency Protocol", desc: "Our custom WebRTC implementation ensures real-time responsiveness even on low-bandwidth networks." },
            { icon: Monitor, title: "Multi-Platform Mastery", desc: "Access any machine from any browser. No installation required for the controller." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-600/20 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
