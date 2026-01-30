import { motion } from 'framer-motion';

export const RejectionScreen = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-md w-full p-8 glass-card rounded-3xl text-center space-y-6 border-red-500/20"
  >
    <div className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">Notice</div>
    <p className="text-slate-200 text-lg leading-relaxed">{message}</p>
    <button
      onClick={() => window.location.reload()}
      className="text-slate-400 hover:text-white text-sm underline underline-offset-4"
    >
      Return to Home
    </button>
  </motion.div>
);