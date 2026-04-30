import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QrCode, Banknote, Check, ArrowRightLeft, ShieldCheck, ChevronRight, ChevronLeft, Upload, X, Phone, User, Mail, Sun, Moon, MapPin, ShieldAlert } from 'lucide-react';
import { cn } from './lib/utils';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';

type TransactionMode = 'upi-to-cash' | 'cash-to-upi';
type AppState = 'auth-email' | 'auth-otp' | 'profile' | 'idle' | 'payment' | 'processing' | 'success';

type TransactionRecord = {
  id: string;
  type: TransactionMode;
  amount: number;
  date: string;
  totalWithFee: number;
};

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/admin';
    }
    return false;
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
     if (typeof window !== 'undefined') {
       return localStorage.getItem('adminToken');
     }
     return null;
  });

  const [mode, setMode] = useState<TransactionMode>('upi-to-cash');
  const [amount, setAmount] = useState('');
  const [appState, setAppState] = useState<AppState>('auth-email');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [history, setHistory] = useState<TransactionRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transaction_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Profile States
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('transaction_history', JSON.stringify(history));
  }, [history]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Handle Auth transitions
  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email) setAppState('auth-otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyOtp = () => {
    if (otp.join('').length === 6) {
      setAppState('profile');
    }
  };

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call and sync with backend
    setTimeout(async () => {
      try {
        const syncRes = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            phoneNumber,
            rollNumber,
            department,
            email
          })
        });

        // Record tracking login
        await fetch('/api/users/login-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: email })
        });

      } catch (err) {
        console.error("Sync failed", err);
      }
      setIsSubmitting(false);
      setAppState('idle');
    }, 1500);
  };

  const signOut = () => {
    setAppState('auth-email');
    setEmail('');
    setOtp(['', '', '', '', '', '']);
    setFullName('');
    setPhoneNumber('');
    setRollNumber('');
    setDepartment('');
    setShowProfile(false);
    setShowHistory(false);
  };

  // Handle amount input
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 6) {
      setAmount(val);
    }
  };

  const handleTransaction = () => {
    if (!amount || parseInt(amount) === 0) return;
    if (mode === 'upi-to-cash') {
      setAppState('payment');
    } else {
      setAppState('processing');
      setTimeout(() => {
        completeTransaction();
      }, 2500);
    }
  };

  const handleVerifyPayment = () => {
    setAppState('processing');
    setTimeout(() => {
      completeTransaction();
    }, 2500);
  };

  const completeTransaction = async () => {
    const record = {
      type: mode,
      amount: parseInt(amount),
      totalWithFee: Math.ceil(parseInt(amount) * 1.05),
      userName: fullName
    };

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.error("Transaction sync failed", err);
    }

    const newRecord: TransactionRecord = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: mode,
      amount: parseInt(amount),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      totalWithFee: Math.ceil(parseInt(amount) * 1.05)
    };
    setHistory(prev => [newRecord, ...prev]);
    setAppState('success');
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    setAppState('idle');
    setAmount('');
    setReceiptImage(null);
  };

  if (isAdminMode) {
    if (!adminToken) {
      return <AdminLogin onLogin={(token) => setAdminToken(token)} />;
    }
    return <AdminPanel onLogout={() => {
      localStorage.removeItem('adminToken');
      setAdminToken(null);
      setIsAdminMode(false);
      window.history.pushState({}, '', '/');
    }} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-color)] text-[var(--text-color)] font-sans transition-colors duration-300">
      {/* Hidden Admin Access */}
      <button 
        onClick={() => {
          setIsAdminMode(true);
          window.history.pushState({}, '', '/admin');
        }}
        className="fixed bottom-4 right-4 w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-[8px] text-white/5 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all opacity-0 hover:opacity-100 z-[9999]"
      >
        REV
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Header / Branding */}
        <header className="flex flex-col items-center border-b border-[var(--border-color)] pb-6 mb-8 text-center relative">
          <div className="absolute top-0 right-0 flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--muted-text)] hover:text-[#D4AF37] transition-all shadow-md active:scale-95"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            
            {['idle', 'payment', 'processing', 'success'].includes(appState) && (
              <div className="relative">
                <button 
                  onClick={() => setShowProfile(!showProfile)}
                  className="w-8 h-8 rounded-full bg-black border border-[#D4AF37]/30 flex items-center justify-center overflow-hidden hover:border-[#D4AF37] transition-all shadow-lg active:scale-95"
                >
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-black text-[#D4AF37] text-[10px] font-bold">
                    {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                </button>

                <AnimatePresence>
                  {showProfile && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowProfile(false)}
                        className="fixed inset-0 z-40"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-64 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-1"
                      >
                        <div className="p-4 border-b border-[var(--border-color)]">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#8E8E8E] flex items-center justify-center text-black font-bold text-sm shadow-inner">
                              {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-[11px] font-bold text-[var(--text-color)] truncate uppercase tracking-wider">{fullName || 'User'}</p>
                              <p className="text-[9px] text-[var(--muted-text)] truncate lowercase">
                                {email.replace(/^(.)(.*)(?=@)/, (_, f, m) => f + "*".repeat(Math.min(m.length, 3)))}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/40 rounded-lg p-2 border border-[var(--border-color)]">
                              <p className="text-[7px] uppercase tracking-widest text-[#D4AF37] mb-0.5">Roll No</p>
                              <p className="text-[10px] font-mono text-[var(--text-color)]">{rollNumber || '-'}</p>
                            </div>
                            <div className="bg-black/40 rounded-lg p-2 border border-[var(--border-color)]">
                              <p className="text-[7px] uppercase tracking-widest text-[#D4AF37] mb-0.5">Dept</p>
                              <p className="text-[10px] uppercase text-[var(--text-color)]">{department || '-'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-1 space-y-1">
                          <button 
                            onClick={() => { setAppState('profile'); setShowProfile(false); }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-[var(--muted-text)] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-left group"
                          >
                            <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">Edit Profile</span>
                          </button>
                          <button 
                            onClick={() => { setShowHistory(true); setShowProfile(false); }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-[var(--muted-text)] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-left group"
                          >
                            <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">History</span>
                          </button>
                          <a 
                            href="https://wa.me/919392673014"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-[var(--muted-text)] hover:text-[#25D366] hover:bg-[#25D366]/5 transition-all text-left group"
                          >
                            <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">WhatsApp Support</span>
                          </a>
                          <a 
                            href="mailto:thismaharshier@gmail.com"
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-[var(--muted-text)] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-left group"
                          >
                            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">Contact Gmail</span>
                          </a>
                          <button 
                            onClick={signOut}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-[var(--muted-text)] hover:text-red-400 hover:bg-red-400/5 transition-all text-left group"
                          >
                            <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {['idle', 'payment', 'processing', 'success'].includes(appState) && (
            <div className="absolute top-0 left-0">
              <button 
                onClick={resetState} 
                className="text-[var(--muted-text)] hover:text-[#D4AF37] transition-colors flex items-center h-8"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium hidden sm:inline">Back</span>
              </button>
            </div>
          )}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            <h1 className="text-3xl font-serif tracking-widest text-[#D4AF37] uppercase">MoneySwap</h1>
          </motion.div>
          <p className="text-[10px] tracking-[0.2em] text-[var(--muted-text)] uppercase mt-2">Private Reserve Payment Gateway</p>
        </header>

        {/* Main Interface Card */}
        <div className="relative border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden p-8 shadow-2xl transition-colors duration-300">
          <AnimatePresence mode="wait">
            {appState === 'auth-email' && (
              <motion.div
                key="auth-email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center space-y-8 py-4"
              >
                <div className="w-16 h-16 bg-[#161618] rounded-2xl border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
                </div>
                
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-serif italic text-[var(--text-color)]">Welcome Back</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-text)]">Enter your email to access your workspace</p>
                </div>

                <form onSubmit={handleEmailSubmit} className="w-full relative flex items-center">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-text)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-black/20 border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 text-sm text-[var(--text-color)] placeholder:text-[#333] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="ml-3 p-4 bg-[#D4AF37] text-black rounded-xl hover:bg-white transition-all shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            )}

            {appState === 'auth-otp' && (
              <motion.div
                key="auth-otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center space-y-8 py-4"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-serif italic text-[var(--text-color)]">Check your email</h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted-text)] leading-relaxed">
                    We've sent a code to<br/>
                    <span className="text-[#D4AF37] lowercase text-[10px] tracking-normal">
                      {email.replace(/^(.)(.*)(?=@)/, (_, f, m) => f + "*".repeat(Math.min(m.length, 3)))}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && idx > 0) {
                          document.getElementById(`otp-${idx - 1}`)?.focus();
                        }
                      }}
                      className="w-10 h-14 bg-black/40 border border-[var(--border-color)] rounded-lg text-center text-xl font-light text-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div className="text-center space-y-6 w-full">
                  <p className="text-[9px] uppercase tracking-widest text-[var(--muted-text)]/60">
                    Didn't receive a code? <button type="button" className="text-[#D4AF37] hover:underline">Try again</button>
                  </p>
                  
                  <button
                    onClick={verifyOtp}
                    disabled={otp.join('').length !== 6}
                    className="w-full py-4 bg-[#D4AF37] text-black rounded-xl text-[11px] uppercase tracking-[0.3em] font-semibold hover:bg-white disabled:opacity-50 disabled:grayscale transition-all shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span>Verify Code</span>
                    <Check className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setAppState('auth-email')}
                    className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted-text)] hover:text-[#D4AF37] transition-colors"
                  >
                    Use different email
                  </button>
                </div>
              </motion.div>
            )}

            {appState === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center space-y-6"
              >
                <div className="relative group">
                  <div className="w-20 h-20 bg-[var(--card-bg)] rounded-3xl border border-[#D4AF37] flex items-center justify-center shadow-lg relative z-10 overflow-hidden">
                    <motion.div 
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <ShieldCheck className="w-10 h-10 text-[#D4AF37]" />
                    </motion.div>
                  </div>
                  <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform" />
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-serif italic text-[var(--text-color)]">Complete Your Profile</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-text)]">Please complete your profile to get started</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1">Email Profile</label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[13px] text-[var(--muted-text)] cursor-not-allowed outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1 flex items-center">
                        Phone <span className="ml-1 text-red-500/60">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/20 border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-color)] placeholder:text-[var(--muted-text)]/30 focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1 flex items-center">
                      Full Name <span className="ml-1 text-red-500/60">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/20 border border-[var(--border-color)] rounded-xl py-3.5 px-4 text-sm text-[var(--text-color)] placeholder:text-[var(--muted-text)]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1">
                        Roll Number <span className="ml-1 text-red-500/60">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 21A9..."
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        className="w-full bg-black/20 border border-[var(--border-color)] rounded-xl py-3.5 px-4 text-sm text-[var(--text-color)] placeholder:text-[var(--muted-text)]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all outline-none uppercase font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#D4AF37] ml-1">
                        Department <span className="ml-1 text-red-500/60">*</span>
                      </label>
                      <select
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-black/20 border border-[var(--border-color)] rounded-xl py-3.5 px-4 text-sm text-[var(--text-color)] focus:border-[#D4AF37] outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-[var(--muted-text)]">Select</option>
                        <option value="cse" className="bg-[var(--card-bg)]">CSE</option>
                        <option value="ece" className="bg-[var(--card-bg)]">ECE</option>
                        <option value="eee" className="bg-[var(--card-bg)]">EEE</option>
                        <option value="mech" className="bg-[var(--card-bg)]">MECH</option>
                        <option value="civil" className="bg-[var(--card-bg)]">CIVIL</option>
                        <option value="it" className="bg-[var(--card-bg)]">IT</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || !fullName || !rollNumber || !department || !phoneNumber}
                      className="w-full py-4 bg-[#D4AF37] text-black rounded-xl text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-white disabled:opacity-50 disabled:grayscale transition-all shadow-xl flex items-center justify-center space-x-2 overflow-hidden"
                    >
                      {isSubmitting ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Create Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {appState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col h-full space-y-10"
              >
                {/* Mode Selector */}
                <div className="relative flex bg-black/40 rounded-lg border border-[var(--border-color)] p-1">
                  <motion.div
                    className="absolute inset-y-1 w-[calc(50%-4px)] bg-[var(--card-bg)] rounded-md border border-[var(--border-color)] shadow-sm origin-left"
                    animate={{
                      left: mode === 'upi-to-cash' ? '4px' : 'calc(50% + 2px)',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  
                  <button
                    onClick={() => setMode('upi-to-cash')}
                    className={cn(
                      "relative z-10 flex-1 flex items-center justify-center space-x-2 py-3 transition-colors duration-200 rounded-md",
                      "text-[10px] uppercase tracking-[0.2em] font-semibold",
                      mode === 'upi-to-cash' ? "text-[#D4AF37]" : "text-[var(--muted-text)] hover:text-[var(--text-color)]"
                    )}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI to Cash</span>
                  </button>
                  <button
                    onClick={() => setMode('cash-to-upi')}
                    className={cn(
                      "relative z-10 flex-1 flex items-center justify-center space-x-2 py-3 transition-colors duration-200 rounded-md",
                      "text-[10px] uppercase tracking-[0.2em] font-semibold",
                      mode === 'cash-to-upi' ? "text-[#D4AF37]" : "text-[var(--muted-text)] hover:text-[var(--text-color)]"
                    )}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash to UPI</span>
                  </button>
                </div>

                {/* Amount Display */}
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-6">
                    {mode === 'upi-to-cash' ? 'Dispense Amount' : 'Deposit Amount'}
                  </span>
                  <div className="relative w-full max-w-[240px] mx-auto flex items-center justify-center border-b border-[var(--border-color)] pb-3">
                    <span className="text-2xl text-[var(--text-color)] font-light mt-1">₹</span>
                    <input
                      type="number"
                      autoFocus
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="amount-input ml-2 text-[var(--text-color)] bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Contextual Info */}
                <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] border-l-2 border-[#D4AF37]">
                  <div className="flex items-center space-x-3 text-[var(--muted-text)]">
                    {mode === 'upi-to-cash' ? (
                      <Banknote className="w-4 h-4 text-[var(--muted-text)]" />
                    ) : (
                      <QrCode className="w-4 h-4 text-[var(--muted-text)]" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#D4AF37]">Premium Exchange</span>
                      <span className="text-[9px] text-[var(--muted-text)]/70">5% Processing Fee Applied</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase tracking-widest text-[var(--muted-text)]">Processing via</span>
                    <span className="block text-[11px] font-serif italic text-[var(--text-color)] tracking-wider mt-0.5">MoneySwap Secure</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleTransaction}
                  disabled={!amount || parseInt(amount) === 0}
                  className={cn(
                    "w-full py-4 text-[11px] uppercase tracking-[0.3em] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2",
                    mode === 'upi-to-cash' 
                      ? "bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                      : "bg-[#D4AF37] border border-[#D4AF37] text-black hover:bg-white hover:border-white transition-colors"
                  )}
                >
                  <span className="relative z-10 flex items-center">
                    {mode === 'upi-to-cash' ? 'Generate Dispense Code' : 'Initialize Deposit'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </span>
                </button>
              </motion.div>
            )}

            {appState === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col space-y-6"
              >
                <div className="text-center space-y-1 mt-2">
                  <h3 className="font-serif text-2xl italic text-[var(--text-color)]">Transfer Liquidity</h3>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--muted-text)]">Scan to initiate transfer</p>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                  
                  {/* QR Image Box */}
                  <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.15)] flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-black" />
                  </div>
                  
                  {/* Payee Info */}
                  <div className="text-center space-y-1.5 w-full">
                    <p className="text-[var(--text-color)] font-medium tracking-wide">Kairamkonda Upendra Devi</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-[#D4AF37] font-mono text-sm tracking-wider bg-[#D4AF37]/10 px-3 py-1 rounded-md border border-[#D4AF37]/20 cursor-default">
                        9392673014@axl
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-[var(--border-color)] w-full space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[var(--muted-text)]">
                      <span>Transfer Amount</span>
                      <span className="font-mono text-xs">₹{parseInt(amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[#D4AF37]">
                      <span>Platform Fee (5%)</span>
                      <span className="font-mono text-xs">₹{Math.ceil(parseInt(amount) * 0.05).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-light text-[var(--text-color)] pt-3 border-t border-[var(--border-color)]">
                      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">Total</span>
                      <span>₹{Math.ceil(parseInt(amount) * 1.05).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                  <a 
                    href={`upi://pay?pa=9392673014@axl&pn=Kairamkonda%20Upendra%20Devi&am=${Math.ceil(parseInt(amount) * 1.05).toFixed(2)}&cu=INR`}
                    className="w-full py-3 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-[10px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all"
                  >
                    <span>Pay with UPI App</span>
                  </a>
                </div>

                {/* Receipt Image Upload */}
                <div className="w-full flex flex-col justify-center gap-2">
                  <p className="text-[10px] text-[var(--muted-text)] text-center mb-1">Upload payment screenshot for verification</p>
                  {!receiptImage ? (
                    <div className="relative w-full border border-dashed border-[var(--border-color)] hover:border-[#D4AF37] rounded-xl p-5 transition-colors group cursor-pointer bg-black/20">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      <div className="flex flex-col items-center justify-center space-y-2 text-[var(--muted-text)] group-hover:text-[#D4AF37] transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-[9px] uppercase tracking-[0.2em]">Upload Screenshot</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full border border-[#D4AF37]/50 rounded-xl overflow-hidden group shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                      <img src={receiptImage} alt="Receipt" className="w-full h-24 object-cover opacity-80" />
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setReceiptImage(null); }}
                          className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#FF4444] bg-[var(--card-bg)] px-4 py-2 border border-[#FF4444]/30 rounded-md flex items-center space-x-2 hover:bg-[#FF4444] hover:text-white transition-all z-20"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleVerifyPayment}
                  disabled={!receiptImage}
                  className="w-full py-4 text-[11px] uppercase tracking-[0.3em] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 bg-[#D4AF37] border border-[#D4AF37] text-black hover:bg-white hover:border-white disabled:hover:bg-[#D4AF37] disabled:hover:border-[#D4AF37] disabled:text-black"
                >
                  <span className="relative z-10 flex items-center">
                    Verify & Process
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </span>
                </button>
              </motion.div>
            )}

            {appState === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-16 space-y-8"
              >
                <div className="relative flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute w-32 h-32 border border-[#D4AF37] opacity-20 rounded-full"
                  />
                  
                  <div className="relative z-10 flex items-center space-x-6">
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      {mode === 'upi-to-cash' ? <QrCode className="w-8 h-8 text-[#A0A0A0]" /> : <Banknote className="w-8 h-8 text-[#A0A0A0]" />}
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <ArrowRightLeft className="w-5 h-5 text-[#D4AF37]" />
                    </motion.div>
                    <motion.div
                      animate={{ x: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      {mode === 'upi-to-cash' ? <Banknote className="w-8 h-8 text-[#A0A0A0]" /> : <QrCode className="w-8 h-8 text-[#A0A0A0]" />}
                    </motion.div>
                  </div>
                </div>
                
                <div className="text-center space-y-2 mt-4">
                  <h3 className="font-serif text-2xl italic text-[var(--text-color)]">Securing Link</h3>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--muted-text)]">AES-256-GCM Sovereign Grade</p>
                </div>
              </motion.div>
            )}

            {appState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center py-6 space-y-8"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative z-10">
                    <Check className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-[#D4AF37]/5 blur-xl"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-serif italic text-[var(--text-color)]">Liquidity Resolved</h3>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--muted-text)]">Transaction {history[0]?.id}</p>
                </div>

                {/* Receiver Info Section */}
                <div className="w-full bg-black/40 rounded-3xl border border-[#D4AF37]/20 p-6 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-16 h-16 text-[#D4AF37]" />
                  </div>
                  
                  <div className="flex items-center space-x-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-black p-[1px] shadow-lg">
                      <div className="w-full h-full bg-[#111] rounded-2xl overflow-hidden flex items-center justify-center">
                        <img 
                          src="https://raw.githubusercontent.com/thismaharshier/netha/main/IMG_20260314_103050.jpg" 
                          alt="Company Representative" 
                          className="w-full h-full object-cover opacity-80"
                        />
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] uppercase tracking-widest text-[#D4AF37] mb-0.5">Receiver / Agent</p>
                      <p className="text-sm font-medium text-[var(--text-color)]">K. Upendra Devi</p>
                      <div className="flex flex-col mt-1 space-y-0.5">
                        <div className="flex items-center text-[9px] text-[var(--muted-text)]">
                          <Phone className="w-2.5 h-2.5 mr-1 text-[#D4AF37]/60" />
                          <span>+91 93926 73014</span>
                        </div>
                        <div className="flex items-center text-[9px] text-[var(--muted-text)]">
                          <Mail className="w-2.5 h-2.5 mr-1 text-[#D4AF37]/60" />
                          <span className="lowercase">support@moneyswap.live</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--muted-text)]">
                      <span>Sender Account</span>
                      <span className="text-[var(--text-color)]">{fullName}</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--muted-text)]">
                      <span>Total Value Sent</span>
                      <span className="text-[#D4AF37] font-mono">₹{history[0]?.totalWithFee.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={resetState}
                    className="w-full py-4 bg-[#D4AF37] text-black rounded-xl text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all shadow-xl"
                  >
                    New Transaction
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <footer className="mt-8 flex flex-col items-center space-y-6">
          <div className="flex items-center justify-center space-x-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[8px] uppercase tracking-widest">Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <QrCode className="w-3.5 h-3.5" />
              <span className="text-[8px] uppercase tracking-widest">Instant Settlement</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-3 pt-4 border-t border-[var(--border-color)]/20 w-full max-w-[200px]">
            <p className="text-[7px] uppercase tracking-[0.4em] text-[var(--muted-text)] mb-1">Contact Concierge</p>
            <div className="flex space-x-4">
              <a 
                href="https://wa.me/919392673014" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-black border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all shadow-md active:scale-95 group"
              >
                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="mailto:thismaharshier@gmail.com"
                className="p-3 rounded-full bg-black border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all shadow-md active:scale-95 group"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
            </div>
            <p className="text-[8px] font-mono text-[var(--muted-text)] lowercase tracking-widest">thismaharshier@gmail.com</p>
          </div>
        </footer>

        {/* Transaction History Modal Overlay */}
        <AnimatePresence>
          {showHistory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-black/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                      <ArrowRightLeft className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif italic text-[var(--text-color)]">Transaction Ledger</h2>
                      <p className="text-[8px] uppercase tracking-widest text-[var(--muted-text)]">Personalized Transaction History</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 text-[var(--muted-text)] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {history.length > 0 ? (
                    history.map((record) => (
                      <motion.div 
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/20 border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                            record.type === 'upi-to-cash' ? "bg-red-500/5 text-red-400" : "bg-green-500/5 text-green-400"
                          )}>
                            {record.type === 'upi-to-cash' ? <QrCode className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-color)]">
                              {record.type === 'upi-to-cash' ? 'UPI to Cash' : 'Cash to UPI'}
                            </p>
                            <p className="text-[8px] text-[var(--muted-text)] mt-0.5">{record.date}</p>
                            <p className="text-[7px] font-mono text-[var(--muted-text)]/50 uppercase tracing-widest mt-1">ID: {record.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[var(--text-color)]">₹{record.totalWithFee.toLocaleString('en-IN')}</p>
                          <span className="text-[7px] uppercase tracking-widest text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/5 rounded-full border border-[#D4AF37]/10">Settled</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-[var(--muted-text)] space-y-4">
                      <div className="w-12 h-12 rounded-2xl border border-dashed border-[var(--border-color)] flex items-center justify-center opacity-30">
                        <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <p className="text-[9px] uppercase tracking-[0.2em] font-medium">No records found</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-black/40 border-t border-[var(--border-color)]">
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="w-full py-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37] rounded-xl text-[9px] uppercase tracking-[0.3em] font-bold hover:bg-[#D4AF37] hover:text-black transition-all"
                  >
                    Close Ledger
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] text-[var(--muted-text)] overflow-hidden font-mono text-[8px] uppercase leading-none select-none">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap mb-1">
            {Array.from({ length: 50 }).map((_, j) => (
              <span key={j} className="mr-8">MoneySwap Gateway Secure Private Ledger Reserve</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
