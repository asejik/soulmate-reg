import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '../../config';

// Import our newly created components
import { UserManagementTab } from '../../components/admin/UserManagementTab';
import { ProgressTab } from '../../components/admin/ProgressTab';
import { CurriculumTab } from '../../components/admin/CurriculumTab';

type AdminTab = 'users' | 'progress' | 'curriculum';

export default function AdminPortalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'users';

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');

  const handleTabChange = (tab: AdminTab) => setSearchParams({ tab });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/login');
      if (session.user.email !== 'asejik@gmail.com') return navigate('/dashboard');
      setAdminEmail(session.user.email || '');
      setIsAdmin(true);
    };
    checkAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isAdmin === null) return null;

  return (
    <div className="flex h-screen bg-[#05050a] text-white font-sans overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#0a0a16] border-r border-white/5 flex flex-col z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center text-pink-500"><ShieldAlert size={18} /></div>
          <div><h1 className="font-bold tracking-wide">Master Admin</h1><p className="text-[10px] text-slate-500 truncate">{adminEmail}</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => handleTabChange('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Users size={18} />User Management</button>
          <button onClick={() => handleTabChange('progress')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'progress' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><GraduationCap size={18} />LMS Progress</button>
          <button onClick={() => handleTabChange('curriculum')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'curriculum' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BookOpen size={18} />Curriculum Data</button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><LogOut size={18} />Log Out</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative overflow-y-auto bg-gradient-to-br from-[#0a0a1a] to-[#05050a] p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'progress' && <ProgressTab />}
          {activeTab === 'curriculum' && <CurriculumTab />}
        </div>
      </div>
    </div>
  );
}