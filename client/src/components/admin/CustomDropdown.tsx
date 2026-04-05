import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CustomDropdownProps {
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (val: any) => void;
  icon?: React.ElementType;
  align?: 'left' | 'right';
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, icon: Icon, align = 'left', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 280px space below (menu max-h is 240px + margin), drop up
      setDropUp(spaceBelow < 280);
    }
    setIsOpen(!isOpen);
  };

  const selectedLabel = options.find(o => o.value === value)?.label || "Select an option";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        ref={buttonRef}
        type="button" 
        onClick={toggleDropdown} 
        className="w-full flex justify-between items-center gap-2 bg-[#13132b] border border-white/10 rounded-xl px-4 py-3 hover:bg-white/5 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
          <span className="text-sm text-white font-medium truncate">{selectedLabel}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: dropUp ? 5 : -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: dropUp ? 5 : -5 }} 
            transition={{ duration: 0.15 }} 
            className={`absolute ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'} w-full min-w-[200px] bg-[#1a1a3a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-60 overflow-y-auto`}
          >
            {options.map((opt) => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors ${value === opt.value ? 'bg-pink-500/20 text-pink-400 font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};