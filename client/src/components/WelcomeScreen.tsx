import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl w-full p-8 glass-card rounded-3xl text-center space-y-6"
    >
      <div className="flex justify-center">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <Heart className="w-12 h-12 text-indigo-400" />
        </div>
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-white">
        Welcome to Ready for a Soulmate
      </h1>

      <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
        <p>Hello! We are so glad you’re here. This isn’t just a meeting; it’s a journey of preparation, refining, and divine positioning.</p>
        <p className="text-sm border-l-2 border-indigo-500 pl-4 italic">
          Please note that we have limited slots available for each cohort to ensure an intimate and impactful experience.
        </p>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-white text-slate-950 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Are you ready? Let's get started
      </button>
    </motion.div>
  );
};