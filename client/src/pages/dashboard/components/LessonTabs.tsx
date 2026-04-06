import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PenTool, MessageSquare, CheckCircle2, Lock, Link as LinkIcon, Radio, Users } from 'lucide-react';
import { fetchLMS, postLMS } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import { type LessonData } from '../LessonPage';
import { useToast, ToastContainer } from '../../../components/shared/Toast';

interface Props { 
  lesson: LessonData; 
  isUnlocked: boolean; 
  isLiveMode?: boolean; 
  activity: { count: number, participants: string[] };
}

export const LessonTabs = ({ lesson, isUnlocked, isLiveMode = false, activity }: Props) => {
  const navigate = useNavigate();
  const { toasts, dismiss, toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignment' | 'discussion' | 'participants'>('overview');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [submissionType, setSubmissionType] = useState<'text' | 'link'>('link');
  const [submissionValue, setSubmissionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Merges fetched comments, only appending truly new ones to avoid flicker
  const mergeComments = useCallback((fetched: any[]) => {
    const newOnes = fetched.filter(c => !knownIdsRef.current.has(c.id));
    if (newOnes.length > 0) {
      newOnes.forEach(c => knownIdsRef.current.add(c.id));
      setComments([...fetched].reverse());
      
      if (isLiveMode) {
        setTimeout(() => {
          if (commentsEndRef.current && commentsEndRef.current.parentElement) {
            const container = commentsEndRef.current.parentElement;
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [isLiveMode]);

  useEffect(() => {
    if (activeTab === 'discussion') {
      knownIdsRef.current = new Set();
      fetchLMS(`/lms/lessons/${lesson.id}/comments`)
        .then(data => mergeComments(data || []))
        .catch(console.error);
    }
  }, [activeTab, lesson.id, mergeComments]);

  useEffect(() => {
    const shouldPoll = isLiveMode && activeTab === 'discussion';
    if (shouldPoll) {
      pollIntervalRef.current = setInterval(() => {
        fetchLMS(`/lms/lessons/${lesson.id}/comments`)
          .then(data => mergeComments(data || []))
          .catch(console.error);
      }, 10_000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isLiveMode, activeTab, lesson.id, mergeComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await postLMS(`/lms/lessons/${lesson.id}/submit`, { submissionType, content: submissionValue });
      navigate('/dashboard');
    } catch (err) { toast.error("Failed to submit assignment. Please try again."); setIsSubmitting(false); }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await postLMS(`/lms/lessons/${lesson.id}/comments`, { content: newComment });
      setNewComment('');
      const updated = await fetchLMS(`/lms/lessons/${lesson.id}/comments`);
      mergeComments(updated || []);
    } catch (err) { toast.error("Failed to post comment. Please try again."); } finally { setIsSubmittingComment(false); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="flex-1 bg-[#111827] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-lg mt-4">
        {/* Optimized Tab Bar to prevent overlapping on mobile */}
        <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar no-scrollbar-mobile">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 min-w-[80px] sm:min-w-[120px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-4 text-[10px] sm:text-xs md:text-sm font-bold border-b-2 transition-all ${activeTab === 'overview' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}>
            <FileText size={14} className="sm:w-[18px] sm:h-[18px]" /> 
            <span>Overview</span>
          </button>
          
          <button onClick={() => setActiveTab('assignment')} className={`flex-1 min-w-[80px] sm:min-w-[140px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-4 text-[10px] sm:text-xs md:text-sm font-bold border-b-2 transition-all ${activeTab === 'assignment' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}>
            <PenTool size={14} className="sm:w-[18px] sm:h-[18px]" /> 
            <span>Assignment</span>
            {isUnlocked && !lesson.is_completed && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse hidden sm:block"></span>}
          </button>

          <button onClick={() => setActiveTab('discussion')} className={`flex-1 min-w-[80px] sm:min-w-[140px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-4 text-[10px] sm:text-xs md:text-sm font-bold border-b-2 transition-all ${activeTab === 'discussion' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}>
            <MessageSquare size={14} className="sm:w-[18px] sm:h-[18px]" /> 
            <span>Discussion</span>
            {isLiveMode && (
              <span className="flex items-center gap-0.5 px-1 py-0.5 bg-red-600 text-white text-[7px] sm:text-[9px] font-black rounded tracking-widest animate-pulse uppercase">
                <Radio size={6} className="sm:w-2 sm:h-2" /> LIVE
              </span>
            )}
          </button>

          {isLiveMode && (
            <button onClick={() => setActiveTab('participants')} className={`flex-1 min-w-[80px] sm:min-w-[150px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-4 text-[10px] sm:text-xs md:text-sm font-bold border-b-2 transition-all ${activeTab === 'participants' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}>
              <Users size={14} className="sm:w-[18px] sm:h-[18px]" /> 
              <span>Active</span>
              {activity.count > 0 && <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[8px] sm:text-[10px] font-black rounded-full leading-none">{activity.count}</span>}
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white">About this lesson</h3><p className="text-sm sm:text-base text-slate-300 whitespace-pre-wrap">{lesson.description}</p>
              </motion.div>
            )}

            {activeTab === 'assignment' && (
              <motion.div key="assignment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
                {lesson.is_completed ? (
                  <div className="flex flex-col items-center py-8 text-center space-y-4"><div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 size={24} className="sm:w-8 sm:h-8" /></div><h3 className="text-lg sm:text-xl font-bold text-white">Assignment Completed</h3></div>
                ) : !isUnlocked ? (
                  <div className="flex flex-col items-center py-10 sm:py-12 text-center space-y-4"><div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500"><Lock size={24} className="sm:w-8 sm:h-8" /></div><h3 className="text-lg sm:text-xl font-bold text-white">Assignment Locked</h3><p className="text-sm sm:text-base text-slate-400">Please watch at least 80% of the video to unlock.</p></div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 sm:p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-100 text-sm sm:text-base whitespace-pre-wrap">{lesson.assignmentPrompt}</div>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button type="button" onClick={() => setSubmissionType('link')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${submissionType === 'link' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}><LinkIcon size={14} className="sm:w-4 sm:h-4" /> Link</button>
                        <button type="button" onClick={() => setSubmissionType('text')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${submissionType === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}><FileText size={14} className="sm:w-4 sm:h-4" /> Text</button>
                      </div>
                      {submissionType === 'link' ? <input type="url" required value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500/50 transition-colors" placeholder="https://..." /> : <textarea required rows={4} value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white resize-none focus:border-blue-500/50 transition-colors" placeholder="Write your submission here..." />}
                      <button type="submit" disabled={isSubmitting || !submissionValue} className="w-full py-3.5 sm:py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all text-sm sm:text-base">{isSubmitting ? 'Submitting...' : 'Submit & Unlock'}</button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'discussion' && (
              <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-5">
                {isLiveMode && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] sm:text-xs tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                      </span>
                      LIVE SESSION IN PROGRESS
                    </div>
                    <span className="text-slate-500 text-[10px] sm:ml-auto">Chat refreshes every 10s</span>
                  </div>
                )}

                <form onSubmit={handlePostComment} className="flex gap-2 sm:gap-3">
                  <input type="text" required placeholder={isLiveMode ? "Say something..." : "Add a comment..."} value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/30 transition-all" />
                  <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className={`px-4 sm:px-6 py-2.5 sm:py-3 font-bold rounded-xl transition-all text-sm active:scale-95 flex-shrink-0 ${isLiveMode ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-white text-black hover:bg-slate-200 shadow-lg shadow-black/20'}`}>
                    {isSubmittingComment ? '...' : isLiveMode ? '⚡ Send' : 'Post'}
                  </button>
                </form>

                <div className="space-y-4 pt-4 border-t border-white/5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {comments.length === 0
                    ? <div className="text-slate-500 text-sm italic text-center py-8">No comments yet. Be the first!</div>
                    : comments.map(c => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex justify-between text-xs text-slate-500">
                          <span className="font-bold text-blue-400">{c.user_name}</span>
                          <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-slate-300">{c.content}</p>
                      </motion.div>
                    ))
                  }
                  <div ref={commentsEndRef} />
                </div>
              </motion.div>
            )}

            {activeTab === 'participants' && (
              <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Participants</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Currently attending the premiere</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                    <Users size={18} />
                    <span className="font-black text-sm">{activity.count} online</span>
                  </div>
                </div>

                {!activity.participants || activity.participants.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 italic">No activity recorded yet. Keep watching!</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activity.participants.map((name, i) => (
                      <motion.div 
                        key={name + i} 
                        initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                          {name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-200">{name}</span>
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};