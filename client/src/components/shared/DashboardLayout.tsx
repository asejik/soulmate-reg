import { useNavigate, Outlet } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../../config';

export const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a16] text-white font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden">

      {/* Ambient Motion Background (Persistent across all dashboard pages) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Top Navigation Bar */}
      <nav className="relative z-20 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="TAi Logo" className="h-10 object-contain" />
            <div className="hidden md:block w-px h-6 bg-white/10 mx-2" />
            <span className="hidden md:block font-heading font-semibold text-sm tracking-wide text-slate-300">
              Learning Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <User size={16} className="text-pink-400" />
              <span className="text-xs font-medium text-slate-300">Participant</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Page Content (Injected here via React Router) */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
};