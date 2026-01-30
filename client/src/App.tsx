import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GatekeeperStep } from './components/form/GatekeeperStep';
import { RejectionScreen } from './components/form/RejectionScreen';
import { RegistrationData } from './components/form/RegistrationData';
import { InstagramLock } from './components/form/InstagramLock';

type AppStep = 'welcome' | 'gatekeeper' | 'registration' | 'social-lock' | 'success' | 'rejected';

function App() {
  const [step, setStep] = useState<AppStep>('welcome');
  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  const [formData, setFormData] = useState<any>(null);

  const handleReject = (message: string) => {
    setRejectionMessage(message);
    setStep('rejected');
  };

  const handleFinalSubmit = () => {
    // Logic for Go Backend/Supabase will go here in Step 6
    console.log("Submitting data:", formData);
    setStep('success');
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
        <InstagramLock
          onComplete={handleFinalSubmit}
          onBack={() => setStep('registration')}
        />
      )}

      {step === 'rejected' && (
        <RejectionScreen message={rejectionMessage} />
      )}

      {step === 'success' && (
        <div className="glass-card p-10 rounded-3xl text-center text-white">
          <h2 className="text-3xl font-bold">Registration Successful!</h2>
          <p className="mt-4 text-slate-400">Please check your email for your WhatsApp Clan link.</p>
        </div>
      )}
    </main>
  );
}

export default App;