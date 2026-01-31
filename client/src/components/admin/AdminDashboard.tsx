import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, LogOut, Users } from 'lucide-react';

interface ClanStat {
  id: number;
  name: string;
  current_count: number;
  max_capacity: number;
}

export const AdminDashboard = () => {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<ClanStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/admin/stats', {
        headers: {
          'X-Admin-Secret': key
        }
      });

      if (res.status === 401) {
        setError('Invalid Secret Key');
        setIsAuthenticated(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setStats(data || []); // Ensure we default to empty array if null
      setIsAuthenticated(true);
    } catch (err) {
      setError('Network Error or Server Offline');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(secret);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 glass-card rounded-3xl text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-500/10 rounded-full">
            <Shield className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Mission Control</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter Admin Secret"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </motion.div>
    );
  }

  // Dashboard Screen
  return (
    <div className="w-full max-w-5xl p-6 space-y-8">
      <div className="flex items-center justify-between text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-indigo-400" /> Admin Dashboard
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => fetchStats(secret)}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setIsAuthenticated(false); setSecret(''); }}
            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((clan) => {
          const percentage = (clan.current_count / clan.max_capacity) * 100;
          const isFull = clan.current_count >= clan.max_capacity;

          return (
            <motion.div
              key={clan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border ${isFull ? 'bg-red-900/10 border-red-500/30' : 'glass-card border-white/10'} relative overflow-hidden`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-white leading-tight">{clan.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${isFull ? 'bg-red-500 text-white' : 'bg-green-500/20 text-green-400'}`}>
                  {isFull ? 'FULL' : 'OPEN'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Users size={14}/> Capacity</span>
                  <span className="text-white font-mono">{clan.current_count} / {clan.max_capacity}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};