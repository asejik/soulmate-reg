import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLMS } from '../../lib/api';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardGateways } from './components/DashboardGateways';
import { ModuleAccordion } from './components/ModuleAccordion';
import { IntroVideoCard } from './components/IntroVideoCard';

export interface DashboardLesson {
  id: string; title: string; estimated_time: string;
  is_completed: boolean; scheduled_start_time?: string | null;
  progress: number; last_watched_seconds: number;
  has_feedback: boolean;
}
export interface DashboardModule { id: string; title: string; lessons: DashboardLesson[]; }
export interface DashboardData {
  user_id: string; 
  has_completed_final_review: boolean; 
  has_completed_mid_review: boolean;
  checkpoint_video_id: string;
  intro_video_id: string;
  active_program: string; enrolled_programs: string[];
  cohort: { name: string; total_lessons: number; completed_lessons: number; };
  next_lesson: { id: string; title: string; estimated_time: string; };
  curriculum: DashboardModule[];
}

import { Skeleton } from '../../components/shared/Skeleton';

// --- Dashboard Skeleton Layout ---
const DashboardSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 md:px-0 animate-in fade-in duration-500">
    {/* Header Skeleton */}
    <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-64" />
      <div className="grid md:grid-cols-2 gap-4 pt-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
    {/* Gateway Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
    {/* Module Skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCompletedFinalReview, setHasCompletedFinalReview] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedProgram = localStorage.getItem('tai_active_program') || '';
    fetchLMS(`/lms/dashboard?program=${storedProgram}`)
      .then((responseData: DashboardData) => {
        setData(responseData);
        setHasCompletedFinalReview(responseData.has_completed_final_review);
        localStorage.setItem('tai_active_program', responseData.active_program);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return <div className="flex flex-col items-center justify-center min-h-[50vh]"><button onClick={() => navigate('/login')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Return to Login</button></div>;

  const progressPercentage = Math.round((data.cohort.completed_lessons / data.cohort.total_lessons) * 100);
  const isFullyCompleted = progressPercentage >= 100;
  const requiresMidReview = progressPercentage >= 50 && !data.has_completed_mid_review;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <DashboardHeader data={data} progressPercentage={progressPercentage} isFullyCompleted={isFullyCompleted} hasCompletedFinalReview={hasCompletedFinalReview} />
      <DashboardGateways data={data} isFullyCompleted={isFullyCompleted} requiresMidReview={requiresMidReview} hasCompletedFinalReview={hasCompletedFinalReview} setHasCompletedFinalReview={setHasCompletedFinalReview} />
      
      {data.intro_video_id && <IntroVideoCard videoId={data.intro_video_id} />}

      <ModuleAccordion
        curriculum={data.curriculum}
        nextLessonId={data.next_lesson?.id}
        currentTime={currentTime}
        requiresMidReview={requiresMidReview}
        totalLessons={data.cohort.total_lessons}
      />
    </div>
  );
};