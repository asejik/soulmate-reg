import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckpointModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Top Pattern Decor */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-10 text-center space-y-6">
              {/* Icon Section */}
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/20">
                  <Star size={40} className="fill-current" />
                  <div className="absolute -bottom-1 -right-1 bg-amber-600 text-black rounded-full p-1 border-2 border-[#111827]">
                    <Lock size={12} />
                  </div>
                </div>
              </div>

              {/* Text Section */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Checkpoint Required</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  You've reached the halfway point! To maintain the lesson flow and unlock the second half of the curriculum, please watch the facilitator's check-in video and leave your feedback.
                </p>
              </div>

              {/* Action Section */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/dashboard/mid-review');
                  }}
                  className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 group"
                >
                  Go to Mid-Program Checkpoint
                  <Star size={18} className="group-hover:rotate-12 transition-transform" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold transition-colors"
                >
                  I'll do it later
                </button>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="bg-[#0b0f19] p-4 text-center border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">Soulmate Relationship Roadmap</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
