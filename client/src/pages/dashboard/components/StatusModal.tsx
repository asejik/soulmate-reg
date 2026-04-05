import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const StatusModal = ({ isOpen, onClose, type, title, message }: Props) => {
  const isError = type === 'error';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#111827] border border-white/10 rounded-3xl shadow-2xl p-8 text-center space-y-6"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isError ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-400'}`}>
              {isError ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
            </div>

            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold transition-all ${isError ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
            >
              {isError ? 'Try Again' : 'Close'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
