import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config';

export const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a16] text-white p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-4xl font-bold text-pink-500">Welcome to your Dashboard</h1>
        <p className="text-slate-300 font-light">
          Your learning journey and cohort content will be built here shortly.
        </p>

        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};