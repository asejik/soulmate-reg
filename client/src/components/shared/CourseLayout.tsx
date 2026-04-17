import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Award, MessageSquare, Menu, X, LogOut, Layout, Heart, Users, Phone } from 'lucide-react';
import { supabase } from '../../config';
import { getAuthSession, clearSessionCache } from '../../lib/api';
import { TAiLogo } from '../TAiLogo';

export const CourseLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userInitial, setUserInitial] = useState('U');
  const [userEmail, setUserEmail] = useState('');

  // Fetch the logged-in user's email to create a dynamic avatar
  useEffect(() => {
    getAuthSession().then((session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setUserInitial(session.user.email.charAt(0).toUpperCase());
      }
    });
  }, []);

  const handleLogout = async () => {
    clearSessionCache();
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Course Material', path: '/dashboard', icon: Layout },
    { label: 'Grades & Progress', path: '/dashboard/grades', icon: Award },
    { label: 'Discussion Forums', path: '/dashboard/discussions', icon: MessageSquare },
    { label: 'Support & Giving', path: '/dashboard/giving', icon: Heart },
    { label: 'Volunteer to Serve', path: '/dashboard/volunteer', icon: Users },
    { label: 'Contact & Support', path: '/dashboard/contact', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-300 font-sans flex flex-col md:flex-row">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between bg-[#111827] border-b border-white/5 p-4 sticky top-0 z-50">
        <div className="text-xl font-bold tracking-widest text-white">
          T<span className="text-pink-500">A</span>I
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* LEFT SIDEBAR (Desktop permanent, Mobile toggleable) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#111827] border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* LOGO AREA */}
        <div className="h-20 flex items-center px-8 border-b border-white/5">
           <TAiLogo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User / Logout Area */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#0b0f19]">

        {/* DESKTOP TOP BAR */}
        <header className="hidden md:flex items-center justify-between bg-[#0b0f19] border-b border-white/5 px-8 py-4">
          <div className="text-sm text-slate-500 font-medium">
            Learning Portal
          </div>

          <div className="flex items-center gap-4 relative group">
            {/* The Dynamic Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer">
              {userInitial}
            </div>

            {/* The Hover Tooltip */}
            <div className="absolute right-0 top-10 w-max px-3 py-2 bg-[#111827] border border-white/10 text-xs text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              <span className="block text-slate-500 mb-0.5">Signed in as</span>
              <span className="font-bold text-white">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT GOES HERE */}
        <main className="flex-1 overflow-y-auto p-0 md:p-8">
          <Outlet />
        </main>

      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};