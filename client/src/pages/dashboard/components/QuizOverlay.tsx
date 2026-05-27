import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../../config';
import { getAuthSession, postLMS } from '../../../lib/api';

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  question?: string;
  created_at: string;
}

export const QuizOverlay = ({ lessonId }: { lessonId: string }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Check if a quiz is active
    const checkQuiz = async () => {
      try {
        const session = await getAuthSession();
        const res = await fetch(`${API_BASE_URL}/lms/lessons/${lessonId}/quiz`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQuiz(data);
          setIsOpen(true);
        } else {
          setQuiz(null);
          setIsOpen(false);
        }
      } catch (e) {
        setQuiz(null);
        setIsOpen(false);
      }
    };

    checkQuiz();
    const interval = setInterval(checkQuiz, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length === 0) return;
    setIsSubmitting(true);
    try {
      await postLMS(`/lms/lessons/${lessonId}/quiz`, { answers });
      setIsSubmitted(true);
      setTimeout(() => setIsOpen(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !quiz) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-[#111827] border border-pink-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(236,72,153,0.15)]"
          >
            {isSubmitted ? (
              <div className="text-center space-y-4 py-8">
                <CheckCircle className="text-green-500 mx-auto" size={48} />
                <h2 className="text-2xl font-bold text-white">Quiz Submitted!</h2>
                <p className="text-slate-400">Great job being early. Enjoy the class!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
                  <div className="flex items-center gap-2 text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    <Clock size={14} /> Time-bound
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Question 1: {quiz.question || "What is the main expectation for today's class?"}
                  </label>
                  <textarea 
                    required
                    value={answers['q1'] || ''}
                    onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
                    rows={4}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none"
                    placeholder="Type your answer here..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !answers['q1']}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Answer'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
