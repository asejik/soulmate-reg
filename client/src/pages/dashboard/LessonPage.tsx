import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Link as LinkIcon, FileText, RotateCcw,
  ChevronLeft, AlertTriangle, Lock, MessageSquare, PenTool, CheckCircle2,
  Volume2, VolumeX
} from 'lucide-react';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { fetchLMS, postLMS } from '../../lib/api';

interface LessonData {
  id: string;
  title: string;
  description: string;
  videoId: string;
  assignmentPrompt: string;
  is_completed: boolean;
}

export const LessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchLMS(`/lms/lessons/${id}`)
      .then((data) => {
        setLesson(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load lesson data. Your session may have expired.');
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (error || !lesson) return <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4"><div className="text-red-400 text-center">{error}</div><button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Back to Course Material</button></div>;

  return <LessonContent lesson={lesson} />;
};

const LessonContent = ({ lesson }: { lesson: LessonData }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'assignment' | 'discussion'>('overview');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState(lesson.is_completed);
  const [submissionType, setSubmissionType] = useState<'text' | 'link'>('link');
  const [submissionValue, setSubmissionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    containerRef, isPlaying, isEnded, togglePlay, progress,
    volume, isMuted, handleVolumeChange, toggleMute,
    handleSeek // <-- IMPORTED SEEK FUNCTION
  } = useYouTubePlayer({
    videoId: lesson.videoId,
    onProgressChange: (pct) => { if (pct >= 80) setIsUnlocked(true); },
    onComplete: () => setIsUnlocked(true),
  });

  useEffect(() => {
    if (activeTab === 'discussion') {
      fetchLMS(`/lms/lessons/${lesson.id}/comments`)
        .then(data => setComments(data || []))
        .catch(console.error);
    }
  }, [activeTab, lesson.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await postLMS(`/lms/lessons/${lesson.id}/submit`, {
        submissionType: submissionType,
        content: submissionValue
      });
      navigate('/dashboard');
    } catch (err) {
      alert("Failed to submit assignment. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await postLMS(`/lms/lessons/${lesson.id}/comments`, { content: newComment });
      setNewComment('');
      const updated = await fetchLMS(`/lms/lessons/${lesson.id}/comments`);
      setComments(updated || []);
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col pb-20 space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Course Material
        </button>

        {lesson.is_completed && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full border border-green-500/20">
            <CheckCircle2 size={14} /> Lesson Completed
          </span>
        )}
      </div>

      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 z-10" />
        <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-300 ${(!isPlaying && progress > 0) ? 'opacity-100' : 'opacity-0'}`}>
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-white/40 text-sm font-medium uppercase tracking-widest">Video Complete</div>
                <div className="text-white/20 text-xs">Click play to rewatch</div>
              </div>
            </div>
          )}
        </div>

        <div className={`absolute inset-0 z-30 transition-opacity flex flex-col justify-end p-6 pointer-events-none ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4 pointer-events-auto">
            <button onClick={togglePlay} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-blue-500 transition-all shadow-lg flex-shrink-0">
              {isEnded ? <RotateCcw size={20} /> : isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
            </button>

            <div className="flex items-center gap-2 group/volume cursor-pointer bg-black/40 px-3 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors flex-shrink-0">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 accent-blue-500 h-1 cursor-pointer origin-left"
              />
            </div>

            {/* --- NEW: DYNAMIC DRAGGABLE PROGRESS BAR --- */}
            {isUnlocked ? (
              <div className="flex-1 relative ml-2 flex items-center h-2 group/progress cursor-pointer">
                {/* Invisible slider sitting on top to capture clicks/drags */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Visual bar sitting underneath */}
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              // The original locked static bar
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden ml-2">
                <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>
            )}

            <span className="text-white text-sm font-bold w-12 text-right flex-shrink-0">{progress}%</span>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{lesson.title}</h1>
      </div>

      {/* --- SPLIT TABBED INTERFACE --- */}
      <div className="flex-1 bg-[#111827] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-lg mt-4">

        <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <FileText size={18} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'assignment' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <PenTool size={18} /> Assignment
            {isUnlocked && !lesson.is_completed && <span className="w-2 h-2 rounded-full bg-blue-500 ml-1 animate-pulse"></span>}
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'discussion' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <MessageSquare size={18} /> Discussion
          </button>
        </div>

        <div className="p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">

            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <h3 className="text-lg font-bold text-white">About this lesson</h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lesson.description || "No description provided for this lesson."}
                </p>
              </motion.div>
            )}

            {activeTab === 'assignment' && (
              <motion.div key="assignment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-6">

                {lesson.is_completed ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Assignment Completed</h3>
                      <p className="text-slate-400 max-w-md mx-auto">You have already submitted and passed this lesson's assignment. Great job!</p>
                    </div>
                    <div className="mt-8 text-left w-full p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-100 whitespace-pre-wrap shadow-inner">
                      <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wider mb-2">Original Task:</h4>
                      {lesson.assignmentPrompt}
                    </div>
                  </div>
                ) : !isUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500">
                      <Lock size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Assignment Locked</h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Please watch at least 80% of the video lesson above to unlock this assignment. Current progress: {progress}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">Your Task</h3>
                      <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-100 leading-relaxed whitespace-pre-wrap">
                        {lesson.assignmentPrompt || "Complete the required task for this lesson."}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-white/5">
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setSubmissionType('link')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${submissionType === 'link' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                          <LinkIcon size={16} /> Video Link
                        </button>
                        <button type="button" onClick={() => setSubmissionType('text')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${submissionType === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                          <FileText size={16} /> Text Response
                        </button>
                      </div>

                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <div className="text-amber-500 mt-0.5"><AlertTriangle size={18} /></div>
                        <p className="text-sm text-amber-500/90 leading-relaxed font-medium">
                          <strong className="block text-amber-400 mb-0.5">Important Reminder:</strong>
                          Even if you have already submitted this assignment on the WhatsApp community, a copy MUST be uploaded here on the platform to unlock your next lesson.
                        </p>
                      </div>

                      {submissionType === 'link' ? (
                        <input
                          type="url" required placeholder="Paste your Google Drive or YouTube link here..."
                          value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <textarea
                          required rows={5} placeholder="Type your reflection here..."
                          value={submissionValue} onChange={(e) => setSubmissionValue(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                        />
                      )}

                      <button type="submit" disabled={isSubmitting || !submissionValue} className="w-full py-4 bg-blue-600 text-white hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit & Unlock Next Module"}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'discussion' && (
              <motion.div key="discussion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Course Q&A</h3>
                  <p className="text-sm text-slate-400">Ask questions, share insights, or read what others have to say about this lesson.</p>
                </div>

                <form onSubmit={handlePostComment} className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text" required placeholder="Add a comment or question..."
                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                    {isSubmittingComment ? 'Posting...' : 'Post'}
                  </button>
                </form>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  {comments.length === 0 ? (
                    <div className="text-slate-500 text-sm italic text-center py-8">No comments yet. Be the first to start the discussion!</div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-blue-400">{comment.user_name}</span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};