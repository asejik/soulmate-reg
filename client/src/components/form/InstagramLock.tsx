import { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react';

interface InstagramLockProps {
  onComplete: () => void;
  onBack: () => void; // Fix: Explicitly added to interface
}

export const InstagramLock = ({ onComplete, onBack }: InstagramLockProps) => {
  const [hasClicked, setHasClicked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full p-8 glass-card rounded-3xl text-center space-y-6 relative"
    >
      {/* Fix: Added Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex justify-center pt-4">
        <div className="p-4 bg-pink-500/10 rounded-full">
          <Instagram className="w-12 h-12 text-pink-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Final Step</h2>
        <p className="text-slate-400">
          To stay updated with daily nuggets and cohort announcements, follow our official handle[cite: 61].
        </p>
      </div>

      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
        <p className="text-sm text-indigo-300 font-medium">Following is mandated to proceed [cite: 40]</p>

        <a
          href="https://www.instagram.com/readyforasoulmate?igsh=ZXBsNDI2b2hsdGo1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setHasClicked(true)}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Follow @readyforasoulmate
        </a>
      </div>

      <button
        disabled={!hasClicked}
        onClick={onComplete}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
          hasClicked
          ? "bg-white text-slate-900 shadow-xl shadow-white/10 cursor-pointer"
          : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
        }`}
      >
        {hasClicked ? (
          <>Complete Registration <ArrowRight size={20} /></>
        ) : (
          <>Please follow to continue</>
        )}
      </button>

      {hasClicked && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-green-400 flex items-center justify-center gap-1"
        >
          <CheckCircle2 size={12} /> Thank you for following!
        </motion.p>
      )}
    </motion.div>
  );
};