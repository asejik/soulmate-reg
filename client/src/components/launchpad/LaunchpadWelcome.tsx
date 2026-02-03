import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

export const LaunchpadWelcome = ({ onStart }: { onStart: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl w-full p-8 glass-card rounded-3xl text-center space-y-8"
    >
      <div className="flex justify-center">
        <div className="p-4 bg-pink-500/20 rounded-full">
          <Rocket className="w-16 h-16 text-pink-400" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Are You Ready to Launch?</h1>
        <p className="text-lg text-indigo-200">Couples' Launchpad 5.0</p>
      </div>

      <div className="space-y-4 text-left bg-white/5 p-6 rounded-xl border border-white/10 text-slate-300 text-sm">
        <p>💍 <strong>For Intending Couples:</strong> This is a deep, intensive teaching specifically for duos who have their wedding dates fixed.</p>
        <p>⚠️ <strong>Not for Singles:</strong> Please hold on; your time is coming, but this cohort is strictly for couples.</p>
        <p>⚠️ <strong>Must Have a Date:</strong> If you don't have a wedding date fixed yet, please wait for the next cohort.</p>
      </div>

      <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 text-amber-200 text-xs font-medium">
        NOTE: Attendance is free, but registration is COMPULSORY.
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-pink-900/20 transition-all"
      >
        Yes, We Are Ready
      </button>
    </motion.div>
  );
};