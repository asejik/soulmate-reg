import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../config';
import { CustomDropdown } from './CustomDropdown';

export const UserManagementTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [userFilter, setUserFilter] = useState('All');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: '', source: '', userName: '', isDeleting: false });

  useEffect(() => { setCurrentPage(1); }, [userFilter, itemsPerPage]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/admin/users`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
        if (res.ok) setUsers(await res.json() || []);
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchUsers();
  }, []);

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/admin/users?id=${deleteModal.userId}&source=${encodeURIComponent(deleteModal.source)}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error("Failed");
      setUsers(users.filter(u => u.id !== deleteModal.userId));
      setDeleteModal({ isOpen: false, userId: '', source: '', userName: '', isDeleting: false });
    } catch (err) { alert("Error deleting user."); setDeleteModal(prev => ({ ...prev, isDeleting: false })); }
  };

  const processedUsers = useMemo(() => {
    const filtered = users.filter(u => userFilter === 'All' || u.source === userFilter);
    const limit = itemsPerPage === -1 ? filtered.length : itemsPerPage;
    const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
    return { data: paginated, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 };
  }, [users, userFilter, currentPage, itemsPerPage]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#13132b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-4 text-red-400"><div className="p-3 bg-red-500/10 rounded-full"><AlertTriangle size={24} /></div><h3 className="text-xl font-bold text-white">Delete User?</h3></div>
              <p className="text-slate-300 mb-6">Delete <strong className="text-white">{deleteModal.userName}</strong>? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteModal({ isOpen: false, userId: '', source: '', userName: '', isDeleting: false })} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/5">Cancel</button>
                <button onClick={confirmDelete} disabled={deleteModal.isDeleting} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white">{deleteModal.isDeleting ? "Deleting..." : "Yes, Delete"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">User Management</h2>
          <p className="text-slate-400">View, filter, and verify all registered participants.</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomDropdown icon={Filter} value={userFilter} onChange={setUserFilter} align="right" options={[{ label: 'All Cohorts', value: 'All' }, { label: 'Ready for a Soulmate', value: 'Ready for a Soulmate' }, { label: 'Couples Launchpad', value: 'Couples Launchpad' }]} />
          <div className="text-sm font-bold text-pink-400 bg-pink-500/10 px-4 py-2.5 rounded-xl border border-pink-500/20">Showing: {processedUsers.total}</div>
        </div>
      </div>

      <div className="bg-[#13132b] border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col">
        {isLoading ? (<div className="h-64 flex items-center justify-center text-slate-500">Loading user data...</div>) : (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <th className="p-5 w-12 text-center">#</th><th className="p-5">Name</th><th className="p-5">Email</th><th className="p-5">Cohort / Source</th><th className="p-5">Date</th><th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {processedUsers.data.map((user, idx) => {
                    const serialNum = (currentPage - 1) * (itemsPerPage === -1 ? processedUsers.total : itemsPerPage) + idx + 1;
                    return (
                      <tr key={user.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5 text-center text-slate-500 font-mono text-xs">{serialNum}</td><td className="p-5 font-medium text-white">{user.full_name}</td><td className="p-5 text-slate-400">{user.email}</td>
                        <td className="p-5"><span className={`px-3 py-1 text-xs font-bold rounded-full ${user.source === 'Couples Launchpad' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>{user.source}</span></td>
                        <td className="p-5 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="p-5 text-right"><button onClick={() => setDeleteModal({ isOpen: true, userId: user.id, source: user.source, userName: user.full_name, isDeleting: false })} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button></td>
                      </tr>
                    );
                  })}
                  {processedUsers.data.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-t border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Rows per page:</span>
                <CustomDropdown value={itemsPerPage} onChange={setItemsPerPage} options={[{ label: '50', value: 50 }, { label: '100', value: 100 }, { label: '150', value: 150 }, { label: 'All', value: -1 }]} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Page {currentPage} of {processedUsers.totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 rounded bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"><ChevronLeft size={20} /></button>
                  <button onClick={() => setCurrentPage(prev => Math.min(processedUsers.totalPages, prev + 1))} disabled={currentPage === processedUsers.totalPages} className="p-1 rounded bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"><ChevronRight size={20} /></button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};