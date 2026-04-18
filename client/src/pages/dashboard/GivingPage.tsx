import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CreditCard, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchLMS, postLMS } from '../../lib/api';

export const GivingPage = () => {
  const [commitment, setCommitment] = useState('');
  const [existingCommitment, setExistingCommitment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCommitment = async () => {
      try {
        const activeProgram = localStorage.getItem('tai_active_program') || 'soulmate';
        const data = await fetchLMS(`/lms/giving-commitment?program=${activeProgram}`);
        if (data && data.commitment) {
          setExistingCommitment(data.commitment);
        }
      } catch (err) {
        console.error("Failed to check commitment status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkCommitment();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitment.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const activeProgram = localStorage.getItem('tai_active_program') || 'soulmate';
      await postLMS('/lms/giving-commitment', {
        programName: activeProgram,
        commitmentText: commitment
      });
      setExistingCommitment(commitment);
    } catch (err) {
      setError("Failed to save your commitment. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      {/* HEADER */}
      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
          <Heart className="text-pink-500" size={32} />
          Giving & Donations
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed mx-auto md:mx-0">
          Your generous support helps us continue building God-centered marriages and providing these resources to couples around the world. All donations directly support the mission of Temitope Christy Global Services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* CENTRAL GIVING CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111827] border border-white/5 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden h-full"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Heart size={120} />
          </div>
          
          <div className="space-y-1 relative z-10">
            <h2 className="text-xl font-bold text-white">Temitope Christy Global Services</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Official Giving Channel</p>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 transition-all hover:border-pink-500/30 group">
              <div className="flex items-center gap-2 text-pink-400 text-sm font-bold mb-4 uppercase tracking-wider">
                <CreditCard size={18}/> Naira Bank Transfer
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Bank Name</p>
                  <p className="text-white font-semibold text-base">GTB</p>
                </div>
                
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Account Name</p>
                  <p className="text-white font-semibold text-base">Temitope Christy Global Services</p>
                </div>

                <div className="pt-2">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Account Number</p>
                  <p className="text-white font-black tracking-[0.2em] text-2xl lg:text-3xl font-mono">0252314244</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 italic text-center">
              Thank you for your partnership in impacting lives and marriages.
            </p>
          </div>
        </motion.div>

        {/* GIVING COMMITMENT SECTION */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-[#111827] border border-white/5 rounded-2xl p-8 space-y-6 shadow-xl h-full flex flex-col justify-center border-l-pink-500/20"
        >
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send size={20} className="text-pink-500" />
              Your Giving Commitment
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              If you feel led to partner with us, please share your commitment below. This helps us plan and reach more lives.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-32 flex items-center justify-center"
              >
                <div className="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              </motion.div>
            ) : existingCommitment ? (
              <motion.div 
                key="submitted"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 text-center space-y-3"
              >
                <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold text-sm underline decoration-green-500/30">Commitment Submitted</p>
                  <p className="text-slate-400 text-xs italic">" {existingCommitment} "</p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium pt-2">Thank you for your generosity and faith.</p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
                    <ShieldAlert size={14} /> {error}
                  </div>
                )}
                
                <textarea
                  required
                  placeholder="Share your giving commitment here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 min-h-[120px] transition-all"
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                />
                
                <button
                  type="submit"
                  disabled={isSubmitting || !commitment.trim()}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-pink-500/10"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>Submit Commitment <Send size={16} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};