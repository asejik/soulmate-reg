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

interface ParsedQuestion {
  id: string;
  questionText: string;
  options: string[];
}

function parseQuestions(rawText: string): ParsedQuestion[] {
  if (!rawText) return [{ id: 'q1', questionText: "What is the main expectation for today's class?", options: [] }];
  
  const blocks = rawText.trim().split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const firstOptionIdx = lines.findIndex(l => /^[A-Ea-e][\.\)]\s/.test(l));
    
    if (firstOptionIdx > 0) {
      return { id: `q${i + 1}`, questionText: lines.slice(0, firstOptionIdx).join(' '), options: lines.slice(firstOptionIdx) };
    } else {
      return { id: `q${i + 1}`, questionText: lines.join(' '), options: [] };
    }
  });
}

export const QuizOverlay = ({ lessonId }: { lessonId: string }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (quiz?.question) {
      setParsedQuestions(parseQuestions(quiz.question));
    } else if (quiz) {
      setParsedQuestions(parseQuestions(''));
    }
  }, [quiz]);

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
          if (data.status === 'waiting' || data.status === 'expired' || data.status === 'no_schedule') {
            setIsOpen(false);
            return;
          }
          if (data.already_submitted) {
            setIsSubmitted(true);
            setIsOpen(false);
            return;
          }
          setQuiz(data);
          setIsOpen(true);
        } else {
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
  
  const handleNext = () => {
    if (currentIdx < parsedQuestions.length - 1) setCurrentIdx(prev => prev + 1);
  };
  
  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(prev => prev - 1);
  };

  if (!isOpen || !quiz || parsedQuestions.length === 0) return null;

  const currentQ = parsedQuestions[currentIdx];
  const isLast = currentIdx === parsedQuestions.length - 1;
  const currentAnswer = answers[currentQ.id] || '';

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
            className="w-full max-w-lg bg-[#111827] border border-pink-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(236,72,153,0.15)] flex flex-col max-h-[90vh]"
          >
            {isSubmitted ? (
              <div className="text-center space-y-4 py-8">
                <CheckCircle className="text-green-500 mx-auto" size={48} />
                <h2 className="text-2xl font-bold text-white">Quiz Submitted!</h2>
                <p className="text-slate-400">Great job being early. Enjoy the class!</p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                  <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
                  <div className="flex items-center gap-2 text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    <Clock size={14} /> Time-bound
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Question {currentIdx + 1} of {parsedQuestions.length}</span>
                  </div>
                  <label className="block text-sm sm:text-base font-medium text-slate-200 leading-relaxed">
                    {currentQ.questionText}
                  </label>
                  
                  {currentQ.options.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      {currentQ.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setAnswers({ ...answers, [currentQ.id]: opt })}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            currentAnswer === opt 
                              ? 'bg-pink-500/20 border-pink-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea 
                      required
                      value={currentAnswer}
                      onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                      rows={4}
                      className="w-full mt-4 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none"
                      placeholder="Type your answer here..."
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 shrink-0">
                  <button 
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all disabled:opacity-30"
                  >
                    Previous
                  </button>
                  
                  {isLast ? (
                    <button 
                      onClick={() => handleSubmit()}
                      disabled={isSubmitting || !currentAnswer}
                      className="flex-[2] py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Quiz'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext}
                      disabled={!currentAnswer}
                      className="flex-[2] py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
