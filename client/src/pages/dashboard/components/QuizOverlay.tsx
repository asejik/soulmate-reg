import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Clock, X } from 'lucide-react';
import { API_BASE_URL } from '../../../config';
import { getAuthSession, postLMS } from '../../../lib/api';

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  question?: string;
  created_at: string;
  expires_at: string;
}

interface ParsedQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer?: string;
}

function parseQuestions(rawText: string): ParsedQuestion[] {
  if (!rawText) return [{ id: 'q1', questionText: "What is the main expectation for today's class?", options: [] }];
  
  const blocks = rawText.trim().split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const firstOptionIdx = lines.findIndex(l => /^[A-Ea-e][\.\)]\s/.test(l));
    
    if (firstOptionIdx > 0) {
      let correctAnswer = '';
      const rawOptions = lines.slice(firstOptionIdx);
      const cleanedOptions = rawOptions.map(opt => {
        if (opt.endsWith('*')) {
          const clean = opt.slice(0, -1).trim();
          correctAnswer = clean;
          return clean;
        }
        return opt;
      });
      return { id: `q${i + 1}`, questionText: lines.slice(0, firstOptionIdx).join(' '), options: cleanedOptions, correctAnswer };
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (quiz?.question) {
      setParsedQuestions(parseQuestions(quiz.question));
    } else if (quiz) {
      setParsedQuestions(parseQuestions(''));
    }
  }, [quiz]);

  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!quiz || !quiz.expires_at || isSubmitted) return;
    
    const calculateTime = () => {
      const end = new Date(quiz.expires_at).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setTimeRemaining(calculateTime());
    const interval = setInterval(() => {
      const remaining = calculateTime();
      setTimeRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        // Auto-submit if time runs out
        if (!isSubmitted) {
          setHasTimedOut(true);
          handleSubmit(undefined, true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, isSubmitted]);

  useEffect(() => {
    // Check if a quiz is active
    const checkQuiz = async () => {
      try {
        const session = await getAuthSession();
        const res = await fetch(`${API_BASE_URL}/lms/lessons/${lessonId}/quiz`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        
        if (res.status === 200) {
          const data = await res.json();
          if (data.status === 'waiting') return; // Not started yet
          if (data.status === 'expired') {
             setIsOpen(false);
             return;
          }
          if (data.status === 'submitted') {
            setIsOpen(false);
            return;
          }
          if (data.id) {
            setQuiz(data);
            setIsOpen(true);
          }
        }
      } catch (e) {
        console.error("Failed to check quiz:", e);
      }
    };

    // Check immediately, then poll every 5s just in case
    checkQuiz();
    const interval = setInterval(checkQuiz, 5000);
    return () => clearInterval(interval);
  }, [lessonId]);

  const [scoreInfo, setScoreInfo] = useState<{ score: number, total: number, percentage: number } | null>(null);

  const handleSubmit = async (e?: React.FormEvent, isTimeout = false) => {
    if (e) e.preventDefault();
    if (!isTimeout && Object.keys(answers).length === 0 && timeRemaining && timeRemaining > 0) return;
    setIsSubmitting(true);
    
    let correctCount = 0;
    parsedQuestions.forEach(q => {
      if (q.correctAnswer && answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const total = parsedQuestions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    setScoreInfo({ score: correctCount, total, percentage });

    try {
      await postLMS(`/lms/lessons/${lessonId}/quiz`, { answers, score: correctCount, total_questions: total });
      setIsSubmitted(true);
      setTimeout(() => setIsOpen(false), 15000); // Leave open a bit longer so they can read their score
    } catch (err) {
      console.error(err);
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
          onClick={() => { if (isSubmitted) setIsOpen(false); }}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-[#111827] border border-pink-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(236,72,153,0.15)] flex flex-col max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {isSubmitted && (
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            )}
            
            {isSubmitted ? (
              <div className="text-center space-y-4 py-8 mt-4">
                <CheckCircle className="text-green-500 mx-auto" size={48} />
                <h2 className="text-2xl font-bold text-white">
                  {hasTimedOut ? "Time's Up!" : "Quiz Submitted!"}
                </h2>
                {hasTimedOut && (
                  <p className="text-amber-400 text-sm mb-2">Your progress has been automatically saved.</p>
                )}
                <h3 className="text-lg font-medium text-slate-300">{quiz.title}</h3>
                {scoreInfo && scoreInfo.total > 0 && (
                  <div className="py-4 bg-white/5 rounded-xl border border-white/10 my-6">
                    <div className="text-4xl font-black text-pink-400 mb-1">{scoreInfo.percentage}%</div>
                    <div className="text-slate-300 font-medium text-sm">
                      You scored {scoreInfo.score} out of {scoreInfo.total} correct
                    </div>
                  </div>
                )}
                <p className="text-slate-400">Great job. Enjoy the class!</p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                  <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
                  <div className="flex items-center gap-2 text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    <Clock size={14} /> 
                    {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : 'Time-bound'}
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
