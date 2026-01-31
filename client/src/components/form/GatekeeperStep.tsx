import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft } from 'lucide-react';

interface GatekeeperStepProps {
  onValidated: () => void;
  onReject: (message: string) => void;
  onBack: () => void;
}

export const GatekeeperStep = ({ onValidated, onReject, onBack }: GatekeeperStepProps) => {
  const [attendanceAnswered, setAttendanceAnswered] = useState(false);

  const handleAttendance = (attended: boolean) => {
    if (attended) {
      onReject("Thank you for your truthfulness! Please keep maximizing the encounter you’ve had in the previous cohort. Abide in thanksgiving and be a consistent doer of the word. Your testimony will come. Kindly allow others to maximize the limited slots available. God bless you!");
    } else {
      setAttendanceAnswered(true);
    }
  };

  const handleFeedback = (willGiveFeedback: boolean) => {
    if (!willGiveFeedback) {
      onReject("Thank you for your interest. To ensure a committed community, feedback is required for participation. We hope to see you another time!");
    } else {
      onValidated();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-xl w-full p-8 glass-card rounded-3xl space-y-8 relative"
    >
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="space-y-6 pt-6">
        <h2 className="text-2xl font-bold text-white">Commitment & Eligibility</h2>

        {/* Step 1: Attendance Check */}
        <div className="space-y-4">
          <p className="text-slate-300">Have you attended Ready for A Soulmate before?</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAttendance(false)}
              className={`py-3 px-4 rounded-xl border transition-all text-white ${!attendanceAnswered ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              No, first time
            </button>
            <button
              onClick={() => handleAttendance(true)}
              className="py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white"
            >
              Yes, I have
            </button>
          </div>
        </div>

        {/* Step 2: Feedback Commitment */}
        <AnimatePresence>
          {attendanceAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 border-t border-white/10 pt-6"
            >
              <p className="text-slate-300">Giving feedback is mandatory after the meeting. Do you agree?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleFeedback(true)}
                  className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <CheckCircle2 size={18} /> I agree
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="py-3 px-4 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  No
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};