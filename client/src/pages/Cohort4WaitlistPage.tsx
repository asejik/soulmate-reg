import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Clock,
  Users,
  BookOpen,
  ChevronRight,
  Instagram,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const WHATSAPP_COMMUNITY_LINK = 'https://chat.whatsapp.com/JdJgtw3VxwIFfAT3HiVSR4?mode=gi_t';

type PageView = 'form' | 'success' | 'error';

interface FormState {
  full_name: string;
  nationality: string;
  whatsapp_number: string;
  email: string;
  religion: string;
  denomination: string;
}

const initialFormState: FormState = {
  full_name: '',
  nationality: '',
  whatsapp_number: '',
  email: '',
  religion: '',
  denomination: '',
};

export const Cohort4WaitlistPage = () => {
  const [view, setView] = useState<PageView>('form');
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/cohort4/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        setView('success');
      } else {
        setErrorMessage(result.message || 'Something went wrong. Please try again.');
        setView('error');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setView('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden font-sans">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-pink-600/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[35%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Sticky mini header */}
      <header className="sticky top-0 z-50 bg-[#050510]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TAi" className="h-8 w-auto object-contain opacity-80" />
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em]">
            <Heart size={12} className="fill-current" />
            Ready for a Soulmate · Cohort 4
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight">
            Join the Waitlist
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            A structured, 7-week transformation journey to help you strengthen your walk with God,
            build self-awareness, and become truly ready for a healthy love life.
          </p>
          <p className="text-indigo-400 font-semibold text-base">
            Cohort 4 runs September – October 2026
          </p>
        </motion.div>

        {/* ── PROGRAM OVERVIEW CARDS ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: Clock, label: 'Duration', value: '7 Weeks' },
            { icon: BookOpen, label: 'Live Classes', value: 'Tue & Thu · 8PM' },
            { icon: Users, label: 'Vigil', value: 'Bi-weekly Fridays · 11PM' },
            { icon: ChevronRight, label: 'Replays', value: '48-Hour Access' },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 hover:border-indigo-500/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Icon size={18} />
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{label}</p>
              <p className="text-white font-semibold text-sm">{value}</p>
            </div>
          ))}
        </motion.div>

        {/* ── IMPORTANT NOTICE ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 space-y-6"
        >
          <h2 className="text-xl font-bold text-amber-400 uppercase tracking-wider">
            ⚠ Please Read Before Proceeding
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Ready for A Soulmate is a <strong className="text-white">structured, 7-week transformation journey.</strong> It is not a casual
              class — it is a holistic process designed to help you strengthen your walk with God, build
              self-awareness, develop emotional maturity, gain clarity, and become ready for a healthy love life.
            </p>
            <p>This journey will require your <em>presence</em>, your <em>commitment</em>, and your <em>willingness to grow.</em></p>
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <h3 className="font-bold text-white">Participants Who Gain the Most:</h3>
            <ul className="space-y-2">
              {[
                'Show up consistently',
                'Stay attentive during sessions',
                'Take time to reflect and respond to exercises',
                'Remain open to learning and personal growth',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-slate-400 text-sm leading-relaxed">
              We have very <strong className="text-white">limited slots</strong>, and we are intentional about creating a space where
              people can truly grow. If your current schedule may not allow you to participate consistently,
              it&apos;s okay to give yourself more time and join when you&apos;re better positioned.
            </p>
          </div>
        </motion.div>

        {/* ── FORM / SUCCESS / ERROR ────────────────────────────── */}
        <AnimatePresence mode="wait">

          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Waitlist Application</h2>
                <p className="text-slate-400 text-sm">
                  Kindly complete the details below. This is a waitlist — not the registration form.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="full_name" className="block text-sm font-semibold text-slate-300">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Adaeze Okafor"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Nationality / State */}
                  <div className="space-y-2">
                    <label htmlFor="nationality" className="block text-sm font-semibold text-slate-300">
                      Nationality / State of Residence <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="nationality"
                      name="nationality"
                      type="text"
                      required
                      value={formData.nationality}
                      onChange={handleChange}
                      placeholder="e.g. Nigerian / Lagos"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <label htmlFor="whatsapp_number" className="block text-sm font-semibold text-slate-300">
                      WhatsApp Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="whatsapp_number"
                      name="whatsapp_number"
                      type="tel"
                      required
                      value={formData.whatsapp_number}
                      onChange={handleChange}
                      placeholder="+234 800 000 0000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Religion */}
                  <div className="space-y-2">
                    <label htmlFor="religion" className="block text-sm font-semibold text-slate-300">
                      Religion <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="religion"
                      name="religion"
                      required
                      value={formData.religion}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="" disabled>Select religion</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Traditional">Traditional Worshiper</option>
                      <option value="Atheist">Atheist</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Denomination */}
                  <div className="space-y-2">
                    <label htmlFor="denomination" className="block text-sm font-semibold text-slate-300">
                      Denomination <span className="text-slate-500">(if Christian)</span>
                    </label>
                    <input
                      id="denomination"
                      name="denomination"
                      type="text"
                      value={formData.denomination}
                      onChange={handleChange}
                      placeholder="e.g. Pentecostal, Catholic…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Joining Waitlist…
                    </>
                  ) : (
                    <>
                      <Heart size={18} />
                      Join the Waitlist
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 border border-indigo-500/20 rounded-3xl p-6 sm:p-10 md:p-16 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-4xl">
                🎉
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white">You're on the List!</h2>
                <p className="text-slate-400 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
                  Thank you for joining the waitlist for <strong className="text-white">Ready for a Soulmate — Cohort 4.</strong>
                  {' '}You will be among the first to receive registration details when enrollment opens.
                </p>
              </div>

              <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 md:p-6 space-y-3 max-w-md mx-auto">
                <p className="text-sm text-slate-400 font-bold">Next Steps</p>
                <ul className="space-y-3 text-slate-300 text-sm text-left">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Stay attentive to your email for further updates.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Follow <strong className="text-white">@readyforasoulmate</strong> on Instagram so you don&apos;t miss important information.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Join the WhatsApp community below to stay connected.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col items-center gap-4">
                <a
                  href={WHATSAPP_COMMUNITY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 w-full max-w-sm mx-auto py-4 px-6 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/30 justify-center text-base"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join WhatsApp Community
                </a>

                <a
                  href="https://www.instagram.com/readyforasoulmate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors text-sm font-medium pt-2"
                >
                  <Instagram size={16} />
                  Follow @readyforasoulmate on Instagram
                </a>
              </div>

              <Link
                to="/"
                className="inline-block text-slate-500 hover:text-white text-sm underline underline-offset-4 transition-colors"
              >
                Return to Home
              </Link>
            </motion.div>
          )}

          {view === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/5 border border-red-500/20 rounded-3xl p-10 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Something Went Wrong</h2>
                <p className="text-slate-400">{errorMessage}</p>
              </div>
              <button
                onClick={() => { setView('form'); setErrorMessage(''); }}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-semibold transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── FOOTER NOTE ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-2 pb-8"
        >
          <p className="text-slate-500 text-sm">
            <strong className="text-slate-400">Please note:</strong> This is a waitlist, not the registration form.
            Kindly stay attentive to your email for further updates.
          </p>
          <p className="text-slate-600 text-xs">
            We look forward to walking this journey with you. — <em>Ready for A Soulmate Team</em>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
