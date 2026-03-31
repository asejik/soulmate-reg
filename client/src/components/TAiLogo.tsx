import React from 'react';
import { motion } from 'framer-motion';

interface TAiLogoProps {
  className?: string;
  withText?: boolean;
}

export const TAiLogo: React.FC<TAiLogoProps> = ({ className = '', withText = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* This points directly to client/public/logo.png
        Adjust the w-10 / h-10 to make it bigger or smaller!
      */}
      <img
        src="/logo.png"
        alt="Temitope Ayenigba Logo"
        className="w-10 h-10 object-contain drop-shadow-lg"
      />

      {withText && (
        <div className="flex flex-col">
          {/* <span className="text-white font-bold text-lg leading-tight tracking-wide">
            Temitope Ayenigba
          </span> */}
          <span className="text-blue-400 text-[10px] uppercase font-bold tracking-widest leading-none">
            {/* Learning Platform */}
          </span>
        </div>
      )}
    </motion.div>
  );
};