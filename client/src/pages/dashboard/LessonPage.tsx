import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { fetchLMS } from '../../lib/api';
import { VideoPlayerUI } from './components/VideoPlayerUI';
import { LessonTabs } from './components/LessonTabs';
import { QuizOverlay } from './components/QuizOverlay';

export interface LessonData {
  id: string; title: string; description: string; videoId: string;
  assignmentPrompt: string; is_completed: boolean; is_locked: boolean;
  scheduled_start_time?: string | null; last_watched_seconds: number;
  progress: number; closing_at?: string | null; has_quiz: boolean;
}

export const LessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [activity, setActivity] = useState<{ count: number, participants: string[] }>({ count: 0, participants: [] });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLiveModeChange = useCallback((live: boolean) => setIsLiveMode(live), []);

  useEffect(() => {
    if (!id) return;
    fetchLMS(`/lms/lessons/${id}`).then((data) => {
      setLesson(data);
      setIsUnlocked(data.is_completed || data.progress >= 80);
      setIsLoading(false);
    }).catch((err) => {
      setErrorMsg(err.message || 'Failed to load lesson');
      setIsLoading(false);
    });
  }, [id]);

  // Activity polling: count and specific names
  useEffect(() => {
    if (!id || !isLiveMode) {
       setActivity({ count: 0, participants: [] });
       return;
    }
    const fetchActivity = () => {
      fetchLMS(`/lms/lessons/${id}/activity`)
        .then(data => setActivity(data || { count: 0, participants: [] }))
        .catch(console.error);
    };
    fetchActivity();
    const inv = setInterval(fetchActivity, 10_000);
    return () => clearInterval(inv);
  }, [id, isLiveMode]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!lesson) {
    const isCheckpointError = errorMsg?.includes('Checkpoint Required');
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 space-y-6 text-center">
        {isCheckpointError ? (
          <>
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-2">
              <Lock size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white max-w-md leading-relaxed">
              Attend to your Mid-Program Feedback to Proceed
            </h2>
            <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-lg transition-all mt-4">
              Go to Dashboard
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
            Back
          </button>
        )}
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto flex flex-col pb-20">
      <div className="py-6 px-4 md:px-0">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors w-max">
          <ChevronLeft size={16} /> Back to Course Material
        </button>
      </div>
      
      {/* Sticky Video HUD - Ensure no background gap, offset by mobile header height */}
      <div className="sticky top-[56px] md:top-0 z-40 bg-[#0b0f19] pt-0 pb-4 px-4 md:px-0 shadow-xl border-b border-white/5 md:border-none">
        <VideoPlayerUI 
          lesson={lesson} 
          isUnlocked={isUnlocked} 
          setIsUnlocked={setIsUnlocked} 
          onLiveModeChange={handleLiveModeChange} 
        />
      </div>

      <div className="space-y-6 px-4 md:px-0 pt-6">
        <div><h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{lesson.title}</h1></div>
        <LessonTabs lesson={lesson} isUnlocked={isUnlocked} isLiveMode={isLiveMode} activity={activity} />
      </div>
      
      <QuizOverlay lessonId={lesson.id} />
    </div>
  );
};