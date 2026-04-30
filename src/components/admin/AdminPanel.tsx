import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowRightLeft, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  Trash2, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  UserPlus,
  CreditCard,
  Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';

type AdminView = 'dashboard' | 'users' | 'transactions' | 'settings';

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<AdminView>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const data = await res.json();
    setStats(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const data = await res.json();
    setUsers(data);
  };

  const fetchTransactions = async () => {
    const res = await fetch('/api/admin/transactions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchTransactions()]);
      setLoading(false);
    };
    init();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchUsers();
      fetchTransactions();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });
    fetchUsers();
    fetchStats();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-[#E0D8D0] font-sans selection:bg-[#D4AF37]/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#2A2A28] bg-[#111112] flex flex-col">
        <div className="p-8 border-b border-[#2A2A28]">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-[#D4AF37]" />
            <h1 className="text-xl font-serif tracking-widest text-[#D4AF37] uppercase">Sovereign</h1>
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#8E8E8E]">Admin Console</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as AdminView)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                view === item.id 
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.05)]" 
                  : "text-[#8E8E8E] hover:text-[#E0D8D0] hover:bg-[#2A2A28]/50"
              )}
            >
              <item.icon className={cn("w-5 h-5", view === item.id ? "text-[#D4AF37]" : "text-[#8E8E8E]")} />
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2A2A28]">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-[#8E8E8E] hover:text-[#FF4444] transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0A0A0B] p-10 relative">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-serif italic text-white capitalize">{view}</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#8E8E8E] mt-1">Real-time ledger access</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E]" />
              <input 
                type="text" 
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#111112] border border-[#2A2A28] rounded-xl py-2 pl-10 pr-4 text-xs tracking-wider outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all w-64"
              />
            </div>
            <button 
              onClick={() => { fetchStats(); fetchUsers(); fetchTransactions(); }}
              className="p-2.5 rounded-xl border border-[#2A2A28] text-[#8E8E8E] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all relative group"
              title="Refresh Stats"
            >
              <Bell className="w-5 h-5 group-active:rotate-180 transition-transform" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#D4AF37] rounded-full border-2 border-[#0A0A0B]" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Login metrics cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { label: 'Logins Today', value: stats?.loginStats?.today || 0, color: 'text-green-400' },
                    { label: 'This Week', value: stats?.loginStats?.week || 0, color: 'text-[#D4AF37]' },
                    { label: 'This Month', value: stats?.loginStats?.month || 0, color: 'text-blue-400' },
                  ].map((metric, i) => (
                    <div key={i} className="bg-[#111112] border border-[#2A2A28] rounded-2xl p-6 border-b-2 border-b-[#D4AF37]/20">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#8E8E8E] mb-2">{metric.label}</p>
                      <h3 className={cn("text-3xl font-light", metric.color)}>{metric.value}</h3>
                    </div>
                  ))}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Active Users', value: stats?.totalUsers || 0, icon: Users, delta: '+12%' },
                  { label: 'Total Volume', value: `₹${(stats?.totalVolume || 0).toLocaleString()}`, icon: TrendingUp, delta: '+8.4%' },
                  { label: 'Settlements', value: stats?.totalTransactions || 0, icon: ArrowRightLeft, delta: '+22' },
                  { label: 'Reserve Cap', value: '42%', icon: CreditCard, delta: 'Secure' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111112] border border-[#2A2A28] rounded-2xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                      <stat.icon className="w-16 h-16 text-[#D4AF37]" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#8E8E8E] mb-4">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-2xl font-light text-white">{stat.value}</h3>
                      <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/5 px-2 py-0.5 rounded border border-[#D4AF37]/10">{stat.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts area - Bento Style */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-[#111112] border border-[#2A2A28] rounded-3xl p-8 h-96 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-lg font-serif italic">Login Trends (Last 7 Days)</h4>
                    <div className="flex space-x-2">
                       <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]">Live Traffic Monitor</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-end justify-between px-4 pb-4 gap-2">
                     {stats?.loginStats?.chart?.map((day: any, i: number) => (
                       <div key={i} className="flex-1 flex flex-col items-center">
                         <div className="w-full text-center text-[8px] text-[var(--muted-text)] mb-2 uppercase tracking-tighter">{day.count}</div>
                         <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.min(100, (day.count / (Math.max(...stats.loginStats.chart.map((d: any) => d.count)) || 1)) * 100)}%` }}
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-1000",
                            i === 6 ? "bg-gradient-to-t from-[#D4AF37] to-white shadow-[0_0_20px_rgba(212,175,55,0.3)]" : "bg-gradient-to-t from-[#D4AF37]/10 to-[#D4AF37]/60 border-x border-t border-[#D4AF37]/30"
                          )}
                         />
                         <div className="text-[8px] mt-2 uppercase text-[var(--muted-text)] tracking-wider">{day.label}</div>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="bg-[#111112] border border-[#2A2A28] rounded-3xl p-8 flex flex-col">
                  <h4 className="text-lg font-serif italic mb-6">Recent Activity</h4>
                  <div className="flex-1 space-y-4">
                    {stats?.recentActivity?.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-black/30 border border-[#2A2A28]/50 rounded-xl hover:border-[#D4AF37]/20 transition-all cursor-pointer group">
                        <div className="flex items-center space-x-3">
                          <div className={cn("p-2 rounded-lg", t.type === 'upi-to-cash' ? "bg-red-500/5 text-red-400" : "bg-green-500/5 text-green-400")}>
                            <CreditCard className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-white uppercase tracking-wider">{t.userName}</p>
                            <p className="text-[8px] text-[#8E8E8E]">{new Date(t.date).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#D4AF37]">₹{t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111112] border border-[#2A2A28] rounded-3xl overflow-hidden"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A28] bg-black/20">
                    {['Identity', 'Status', 'Assets', 'Metrics', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-[0.3em] font-medium text-[#8E8E8E]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A28]">
                  {users.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                    <tr key={user.id} className="group hover:bg-[#D4AF37]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-black flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName[0]}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{user.fullName}</p>
                            <p className="text-[10px] text-[#8E8E8E]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest border",
                          user.status === 'active' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-mono text-[#D4AF37]">{user.phoneNumber}</p>
                        <p className="text-[9px] text-[#8E8E8E] uppercase tracking-widest">{user.department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] text-white">Joined</p>
                        <p className="text-[9px] text-[#8E8E8E]">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                           <button 
                             onClick={async () => {
                               const newStatus = user.status === 'active' ? 'blocked' : 'active';
                               await fetch(`/api/admin/users/${user.id}/status`, {
                                 method: 'PATCH',
                                 headers: { 
                                   'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                                   'Content-Type': 'application/json'
                                 },
                                 body: JSON.stringify({ status: newStatus })
                               });
                               fetchUsers();
                             }}
                             className={cn(
                               "p-2 rounded-lg transition-all",
                               user.status === 'active' ? "text-[#8E8E8E] hover:text-orange-400 hover:bg-orange-400/10" : "text-green-400 hover:bg-green-400/10"
                             )}
                             title={user.status === 'active' ? "Block User" : "Unblock User"}
                           >
                             <ShieldAlert className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-lg text-[#8E8E8E] hover:text-[#FF4444] hover:bg-[#FF4444]/10 transition-all">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-20 text-center text-[#8E8E8E] space-y-4">
                   <Users className="w-12 h-12 mx-auto opacity-20" />
                   <p className="text-xs uppercase tracking-[0.2em]">No reserve entities identified</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'transactions' && (
             <motion.div
               key="transactions"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="bg-[#111112] border border-[#2A2A28] rounded-3xl overflow-hidden"
             >
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-[#2A2A28] bg-black/20">
                     {['Asset', 'Identity', 'Mode', 'Amount', 'Status'].map(h => (
                       <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-[0.3em] font-medium text-[#8E8E8E]">{h}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2A2A28]">
                   {transactions.map((t) => (
                     <tr key={t.id} className="group hover:bg-[#D4AF37]/5 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex items-center space-x-2">
                           <ShieldAlert className="w-4 h-4 text-[#D4AF37]/60" />
                           <span className="text-[10px] font-mono text-white">{t.id}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <p className="text-sm text-white font-medium">{t.userName}</p>
                       </td>
                       <td className="px-6 py-4">
                         <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] flex items-center space-x-2">
                           {t.type === 'upi-to-cash' ? <CreditCard className="w-3 h-3 text-red-400" /> : <TrendingUp className="w-3 h-3 text-green-400" />}
                           <span>{t.type.replace(/-/g, ' ')}</span>
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right pr-20">
                         <p className="text-sm font-medium text-white">₹{t.totalWithFee}</p>
                         <p className="text-[9px] text-[#D4AF37]">Net: ₹{t.amount}</p>
                       </td>
                       <td className="px-6 py-4">
                         <div className="inline-flex items-center space-x-2 text-[10px] text-green-400 bg-green-500/5 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
                           <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                           <span>Settled</span>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </motion.div>
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl bg-[#111112] border border-[#2A2A28] rounded-3xl p-10 space-y-10"
            >
              <section className="space-y-6">
                <h4 className="text-xl font-serif italic">Security Protocols</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-black/40 border border-[#2A2A28] rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Change Admin Key</p>
                      <p className="text-[10px] text-[#8E8E8E] mt-1">Rotate credentials for the sovereign layer</p>
                    </div>
                    <button className="px-6 py-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#D4AF37] hover:text-black transition-all">Update</button>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-black/40 border border-[#2A2A28] rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Two-Factor Encryption</p>
                      <p className="text-[10px] text-[#8E8E8E] mt-1">Require secondary hardware token</p>
                    </div>
                    <div className="w-12 h-6 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-[#D4AF37] rounded-full shadow-lg shadow-[#D4AF37]/50" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
               <h4 className="text-xl font-serif italic">Data Governance</h4>
               <div className="grid grid-cols-2 gap-4">
                  <button className="p-6 bg-black/40 border border-[#2A2A28] rounded-2xl text-left group hover:border-[#D4AF37]/30 transition-all">
                    <Trash2 className="w-6 h-6 text-[#8E8E8E] group-hover:text-[#FF4444] mb-3 transition-colors" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Flush Cache</p>
                    <p className="text-[9px] text-[#8E8E8E] mt-1">Clear non-permanent ledger data</p>
                  </button>
                  <button className="p-6 bg-black/40 border border-[#2A2A28] rounded-2xl text-left group hover:border-[#D4AF37]/30 transition-all">
                    <ArrowRightLeft className="w-6 h-6 text-[#8E8E8E] group-hover:text-[#D4AF37] mb-3 transition-colors" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Export Ledger</p>
                    <p className="text-[9px] text-[#8E8E8E] mt-1">Download ISO/IEC 20022 compliant logs</p>
                  </button>
               </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
