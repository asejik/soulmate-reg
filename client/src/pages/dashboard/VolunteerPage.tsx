import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Send, CheckCircle2 } from 'lucide-react';

export const VolunteerPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // We can wire this to Google Sheets or Supabase later just like registration!
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-6 bg-[#111827] border border-white/5 p-12 rounded-3xl">
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={40} /></div>
        <h2 className="text-3xl font-bold text-white">Thank You for Serving!</h2>
        <p className="text-slate-400">Your volunteer application has been received. Our team will review your details and reach out to you via WhatsApp or Email shortly.</p>
        <button onClick={() => setIsSuccess(false)} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg mt-4">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Users className="text-blue-500" size={32} /> Serve With Us
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          We are always looking for passionate individuals to join our workforce. If you feel called to serve in Ready for A Soulmate or Couples' Launchpad, please fill out your details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111827] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label><input required type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label><input required type="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Number</label><input required type="tel" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instagram Handle</label><input required type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Religion</label><input required type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Denomination</label><input required type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
            <select required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none">
              <option value="">Select Gender...</option><option value="Male">Male</option><option value="Female">Female</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Country</label><input required type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">State</label><input required type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Birth Month</label><input required type="text" placeholder="e.g. October" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Birth Day</label><input required type="number" min="1" max="31" placeholder="e.g. 15" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" /></div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Areas of Strength / Skills</label>
          <textarea required rows={4} placeholder="e.g. Graphic Design, Video Editing, Intercession, Administration..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"></textarea>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? 'Submitting Application...' : 'Submit Application'} {!isSubmitting && <Send size={18} />}
        </button>
      </form>
    </div>
  );
};