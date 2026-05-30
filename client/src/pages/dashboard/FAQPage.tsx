import { useState } from 'react';
import { HelpCircle, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQs = [
  { q: "How do I join the waitroom before class?", a: "You can click on the 'Start' button for the lesson. A countdown will appear until the live premiere starts." },
  { q: "When do the replays expire?", a: "Standard lessons expire 48 hours after they go live. Class 4 will remain open for 5 days." },
  { q: "How do I submit my Mid-Cohort Feedback?", a: "Navigate to the Mid-Cohort Review tab, or click the required action button on your dashboard. Ensure your review is at least 20 characters long." },
  { q: "My spouse cannot log in, what do I do?", a: "Ensure they received the OTP sent to your registered email during the 'Claim Account' process." }
];

export const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filteredFAQs = FAQs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <HelpCircle className="text-pink-400" size={32} /> AI FAQ Database
        </h1>
        <p className="text-slate-400">Search for answers to the most common questions.</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type your question..."
          className="w-full bg-[#111827] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
        />
      </div>

      <div className="space-y-4">
        {filteredFAQs.map((faq, i) => (
          <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <h3 className="text-lg font-bold text-white pr-4">{faq.q}</h3>
              <ChevronDown 
                className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`} 
                size={20} 
              />
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-5 text-slate-400"
                >
                  <p>{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-10 text-slate-500 italic">
            No FAQs found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
