import { useState, useEffect } from 'react';
import { Star, Video, FileText, Search, User, Mail, Calendar, ExternalLink, X } from 'lucide-react';
import { fetchLMS } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminReview {
  id: string;
  student_name: string;
  email: string;
  program_name: string;
  review_type: string;
  content: string;
  created_at: string;
}

const isUrl = (val: string) => val.startsWith('http://') || val.startsWith('https://');

export const ReviewsTab = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchLMS('/admin/reviews');
        setReviews(data || []);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReviews();
  }, []);

  const filteredReviews = reviews.filter(r => 
    r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getReviewIcon = (type: string) => {
    if (type.includes('video')) return <Video size={16} className="text-blue-400" />;
    if (type.includes('google')) return <Star size={16} className="text-amber-400" />;
    return <FileText size={16} className="text-pink-400" />;
  };

  const getReviewLabel = (type: string) => {
    if (type.includes('mid')) return 'Mid-Program Checkpoint';
    if (type.includes('final')) return 'Final Graduation';
    return 'Program Review';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Star className="text-amber-500" size={24} />
            Program Reviews
          </h2>
          <p className="text-slate-400 text-sm">Review mid-program and graduation feedback from students.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search by name, email or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 w-full md:w-80 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600">
            <Star size={32} />
          </div>
          <p className="text-slate-400 font-medium">No reviews found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredReviews.map((review, i) => (
              <motion.div
                key={review.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 10) * 0.05 }}
                onClick={() => setSelectedReview(review)}
                className="bg-white/5 border border-white/5 hover:border-amber-500/30 rounded-2xl p-6 space-y-4 cursor-pointer transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={16} className="text-amber-500" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <User size={14} className="text-slate-500" />
                    {review.student_name}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Mail size={12} className="text-slate-600" />
                    {review.email}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l-2 border-white/10 pl-3">
                  {getReviewIcon(review.review_type)}
                  <div>
                    <p className="text-xs font-bold text-slate-300">{getReviewLabel(review.review_type)}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{review.program_name}</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-3">
                  {isUrl(review.content) ? (
                    <a href={review.content} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 text-xs font-medium underline break-all">
                      {review.content}
                    </a>
                  ) : (
                    <p className="text-slate-300 text-xs italic line-clamp-3 leading-relaxed">
                      "{review.content}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={10} />
                    {formatDate(review.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a16] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <button 
                onClick={() => setSelectedReview(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
                  {getReviewIcon(selectedReview.review_type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{selectedReview.student_name}</h3>
                  <p className="text-slate-400 text-sm">{selectedReview.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getReviewLabel(selectedReview.review_type)}</span>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                  {isUrl(selectedReview.content) ? (
                    <a href={selectedReview.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-bold underline break-all flex items-center gap-2">
                      <ExternalLink size={16} /> Open Link
                    </a>
                  ) : (
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReview.content}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-6">
                <p>Program: <span className="text-slate-300 font-bold ml-1 uppercase">{selectedReview.program_name}</span></p>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(selectedReview.created_at)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
