import { useState } from 'react';
import { LaunchpadWelcome } from '../components/launchpad/LaunchpadWelcome';
import { LaunchpadWizard } from '../components/launchpad/LaunchpadWizard';
import { RejectionScreen } from '../components/form/RejectionScreen'; // Reuse existing
import { API_BASE_URL } from '../config';

export const LaunchpadApp = () => {
  const [view, setView] = useState<'welcome' | 'form' | 'success' | 'rejected'>('welcome');
  const [rejectMsg, setRejectMsg] = useState('');
  const [successLinks, setSuccessLinks] = useState({ whatsapp: '', telegram: '' });

  const handleRegister = async (data: any) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/launchpad/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            setSuccessLinks({ whatsapp: result.whatsapp_link, telegram: result.telegram_link });
            setView('success');
        } else {
            setRejectMsg(result || "Registration failed.");
            setView('rejected');
        }
    } catch (err) {
        setRejectMsg("Network error. Please try again.");
        setView('rejected');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-mesh fixed inset-0 pointer-events-none" />
      <div className="bg-beam fixed inset-0 pointer-events-none" />

      <div className="relative z-10 w-full flex justify-center">
        {view === 'welcome' && <LaunchpadWelcome onStart={() => setView('form')} />}

        {view === 'form' && (
            <LaunchpadWizard
                onSubmit={handleRegister}
                onReject={(msg) => { setRejectMsg(msg); setView('rejected'); }}
                onBack={() => setView('welcome')}
            />
        )}

        {view === 'rejected' && (
            <RejectionScreen message={rejectMsg} onReset={() => setView('welcome')} />
        )}

        {view === 'success' && (
            <div className="max-w-md w-full p-8 glass-card rounded-3xl text-center space-y-6 text-white">
                <h2 className="text-3xl font-bold">You are Registered! 🎉</h2>
                <p className="text-slate-300">Congratulations! You have taken a great step toward a blissful marriage.</p>

                <div className="space-y-3">
                    <p className="text-sm font-bold text-amber-400">IMPORTANT: Join BOTH groups below:</p>
                    <a href={successLinks.whatsapp} target="_blank" className="block w-full py-3 bg-[#25D366] rounded-xl font-bold">Join WhatsApp Group</a>
                    <a href={successLinks.telegram} target="_blank" className="block w-full py-3 bg-[#0088cc] rounded-xl font-bold">Join Telegram Group</a>
                </div>

                <button onClick={() => window.location.href = '/'} className="text-sm text-slate-400 underline">Return to Portal</button>
            </div>
        )}
      </div>
    </div>
  );
};