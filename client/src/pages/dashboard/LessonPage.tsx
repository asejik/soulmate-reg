// client/src/pages/dashboard/LessonPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, CheckCircle, ArrowLeft,
  Link as LinkIcon, FileText, RotateCcw
} from 'lucide-react';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';

const mockLesson = {
  title:            "Module 3: The Power of Vision",
  description:      "In this session, we explore how a unified vision accelerates your preparation for a God-centered marriage.",
  videoId:          "LXb3EKWsInQ",
  assignmentPrompt: "Submit the link to your 2-minute video reflection, or write a 300-word summary of your key takeaways."
};

export const LessonPage = () => {
  const navigate = useNavigate();

  const [isUnlocked,      setIsUnlocked]      = useState(false);
  const [submissionType,  setSubmissionType]  = useState<'text' | 'link'>('link');
  const [submissionValue, setSubmissionValue] = useState('');
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  const {
    containerRef,
    isPlaying,
    isEnded,      // NEW: true when video is at 98%+ and paused
    togglePlay,
    progress,
  } = useYouTubePlayer({
    videoId:          mockLesson.videoId,
    onProgressChange: (pct) => { if (pct >= 80) setIsUnlocked(true); },
    onComplete:       ()    => setIsUnlocked(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Lesson Header */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
          {mockLesson.title}
        </h1>
        <p className="text-slate-400 font-light leading-relaxed">
          {mockLesson.description}
        </p>
      </div>

      {/* Video Player */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl aspect-video group">

        {/* Layer 1 — YouTube iframe */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* Layer 2 — Transparent click blocker.
            Prevents interaction with YouTube's injected UI.
            Always present, covers the full iframe.              */}
        <div className="absolute inset-0 z-10" />

        {/* Layer 3 — Opaque cover when paused or ended.
            FIX 2: This solid bg-black layer completely hides the
            "More Videos" panel that YouTube injects into the iframe
            whenever the video is paused or ended.
            It fades in/out smoothly so it doesn't feel jarring.  */}
        <div className={`
          absolute inset-0 z-20 bg-black
          transition-opacity duration-300
          ${(!isPlaying && progress > 0) ? 'opacity-100' : 'opacity-0'}
        `}>
          {/* Show a still frame impression — just the progress indicator
              so the user knows where they are in the video             */}
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-white/40 text-sm font-medium uppercase tracking-widest">
                  Video Complete
                </div>
                <div className="text-white/20 text-xs">
                  Click play to rewatch
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layer 4 — Custom Controls.
            z-30 keeps them above the opaque cover.               */}
        <div className={`
          absolute inset-0 z-30 transition-opacity flex flex-col justify-end p-6
          pointer-events-none
          ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
        `}>
          {/* Gradient backdrop for readability */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          <div className="relative flex items-center gap-4 pointer-events-auto">

            {/* Play / Pause / Replay Button */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-pink-400 transition-all shadow-lg flex-shrink-0"
            >
              {isEnded
                ? <RotateCcw size={20} />
                : isPlaying
                  ? <Pause size={24} className="fill-current" />
                  : <Play  size={24} className="fill-current ml-1" />
              }
            </button>

            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Percentage */}
            <span className="text-white text-sm font-bold w-12 text-right flex-shrink-0">
              {progress}%
            </span>

          </div>
        </div>

      </div>

      {/* Assignment Section */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-[#13132b] border border-pink-500/30 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(236,72,153,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-pink-500">
              <CheckCircle size={100} />
            </div>

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold uppercase tracking-wide">
                <CheckCircle size={14} /> Video Complete
              </div>
              <h2 className="font-heading text-2xl font-bold text-white">
                Lesson Assignment
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                {mockLesson.assignmentPrompt}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative z-10 space-y-6 pt-4 border-t border-white/10"
            >
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSubmissionType('link')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    submissionType === 'link'
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <LinkIcon size={16} /> Video Link
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('text')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    submissionType === 'text'
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FileText size={16} /> Text Response
                </button>
              </div>

              {submissionType === 'link' ? (
                <input
                  type="url"
                  required
                  placeholder="Paste your Google Drive or YouTube link here..."
                  value={submissionValue}
                  onChange={(e) => setSubmissionValue(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all"
                />
              ) : (
                <textarea
                  required
                  rows={5}
                  placeholder="Type your reflection here..."
                  value={submissionValue}
                  onChange={(e) => setSubmissionValue(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all resize-none"
                />
              )}

              <button
                type="submit"
                disabled={isSubmitting || !submissionValue}
                className="w-full py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  "Submit & Unlock Next Module"
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};