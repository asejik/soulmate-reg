import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// If you don't have these icons, you can remove them or install lucide-react: npm install lucide-react
import { Mail, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

import { API_BASE_URL } from '../config';

export default function ClaimAccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send the request to our new Go "Bouncer" endpoint
      const response = await fetch(`${API_BASE_URL}/auth/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim account.');
      }

      // If successful, show the success state!
      setSuccess(true);

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Claim Your Account</h1>
          <p className="text-slate-400">Enter the email you used to register for the cohort.</p>
        </div>

        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-8 shadow-2xl">
          {success ? (
            <motion.div
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
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
                    className="w-full bg-[#1a1a3a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-pink-500/25"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Claim Account'}
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>
          )}
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