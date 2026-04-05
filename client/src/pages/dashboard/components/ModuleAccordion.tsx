import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, Timer, CheckCircle2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DashboardModule } from '../DashboardPage';
import { CheckpointModal } from './CheckpointModal';

interface Props {
  curriculum: DashboardModule[];
  nextLessonId: string;
  currentTime: Date;
  requiresMidReview: boolean;
  totalLessons: number;
}

export const ModuleAccordion = ({ curriculum, nextLessonId, currentTime, requiresMidReview, totalLessons }: Props) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    (curriculum || []).forEach((module, index) => {
      if (module.lessons?.some(l => l.id === nextLessonId) || index === 0) initial[module.id] = true;
    });
    return initial;
  });

  const toggleModule = (id: string) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

  // TRACK GLOBAL LESSON INDEX TO FIND MID-POINT
  let currentGlobalIdx = 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Course Material</h2>
      <div className="space-y-3">
        {(curriculum || []).map((module, mIdx) => {
          const isExpanded = expandedModules[module.id];
          const completedInModule = module.lessons.filter(l => l.is_completed).length;

          return (
            <div key={module.id} className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden transition-all">
              <button onClick={() => toggleModule(module.id)} className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Module {mIdx + 1}</div>
                  <h3 className="text-lg font-bold text-slate-200">{module.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-xs font-medium text-slate-500">{completedInModule}/{module.lessons.length} completed</div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-[#0b0f19]/50">
                    <div className="flex flex-col divide-y divide-white/5">
                      {module.lessons.map((lesson) => {
                        currentGlobalIdx++;
                        const isNextLesson = lesson.id === nextLessonId;
                        const isPostCheckpoint = currentGlobalIdx > Math.ceil(totalLessons / 2);
                        const isLockedByCheckpoint = requiresMidReview && isPostCheckpoint && !lesson.is_completed;

                        const startTime = lesson.scheduled_start_time ? new Date(lesson.scheduled_start_time) : null;
                        const isTimeLocked = startTime ? startTime > currentTime : false;

                        // Now Live disappears once completed. Continue appears if progress > 0.
                        const isNowLive = startTime ? startTime <= currentTime && (startTime.getTime() + 7200000) > currentTime.getTime() && lesson.progress < 80 : false;
                        const hasStarted = lesson.progress > 0 && !lesson.is_completed;

                        const formattedTime = startTime ? startTime.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

                        return (
                          <div key={lesson.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 transition-colors ${isLockedByCheckpoint ? 'opacity-50 grayscale select-none' : !isTimeLocked && isNextLesson ? 'bg-blue-500/[0.03]' : isTimeLocked ? 'opacity-90' : 'hover:bg-white/[0.02]'}`}>
                            <div className="flex items-start md:items-center gap-4">
                              <div className="mt-0.5 md:mt-0 shrink-0">
                                {lesson.is_completed ? (
                                  <CheckCircle2 size={20} className="text-green-500" />
                                ) : isLockedByCheckpoint ? (
                                  <div className="w-6 h-6 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-600"><Star size={14} /></div>
                                ) : isTimeLocked ? (
                                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><Timer size={14} /></div>
                                ) : isNextLesson ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /></div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-slate-700 cursor-not-allowed"><Clock size={12} /></div>
                                )}
                              </div>
                              <div>
                                <h4 className={`font-medium ${lesson.is_completed ? 'text-slate-300' : !isTimeLocked && !isLockedByCheckpoint ? 'text-white font-bold' : 'text-slate-500'}`}>{lesson.title}</h4>
                                <div className={`flex items-center gap-1.5 text-xs mt-1 ${isTimeLocked || isLockedByCheckpoint ? 'text-slate-700' : 'text-slate-500'}`}><Clock size={12} /> {lesson.estimated_time} • Video</div>
                              </div>
                            </div>
                            <div className="pl-9 md:pl-0 shrink-0">
                              <button
                                onClick={() => {
                                  if (isLockedByCheckpoint) {
                                    setIsModalOpen(true);
                                    return;
                                  }
                                  navigate(`/dashboard/lessons/${lesson.id}`);
                                }}
                                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                                  isLockedByCheckpoint ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                                  : isTimeLocked ? 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/20'
                                  : isNowLive ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/20'
                                  : isNextLesson ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/20'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                }`}
                              >
                                {isLockedByCheckpoint ? 'Checkpoint Required' : isTimeLocked ? `Premieres ${formattedTime}` : lesson.is_completed ? 'Review' : isNowLive ? 'NOW LIVE' : hasStarted ? 'Continue' : 'Start'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <CheckpointModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};