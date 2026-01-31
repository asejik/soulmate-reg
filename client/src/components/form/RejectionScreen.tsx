import { motion } from 'framer-motion';

interface RejectionScreenProps {
  message: string;
  onReset: () => void; // New prop to handle the reset
}

export const RejectionScreen = ({ message, onReset }: RejectionScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full p-8 glass-card rounded-3xl text-center space-y-6 border border-indigo-500/30 shadow-2xl"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-indigo-200 tracking-widest uppercase text-sm">Notice</h2>
        <p className="text-white text-lg leading-relaxed">{message}</p>
      </div>

      <button
        onClick={onReset}
        className="text-slate-400 hover:text-white text-sm underline underline-offset-4 transition-colors cursor-pointer"
      >
        Return to Home
      </button>
    </motion.div>
  );
};