import { useState, useEffect } from 'react';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { GatekeeperStep } from '../components/form/GatekeeperStep';
import { RejectionScreen } from '../components/form/RejectionScreen';
import { RegistrationData } from '../components/form/RegistrationData';
import { InstagramLock } from '../components/form/InstagramLock';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { Loader2, LogIn } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';

type AppStep = 'welcome' | 'gatekeeper' | 'registration' | 'social-lock' | 'success' | 'rejected' | 'admin';

export function SoulmateApp() {
  const [step, setStep] = useState<AppStep>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin') return 'admin';
    return (localStorage.getItem('soulmate_step') as AppStep) || 'welcome';
  });

  const [formData, setFormData] = useState<any>(() => {
    const saved = localStorage.getItem('soulmate_form_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [assignedClan, setAssignedClan] = useState<{name: string, link: string} | null>(() => {
    const saved = localStorage.getItem('soulmate_assigned_clan');
    return saved ? JSON.parse(saved) : null;
  });

  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (step === 'admin') return;

    localStorage.setItem('soulmate_step', step);
    if (formData) localStorage.setItem('soulmate_form_data', JSON.stringify(formData));
    if (assignedClan) localStorage.setItem('soulmate_assigned_clan', JSON.stringify(assignedClan));
  }, [step, formData, assignedClan]);

  const handleStart = () => {
    localStorage.removeItem('soulmate_step');
    localStorage.removeItem('soulmate_form_data');
    localStorage.removeItem('soulmate_assigned_clan');
    setFormData(null);
    setAssignedClan(null);
    setRejectionMessage('');
    setStep('welcome');
  };

  const handleReject = (message: string) => {
    setRejectionMessage(message);
    setStep('rejected');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        const clanInfo = { name: result.clan_name, link: result.whatsapp_link };
        setAssignedClan(clanInfo);
        setStep('success');
      } else {
        handleReject(result.message || "An error occurred during registration.");
      }
    } catch (error) {
      handleReject("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-mesh fixed inset-0 pointer-events-none" />
      <div className="bg-beam fixed inset-0 pointer-events-none" />

      {/* Floating Login Button (FIXED to the screen) */}
      <div className="fixed top-6 right-6 md:top-8 md:right-8 z-50">
        <Link
          to="/login"
          className="flex items-center gap-2 px-5 py-2.5 bg-black/20 hover:bg-black/40 border border-white/10 rounded-full text-sm font-bold text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-[0_0_30px_-10px_rgba(236,72,153,0.3)]"
        >
          <LogIn size={16} className="text-pink-400" />
          <span>Participant Login</span>
        </Link>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {step === 'admin' && <AdminDashboard />}
        {step === 'welcome' && <WelcomeScreen onStart={() => setStep('gatekeeper')} />}
        {step === 'gatekeeper' && <GatekeeperStep onValidated={() => setStep('registration')} onReject={handleReject} onBack={() => setStep('welcome')} />}
        {step === 'registration' && <RegistrationData onNext={(data) => { setFormData(data); setStep('social-lock'); }} onBack={() => setStep('gatekeeper')} />}

        {step === 'social-lock' && (
          <div className="relative w-full max-w-md">
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-white mt-4 font-medium">Assigning your Clan...</p>
              </div>
            )}
            <InstagramLock onComplete={handleFinalSubmit} onBack={() => setStep('registration')} />
          </div>
        )}

        {step === 'rejected' && <RejectionScreen message={rejectionMessage} onReset={handleStart} />}

        {step === 'success' && assignedClan && (
          <div className="max-w-md w-full p-10 glass-card rounded-3xl text-center text-white space-y-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
               <span className="text-3xl">🎉</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">You're In!</h2>
              <p className="mt-2 text-slate-300">Welcome to the journey.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-2">
              <p className="text-xs uppercase tracking-widest text-slate-400">Your Assigned Group</p>
              <h3 className="text-xl font-bold text-indigo-300">{assignedClan.name}</h3>
            </div>
            <a href={assignedClan.link} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20">
              Join WhatsApp Clan Now
            </a>
            <div className="space-y-4">
              <p className="text-xs text-slate-500">A confirmation email has also been sent to you.</p>
              <button onClick={handleStart} className="text-slate-400 hover:text-white text-sm underline underline-offset-4 transition-colors cursor-pointer">
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}