import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { fetchLMS } from '../../lib/api';
import { VideoPlayerUI } from './components/VideoPlayerUI';
import { LessonTabs } from './components/LessonTabs';

export interface LessonData {
  id: string; title: string; description: string; videoId: string;
  assignmentPrompt: string; is_completed: boolean; is_locked: boolean;
  scheduled_start_time?: string | null; last_watched_seconds: number;
  progress: number;
}

export const LessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchLMS(`/lms/lessons/${id}`).then((data) => {
      setLesson(data);
      // 2. CHANGE THIS LINE: Unlocks if completed OR if previously watched > 80%
      setIsUnlocked(data.is_completed || data.progress >= 80);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!lesson) return <div className="flex flex-col items-center justify-center min-h-[50vh]"><button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">Back</button></div>;

  if (lesson.is_locked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500"><Lock size={48} /></div>
        <h2 className="text-3xl font-bold text-white mb-3">Lesson Locked</h2>
        <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col pb-20 space-y-6">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors w-max">
        <ChevronLeft size={16} /> Back to Course Material
      </button>
      <VideoPlayerUI lesson={lesson} isUnlocked={isUnlocked} setIsUnlocked={setIsUnlocked} />
      <div><h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{lesson.title}</h1></div>
      <LessonTabs lesson={lesson} isUnlocked={isUnlocked} />
    </div>
  );
};