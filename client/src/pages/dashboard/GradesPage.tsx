import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Circle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLMS } from '../../lib/api';

interface DashboardLesson { id: string; title: string; estimated_time: string; is_completed: boolean; }
interface DashboardModule { id: string; title: string; lessons: DashboardLesson[]; }
interface DashboardData {
  cohort: { name: string; total_lessons: number; completed_lessons: number; };
  curriculum: DashboardModule[];
}

export const GradesPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLMS('/lms/dashboard')
      .then((res) => { setData(res); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!data) return null;

  const progressPercentage = Math.round((data.cohort.completed_lessons / data.cohort.total_lessons) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      {/* Header */}
      <div className="space-y-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Award className="text-blue-500" size={32} /> Grades & Progress
        </h1>
        <p className="text-slate-400 text-sm">Track your assignment submissions and overall course completion.</p>
      </div>

      {/* Progress Overview Card */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 md:p-8 flex items-center gap-6 shadow-xl">
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            <path className="text-blue-500 transition-all duration-1000 ease-out" strokeDasharray={`${progressPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <span className="absolute text-white font-bold text-sm">{progressPercentage}%</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Academic Transcript</h2>
          <p className="text-slate-400 text-sm">You have completed {data.cohort.completed_lessons} out of {data.cohort.total_lessons} required assignments to earn your certificate.</p>
        </div>
      </div>

      {/* Detailed Transcript */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-black/20 px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Assignment History</h3>
        </div>
        <div className="divide-y divide-white/5">
          {data.curriculum.map((module) => (
            module.lessons.map((lesson) => (
              <div key={lesson.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {lesson.is_completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} className="text-slate-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-400 mb-1">{module.title}</div>
                    <h4 className={`font-medium ${lesson.is_completed ? 'text-white' : 'text-slate-400'}`}>{lesson.title}</h4>
                  </div>
                </div>
                <div className="pl-9 md:pl-0 shrink-0 flex items-center gap-3">
                  {lesson.is_completed ? (
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider rounded-lg">Pass / Completed</span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg">Pending Submission</span>
                  )}
                </div>
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};