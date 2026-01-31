import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GatekeeperStep } from './components/form/GatekeeperStep';
import { RejectionScreen } from './components/form/RejectionScreen';
import { RegistrationData } from './components/form/RegistrationData';
import { InstagramLock } from './components/form/InstagramLock';
import { Loader2 } from 'lucide-react';

type AppStep = 'welcome' | 'gatekeeper' | 'registration' | 'social-lock' | 'success' | 'rejected';

function App() {
  const [step, setStep] = useState<AppStep>('welcome');
  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  const [formData, setFormData] = useState<any>(null);

  // API State
  const [isLoading, setIsLoading] = useState(false);
  const [assignedClan, setAssignedClan] = useState<{name: string, link: string} | null>(null);

  const handleReject = (message: string) => {
    setRejectionMessage(message);
    setStep('rejected');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);

    try {
      // NOTE: Ensure your Go backend is running on port 8080
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setAssignedClan({ name: result.clan_name, link: result.whatsapp_link });
        setStep('success');
      } else {
        handleReject(result.message || "An error occurred during registration.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      handleReject("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-mesh" />
      <div className="bg-beam" />

      {step === 'welcome' && (
        <WelcomeScreen onStart={() => setStep('gatekeeper')} />
      )}

      {step === 'gatekeeper' && (
        <GatekeeperStep
          onValidated={() => setStep('registration')}
          onReject={handleReject}
          onBack={() => setStep('welcome')}
        />
      )}

      {step === 'registration' && (
        <RegistrationData
          onNext={(data) => { setFormData(data); setStep('social-lock'); }}
          onBack={() => setStep('gatekeeper')}
        />
      )}

      {step === 'social-lock' && (
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-white mt-4 font-medium">Assigning your Clan...</p>
            </div>
          )}
          <InstagramLock
            onComplete={handleFinalSubmit}
            onBack={() => setStep('registration')}
          />
        </div>
      )}

      {step === 'rejected' && (
        <RejectionScreen message={rejectionMessage} />
      )}

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

          <a
            href={assignedClan.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20"
          >
            Join WhatsApp Clan Now
          </a>

          <p className="text-xs text-slate-500">
            A confirmation email has also been sent to you.
          </p>
        </div>
      )}
    </main>
  );
}

export default App;