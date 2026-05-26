import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, KeyRound, Heart } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ClaimAccountPage() {
  const navigate = useNavigate();
  
  // Program Selection
  const [activeTab, setActiveTab] = useState<'launchpad' | 'rfasm'>('launchpad');

  // Unified State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [spouseEmail, setSpouseEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Launchpad Wizard Steps: 1 (Spouse Email) -> 2 (OTP & Details) -> 3 (Success)
  const [step, setStep] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- RFASM Flow ---
  const handleRFASMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to claim account.');

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Launchpad Flow ---
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spouseEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send verification code.');

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchpadClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, spouseEmail, code: otpCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to claim account.');

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700 ${activeTab === 'launchpad' ? 'bg-pink-600/10' : 'bg-indigo-500/10'}`} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Claim Your Account</h1>
          <p className="text-slate-400">Select your program to continue.</p>
        </div>

        {!success && (
          <div className="flex bg-[#1a1a3a] p-1 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('launchpad'); setStep(1); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'launchpad' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Heart size={16} /> Launchpad
            </button>
            <button
              onClick={() => { setActiveTab('rfasm'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'rfasm' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Soulmate
            </button>
          </div>
        )}

        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Account Claimed!</h3>
                <p className="text-slate-400">You can now access the portal. Redirecting to login...</p>
              </motion.div>
            ) : activeTab === 'rfasm' ? (
              <motion.form 
                key="rfasm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRFASMSubmit} 
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Your Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-indigo-500/25"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Claim Account'}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              </motion.form>
            ) : step === 1 ? (
              <motion.form 
                key="launchpad-step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRequestOTP} 
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Your SPOUSE'S Registered Email</label>
                  <p className="text-xs text-slate-400 ml-1 mb-2">We will send a verification code to their email address.</p>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="email"
                      required
                      value={spouseEmail}
                      onChange={(e) => setSpouseEmail(e.target.value)}
                      className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
                      placeholder="spouse@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !spouseEmail}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-pink-500/25"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Send Code'}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="launchpad-step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLaunchpadClaim} 
                className="space-y-5"
              >
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">6-Digit Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors text-center font-mono tracking-widest text-lg"
                      placeholder="000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Your Personal Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !otpCode || !email || !password}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-pink-500/25 mt-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Complete Claim'}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-slate-400 hover:text-white text-sm font-bold py-2 transition-colors"
                >
                  Back
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!success && (
          <p className="text-center text-slate-400 mt-8 text-sm">
            Already claimed your account? <Link to="/login" className="text-pink-400 hover:text-pink-300 font-bold transition-colors">Log In</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}