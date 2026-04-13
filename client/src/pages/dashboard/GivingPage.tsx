import { motion } from 'framer-motion';
import { Heart, CreditCard } from 'lucide-react';

export const GivingPage = () => {
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

      <div className="max-w-2xl">
        {/* CENTRAL GIVING CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111827] border border-white/5 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden"
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
                  <p className="text-white font-black tracking-[0.2em] text-3xl font-mono">0252314244</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 italic text-center">
              Thank you for your partnership in impacting lives and marriages.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};