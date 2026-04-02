import { useEffect, useState } from 'react';
import { MessageSquare, User, ChevronLeft } from 'lucide-react';
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

import { Skeleton } from '../../components/shared/Skeleton';

const DiscussionsSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="grid gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-6">
           <div className="space-y-2">
             <Skeleton className="h-6 w-3/4" />
             <Skeleton className="h-3 w-24" />
           </div>
           <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export const DiscussionsPage = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const activeProg = localStorage.getItem('tai_active_program') || '';
    fetchLMS(`/lms/discussions?program=${activeProg}`)
      .then((data) => { setTopics(data || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <DiscussionsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      <div className="space-y-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="text-blue-500" size={32} /> Central Forums
        </h1>
        <p className="text-slate-400 text-sm">Join the latest curriculum-wide discussions.</p>
      </div>

      <div className="grid gap-6">
        {topics.length === 0 ? (
          <div className="text-center py-16 bg-[#111827]/50 border border-white/5 rounded-3xl text-slate-500 italic">
            No discussions yet. Be the first to start a conversation inside a lesson!
          </div>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => navigate(`/dashboard/lessons/${topic.lesson_id}`)}
              className="group relative bg-[#111827] border border-white/5 rounded-3xl p-6 md:p-8 hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all cursor-pointer shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {topic.lesson_title}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Topic</p>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5 relative">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                         <User size={10} />
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{topic.user_name}</span>
                       <span className="text-[10px] text-slate-600">• {new Date(topic.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                      {topic.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                   <button className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-full transition-all shadow-lg shadow-blue-500/10 group-hover:scale-105">
                     <MessageSquare size={14} /> Join Discussion
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};