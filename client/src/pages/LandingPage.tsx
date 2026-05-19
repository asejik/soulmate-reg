import { motion } from 'framer-motion';
import {
  Heart,
  Rocket,
  ArrowRight,
  Globe,
  Mail,
  LogIn,
  ChevronRight,
  HeartHandshake,
  Instagram,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden selection:bg-pink-500 selection:text-white font-sans">

      {/* ─── AMBIENT GLOWS ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      {/* ─── STICKY HEADER / NAV ───────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#050510]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Temitope Ayenigba Initiative"
              className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
            />
            <span className="hidden sm:block text-sm font-bold text-white/70 tracking-tight leading-tight">
              Temitope<br />Ayenigba
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#programs" className="hover:text-white transition-colors">Programs</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="https://www.anchorofhopecc.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Counseling</a>
            <a href="mailto:writeanchorofhopecc@gmail.com" className="hover:text-white transition-colors">Contact</a>
          </nav>

          {/* CTA area */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold text-white transition-all"
            >
              <LogIn size={15} className="text-pink-400" />
              Login
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/5 bg-[#080818] px-6 py-4 space-y-3"
          >
            {[
              { label: 'Programs', href: '#programs' },
              { label: 'About', href: '#about' },
              { label: 'Counseling', href: 'https://www.anchorofhopecc.com' },
              { label: 'Contact', href: 'mailto:writeanchorofhopecc@gmail.com' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-400 hover:text-white transition-colors py-1"
              >
                {label}
              </a>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
              className="flex items-center gap-2 mt-2 text-sm font-bold text-pink-400"
            >
              <LogIn size={15} /> Participant Login
            </button>
          </motion.div>
        )}
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* ─── HERO SECTION ──────────────────────────────────────── */}
        <section className="py-20 md:py-32 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-[0.2em]">
              <Heart size={12} className="fill-current animate-pulse" />
              Faith · Family · Mental Health
            </div>

            <h1 className="font-black text-5xl md:text-7xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30 leading-none">
              Temitope Ayenigba<br />
              <span className="text-3xl md:text-5xl text-white/60 font-extrabold">Initiative</span>
            </h1>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-pink-500 to-transparent mx-auto" />

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Building healthy identities and purpose-driven marriages through faith, self-awareness, and practical transformation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/cohort4-waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
            >
              <Heart size={16} />
              Join Soulmate Cohort 4 Waitlist
            </Link>
            <a
              href="#programs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold uppercase tracking-widest transition-all"
            >
              View Programs
            </a>
          </motion.div>
        </section>

        {/* ─── PROGRAMS SECTION ──────────────────────────────────── */}
        <section id="programs" className="py-16 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
              Our Programs
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Journeys Built for Transformation
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ── Soulmate Card (Cohort 4 Waitlist Open) ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-[2.5rem] bg-[#0d0d1f] border border-indigo-500/20 p-10 text-center transition-all shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 mx-auto bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all transform rotate-3 group-hover:rotate-0">
                  <Heart className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Ready for a Soulmate</h2>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    For singles ready to be positioned, refined, and settled by God's word. A 7-week holistic transformation journey.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    Cohort 4 · Aug–Sep 2026
                  </div>
                  <Link
                    to="/cohort4-waitlist"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-1"
                  >
                    Join Waitlist <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* ── Launchpad Card (Registration Closed) ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative overflow-hidden rounded-[2.5rem] bg-[#0d0d1f] border border-white/5 p-10 text-center transition-all shadow-2xl opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent" />
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 mx-auto bg-pink-500/10 rounded-3xl flex items-center justify-center text-pink-400 transform -rotate-3">
                  <Rocket className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Couples' Launchpad</h2>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    For couples with a fixed wedding date, ready to build a solid foundation for marriage.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/5 text-slate-500 text-sm font-bold uppercase tracking-widest cursor-not-allowed">
                  Registration Closed
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── PARTICIPANT LOGIN BANNER ───────────────────────────── */}
        <section className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="group relative bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl hover:border-pink-500/30 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                  <HeartHandshake size={24} />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-bold text-white">Already a registered participant?</h3>
                  <p className="text-slate-400 text-sm font-medium">Access your curriculum and community dashboards here.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="relative z-10 flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all hover:scale-105 active:scale-95"
              >
                <LogIn size={20} className="text-pink-400" /> Participant Login
              </button>
            </div>
          </motion.div>
        </section>

        {/* ─── ABOUT / THE VISIONARY ─────────────────────────────── */}
        <section id="about" className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-16 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/5 blur-[120px] -mr-32 -mt-32 rounded-full" />

            <div className="grid lg:grid-cols-12 gap-16 items-center relative z-10">
              {/* Image Column */}
              <div className="lg:col-span-5 space-y-8">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl opacity-50" />
                  <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-800 border border-white/10 relative">
                    <img
                      src="/temitope.jpg"
                      alt="Temitope Ayenigba"
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Temitope+Ayenigba&background=1e1e2e&color=fff&size=512";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510]/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      <h3 className="text-2xl font-bold text-white">Temitope Ayenigba</h3>
                      <p className="text-pink-400 font-bold uppercase tracking-widest text-xs mt-1">Visionary & Lead Consultant</p>
                    </div>
                  </div>
                </div>

                {/* Quick Contact Links */}
                <div className="grid grid-cols-1 gap-3">
                  <a href="https://www.anchorofhopecc.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group border border-white/5 hover:border-pink-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-pink-500" />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white">anchorofhopecc.com</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-pink-500 transition-colors" />
                  </a>
                  <a href="mailto:writeanchorofhopecc@gmail.com" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group border border-white/5 hover:border-pink-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-pink-500" />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white">Email Us</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-pink-500 transition-colors" />
                  </a>
                  <a href="https://www.instagram.com/readyforasoulmate" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group border border-white/5 hover:border-pink-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Instagram size={18} className="text-pink-500" />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white">@readyforasoulmate</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-pink-500 transition-colors" />
                  </a>
                </div>
              </div>

              {/* Bio Content */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    The Visionary
                  </div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Restoring wholeness <br />in love and life.</h2>
                </div>

                <div className="space-y-6 text-slate-400 text-lg leading-relaxed font-medium">
                  <p>
                    <span className="text-white font-bold">Temitope Ayenigba</span> is a Family Life Practitioner and Mental Health Professional dedicated to making Christ visible through compassion and practical transformation.
                  </p>
                  <p>
                    Her ministry houses <span className="text-pink-400">Couples' Launchpad</span> and <span className="text-indigo-400">Ready for a Soulmate</span>—platforms designed to help participants build healthy identities and marriages rooted in divine purpose.
                  </p>

                  <div className="flex items-center gap-4 py-4">
                    <div className="h-12 w-1 bg-pink-500 rounded-full" />
                    <p className="italic text-slate-200">
                      "Helping people live whole, grounded, and purpose-driven lives that reflect the love and character of Christ."
                    </p>
                  </div>

                  <p>
                    Alongside ministry, she leads <strong>Anchor of Hope Counseling & Consulting</strong>, providing psychologically grounded guidance for individuals, couples, and organizations.
                  </p>
                </div>

                <div className="pt-4">
                  <a href="https://wa.me/2347075529430" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-pink-400 font-bold hover:text-white transition-all group">
                    Inquire for Counseling <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── FOOTER ────────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-12 mt-8">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div className="space-y-4">
              <img src="/logo.png" alt="TAi" className="h-12 w-auto object-contain opacity-80" />
              <p className="text-slate-500 text-sm leading-relaxed">
                Building healthy identities and purpose-driven marriages through faith, self-awareness, and practical transformation.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Programs</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link to="/cohort4-waitlist" className="hover:text-pink-400 transition-colors">Ready for a Soulmate — Cohort 4 Waitlist</Link>
                </li>
                <li>
                  <span className="text-slate-600">Couples' Launchpad (Registration Closed)</span>
                </li>
                <li>
                  <Link to="/login" className="hover:text-pink-400 transition-colors">Participant Login</Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Connect</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="https://www.anchorofhopecc.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors flex items-center gap-1.5">
                    <Globe size={13} /> anchorofhopecc.com
                  </a>
                </li>
                <li>
                  <a href="mailto:writeanchorofhopecc@gmail.com" className="hover:text-pink-400 transition-colors flex items-center gap-1.5">
                    <Mail size={13} /> writeanchorofhopecc@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/readyforasoulmate" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors flex items-center gap-1.5">
                    <Instagram size={13} /> @readyforasoulmate
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} Temitope Ayenigba Initiative. All rights reserved.
            </p>
            <p className="text-slate-700 text-xs">
              Faith-centered transformation for a modern world.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
};