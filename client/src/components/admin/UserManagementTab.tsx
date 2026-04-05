import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Filter, ChevronLeft, ChevronRight, UserPlus, X, Save, LogIn, Mail, Phone, Instagram, Users, Search, RotateCcw, Book } from 'lucide-react';
import { supabase, API_BASE_URL } from '../../config';
import { CustomDropdown } from './CustomDropdown';

export const UserManagementTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [userFilter, setUserFilter] = useState('All');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: '', source: '', userName: '', isDeleting: false });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUserData, setNewUserData] = useState({
    source: 'Ready for a Soulmate',
    full_name: '',
    email: '',
    whatsapp_number: '',
    gender: 'Male',
    country_city: '',
    state: '',
    age_group: '',
    religion: 'Christianity',
    church_name: '',
    instagram_handle: '',
    relationship_status: 'Single',
    wedding_date: '',
    partner_registered: 'No'
  });
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [resetModal, setResetModal] = useState({ isOpen: false, type: 'all', moduleId: '', isResetting: false });

  useEffect(() => { setCurrentPage(1); }, [userFilter, itemsPerPage, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
      if (res.ok) setUsers(await res.json() || []);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const fetchModules = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/admin/modules`, { 
        headers: { 'Authorization': `Bearer ${session?.access_token}` } 
      });
      if (res.ok) setModules(await res.json() || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUsers();
    fetchModules();
  }, []);

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/admin/users?id=${deleteModal.userId}&source=${encodeURIComponent(deleteModal.source)}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error("Failed");
      setUsers(users.filter(u => u.id !== deleteModal.userId));
      setDeleteModal({ isOpen: false, userId: '', source: '', userName: '', isDeleting: false });
    } catch (err) { alert("Error deleting user."); setDeleteModal(prev => ({ ...prev, isDeleting: false })); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUserData)
      });
      if (!res.ok) throw new Error(await res.text());
      setIsAddModalOpen(false);
      setNewUserData({
        source: 'Ready for a Soulmate',
        full_name: '',
        email: '',
        whatsapp_number: '',
        gender: 'Male',
        country_city: '',
        state: '',
        age_group: '',
        religion: 'Christianity',
        church_name: '',
        instagram_handle: '',
        relationship_status: 'Single',
        wedding_date: '',
        partner_registered: 'No'
      });
      fetchUsers();
    } catch (err) {
      alert("Error adding user: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetProgress = async () => {
    setResetModal(prev => ({ ...prev, isResetting: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let url = `${API_BASE_URL}/admin/progress?user_id=${selectedUser.id}`;
      if (resetModal.type === 'module' && resetModal.moduleId) {
        url += `&module_id=${resetModal.moduleId}`;
      }
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      
      if (res.ok) {
        alert("Progress reset successfully.");
        setResetModal({ isOpen: false, type: 'all', moduleId: '', isResetting: false });
      }
    } catch (err) {
      alert("Error resetting progress.");
    } finally {
      setResetModal(prev => ({ ...prev, isResetting: false }));
    }
  };

  const processedUsers = useMemo(() => {
    let filtered = users.filter(u => userFilter === 'All' || u.source === userFilter);
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(lowerSearch) || 
        u.email?.toLowerCase().includes(lowerSearch)
      );
    }

    const limit = itemsPerPage === -1 ? filtered.length : itemsPerPage;
    const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
    return { data: paginated, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 };
  }, [users, userFilter, currentPage, itemsPerPage, searchTerm]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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

      {/* Reset Progress Modal */}
      <AnimatePresence>
        {resetModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#13132b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-4 text-amber-400"><div className="p-3 bg-amber-500/10 rounded-full"><RotateCcw size={24} /></div><h3 className="text-xl font-bold text-white">Reset Progress?</h3></div>
              <p className="text-slate-300 mb-6">Reset {resetModal.type === 'all' ? 'ALL lesson progress' : 'module progress'} for <strong className="text-white">{selectedUser.full_name}</strong>? This will set completion to 0%.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setResetModal({ isOpen: false, type: 'all', moduleId: '', isResetting: false })} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/5">Cancel</button>
                <button onClick={handleResetProgress} disabled={resetModal.isResetting} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white">{resetModal.isResetting ? "Resetting..." : "Confirm Reset"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl my-8 relative">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Manual Registration</h3>
                  <p className="text-slate-400 text-sm">Onboard a participant manually into a cohort.</p>
                </div>
              </div>

              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Program Cohort</label>
                  <CustomDropdown 
                    value={newUserData.source} 
                    onChange={v => setNewUserData({...newUserData, source: v})}
                    options={[{label: 'Ready for a Soulmate', value: 'Ready for a Soulmate'}, {label: 'Couples Launchpad', value: 'Couples Launchpad'}]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Full Name</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.full_name} onChange={e => setNewUserData({...newUserData, full_name: e.target.value})} placeholder="e.g. Sogo Ayenigba" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Email Address</label>
                  <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} placeholder="email@example.com" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">WhatsApp Number</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.whatsapp_number} onChange={e => setNewUserData({...newUserData, whatsapp_number: e.target.value})} placeholder="+234..." />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Gender</label>
                  <CustomDropdown 
                    value={newUserData.gender} 
                    onChange={v => setNewUserData({...newUserData, gender: v})}
                    options={[{label: 'Male', value: 'Male'}, {label: 'Female', value: 'Female'}]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Country</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.country_city} onChange={e => setNewUserData({...newUserData, country_city: e.target.value})} placeholder="Nigeria" />
                </div>

                {newUserData.source === 'Ready for a Soulmate' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">State / Province</label>
                      <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.state} onChange={e => setNewUserData({...newUserData, state: e.target.value})} placeholder="Kwara" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Age Group</label>
                      <CustomDropdown 
                        value={newUserData.age_group} 
                        onChange={v => setNewUserData({...newUserData, age_group: v})}
                        options={[{label: '21-25', value: '21-25'}, {label: '26-30', value: '26-30'}, {label: '31-35', value: '31-35'}, {label: '36+', value: '36+'}]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Church Name</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.church_name} onChange={e => setNewUserData({...newUserData, church_name: e.target.value})} placeholder="e.g. Anchor of Hope CC" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Relationship Status</label>
                      <CustomDropdown 
                        value={newUserData.relationship_status} 
                        onChange={v => setNewUserData({...newUserData, relationship_status: v})}
                        options={[{label: 'Single', value: 'Single'}, {label: 'Engaged', value: 'Engaged'}, {label: 'Married', value: 'Married'}]}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Wedding Date</label>
                      <input type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.wedding_date} onChange={e => setNewUserData({...newUserData, wedding_date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Partner Registered?</label>
                      <CustomDropdown 
                        value={newUserData.partner_registered} 
                        onChange={v => setNewUserData({...newUserData, partner_registered: v})}
                        options={[{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}]}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Instagram Handle</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" value={newUserData.instagram_handle} onChange={e => setNewUserData({...newUserData, instagram_handle: e.target.value})} placeholder="@username" />
                </div>

                <div className="md:col-span-2 pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    <Save size={18} /> {isSaving ? "Registering..." : "Add User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[#0f0f1e] border border-white/10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative overflow-hidden my-8"
            >
              {/* Header Decorative Background */}
              <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r ${selectedUser.source === 'Couples Launchpad' ? 'from-blue-600/20 to-indigo-600/10' : 'from-purple-600/20 to-pink-600/10'} opacity-50`} />
              
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white rounded-xl transition-all z-20"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 px-8 pt-10 pb-8">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-8">
                  <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl font-black mb-4 shadow-2xl ${selectedUser.source === 'Couples Launchpad' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-purple-600 text-white shadow-purple-500/20'}`}>
                    {selectedUser.full_name.charAt(0)}
                  </div>
                  <h3 className="text-3xl font-extrabold text-white text-center">{selectedUser.full_name}</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${selectedUser.source === 'Couples Launchpad' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                      {selectedUser.source}
                    </span>
                    {selectedUser.clan_id && (
                       <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/10">
                        Clan: {selectedUser.clan_id}
                       </span>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Primary Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/[0.03] rounded-3xl border border-white/5 transition-all">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg leading-none">@</div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</span>
                           <span className="text-sm text-slate-200">{selectedUser.email}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center"><Phone size={16} /></div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp</span>
                           <span className="text-sm text-slate-200">{selectedUser.whatsapp_number}</span>
                         </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center"><Instagram size={16} /></div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instagram</span>
                           <span className="text-sm text-slate-200">{selectedUser.instagram_handle || 'Not Provided'}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><Users size={16} /></div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender & Religion</span>
                           <span className="text-sm text-slate-200">{selectedUser.gender} • {selectedUser.religion}</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Secondary Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-4 pb-4">
                     {/* Dynamic Fields based on Source */}
                     {selectedUser.source === 'Ready for a Soulmate' ? (
                        <>
                          <DetailItem label="Location" value={`${selectedUser.state}, ${selectedUser.location}`} />
                          <DetailItem label="Age Group" value={selectedUser.age_group} />
                          <DetailItem label="Church / Denomination" value={selectedUser.church_name} />
                          <DetailItem label="Relationship Status" value={selectedUser.relationship_status} />
                        </>
                     ) : (
                        <>
                          <DetailItem label="Location" value={selectedUser.location} />
                          <DetailItem label="Wedding Date" value={selectedUser.wedding_date} />
                          <DetailItem label="Denomination" value={selectedUser.denomination} />
                          <DetailItem label="Referral Source" value={selectedUser.referral_source} />
                          <DetailItem label="Spouse Information" value={selectedUser.spouse_name ? `${selectedUser.spouse_name} (${selectedUser.spouse_whatsapp})` : 'N/A'} />
                          <DetailItem label="Partner Registered?" value={selectedUser.partner_registered} />
                        </>
                     )}
                     <DetailItem label="Registration Date" value={new Date(selectedUser.created_at).toLocaleString()} />
                     {selectedUser.source === 'Couples Launchpad' && (
                        <div className="md:col-span-2 grid grid-cols-3 gap-2">
                           <StatusBadge label="Attended Before" active={selectedUser.attended_before} />
                           <StatusBadge label="Gave Feedback" active={selectedUser.agreed_to_feedback} />
                           <StatusBadge label="Agreed Term" active={selectedUser.agreed_to_participation} />
                        </div>
                     )}
                  </div>

                   {/* Progress Management Section */}
                   <div className="mt-4 pt-8 border-t border-white/5 space-y-4">
                      <div className="flex items-center gap-4 text-amber-500 mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-xl"><RotateCcw size={20} /></div>
                        <div>
                          <h4 className="font-bold text-white">Learning Progress</h4>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Manage participant advancement</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => setResetModal({ isOpen: true, type: 'all', moduleId: '', isResetting: false })}
                          className="flex items-center justify-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20 text-slate-300 hover:text-amber-400 font-bold transition-all"
                        >
                          <RotateCcw size={18} /> Reset All Progress
                        </button>
                        
                        <div className="relative group">
                          <CustomDropdown 
                            icon={Book}
                            value=""
                            onChange={(id) => {
                              if (!id) return;
                              setResetModal({ isOpen: true, type: 'module', moduleId: id, isResetting: false });
                            }}
                            options={[
                              { label: 'Reset by Module...', value: '' },
                              ...modules.filter(m => m.program_name === (selectedUser.source === 'Couples Launchpad' ? 'launchpad' : 'soulmate'))
                                .map(m => ({ label: m.title, value: m.id }))
                            ]}
                          />
                        </div>
                      </div>
                   </div>
                </div>
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
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] md:w-64 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('') }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <UserPlus size={18} /> <span className="hidden sm:inline">Add User</span>
          </button>
          <CustomDropdown icon={Filter} value={userFilter} onChange={setUserFilter} align="right" options={[{ label: 'All Cohorts', value: 'All' }, { label: 'Ready for a Soulmate', value: 'Ready for a Soulmate' }, { label: 'Couples Launchpad', value: 'Couples Launchpad' }]} />
          <div className="text-sm font-bold text-pink-400 bg-pink-500/10 px-4 py-2.5 rounded-xl border border-pink-500/20">Total: {processedUsers.total}</div>
        </div>
      </div>

      <div className="bg-[#13132b] border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col">
        {isLoading ? (<div className="h-64 flex items-center justify-center text-slate-500">Loading user data...</div>) : (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold whitespace-nowrap">
                    <th className="p-5 w-12 text-center">#</th>
                    <th className="p-5 min-w-[200px]">Name</th>
                    <th className="p-5 min-w-[250px]">Email</th>
                    <th className="p-5 min-w-[150px]">Cohort / Source</th>
                    <th className="p-5 min-w-[120px]">Date</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {processedUsers.data.map((user, idx) => {
                    const serialNum = (currentPage - 1) * (itemsPerPage === -1 ? processedUsers.total : itemsPerPage) + idx + 1;
                    return (
                      <tr key={user.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5 text-center text-slate-500 font-mono text-xs">{serialNum}</td>
                        <td className="p-5 font-medium text-white whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="hover:text-blue-400 transition-colors text-left font-bold border-b border-transparent hover:border-blue-400/30"
                          >
                            {user.full_name}
                          </button>
                        </td>
                        <td className="p-5 text-slate-400 whitespace-nowrap">{user.email}</td>
                        <td className="p-5 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full inline-block ${user.source === 'Couples Launchpad' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                            {user.source}
                          </span>
                        </td>
                        <td className="p-5 text-slate-500 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
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

const DetailItem = ({ label, value }: { label: string, value: string | undefined }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm text-slate-300 font-medium">{value || 'N/A'}</span>
  </div>
);

const StatusBadge = ({ label, active }: { label: string, active: boolean }) => (
  <div className={`p-2 rounded-xl text-[10px] font-bold flex items-center justify-center text-center ${active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
    {label}
  </div>
);