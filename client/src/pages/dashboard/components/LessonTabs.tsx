import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PenTool, MessageSquare, CheckCircle2, Lock, Link as LinkIcon, Radio } from 'lucide-react';
import { fetchLMS, postLMS } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import { type LessonData } from '../LessonPage';
import { useToast, ToastContainer } from '../../../components/shared/Toast';

interface Props { lesson: LessonData; isUnlocked: boolean; isLiveMode?: boolean; }

export const LessonTabs = ({ lesson, isUnlocked, isLiveMode = false }: Props) => {
  const navigate = useNavigate();
  const { toasts, dismiss, toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignment' | 'discussion'>('overview');
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
      // fetched is DESC order from backend; reverse for chronological display
      setComments([...fetched].reverse());
      // Auto-scroll to newest during live
      if (isLiveMode) {
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [isLiveMode]);

  // Initial load when switching to Discussion tab
  useEffect(() => {
    if (activeTab === 'discussion') {
      knownIdsRef.current = new Set();
      fetchLMS(`/lms/lessons/${lesson.id}/comments`)
        .then(data => mergeComments(data || []))
        .catch(console.error);
    }
  }, [activeTab, lesson.id]);

  // Live polling: start/stop based on isLiveMode + activeTab
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
        <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}><FileText size={18} /> Overview</button>
          <button onClick={() => setActiveTab('assignment')} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'assignment' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}><PenTool size={18} /> Assignment {isUnlocked && !lesson.is_completed && <span className="w-2 h-2 rounded-full bg-blue-500 ml-1 animate-pulse"></span>}</button>
          <button onClick={() => setActiveTab('discussion')} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'discussion' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}>
            <MessageSquare size={18} /> Discussion
            {isLiveMode && (
              <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded tracking-widest animate-pulse">
                <Radio size={8} /> LIVE
              </span>
            )}
          </button>
        </div>

        <div className="p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-lg font-bold text-white">About this lesson</h3><p className="text-slate-300 whitespace-pre-wrap">{lesson.description}</p>
              </motion.div>
            )}

            {activeTab === 'assignment' && (
              <motion.div key="assignment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
                {lesson.is_completed ? (
                  <div className="flex flex-col items-center py-8 text-center space-y-4"><div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 size={32} /></div><h3 className="text-xl font-bold text-white">Assignment Completed</h3></div>
                ) : !isUnlocked ? (
                  <div className="flex flex-col items-center py-12 text-center space-y-4"><div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500"><Lock size={32} /></div><h3 className="text-xl font-bold text-white">Assignment Locked</h3><p className="text-slate-400">Please watch at least 80% of the video to unlock.</p></div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-100 whitespace-pre-wrap">{lesson.assignmentPrompt}</div>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setSubmissionType('link')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold ${submissionType === 'link' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}><LinkIcon size={16} /> Link</button>
                        <button type="button" onClick={() => setSubmissionType('text')} className={`flex gap-2 px-6 py-3 rounded-xl text-sm font-bold ${submissionType === 'text' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hvoer:bg-white/10'}`}><FileText size={16} /> Text</button>
                      </div>
                      {submissionType === 'link' ? <input type="url" required value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500/50" /> : <textarea required rows={5} value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white resize-none focus:border-blue-500/50" />}
                      <button type="submit" disabled={isSubmitting || !submissionValue} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all">{isSubmitting ? 'Submitting...' : 'Submit & Unlock'}</button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'discussion' && (
              <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
                {/* Live banner */}
                {isLiveMode && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                      LIVE SESSION IN PROGRESS
                    </div>
                    <span className="text-slate-400 text-xs ml-auto">Chat refreshes automatically every 10s</span>
                  </div>
                )}

                <form onSubmit={handlePostComment} className="flex gap-3">
                  <input type="text" required placeholder={isLiveMode ? "Say something live..." : "Add a comment..."} value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-white/20" />
                  <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className={`px-6 py-3 font-bold rounded-xl transition-colors ${isLiveMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white text-black hover:bg-slate-200'}`}>
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
                  {/* Scroll anchor */}
                  <div ref={commentsEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};