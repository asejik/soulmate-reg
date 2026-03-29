import { useEffect, useState } from 'react';
import { MessageSquare, ExternalLink, User, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLMS } from '../../lib/api';

interface Comment {
  id: string;
  lesson_id: string;
  lesson_title: string;
  user_name: string;
  content: string;
  created_at: string;
}

export const DiscussionsPage = () => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLMS('/lms/discussions')
      .then((data) => { setComments(data || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      <div className="space-y-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="text-blue-500" size={32} /> Discussion Forums
        </h1>
        <p className="text-slate-400 text-sm">See what other participants are discussing across the curriculum.</p>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 bg-[#111827] border border-white/5 rounded-2xl text-slate-400">
            No discussions yet. Be the first to start a conversation inside a lesson!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-[#111827] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors shadow-lg">

              {/* Comment Header */}
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200">{comment.user_name}</div>
                    <div className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/dashboard/lessons/${comment.lesson_id}`)}
                  className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg"
                >
                  <ExternalLink size={14} /> Go to Lesson
                </button>
              </div>

              {/* Comment Body */}
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </div>

              {/* Context Tag */}
              <div className="mt-4 inline-block text-xs font-medium text-slate-500 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                Posted in: {comment.lesson_title}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};