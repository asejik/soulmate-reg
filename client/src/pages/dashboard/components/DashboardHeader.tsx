import { useState } from 'react';
import { BookOpen, Award } from 'lucide-react';
import { supabase, API_BASE_URL } from '../../../config';
import { type DashboardData } from '../DashboardPage';
import { StatusModal } from './StatusModal';

interface Props {
  data: DashboardData;
  progressPercentage: number;
  isFullyCompleted: boolean;
  hasCompletedFinalReview: boolean;
}

export const DashboardHeader = ({ data, progressPercentage, isFullyCompleted, hasCompletedFinalReview }: Props) => {
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleSwitchProgram = (newProgram: string) => {
    localStorage.setItem('tai_active_program', newProgram);
    window.location.reload();
  };

  const [errorMessage, setErrorMessage] = useState('Something went wrong while generating your certificate. Please try again or contact support if the issue persists.');

  const handleDownloadCertificate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeProg = localStorage.getItem('tai_active_program') || '';
      const response = await fetch(`${API_BASE_URL}/lms/certificate?program=${activeProg}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Record.pdf';
      a.click();
    } catch (err: any) {
      console.error('Certificate error:', err);
      setErrorMessage(err.message);
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{data.cohort.name}</h1>
          <p className="text-slate-400 text-sm">Review syllabus, track your progress, and continue your learning journey.</p>
        </div>
        {data.enrolled_programs && data.enrolled_programs.length > 1 && (
          <div className="flex items-center bg-black/20 border border-white/10 rounded-xl p-1.5 shadow-inner shrink-0">
            {data.enrolled_programs.map(prog => (
              <button key={prog} onClick={() => handleSwitchProgram(prog)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.active_program === prog ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {prog === 'launchpad' ? "Launchpad" : "Soulmate"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            {isFullyCompleted ? <Award size={24} /> : <BookOpen size={24} />}
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-1">{isFullyCompleted ? "Course Completed!" : "Learning Progress"}</div>
            <div className="text-xs text-slate-400">{data.cohort.completed_lessons} of {data.cohort.total_lessons} items completed</div>
          </div>
        </div>
        <div className="w-full md:flex-1 max-w-md">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>{progressPercentage}%</span><span>100%</span></div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
        {isFullyCompleted && hasCompletedFinalReview && (
          <button onClick={handleDownloadCertificate} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shrink-0">
            Download Certificate
          </button>
        )}
      </div>

      <StatusModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        type="error" 
        title="Download Error" 
        message={errorMessage} 
      />
    </div>
  );
};