import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, LogOut, ShieldAlert, Menu, X } from 'lucide-react';
import { supabase } from '../../config';

// Import our newly created components
import { UserManagementTab } from '../../components/admin/UserManagementTab';
import { ProgressTab } from '../../components/admin/ProgressTab';
import { CurriculumTab } from '../../components/admin/CurriculumTab';
import { DiscussionsTab } from '../../components/admin/DiscussionsTab';

type AdminTab = 'users' | 'progress' | 'curriculum' | 'discussions';

export default function AdminPortalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'users';

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabChange = (tab: AdminTab) => {
    setSearchParams({ tab });
    setIsMenuOpen(false); // Close menu on tab change
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/login');
      
      const allowedAdmins = ['asejik@gmail.com', 'temitopeayenigba@gmail.com', 'winneridigbe@gmail.com'];
      if (!allowedAdmins.includes(session.user.email || '')) {
        return navigate('/dashboard');
      }
      
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
    <div className="flex h-screen bg-[#05050a] text-white font-sans overflow-hidden relative">

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-[#0a0a16] border-r border-white/5 flex flex-col z-40 transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:block
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center text-pink-500"><ShieldAlert size={18} /></div>
            <div><h1 className="font-bold tracking-wide">Master Admin</h1><p className="text-[10px] text-slate-500 truncate w-32">{adminEmail}</p></div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => handleTabChange('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Users size={18} />User Management</button>
          <button onClick={() => handleTabChange('progress')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'progress' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><GraduationCap size={18} />LMS Progress</button>
          <button onClick={() => handleTabChange('curriculum')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'curriculum' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BookOpen size={18} />Curriculum Data</button>
          <button onClick={() => handleTabChange('discussions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'discussions' ? 'bg-pink-500/10 text-pink-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><ShieldAlert size={18} />Discussions</button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><LogOut size={18} />Log Out</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative overflow-y-auto bg-gradient-to-br from-[#0a0a1a] to-[#05050a] p-4 sm:p-8 md:p-12 selection:bg-pink-500/30">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Header Bar */}
          <div className="lg:hidden flex items-center justify-between mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center text-pink-500"><ShieldAlert size={18} /></div>
              <h1 className="font-bold tracking-wide">Master Admin</h1>
            </div>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <Menu size={24} />
            </button>
          </div>
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'progress' && <ProgressTab />}
          {activeTab === 'curriculum' && <CurriculumTab />}
          {activeTab === 'discussions' && <DiscussionsTab />}
        </div>
      </div>
    </div>
  );
}