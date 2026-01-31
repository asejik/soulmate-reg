import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, LogOut, Users, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

interface ClanStat {
  id: number;
  name: string;
  current_count: number;
  max_capacity: number;
}

interface Participant {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  gender: string;
  country: string;
  state: string;
  age_group: string;
  religion: string;
  church_name: string;
  instagram_handle: string;
  relationship_status: string;
}

export const AdminDashboard = () => {
  // Auth State
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Data State
  const [stats, setStats] = useState<ClanStat[]>([]);
  const [selectedClan, setSelectedClan] = useState<ClanStat | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Auto-Login on Mount
  useEffect(() => {
    const savedSecret = localStorage.getItem('soulmate_admin_secret');
    if (savedSecret) {
      setSecret(savedSecret);
      fetchStats(savedSecret);
    }
  }, []);

  // 2. Fetch Dashboard Stats
  const fetchStats = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/admin/stats', {
        headers: { 'X-Admin-Secret': key }
      });

      if (res.status === 401) {
        setError('Invalid Secret Key');
        setIsAuthenticated(false);
        localStorage.removeItem('soulmate_admin_secret'); // Clear invalid secret
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setStats(data || []);
      setIsAuthenticated(true);

      // Save valid secret for persistence
      localStorage.setItem('soulmate_admin_secret', key);
    } catch (err) {
      setError('Network Error or Server Offline');
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Participants
  const fetchParticipants = async (clan: ClanStat) => {
    setLoading(true);
    setSelectedClan(clan);
    try {
      const res = await fetch(`http://localhost:8080/api/admin/participants?clan_id=${clan.id}`, {
        headers: { 'X-Admin-Secret': secret }
      });
      const data = await res.json();
      setParticipants(data || []);
    } catch (err) {
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(secret);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSecret('');
    setStats([]);
    setSelectedClan(null);
    localStorage.removeItem('soulmate_admin_secret');
  };

  // --- VIEW 1: LOGIN SCREEN ---
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

  // --- VIEW 2: PARTICIPANT TABLE ---
  if (selectedClan) {
    return (
      <div className="w-full max-w-7xl p-6 space-y-6">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setSelectedClan(null); setParticipants([]); }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{selectedClan.name}</h1>
              <p className="text-slate-400 text-sm">
                {participants.length} / {selectedClan.max_capacity} Participants
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchParticipants(selectedClan)}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-white uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Full Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Demographics</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No participants yet.
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white">
                      {p.full_name}
                      <div className="text-xs text-indigo-400 mt-1">{p.instagram_handle}</div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2"><Mail size={12}/> {p.email}</div>
                      <div className="flex items-center gap-2"><Phone size={12}/> {p.whatsapp_number}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2"><MapPin size={12}/> {p.state}, {p.country}</div>
                    </td>
                    <td className="p-4">
                      {p.gender}, {p.age_group}<br/>
                      <span className="text-xs opacity-70">{p.relationship_status}</span>
                    </td>
                    <td className="p-4">
                      {p.religion}<br/>
                      <span className="text-xs opacity-70">{p.church_name || '-'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- VIEW 3: CLAN GRID ---
  return (
    <div className="w-full max-w-6xl p-6 space-y-8">
      <div className="flex items-center justify-between text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-indigo-400" /> Admin Dashboard
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => fetchStats(secret)}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
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
              layoutId={`clan-${clan.id}`}
              onClick={() => fetchParticipants(clan)}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-2xl border cursor-pointer transition-colors ${isFull ? 'bg-red-900/10 border-red-500/30 hover:bg-red-900/20' : 'glass-card border-white/10 hover:bg-white/10'} relative overflow-hidden`}
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

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 text-xs text-center text-indigo-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view participants
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};