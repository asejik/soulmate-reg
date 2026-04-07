import { motion } from 'framer-motion';
import { Mail, Instagram, Facebook, Calendar, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export const ContactPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-4 md:px-0">
      
      {/* HEADER */}
      <div className="space-y-4 text-center md:text-left">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-4"
        >
          <Phone className="text-blue-500" size={36} />
          Contact & Support
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0"
        >
          We're here to support you on your journey. Connect with us for personalized therapy sessions or follow our socials for more resources and updates.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* THERAPY BOOKING CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-8 shadow-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="absolute -top-10 -right-10 p-12 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
          
          <div className="space-y-4 relative z-10">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Calendar className="text-blue-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Personalized Therapy</h2>
            <p className="text-slate-400 leading-relaxed">
              Book personalized therapy sessions from <span className="text-white font-medium">Anchor of Hope Counseling and Consulting</span>. Professional support for your relational and emotional well-being.
            </p>
          </div>

          <div className="pt-4 relative z-10">
            <a 
              href="https://www.anchorofhopecc.com/booking" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 group-hover:translate-x-1"
            >
              Book a Session
              <ExternalLink size={18} />
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-4 relative z-10">
            <ShieldCheck size={14} />
            Secure & Confidential
          </div>
        </motion.div>

        {/* SOCIAL CONNECT CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-8 shadow-2xl overflow-hidden hover:border-pink-500/30 transition-all duration-300"
        >
          <div className="absolute -top-10 -right-10 p-12 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-500" />

          <div className="space-y-4 relative z-10">
            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="text-pink-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Connect with Temitope</h2>
            <p className="text-slate-400 leading-relaxed">
              Stay connected and get inspired. Follow Temitope Ayenigba on social media for regular insights, tips, and community engagement.
            </p>
          </div>

          <div className="space-y-3 relative z-10">
            <a 
              href="https://www.instagram.com/temitopeayenigba/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-pink-500/20 transition-all group/link"
            >
              <div className="flex items-center gap-3 font-medium text-slate-200">
                <Instagram className="text-pink-500" size={20} />
                Instagram
              </div>
              <ExternalLink className="text-slate-500 group-hover/link:text-pink-400 transition-colors" size={16} />
            </a>

            <a 
              href="https://web.facebook.com/Pheyhishara" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/20 transition-all group/link"
            >
              <div className="flex items-center gap-3 font-medium text-slate-200">
                <Facebook className="text-blue-500" size={20} />
                Facebook
              </div>
              <ExternalLink className="text-slate-500 group-hover/link:text-blue-400 transition-colors" size={16} />
            </a>
          </div>
        </motion.div>

      </div>

      {/* FOOTER QUOTE */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-12 border-t border-white/5 text-center"
      >
        <p className="text-slate-500 italic text-sm">
          "The greatest thing you can do for your relationship is to invest in your own growth."
        </p>
      </motion.div>
    </div>
  );
};
