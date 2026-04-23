import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldAlert, ChevronLeft, Send, CheckCircle2, Play, Pause, RotateCcw, Volume2, VolumeX, Video } from 'lucide-react';
import { postLMS, fetchLMS } from '../../lib/api';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { StatusModal } from '../../pages/dashboard/components/StatusModal';

export const MidCohortReviewPage = () => {
  const navigate = useNavigate();
  const [reviewType, setReviewType] = useState<'video' | 'google'>('video');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Custom Modal States
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const activeProgram = localStorage.getItem('tai_active_program') || '';
        const data = await fetchLMS(`/lms/dashboard?program=${activeProgram}`);
        // The dashboard now returns the special video ID from our settings table
        setVideoId(data.checkpoint_video_id || '');
      } catch (err) {
        console.error("Failed to load checkpoint video ID");
      }
    };
    fetchSettings();
  }, []);

  const {
      containerRef, isPlaying, isEnded, togglePlay, progress, volume, isMuted, handleVolumeChange, toggleMute, handleSeek
  } = useYouTubePlayer({
      videoId: videoId,
      onProgressChange: (pct) => { if (pct >= 85) setIsUnlocked(true); },
      onComplete: () => setIsUnlocked(true),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;

    setIsSubmitting(true);
    try {
      const activeProgram = localStorage.getItem('tai_active_program') || '';
      let typeStr = 'mid_cohort';
      if (reviewType === 'video') typeStr = 'mid_video';
      if (reviewType === 'google') typeStr = 'mid_google';
      
      await postLMS(`/lms/reviews?program=${activeProgram}`, {
        reviewType: typeStr,
        content: reviewContent || 'Google Review Clicked'
      });

      setIsSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setErrorMessage("We encountered an issue while saving your review. Please double-check your connection and try again.");
      setIsErrorModalOpen(true);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-6 bg-[#111827] border border-white/5 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0" />
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <CheckCircle2 size={40} className="animate-in zoom-in-0 duration-500" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Checkpoint Cleared!</h2>
        <p className="text-slate-400 text-sm leading-relaxed">Thank you for your valuable feedback. Your next module has been officially unlocked. Redirecting you back to the curriculum...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Pop up alerts */}
      <StatusModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)}
        type="error"
        title="Submission Failed"
        message={errorMessage}
      />

      {/* Header */}
      <div className="space-y-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Star className="text-amber-500" size={32} /> Mid-Program Checkpoint
        </h1>
        <p className="text-slate-400 text-sm">You've made it halfway through the curriculum! Before we unlock the second half of your journey, please watch this quick check-in video and leave your feedback.</p>
      </div>

      {/* CUSTOM Video Player UI (Same as lessons) */}
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={(e) => e.preventDefault()} />

        {/* Video Overlay Info/Ended State */}
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

        {/* Custom Controls Bar */}
        <div className={`absolute inset-0 z-30 transition-opacity flex flex-col justify-end p-6 pointer-events-none ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4 pointer-events-auto">

            <button onClick={togglePlay} className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-amber-500 transition-all shadow-lg flex-shrink-0">
              {isEnded ? <RotateCcw size={20} /> : isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
            </button>

            <div className="flex items-center gap-2 group/volume cursor-pointer bg-black/40 px-3 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <button onClick={toggleMute} className="text-white hover:text-amber-400 transition-colors flex-shrink-0">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 accent-amber-500 h-1 cursor-pointer origin-left" />
            </div>

            {isUnlocked ? (
              <div className="flex-1 relative ml-2 flex items-center h-2 group/progress cursor-pointer">
                <input type="range" min="0" max="100" value={progress} onChange={(e) => handleSeek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-75" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden ml-2">
                <div className="h-full bg-amber-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>
            )}
            <span className="text-white text-sm font-bold w-12 text-right flex-shrink-0">{progress}%</span>

          </div>
        </div>
      </div>

      {/* Midpoint Reflection Prompt */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
        <div className="space-y-1">
          <p className="text-amber-400 italic font-semibold text-base">Midpoint Reflection at Ready for A Soulmate</p>
        </div>

        <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
          <p>Take your time to create a clean video to fully express yourself.</p>
        </div>

        <hr className="border-white/10" />

        <p className="text-slate-400 text-sm">It's been 6 sessions back to back.</p>

        <ul className="space-y-4">
          {[
            "How would you describe your experience so far in the growth and relationship-focused sessions with Mrs. Ayenigba?",
            "What changes have you begun to notice in your self-awareness, mindset, or approach to relationships?",
            "How would you describe the level of guidance and support you have received so far?",
            "What are you looking forward to seeing in the remaining Sessions?"
          ].map((question, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed">{question}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* The Review Form */}
      <div className="bg-[#111827] border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)]">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Strict Instructions Block */}
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-4">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={24} />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-500 uppercase tracking-wider text-sm">Mandatory Guidelines</h4>
              <p className="text-sm text-amber-500/80 leading-relaxed">
                Your feedback will be linked to our public Google Reviews page. Responses <strong>must be professional</strong>. Please do not use promotional language or mention the word "free".
              </p>
            </div>
          </div>

          <div className="flex gap-4 max-w-sm mx-auto p-1 bg-white/5 rounded-2xl mb-6">
            <button type="button" onClick={() => setReviewType('video')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${reviewType === 'video' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}><Video size={16} /> Video Link</button>
            <button type="button" onClick={() => setReviewType('google')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${reviewType === 'google' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}><Star size={16} /> Google Review</button>
          </div>

          {reviewType === 'video' && (
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Share your Video Review (Paste link below)</label>
              <input 
                type="url" 
                required 
                placeholder="Loom, YouTube, or Drive link..." 
                value={reviewContent} 
                onChange={e => setReviewContent(e.target.value)} 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" 
              />
            </div>
          )}

          {reviewType === 'google' && (
            <div className="space-y-6 text-center py-4">
              <p className="text-slate-400 text-sm leading-relaxed">Please click the link below to leave us a 5-star review on Google! Once done, come back here to finalize your checkpoint.</p>
              <a 
                href="https://g.page/r/CUshM1sWqjCoEAE/review" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setReviewContent('Google Review Link Clicked')}
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold underline decoration-amber-500/30 underline-offset-4"
              >
                Soulmate Relationship Google Review Page
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (reviewType !== 'google' && !reviewContent.trim())}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isSubmitting ? 'Verifying...' : reviewType === 'google' ? 'I have submitted my Google Review' : 'Submit Review & Unlock Next Lesson'} <Send size={18} />
          </button>
        </form>
      </div>

    </div>
  );
};