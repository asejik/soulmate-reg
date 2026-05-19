import { useState } from 'react';
import { Star, PlayCircle, Instagram } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postLMS } from '../../../lib/api';
import { StatusModal } from './StatusModal';

export const DashboardGateways = ({ data, isFullyCompleted, requiresMidReview, hasCompletedFinalReview, setHasCompletedFinalReview }: any) => {
  const navigate = useNavigate();
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleInstagramClick = async () => {
    // Open the reel in a new tab immediately to bypass popup blockers
    window.open('https://www.instagram.com/reels/DYh3VdTCf3X/', '_blank', 'noopener,noreferrer');

    setIsReviewSubmitting(true);
    try {
      await postLMS(`/lms/reviews?program=${localStorage.getItem('tai_active_program') || ''}`, { 
        reviewType: 'final_instagram', 
        content: 'Instagram Reels Link Clicked' 
      });
      setHasCompletedFinalReview(true);
    } catch (err) { 
      setIsErrorModalOpen(true);
    } finally { 
      setIsReviewSubmitting(false); 
    }
  };

  if (isFullyCompleted) {
    if (hasCompletedFinalReview) {
      return (
        <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-[#111827] p-8 shadow-2xl transition-all duration-500 hover:border-blue-500/30">
          <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-8 ring-blue-500/10">
              <Star size={40} className="animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-3xl font-extrabold text-white tracking-tight leading-none">Graduation Complete!</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl">Congratulations on successfully finishing your journey. Your commitment and growth are truly inspiring. Your official certificate is ready for you below!</p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
               <button 
                  onClick={() => {
                     const btn = document.getElementById('tai-main-cert-btn') as HTMLButtonElement;
                     if (btn) btn.click();
                  }}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
               >
                  <Star className="fill-black" size={18} />
                  Download Certificate
               </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#111827] border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
              <Star size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Final Step: Share Your Experience</h2>
          </div>
          
          <div className="max-w-2xl mx-auto text-center space-y-4 pt-4 border-t border-white/5 flex flex-col items-center">
            <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line">
              Welcome to the end of Ready for A Soulmate Cohort 3!!! Share your experience on the link below.{"\n"}
              Do well to connect with others.{"\n"}{"\n"}
              Have a beautiful life ahead ❤️
            </p>
            
            <button 
              onClick={handleInstagramClick}
              disabled={isReviewSubmitting}
              className="w-full max-w-md py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
            >
              <Instagram size={18} />
              {isReviewSubmitting ? 'Verifying...' : 'Share Experience on Instagram & Unlock Certificate'}
            </button>
          </div>
        </div>
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