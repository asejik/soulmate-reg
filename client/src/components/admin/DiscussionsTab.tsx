import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MessageSquare, Filter, AlertTriangle, X, Search } from 'lucide-react';
import { supabase, API_BASE_URL } from '../../config';
import { CustomDropdown } from './CustomDropdown';

export const DiscussionsTab = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [programFilter, setProgramFilter] = useState('soulmate');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', text: '', isDeleting: false });

  const fetchComments = async (program: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/lms/discussions?program=${program}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) setComments(await res.json() || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(programFilter);
  }, [programFilter]);

  const handleDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/admin/comments?id=${deleteModal.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== deleteModal.id));
        setDeleteModal({ isOpen: false, id: '', text: '', isDeleting: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const filteredComments = comments.filter(c => 
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lesson_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#13112b] border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-4 text-red-400 mb-4">
                <div className="p-3 bg-red-500/10 rounded-2xl"><AlertTriangle size={24} /></div>
                <h3 className="text-xl font-bold text-white">Delete Comment?</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-white/5">Are you sure you want to remove this comment? This action is permanent.</p>
              <div className="flex justify-end gap-3 font-bold">
                <button onClick={() => setDeleteModal({ isOpen: false, id: '', text: '', isDeleting: false })} className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-white transition-colors">Cancel</button>
                <button 
                  onClick={handleDelete} 
                  disabled={deleteModal.isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  {deleteModal.isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Discussion Management</h2>
          <p className="text-slate-400">Moderate and manage all lesson comments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-64">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               placeholder="Search comments..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-pink-500/50 transition-all font-medium"
             />
          </div>
          <CustomDropdown 
            icon={Filter} 
            value={programFilter} 
            onChange={setProgramFilter} 
            align="right"
            options={[{ label: 'Soulmate Cohort', value: 'soulmate' }, { label: 'Launchpad Cohort', value: 'launchpad' }]} 
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4">
             <div className="w-12 h-12 border-4 border-white/10 border-t-pink-500 rounded-full animate-spin" />
             <p className="font-bold tracking-widest text-xs uppercase">Loading Feed...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="h-64 bg-[#13112b] border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-3">
             <MessageSquare size={40} className="opacity-20" />
             <p className="font-bold">No comments found here.</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <motion.div 
               layout
               key={comment.id} 
               className="bg-[#13112b] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-pink-500">
                    {comment.user_name?.[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-none">{comment.user_name}</h4>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Lesson: {comment.lesson_title}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setDeleteModal({ isOpen: true, id: comment.id, text: comment.content, isDeleting: false })}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
              <div className="mt-4 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span>{new Date(comment.created_at).toLocaleString()}</span>
                <span className="px-2 py-0.5 bg-white/5 rounded-md">ID: {comment.id}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
