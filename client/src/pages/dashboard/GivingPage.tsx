import React from 'react';
import { motion } from 'framer-motion';
import { Heart, CreditCard, Globe } from 'lucide-react';

export const GivingPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      {/* HEADER */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Heart className="text-pink-500" size={32} />
          Giving & Donations
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Your generous support helps us continue building God-centered marriages and providing these resources to couples around the world. Please select the specific ministry you'd like to support below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* RFASM GIVING CARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111827] border border-white/5 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Heart size={100} /></div>
          <h2 className="text-xl font-bold text-white relative z-10">Ready for A Soulmate</h2>

          <div className="space-y-4 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-pink-400 text-sm font-bold mb-2 uppercase tracking-wider"><CreditCard size={16}/> Naira Account</div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">Bank: <span className="text-white font-medium">GTBank</span></p>
                <p className="text-slate-400">Account Name: <span className="text-white font-medium">Ready for A Soulmate</span></p>
                <p className="text-slate-400">Account Number: <span className="text-white font-bold tracking-widest text-lg">0123456789</span></p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mb-2 uppercase tracking-wider"><Globe size={16}/> Dollar Account</div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">Bank: <span className="text-white font-medium">Zenith Bank (Domiciliary)</span></p>
                <p className="text-slate-400">Account Name: <span className="text-white font-medium">Ready for A Soulmate</span></p>
                <p className="text-slate-400">Account Number: <span className="text-white font-bold tracking-widest text-lg">0987654321</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* COUPLES LAUNCHPAD GIVING CARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111827] border border-white/5 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Heart size={100} /></div>
          <h2 className="text-xl font-bold text-white relative z-10">Couples' Launchpad</h2>

          <div className="space-y-4 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-pink-400 text-sm font-bold mb-2 uppercase tracking-wider"><CreditCard size={16}/> Naira Account</div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">Bank: <span className="text-white font-medium">GTBank</span></p>
                <p className="text-slate-400">Account Name: <span className="text-white font-medium">Couples Launchpad</span></p>
                <p className="text-slate-400">Account Number: <span className="text-white font-bold tracking-widest text-lg">1122334455</span></p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mb-2 uppercase tracking-wider"><Globe size={16}/> Dollar Account</div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">Bank: <span className="text-white font-medium">Zenith Bank (Domiciliary)</span></p>
                <p className="text-slate-400">Account Name: <span className="text-white font-medium">Couples Launchpad</span></p>
                <p className="text-slate-400">Account Number: <span className="text-white font-bold tracking-widest text-lg">5544332211</span></p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};