import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { fetchLMS } from '../../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}

interface SubmissionData {
  content: string;
  submission_type: string;
  admin_feedback: string | null;
  feedback_at: string | null;
  submitted_at: string;
}

export const FeedbackModal = ({ isOpen, onClose, lessonId, lessonTitle }: Props) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubmissionData | null>(null);

  useEffect(() => {
    if (isOpen && lessonId) {
      setLoading(true);
      fetchLMS(`/lms/lessons/${lessonId}/my-submission`)
        .then(res => setData(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, lessonId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Assignment Feedback</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{lessonTitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Fetching feedback...</p>
                </div>
              ) : !data ? (
                <div className="py-12 text-center">
                  <p className="text-slate-500 italic">No feedback found for this lesson.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Student Submission */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Your Submission</p>
                    {data.content.startsWith('http') ? (
                      <a 
                        href={data.content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl text-blue-400 hover:text-blue-300 transition-colors group"
                      >
                        <LinkIcon size={18} className="shrink-0" />
                        <span className="text-sm font-medium truncate">{data.content}</span>
                      </a>
                    ) : (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {data.content}
                      </div>
                    )}
                  </div>

                  {/* Admin Feedback */}
                  <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <MessageSquare size={48} className="text-amber-500" />
                    </div>
                    
                    <div className="relative space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Instructor Response</p>
                      </div>
                      
                      <p className="text-sm sm:text-base text-slate-100 whitespace-pre-wrap leading-relaxed italic">
                        "{data.admin_feedback || "No written feedback provided yet."}"
                      </p>
                      
                      {data.feedback_at && (
                        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
                          <p className="text-[10px] text-amber-500/60 font-medium">
                            Reviewed on {new Date(data.feedback_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                          <CheckCircle2 size={14} className="text-amber-500/60" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.01] border-t border-white/5">
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
