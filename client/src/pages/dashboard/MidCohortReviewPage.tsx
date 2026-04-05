import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldAlert, ChevronLeft, Send, CheckCircle2 } from 'lucide-react';
import { postLMS, fetchLMS } from '../../lib/api';

export const MidCohortReviewPage = () => {
  const navigate = useNavigate();
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [videoId, setVideoId] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await fetchLMS('/lms/dashboard');
        console.log("🎥 Dashboard Data:", data);
        // The dashboard now returns the special video ID from our settings table
        setVideoId(data.checkpoint_video_id || '');
      } catch (err) {
        console.error("Failed to load checkpoint video ID");
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;

    setIsSubmitting(true);
    try {
      await postLMS('/lms/reviews', {
        reviewType: 'mid_cohort',
        content: reviewContent
      });

      setIsSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      alert("Failed to submit review. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-6 bg-[#111827] border border-white/5 p-12 rounded-3xl shadow-2xl">
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white">Checkpoint Cleared!</h2>
        <p className="text-slate-400">Thank you for your feedback. Your next module has been officially unlocked. Redirecting you back to the curriculum...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

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

      {/* Facilitator Check-in Video */}
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&origin=${window.location.origin}`}
          title="Mid-Cohort Check-in"
          className="absolute top-0 left-0 w-full h-full border-0 pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>

        {/* Protection Shield: Prevents interaction/clicking out to YouTube */}
        <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={(e) => e.preventDefault()} />
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

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">How has the program impacted you so far?</label>
            <textarea
              required
              rows={6}
              placeholder="Write your professional review here..."
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !reviewContent.trim()}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isSubmitting ? 'Verifying...' : 'Submit Review & Unlock Next Lesson'} <Send size={18} />
          </button>
        </form>
      </div>

    </div>
  );
};