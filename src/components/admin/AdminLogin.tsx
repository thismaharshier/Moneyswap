import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, ChevronRight, ArrowRightLeft } from 'lucide-react';

export default function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Identity verification failed');
      }
    } catch (err) {
      setError('Connection to sovereign network failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0B] text-[#E0D8D0] font-sans overflow-hidden">
      {/* Decorative patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] text-[#8E8E8E] overflow-hidden font-mono text-[8px] uppercase leading-none select-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap mb-1">
            {Array.from({ length: 20 }).map((_, j) => (
              <span key={j} className="mr-8">Sovereign Reserve Access Restricted Entry Only Authorization Required</span>
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <header className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 bg-[#161618] rounded-2xl border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.1)] mb-6"
          >
            <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
          </motion.div>
          <h1 className="text-3xl font-serif tracking-[0.2em] text-[#D4AF37] uppercase">MoneySwap</h1>
          <p className="text-[10px] tracking-[0.3em] text-[#8E8E8E] uppercase mt-2">Centralized Authority Auth</p>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111112] border border-[#2A2A28] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1">Command Identity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@moneyswap.live"
                  className="w-full bg-black/20 border border-[#2A2A28] rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-[#333] focus:border-[#D4AF37] transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1">Access Protocol</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/20 border border-[#2A2A28] rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-[#333] focus:border-[#D4AF37] transition-all outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] uppercase tracking-widest text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#D4AF37] text-black rounded-xl text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-white disabled:opacity-50 transition-all shadow-xl flex items-center justify-center space-x-2"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <ArrowRightLeft className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <span>Initiate Login</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-[9px] uppercase tracking-widest text-[#8E8E8E] opacity-50">
          Hardware encrypted channel established
        </p>
      </div>
    </div>
  );
}
