import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronLeft, ChevronRight, X, FileText, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getAuthSession } from '../../lib/api';
import { CustomDropdown } from './CustomDropdown';

const isUrl = (val: string) => val.startsWith('http://') || val.startsWith('https://');

export const ProgressTab = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [progressFilter, setProgressFilter] = useState('All');
  const [textModal, setTextModal] = useState<{ name: string; content: string } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    id: string; studentName: string; lessonTitle: string; currentFeedback: string;
  } | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  useEffect(() => { setCurrentPage(1); }, [progressFilter, itemsPerPage]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const session = await getAuthSession();
        const res = await fetch(`${API_BASE_URL}/admin/submissions`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
        if (res.ok) setSubmissions(await res.json() || []);
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchSubmissions();
  }, []);

  const processedSubmissions = useMemo(() => {
    const filtered = submissions.filter(s => progressFilter === 'All' || s.lesson_title === progressFilter);
    const limit = itemsPerPage === -1 ? filtered.length : itemsPerPage;
    const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
    return { data: paginated, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 };
  }, [submissions, progressFilter, currentPage, itemsPerPage]);

  const openFeedbackModal = (sub: any) => {
    setFeedbackDraft(sub.admin_feedback || '');
    setFeedbackModal({ id: sub.id, studentName: sub.student_name, lessonTitle: sub.lesson_title, currentFeedback: sub.admin_feedback || '' });
  };

  const saveFeedback = async () => {
    if (!feedbackModal) return;
    setIsSavingFeedback(true);
    try {
      const session = await getAuthSession();
      const res = await fetch(`${API_BASE_URL}/admin/submissions/${feedbackModal.id}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ feedback: feedbackDraft }),
      });
      if (res.ok) {
        // Update the local data so the button reflects the saved state
        setSubmissions(prev => prev.map(s => s.id === feedbackModal.id ? { ...s, admin_feedback: feedbackDraft } : s));
        setFeedbackModal(null);
      }
    } catch (err) { console.error(err); } finally { setIsSavingFeedback(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

      {/* Text Submission Modal */}
      <AnimatePresence>
        {textModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0f0f1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400"><FileText size={16} /></div>
                  <div><p className="text-white font-bold text-sm">{textModal.name}</p><p className="text-slate-500 text-xs">Text Submission</p></div>
                </div>
                <button onClick={() => setTextModal(null)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{textModal.content}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Feedback Modal */}
      <AnimatePresence>
        {feedbackModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0f0f1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400"><MessageSquare size={16} /></div>
                  <div>
                    <p className="text-white font-bold text-sm">{feedbackModal.studentName}</p>
                    <p className="text-slate-500 text-xs">{feedbackModal.lessonTitle}</p>
                  </div>
                </div>
                <button onClick={() => setFeedbackModal(null)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  rows={6}
                  value={feedbackDraft}
                  onChange={e => setFeedbackDraft(e.target.value)}
                  placeholder="Write your feedback for this student..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 resize-none transition-colors"
                />
                <div className="flex gap-3">
                  <button onClick={() => setFeedbackModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                  <button
                    onClick={saveFeedback}
                    disabled={isSavingFeedback || !feedbackDraft.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {isSavingFeedback ? 'Saving...' : 'Save Feedback'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
        <div className="max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Instructor Dashboard</h2>
          <p className="text-slate-400 text-sm">Review student progress and submitted assignment links.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none">
            <CustomDropdown icon={Filter} value={progressFilter} onChange={setProgressFilter} align="right" options={[{ label: 'All Lessons', value: 'All' }, ...Array.from(new Set(submissions.map(s => s.lesson_title))).map(title => ({ label: title as string, value: title as string }))]} />
          </div>
          <div className="text-sm font-bold text-pink-400 bg-pink-500/10 px-4 py-2.5 rounded-xl border border-pink-500/20 text-center flex-1 lg:flex-none whitespace-nowrap">Submissions: {processedSubmissions.total}</div>
        </div>
      </div>

      <div className="bg-[#13132b] border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col">
        {isLoading ? (<div className="h-64 flex items-center justify-center text-slate-500">Loading submissions...</div>) : (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <th className="p-5 w-12 text-center">#</th><th className="p-5">Student</th><th className="p-5">Lesson</th><th className="p-5">Submission</th><th className="p-5">Feedback</th><th className="p-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {processedSubmissions.data.map((sub, idx) => {
                    const serialNum = (currentPage - 1) * (itemsPerPage === -1 ? processedSubmissions.total : itemsPerPage) + idx + 1;
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-5 text-center text-slate-500 font-mono text-xs">{serialNum}</td>
                        <td className="p-5"><div className="font-bold text-white">{sub.student_name}</div><div className="text-xs text-slate-500">{sub.email}</div></td>
                        <td className="p-5 font-medium text-indigo-300">{sub.lesson_title}</td>
                        <td className="p-5">
                          {isUrl(sub.submission_url) ? (
                            <a href={sub.submission_url} target="_blank" rel="noopener noreferrer"
                              className="px-4 py-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white rounded-lg transition-colors inline-block text-xs font-bold">
                              View Assignment
                            </a>
                          ) : (
                            <button onClick={() => setTextModal({ name: sub.student_name, content: sub.submission_url })}
                              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors text-xs font-bold">
                              Read Response
                            </button>
                          )}
                        </td>
                        <td className="p-5">
                          <button
                            onClick={() => openFeedbackModal(sub)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              sub.admin_feedback
                                ? 'bg-teal-500/15 text-teal-400 hover:bg-teal-500 hover:text-white'
                                : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {sub.admin_feedback ? 'Edit Feedback' : 'Leave Feedback'}
                          </button>
                        </td>
                        <td className="p-5 text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                  {processedSubmissions.data.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No assignments match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-t border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Rows per page:</span>
                <CustomDropdown value={itemsPerPage} onChange={setItemsPerPage} options={[{ label: '50', value: 50 }, { label: '100', value: 100 }, { label: '150', value: 150 }, { label: 'All', value: -1 }]} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Page {currentPage} of {processedSubmissions.totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 rounded bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"><ChevronLeft size={20} /></button>
                  <button onClick={() => setCurrentPage(prev => Math.min(processedSubmissions.totalPages, prev + 1))} disabled={currentPage === processedSubmissions.totalPages} className="p-1 rounded bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"><ChevronRight size={20} /></button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
