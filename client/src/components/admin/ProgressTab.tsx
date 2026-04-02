import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../config';
import { CustomDropdown } from './CustomDropdown';

export const ProgressTab = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [progressFilter, setProgressFilter] = useState('All');

  useEffect(() => { setCurrentPage(1); }, [progressFilter, itemsPerPage]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/admin/submissions`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Instructor Dashboard</h2>
          <p className="text-slate-400">Review student progress and submitted assignment links.</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomDropdown icon={Filter} value={progressFilter} onChange={setProgressFilter} align="right" options={[{ label: 'All Lessons', value: 'All' }, ...Array.from(new Set(submissions.map(s => s.lesson_title))).map(title => ({ label: title as string, value: title as string }))]} />
          <div className="text-sm font-bold text-pink-400 bg-pink-500/10 px-4 py-2.5 rounded-xl border border-pink-500/20">Submissions: {processedSubmissions.total}</div>
        </div>
      </div>
      <div className="bg-[#13132b] border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col">
        {isLoading ? (<div className="h-64 flex items-center justify-center text-slate-500">Loading submissions...</div>) : (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <th className="p-5 w-12 text-center">#</th><th className="p-5">Student</th><th className="p-5">Lesson</th><th className="p-5">Submitted URL</th><th className="p-5">Date</th>
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
                        <td className="p-5"><a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white rounded-lg transition-colors inline-block text-xs font-bold">View Assignment</a></td>
                        <td className="p-5 text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                  {processedSubmissions.data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No assignments match this filter.</td></tr>}
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