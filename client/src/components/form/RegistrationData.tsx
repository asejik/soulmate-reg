import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface RegistrationDataProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export const RegistrationData = ({ onNext, onBack }: RegistrationDataProps) => {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onNext(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full p-8 glass-card rounded-3xl space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar relative"
    >
      <button
        type="button"
        onClick={onBack}
        className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors mb-2"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Your Details</h2>
        <p className="text-slate-400">Please provide accurate information for your cohort placement.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input name="full_name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="Enter name" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="email@example.com" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">WhatsApp Number</label>
            <input name="whatsapp_number" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="+234..." required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Gender</label>
            <select name="gender" className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Country</label>
            <input name="country" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="Nigeria" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Location / State</label>
            <input name="state" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="Lagos" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Age Group</label>
            <select name="age_group" className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white">
              <option value="18-25">18-25</option>
              <option value="26-30">26-30</option>
              <option value="31-35">31-35</option>
              <option value="36-40">36-40</option>
              <option value="40+">40 and above</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Religion</label>
            <select name="religion" className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white">
              <option value="Christian">Christian</option>
              <option value="Muslim">Muslim</option>
              <option value="Traditional">Traditional Worshiper</option>
              <option value="Atheist">Atheist</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Instagram Handle</label>
            <input name="instagram_handle" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="@username" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Church Name (If Christian)</label>
            <input name="church_name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="Assembly name" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Relationship Status</label>
          <select name="relationship_status" className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white">
            <option value="single">Single</option>
            <option value="single-parent">Single Mum/Dad</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widow/Widower</option>
          </select>
        </div>

        <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
          Continue to Final Verification
        </button>
      </form>
    </motion.div>
  );
};