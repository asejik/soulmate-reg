import { useState, useEffect } from 'react';
import { Heart, Mail, Calendar, User, Search, ExternalLink, X } from 'lucide-react';
import { fetchLMS } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface GivingCommitment {
  commitment_text: string;
  created_at: string;
  program_name: string;
  user_name: string;
  user_email: string;
}

export const GivingTab = () => {
  const [commitments, setCommitments] = useState<GivingCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitment, setSelectedCommitment] = useState<GivingCommitment | null>(null);

  useEffect(() => {
    const loadCommitments = async () => {
      try {
        const data = await fetchLMS('/api/admin/giving-commitments');
        setCommitments(data || []);
      } catch (err) {
        console.error("Failed to load giving commitments:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCommitments();
  }, []);

  const filteredCommitments = commitments.filter(c => 
    c.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.commitment_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Heart className="text-pink-500" size={24} />
            Giving Commitments
          </h2>
          <p className="text-slate-400 text-sm">Review member commitments and expressions of partnership.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search by name, email or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 w-full md:w-80 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 h-40 animate-pulse" />
          ))}
        </div>
      ) : filteredCommitments.length === 0 ? (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600">
            <Heart size={32} />
          </div>
          <p className="text-slate-400 font-medium">No commitments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredCommitments.map((commitment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedCommitment(commitment)}
                className="bg-white/5 border border-white/5 hover:border-pink-500/30 rounded-2xl p-6 space-y-4 cursor-pointer transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={16} className="text-pink-500" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <User size={14} className="text-slate-500" />
                    {commitment.user_name}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Mail size={12} className="text-slate-600" />
                    {commitment.user_email}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-slate-300 text-xs italic line-clamp-3 leading-relaxed">
                    "{commitment.commitment_text}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                    {commitment.program_name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={10} />
                    {formatDate(commitment.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* COMMITMENT MODAL */}
      <AnimatePresence>
        {selectedCommitment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCommitment(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a16] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <button 
                onClick={() => setSelectedCommitment(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-pink-500/20 text-pink-500 rounded-2xl flex items-center justify-center">
                  <Heart size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{selectedCommitment.user_name}</h3>
                  <p className="text-slate-400 text-sm">{selectedCommitment.user_email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">The Commitment</span>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCommitment.commitment_text}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-6">
                <p>Program: <span className="text-slate-300 font-bold ml-1 uppercase">{selectedCommitment.program_name}</span></p>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(selectedCommitment.created_at)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
