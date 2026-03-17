import { motion, type Variants } from 'framer-motion';
import { PlayCircle, CheckCircle, BookOpen, Clock } from 'lucide-react';

// Mock Data (To be replaced by Go Backend API later)
const mockUser = { name: "Sogo" };
const mockCohort = { name: "Couples' Launchpad 5.0", totalLessons: 12, completedLessons: 2 };
const progressPercentage = Math.round((mockCohort.completedLessons / mockCohort.totalLessons) * 100);

// Framer Motion animation variants for staggered reveals
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const DashboardPage = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-12">

      {/* --- HEADER SECTION --- */}
      <motion.header variants={itemVariants} className="space-y-4">
        <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-pink-300 tracking-wide uppercase mb-2">
          {mockCohort.name}
        </div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white tracking-tight">
          Welcome back, {mockUser.name}.
        </h1>
        <p className="text-lg text-slate-400 font-light max-w-2xl">
          Pick up exactly where you left off. Consistency is the foundation of transformation.
        </p>
      </motion.header>

      {/* --- MAIN DASHBOARD GRID --- */}
      <div className="grid md:grid-cols-12 gap-8">

        {/* Left Column: Active Journey (Takes up 8 columns on desktop) */}
        <motion.div variants={itemVariants} className="md:col-span-8 space-y-6">
          <h2 className="font-heading text-2xl font-semibold text-white">Your Journey</h2>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-white">
              <BookOpen size={120} />
            </div>

            <div className="relative z-10 space-y-8">
              <div>
                <p className="text-pink-400 text-sm font-bold mb-2">UP NEXT</p>
                <h3 className="text-3xl font-heading font-bold text-white">Module 3: The Power of Vision</h3>
                <p className="text-slate-400 mt-2 text-sm flex items-center gap-2">
                  <Clock size={14} /> Est. time: 45 mins
                </p>
              </div>

              {/* Progress Bar UI */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-300">Overall Progress</span>
                  <span className="text-white">{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {mockCohort.completedLessons} of {mockCohort.totalLessons} modules completed
                </p>
              </div>

              <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-pink-50 hover:text-pink-600 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                <PlayCircle size={20} />
                Resume Learning
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Expectations & Info (Takes up 4 columns on desktop) */}
        <motion.div variants={itemVariants} className="md:col-span-4 space-y-6">
          <h2 className="font-heading text-2xl font-semibold text-white">Guidelines</h2>

          <div className="bg-[#13132b] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400 mt-1">
                <PlayCircle size={18} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">80% Watch Requirement</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">You must watch at least 80% of a lesson video to unlock the assignment step. Skipping is disabled.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 mt-1">
                <CheckCircle size={18} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Mandatory Assignments</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Even if submitted on the WhatsApp community, a copy must be uploaded here to unlock the next module.</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5 italic text-xs text-slate-300">
              "Trust the process, abide in the Word, and expect your testimony."
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};