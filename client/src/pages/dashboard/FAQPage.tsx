import { HelpCircle, Search } from 'lucide-react';

const FAQs = [
  { q: "How do I join the waitroom before class?", a: "You can click on the 'Start' button for the lesson. A countdown will appear until the live premiere starts." },
  { q: "When do the replays expire?", a: "Standard lessons expire 48 hours after they go live. Class 4 will remain open for 5 days." },
  { q: "How do I submit my Mid-Cohort Feedback?", a: "Navigate to the Mid-Cohort Review tab, or click the required action button on your dashboard. Ensure your review is at least 20 characters long." },
  { q: "My spouse cannot log in, what do I do?", a: "Ensure they received the OTP sent to your registered email during the 'Claim Account' process." }
];

export const FAQPage = () => {
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
          placeholder="Type your question..."
          className="w-full bg-[#111827] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
        />
      </div>

      <div className="space-y-4">
        {FAQs.map((faq, i) => (
          <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
            <p className="text-slate-400">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
