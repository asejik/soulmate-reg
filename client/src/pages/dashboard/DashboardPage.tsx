import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLMS } from '../../lib/api';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardGateways } from './components/DashboardGateways';
import { ModuleAccordion } from './components/ModuleAccordion';

export interface DashboardLesson {
  id: string; title: string; estimated_time: string;
  is_completed: boolean; scheduled_start_time?: string | null;
  progress: number; last_watched_seconds: number;
}
export interface DashboardModule { id: string; title: string; lessons: DashboardLesson[]; }
export interface DashboardData {
  user_id: string; has_completed_final_review: boolean; has_completed_mid_review: boolean;
  active_program: string; enrolled_programs: string[];
  cohort: { name: string; total_lessons: number; completed_lessons: number; };
  next_lesson: { id: string; title: string; estimated_time: string; };
  curriculum: DashboardModule[];
}

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

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="flex flex-col items-center justify-center min-h-[50vh]"><button onClick={() => navigate('/login')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Return to Login</button></div>;

  const progressPercentage = Math.round((data.cohort.completed_lessons / data.cohort.total_lessons) * 100);
  const isFullyCompleted = progressPercentage >= 100;
  const requiresMidReview = progressPercentage >= 50 && !data.has_completed_mid_review;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <DashboardHeader data={data} progressPercentage={progressPercentage} isFullyCompleted={isFullyCompleted} hasCompletedFinalReview={hasCompletedFinalReview} />
      <DashboardGateways data={data} isFullyCompleted={isFullyCompleted} requiresMidReview={requiresMidReview} hasCompletedFinalReview={hasCompletedFinalReview} setHasCompletedFinalReview={setHasCompletedFinalReview} />
      <ModuleAccordion curriculum={data.curriculum} nextLessonId={data.next_lesson?.id} currentTime={currentTime} />
    </div>
  );
};