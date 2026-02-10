import { motion } from 'framer-motion';
import { Heart, Rocket, ArrowRight, Globe, Mail, Phone } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a16] text-white overflow-x-hidden selection:bg-pink-500 selection:text-white font-sans">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-24">

        {/* --- SECTION 1: HEADER & PROGRAM SELECTION --- */}
        <header className="text-center space-y-8 animate-in fade-in slide-in-from-top-8 duration-700">
          {/* LOGO UPDATE: Removed background container, adjusted height */}
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Temitope Ayenigba Initiative"
              className="h-12 md:h-16 w-auto object-contain hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="space-y-4">
            <h1 className="font-heading text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-white">
              Temitope Ayenigba Initiative
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              Building healthy identities, strong relationships, and marriages rooted in purpose.
            </p>
          </div>
        </header>

        {/* The Cards (Hero) */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Soulmate Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-3xl bg-[#13132b] border border-white/10 p-8 text-center hover:border-indigo-500/50 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-bold text-white">Ready for a Soulmate</h2>
                <p className="text-sm text-indigo-200/70 leading-relaxed">
                  For singles ready to be positioned, refined, and settled by God's word.
                </p>
              </div>
              <a href="/soulmate" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all group-hover:border-indigo-500/50">
                Register Now <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Launchpad Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-3xl bg-[#13132b] border border-white/10 p-8 text-center hover:border-pink-500/50 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 mx-auto bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                <Rocket className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-bold text-white">Couples' Launchpad</h2>
                <p className="text-sm text-pink-200/70 leading-relaxed">
                  For couples with a fixed wedding date, ready to build a solid foundation.
                </p>
              </div>
              <a href="/launchpad" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all group-hover:border-pink-500/50">
                Launch Now <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* --- SECTION 2: ABOUT THE VISIONARY --- */}
        <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
        </div>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-md">
          <div className="grid md:grid-cols-12 gap-12 items-start">

            {/* Image Column */}
            <div className="md:col-span-4 space-y-6">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/10 relative group">
                <img
                   src="/temitope.jpg"
                   alt="Temitope Ayenigba"
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Temitope+Ayenigba&background=1e1e2e&color=fff&size=512";
                   }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="font-heading text-xl font-bold text-white">Temitope Ayenigba</h3>
                  <p className="text-pink-400 text-sm">Visionary & Lead Consultant</p>
                </div>
              </div>

              {/* Contact Links */}
              <div className="space-y-4 p-6 bg-black/20 rounded-2xl border border-white/5">
                <h4 className="font-heading font-bold text-white text-sm mb-4 border-b border-white/10 pb-2">Connect & Engage</h4>

                <a href="https://www.anchorofhopecc.com" target="_blank" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors">
                  <Globe size={16} className="text-pink-500" /> anchorofhopecc.com
                </a>
                <a href="mailto:writeanchorofhopecc@gmail.com" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors">
                  <Mail size={16} className="text-pink-500" /> Email Us
                </a>
                <a href="https://wa.me/2347075529430" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors">
                  <Phone size={16} className="text-pink-500" /> +234 707 552 9430
                </a>
              </div>
            </div>

            {/* Bio Text Column */}
            <div className="md:col-span-8 space-y-6 text-slate-300 leading-relaxed font-light">
              <div className="inline-block px-3 py-1 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full border border-pink-500/30 mb-2">
                MEET THE VISIONARY
              </div>

              <h2 className="font-heading text-3xl font-bold text-white">About Temitope Ayenigba</h2>

              <p>
                Temitope Ayenigba is a Family Life Practitioner, Mental Health Professional, Leadership and Organizational Consultant, and a devoted follower of Jesus Christ. Her life and work are driven by a deep passion to serve God, love people well, and make Christ visible through compassion, integrity, wisdom, and service in everyday life.
              </p>

              <p>
                She is the visionary behind the <strong>Temitope Ayenigba Initiative</strong>, the ministry umbrella that houses <span className="text-pink-200">Couples' Launchpad</span> and <span className="text-indigo-200">Ready for a Soulmate</span>. Through these platforms, Temitope serves singles and couples with faith-centered teaching, guidance, and mentorship designed to help them build healthy identities, strong relationships, and marriages rooted in purpose.
              </p>

              <div className="bg-white/5 p-6 rounded-xl border-l-4 border-pink-500 italic text-slate-400 my-8">
                "Her goal remains the same: to help people live whole, grounded, and purpose-driven lives that reflect the love and character of Christ."
              </div>

              <p>
                Alongside her ministry calling, <strong>Anchor of Hope Counseling & Consulting</strong> serves as her professional arm. This practice provides structured, confidential, and psychologically grounded counseling for individuals, couples, families, and organizations.
              </p>

              <p>
                Her life’s work stands at the intersection of faith, healing, wisdom, and practical transformation, offering a steady path toward wholeness, emotional health, relational strength, and meaningful living.
              </p>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm pb-8">
          © {new Date().getFullYear()} Temitope Ayenigba Initiative. All rights reserved.
        </footer>
      </div>
    </div>
  );
};