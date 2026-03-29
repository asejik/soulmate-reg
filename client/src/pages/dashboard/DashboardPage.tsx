import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, BookOpen, Award, Video, FileText, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config';
import { fetchLMS, postLMS } from '../../lib/api';

// --- DATA INTERFACES ---
interface DashboardLesson { id: string; title: string; estimated_time: string; is_completed: boolean; }
interface DashboardModule { id: string; title: string; lessons: DashboardLesson[]; }
interface DashboardData {
  user_id: string;
  has_completed_final_review: boolean;
  has_completed_mid_review: boolean;
  cohort: { name: string; total_lessons: number; completed_lessons: number; };
  next_lesson: { id: string; title: string; estimated_time: string; };
  curriculum: DashboardModule[];
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // --- Testimonial Gateway State ---
  const [reviewType, setReviewType] = useState<'video' | 'text'>('video');
  const [reviewContent, setReviewContent] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [hasCompletedFinalReview, setHasCompletedFinalReview] = useState(false);

  useEffect(() => {
    fetchLMS('/lms/dashboard')
      .then((responseData: DashboardData) => {
        setData(responseData);

        // Tell React if the database says they already reviewed!
        setHasCompletedFinalReview(responseData.has_completed_final_review);

        const nextLessonId = responseData.next_lesson?.id;
        const initialExpanded: Record<string, boolean> = {};
        responseData.curriculum.forEach((module, index) => {
          const hasNextLesson = module.lessons.some(l => l.id === nextLessonId);
          if (hasNextLesson || index === 0) initialExpanded[module.id] = true;
        });
        setExpandedModules(initialExpanded);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load dashboard data. Your session may have expired.');
        setIsLoading(false);
      });
  }, []);

  const toggleModule = (moduleId: string) => setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));

  const handleDownloadCertificate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/lms/certificate`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TAI_Certificate.pdf';
      a.click();
    }
  };

  const submitFinalReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewSubmitting(true);

    try {
      await postLMS('/lms/reviews', {
        reviewType: reviewType,
        content: reviewContent
      });
      setHasCompletedFinalReview(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review. Please check your connection and try again.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (error || !data) return <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4"><div className="text-red-400 text-center">{error}</div><button onClick={() => navigate('/login')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Return to Login</button></div>;

  const progressPercentage = Math.round((data.cohort.completed_lessons / data.cohort.total_lessons) * 100);
  const isFullyCompleted = progressPercentage >= 100;
  const requiresMidReview = progressPercentage >= 50 && !data.has_completed_mid_review;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      {/* 1. COURSE HEADER */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{data.cohort.name}</h1>
          <p className="text-slate-400 text-sm">Review syllabus, track your progress, and continue your learning journey.</p>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              {isFullyCompleted ? <Award size={24} /> : <BookOpen size={24} />}
            </div>
            <div>
              <div className="text-sm font-bold text-white mb-1">{isFullyCompleted ? "Course Completed!" : "Learning Progress"}</div>
              <div className="text-xs text-slate-400">{data.cohort.completed_lessons} of {data.cohort.total_lessons} items completed</div>
            </div>
          </div>

          <div className="w-full md:flex-1 max-w-md">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>{progressPercentage}%</span><span>100%</span></div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          {isFullyCompleted && hasCompletedFinalReview && (
            <button onClick={handleDownloadCertificate} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shrink-0">
              Download Certificate
            </button>
          )}
        </div>
      </div>

      {/* 2. DYNAMIC TOP SECTION */}
      {isFullyCompleted ? (

        /* --- STATE 1: 100% COMPLETE (FINAL GATEWAY) --- */
        <div className="bg-[#111827] border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]">
          {!hasCompletedFinalReview ? (
            <div className="p-8 space-y-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto"><Star size={32} /></div>
                <h2 className="text-2xl font-bold text-white">Final Step: Share Your Experience</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Congratulations on finishing the curriculum! To unlock your official Certificate of Completion, please submit a final review of your experience.
                </p>
              </div>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={() => setReviewType('video')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${reviewType === 'video' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                  <Video size={16} /> Video Upload
                </button>
                <button onClick={() => setReviewType('text')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${reviewType === 'text' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                  <FileText size={16} /> Text Review
                </button>
              </div>

              <form onSubmit={submitFinalReview} className="space-y-6 max-w-2xl mx-auto pt-4 border-t border-white/5">
                {reviewType === 'video' ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                      <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wider">Video Guidelines</h4>
                      <ul className="text-sm text-blue-100/80 space-y-1 list-disc list-inside">
                        <li>Presentable appearance (simple, inviting)</li>
                        <li>Clean background</li>
                        <li>Good lighting (natural light acceptable)</li>
                        <li>Portrait orientation</li>
                        <li>Clear audio</li>
                      </ul>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Video Link (Google Drive, YouTube, etc.)</label>
                      <input type="url" required placeholder="https://..." value={reviewContent} onChange={e => setReviewContent(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                      <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wider">Writing Prompts</h4>
                      <ul className="text-sm text-blue-100/80 space-y-1 list-disc list-inside">
                        <li>How did the Relationship Counseling Classes go?</li>
                        <li>How would you describe the counselor (Mrs. Temitope Ayenigba)?</li>
                        <li>What is your major takeaway?</li>
                      </ul>
                      <p className="text-xs text-blue-400 mt-2 font-bold italic">Note: Please also copy your response and post it to our Google Reviews page!</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Your Testimonial</label>
                      <textarea required rows={5} placeholder="Write your review here..." value={reviewContent} onChange={e => setReviewContent(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isReviewSubmitting || !reviewContent} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 flex justify-center items-center">
                  {isReviewSubmitting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Submit Review & Unlock Certificate'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={40} /></div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white">Review Verified</h3>
                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">Thank you for sharing your experience! Your certificate of completion has been successfully generated.</p>
              </div>
              <button onClick={handleDownloadCertificate} className="inline-block mt-4 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20">
                Download Official Certificate
              </button>
            </div>
          )}
        </div>

      ) : requiresMidReview ? (

        /* --- STATE 2: 50% COMPLETE (MID-COHORT CHECKPOINT) --- */
        <div className="bg-gradient-to-r from-[#2a1a1a] to-[#1a1313] border border-amber-500/40 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Star size={32} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500">Action Required</div>
            <h3 className="text-xl font-bold text-white">Mid-Program Checkpoint</h3>
            <p className="text-sm text-slate-400">You've reached the halfway mark! Please complete your mid-cohort review to unlock the rest of the curriculum.</p>
          </div>
          <button onClick={() => navigate('/dashboard/mid-review')} className="w-full md:w-auto px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
            Start Checkpoint
          </button>
        </div>

      ) : (

        /* --- STATE 3: NORMAL LEARNING (UP NEXT) --- */
        <div className="bg-gradient-to-r from-[#1a1a3a] to-[#13132b] border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <PlayCircle size={32} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Up Next For You</div>
            <h3 className="text-xl font-bold text-white">{data.next_lesson.title}</h3>
          </div>
          <button onClick={() => navigate(`/dashboard/lessons/${data.next_lesson.id}`)} className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">
            Resume Learning
          </button>
        </div>
      )}

      {/* 3. COURSE SYLLABUS (Accordion) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Course Material</h2>
        <div className="space-y-3">
          {data.curriculum.map((module, mIdx) => {
            const isExpanded = expandedModules[module.id];
            const completedInModule = module.lessons.filter(l => l.is_completed).length;
            const totalInModule = module.lessons.length;

            return (
              <div key={module.id} className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleModule(module.id)} className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Module {mIdx + 1}</div>
                    <h3 className="text-lg font-bold text-slate-200">{module.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:block text-xs font-medium text-slate-500">{completedInModule}/{totalInModule} completed</div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-[#0b0f19]/50">
                      <div className="flex flex-col divide-y divide-white/5">
                        {module.lessons.map((lesson) => {
                          const isNextLesson = lesson.id === data.next_lesson?.id;
                          return (
                            <div key={lesson.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 transition-colors ${isNextLesson ? 'bg-blue-500/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                              <div className="flex items-start md:items-center gap-4">
                                <div className="mt-0.5 md:mt-0 shrink-0">
                                  {lesson.is_completed ? <CheckCircle2 size={20} className="text-green-500" /> : isNextLesson ? <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-full" /></div> : <PlayCircle size={20} className="text-slate-600" />}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${lesson.is_completed ? 'text-slate-300' : isNextLesson ? 'text-white font-bold' : 'text-slate-400'}`}>{lesson.title}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1"><Clock size={12} /> {lesson.estimated_time} • Video</div>
                                </div>
                              </div>
                              <div className="pl-9 md:pl-0 shrink-0">
                                <button onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${isNextLesson ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/20' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}>
                                  {lesson.is_completed ? 'Review' : isNextLesson ? 'Resume' : 'Start'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};