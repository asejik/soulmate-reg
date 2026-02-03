import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Rocket } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background Effects */}
      <div className="bg-mesh fixed inset-0 pointer-events-none" />
      <div className="bg-beam fixed inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Temitope Ayenigba Initiative
          </h1>
          <p className="text-xl text-indigo-200">Select your journey below</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Ready for a Soulmate */}
          <Link to="/soulmate" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-8 glass-card rounded-3xl h-full border border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                <Heart className="w-10 h-10 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready for a Soulmate</h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  For singles ready to be positioned, refined, and settled by God’s word.
                </p>
              </div>
              <span className="px-6 py-2 bg-white/10 rounded-full text-white text-sm font-semibold group-hover:bg-indigo-600 transition-colors">
                Register Now &rarr;
              </span>
            </motion.div>
          </Link>

          {/* Card 2: Couples' Launchpad */}
          <Link to="/launchpad" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-8 glass-card rounded-3xl h-full border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                <Rocket className="w-10 h-10 text-pink-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Couples' Launchpad</h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  For couples with a fixed wedding date, ready to build a solid foundation.
                </p>
              </div>
              <span className="px-6 py-2 bg-white/10 rounded-full text-white text-sm font-semibold group-hover:bg-pink-600 transition-colors">
                Launch Now &rarr;
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
};