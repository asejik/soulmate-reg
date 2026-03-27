import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { PlayCircle, BookOpen, Clock, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2
import { useNavigate } from 'react-router-dom';
import { fetchLMS } from '../../lib/api';
import { supabase } from '../../config';

// 1. Update the interface to include our new curriculum data
interface DashboardLesson {
  id: string;
  title: string;
  estimated_time: string;
  is_completed: boolean;
}

interface DashboardModule {
  id: string;
  title: string;
  lessons: DashboardLesson[];
}

interface DashboardData {
  user_id: string;
  cohort: { name: string; total_lessons: number; completed_lessons: number; };
  next_lesson: { id: string; title: string; estimated_time: string; };
  curriculum: DashboardModule[]; // NEW
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLMS('/lms/dashboard')
      .then((responseData) => { setData(responseData); setIsLoading(false); })
      .catch((err) => {
        console.error(err);
        setError('Failed to load dashboard data. Your session may have expired.');
        setIsLoading(false);
      });
  }, []);

  const handleDownloadCertificate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/lms/certificate`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TAI_Certificate.pdf';
      a.click();
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" /></div>;
  if (error || !data) return <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4"><div className="text-red-400 text-center">{error}</div><button onClick={() => navigate('/login')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Return to Login</button></div>;

  const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  const progressPercentage = Math.round((data.cohort.completed_lessons / data.cohort.total_lessons) * 100);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-12 pb-20">

      {/* HEADER & OVERVIEW */}
      <div className="space-y-8">
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-400 font-light">{data.cohort.name} • {data.cohort.completed_lessons} of {data.cohort.total_lessons} lessons completed</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#13132b] border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><BookOpen size={120} /></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-white">Overall Progress</span>
                <span className="text-pink-400">{progressPercentage}%</span>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* DYNAMIC TOP SECTION */}
        {progressPercentage >= 100 ? (
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Congratulations!</h2>
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-[0_0_50px_-12px_rgba(236,72,153,0.2)]">
              <div className="w-20 h-20 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🎓</span></div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-white">You've completed the journey.</h3>
                <p className="text-slate-300 max-w-lg mx-auto leading-relaxed">You have successfully finished all lessons and assignments. Your dedication to building a God-centered marriage is inspiring.</p>
              </div>
              <button onClick={handleDownloadCertificate} className="inline-block mt-8 px-8 py-4 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-400 hover:scale-105 transition-all shadow-lg shadow-pink-500/25">Download My Certificate</button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Up Next For You</h2>
            <div className="group bg-gradient-to-r from-[#1a1a3a] to-[#13132b] border border-pink-500/20 hover:border-pink-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.3)] cursor-pointer" onClick={() => navigate(`/dashboard/lessons/${data.next_lesson.id}`)}>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/20 text-pink-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><PlayCircle size={32} /></div>
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-400"><Clock size={14} /> {data.next_lesson.estimated_time}</div>
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">{data.next_lesson.title}</h3>
                </div>
                <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/10"><button className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">Start Learning</button></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* --- NEW: THE CURRICULUM LIST --- */}
      <motion.div variants={itemVariants} className="space-y-6 pt-8 border-t border-white/10">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">Course Curriculum</h2>
          <p className="text-sm text-slate-400">Review past lessons or jump to specific topics.</p>
        </div>

        <div className="space-y-6">
          {data.curriculum?.map((module, idx) => (
            <div key={module.id} className="bg-[#13132b] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              {/* Module Header */}
              <div className="bg-black/20 px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  <span className="text-pink-500 mr-2">Module {idx + 1}:</span>
                  {module.title}
                </h3>
              </div>

              {/* Lesson List */}
              <div className="divide-y divide-white/5">
                {module.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-4">
                      {lesson.is_completed ? (
                        <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                      ) : (
                        <PlayCircle size={20} className="text-slate-500 group-hover:text-pink-400 transition-colors shrink-0" />
                      )}
                      <span className={`font-medium ${lesson.is_completed ? 'text-slate-300' : 'text-white'}`}>
                        {lesson.title}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white/5 px-2.5 py-1 rounded-md shrink-0">
                      {lesson.estimated_time}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
};