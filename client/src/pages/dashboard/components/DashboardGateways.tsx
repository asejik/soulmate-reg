import React, { useState } from 'react';
import { Star, Video, FileText, CheckCircle2, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postLMS } from '../../../lib/api';
import { StatusModal } from './StatusModal';

export const DashboardGateways = ({ data, isFullyCompleted, requiresMidReview, hasCompletedFinalReview, setHasCompletedFinalReview }: any) => {
  const navigate = useNavigate();
  const [reviewType, setReviewType] = useState<'video' | 'text'>('video');
  const [reviewContent, setReviewContent] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const submitFinalReview = async (e: React.FormEvent) => {
    e.preventDefault(); setIsReviewSubmitting(true);
    try {
      await postLMS(`/lms/reviews?program=${localStorage.getItem('tai_active_program') || ''}`, { reviewType, content: reviewContent });
      setHasCompletedFinalReview(true);
    } catch (err) { 
      setIsErrorModalOpen(true);
    } finally { setIsReviewSubmitting(false); }
  };

  if (isFullyCompleted) {
    return (
      <div className="bg-[#111827] border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]">
        {!hasCompletedFinalReview ? (
          <div className="p-8 space-y-8">
            <div className="text-center space-y-3"><div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto"><Star size={32} /></div><h2 className="text-2xl font-bold text-white">Final Step: Share Your Experience</h2></div>
            <div className="flex gap-4 max-w-md mx-auto">
              <button onClick={() => setReviewType('video')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold ${reviewType === 'video' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}><Video size={16} /> Video</button>
              <button onClick={() => setReviewType('text')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold ${reviewType === 'text' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}><FileText size={16} /> Text</button>
            </div>
            <form onSubmit={submitFinalReview} className="space-y-6 max-w-2xl mx-auto pt-4 border-t border-white/5">
              <label className="block text-sm font-bold text-slate-300 mb-2">{reviewType === 'video' ? 'Video Link' : 'Your Testimonial'}</label>
              {reviewType === 'video' ? <input type="url" required value={reviewContent} onChange={e => setReviewContent(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" /> : <textarea required rows={5} value={reviewContent} onChange={e => setReviewContent(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" />}
              <button type="submit" disabled={isReviewSubmitting || !reviewContent} className="w-full py-4 bg-white text-black font-bold rounded-xl">{isReviewSubmitting ? 'Submitting...' : 'Submit Review & Unlock Certificate'}</button>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center space-y-6"><div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={40} /></div><h3 className="text-3xl font-bold text-white">Review Verified</h3></div>
        )}
      </div>
    );
  }

  if (requiresMidReview) {
    return (
      <div className="bg-gradient-to-r from-[#2a1a1a] to-[#1a1313] border border-amber-500/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0"><Star size={32} /></div>
        <div className="flex-1 space-y-2"><div className="text-xs font-bold uppercase tracking-wider text-amber-500">Action Required</div><h3 className="text-xl font-bold text-white">Mid-Program Checkpoint</h3></div>
        <button onClick={() => navigate('/dashboard/mid-review')} className="w-full md:w-auto px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">Start Checkpoint</button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#1a1a3a] to-[#13132b] border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0"><PlayCircle size={32} /></div>
      <div className="flex-1 space-y-2"><div className="text-xs font-bold uppercase tracking-wider text-blue-400">Up Next For You</div><h3 className="text-xl font-bold text-white">{data.next_lesson.title}</h3></div>
      <button onClick={() => navigate(`/dashboard/lessons/${data.next_lesson.id}`)} className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">Resume Learning</button>

      <StatusModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        type="error"
        title="Review Not Submitted"
        message="We encountered an issue while saving your final review. Please try again or check your internet connection."
      />
    </div>
  );
};