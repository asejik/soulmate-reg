import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { PlayCircle, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLMS } from '../../lib/api';

// We define the shape of the data Go is sending us
interface DashboardData {
  user_id: string;
  cohort: {
    name: string;
    total_lessons: number;
    completed_lessons: number;
  };
  next_lesson: {
    id: string;
    title: string;
    estimated_time: string;
  };
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Call our Go backend the moment the dashboard loads
    fetchLMS('/lms/dashboard')
      .then((responseData) => {
        setData(responseData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load dashboard data. Your session may have expired.');
        setIsLoading(false);
      });
  }, []);

  // Show a loading state while fetching from Go
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Show an error state if the backend rejects the token or fails
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-red-400 text-center">{error}</div>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Framer Motion animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Calculate percentage for the progress bar
  const progressPercentage = Math.round((data.cohort.completed_lessons / data.cohort.total_lessons) * 100);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-8 pb-20"
    >
      {/* --- Header Section --- */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-400 font-light">
          {data.cohort.name} • {data.cohort.completed_lessons} of {data.cohort.total_lessons} modules completed
        </p>
      </motion.div>

      {/* --- Progress Overview Card --- */}
      <motion.div variants={itemVariants} className="bg-[#13132b] border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BookOpen size={120} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-white">Overall Progress</span>
              <span className="text-pink-400">{progressPercentage}%</span>
            </div>
            <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- Up Next Card --- */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-bold text-white">Up Next For You</h2>

        <div
          className="group bg-gradient-to-r from-[#1a1a3a] to-[#13132b] border border-pink-500/20 hover:border-pink-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.3)] cursor-pointer"
          // This routes to the dynamic lesson ID provided by Go
          onClick={() => navigate(`/dashboard/lessons/${data.next_lesson.id}`)}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 text-pink-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <PlayCircle size={32} />
            </div>

            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-400">
                <Clock size={14} /> {data.next_lesson.estimated_time}
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                {data.next_lesson.title}
              </h3>
            </div>

            <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
              <button className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Start Learning
              </button>
            </div>

          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};