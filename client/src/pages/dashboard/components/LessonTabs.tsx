import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PenTool, MessageSquare, CheckCircle2, Lock, Link as LinkIcon } from 'lucide-react';
import { fetchLMS, postLMS } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import { type LessonData } from '../LessonPage';

interface Props { lesson: LessonData; isUnlocked: boolean; }

export const LessonTabs = ({ lesson, isUnlocked }: Props) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignment' | 'discussion'>('overview');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [submissionType, setSubmissionType] = useState<'text' | 'link'>('link');
  const [submissionValue, setSubmissionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'discussion') {
      fetchLMS(`/lms/lessons/${lesson.id}/comments`).then(data => setComments(data || [])).catch(console.error);
    }
  }, [activeTab, lesson.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await postLMS(`/lms/lessons/${lesson.id}/submit`, { submissionType, content: submissionValue });
      navigate('/dashboard');
    } catch (err) { alert("Failed to submit assignment."); setIsSubmitting(false); }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await postLMS(`/lms/lessons/${lesson.id}/comments`, { content: newComment });
      setNewComment('');
      const updated = await fetchLMS(`/lms/lessons/${lesson.id}/comments`);
      setComments(updated || []);
    } catch (err) { alert("Failed to post comment."); } finally { setIsSubmittingComment(false); }
  };

  return (
    <div className="flex-1 bg-[#111827] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-lg mt-4">
      <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}><FileText size={18} /> Overview</button>
        <button onClick={() => setActiveTab('assignment')} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'assignment' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}><PenTool size={18} /> Assignment {isUnlocked && !lesson.is_completed && <span className="w-2 h-2 rounded-full bg-blue-500 ml-1 animate-pulse"></span>}</button>
        <button onClick={() => setActiveTab('discussion')} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'discussion' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}><MessageSquare size={18} /> Discussion</button>
      </div>

      <div className="p-6 md:p-8 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-lg font-bold text-white">About this lesson</h3><p className="text-slate-300 whitespace-pre-wrap">{lesson.description}</p>
            </motion.div>
          )}

          {activeTab === 'assignment' && (
            <motion.div key="assignment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-6">
              {lesson.is_completed ? (
                <div className="flex flex-col items-center py-8 text-center space-y-4"><div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 size={32} /></div><h3 className="text-xl font-bold text-white">Assignment Completed</h3></div>
              ) : !isUnlocked ? (
                <div className="flex flex-col items-center py-12 text-center space-y-4"><div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500"><Lock size={32} /></div><h3 className="text-xl font-bold text-white">Assignment Locked</h3><p className="text-slate-400">Please watch at least 80% of the video to unlock.</p></div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-100 whitespace-pre-wrap">{lesson.assignmentPrompt}</div>
                  <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-white/5">
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setSubmissionType('link')} className={`flex gap-2 px-6 py-3 rounded-xl text-sm font-bold ${submissionType === 'link' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}><LinkIcon size={16} /> Link</button>
                      <button type="button" onClick={() => setSubmissionType('text')} className={`flex gap-2 px-6 py-3 rounded-xl text-sm font-bold ${submissionType === 'text' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}><FileText size={16} /> Text</button>
                    </div>
                    {submissionType === 'link' ? <input type="url" required value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white" /> : <textarea required rows={5} value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white resize-none" />}
                    <button type="submit" disabled={isSubmitting || !submissionValue} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">{isSubmitting ? 'Submitting...' : 'Submit & Unlock'}</button>
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'discussion' && (
            <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-6">
              <form onSubmit={handlePostComment} className="flex gap-3">
                <input type="text" required placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" />
                <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="px-6 py-3 bg-white text-black font-bold rounded-xl">Post</button>
              </form>
              <div className="space-y-4 pt-4 border-t border-white/5">
                {comments.length === 0 ? <div className="text-slate-500 text-sm italic text-center py-8">No comments yet.</div> : comments.map(c => (
                  <div key={c.id} className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500"><span className="font-bold text-blue-400">{c.user_name}</span><span>{new Date(c.created_at).toLocaleDateString()}</span></div>
                    <p className="text-sm text-slate-300">{c.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};