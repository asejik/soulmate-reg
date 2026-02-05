import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

interface WizardProps {
  onSubmit: (data: any) => void;
  onReject: (msg: string) => void;
  onBack: () => void;
}

export const LaunchpadWizard = ({ onSubmit, onReject, onBack }: WizardProps) => {
  const [step, setStep] = useState(1);

  // Track if they clicked the Instagram link
  const [hasClickedIG, setHasClickedIG] = useState(false);
  // NEW: State for the custom warning popup
  const [showSocialWarning, setShowSocialWarning] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', gender: 'Female', email: '', whatsapp_number: '',
    country_city: '', religion: '', denomination: '', referral_source: '',
    instagram_handle: '', wedding_date: '',
    partner_registered: 'No', spouse_name: '', spouse_whatsapp: '',
    attended_before: false, agreed_to_feedback: false, agreed_to_participation: false
  });

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNext = () => {
    // Basic Validation per step
    if (step === 1) {
      if (!formData.full_name || !formData.email || !formData.whatsapp_number) return alert("Please fill in required fields.");

      // CUSTOM UI: Social Gate Check
      if (!hasClickedIG) {
        setShowSocialWarning(true);
        // Auto-hide the warning after 4 seconds
        setTimeout(() => setShowSocialWarning(false), 4000);
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!formData.wedding_date || !formData.spouse_name) return alert("Wedding date and spouse name are required.");
      setStep(3);
    } else if (step === 3) {
        if (formData.attended_before) {
            onReject("We are focusing on first-time attendees for this cohort. Thank you for your honesty!");
            return;
        }
        if (!formData.agreed_to_feedback || !formData.agreed_to_participation) {
            onReject("Commitment to feedback and active participation is required to join this cohort.");
            return;
        }
        onSubmit(formData);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl w-full glass-card p-8 rounded-3xl relative">

      {/* Progress Bar */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 flex-1 mx-1 rounded-full ${s <= step ? 'bg-pink-500' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="space-y-6">

        {/* --- STEP 1: PERSONAL --- */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white">Personal Details</h2>
            <div className="grid grid-cols-2 gap-4">
               <input name="full_name" placeholder="Full Name" onChange={handleChange} className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
               <select name="gender" onChange={handleChange} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white [&>option]:text-black focus:ring-2 focus:ring-pink-500 outline-none">
                 <option value="Female">Female</option>
                 <option value="Male">Male</option>
               </select>
               <input name="email" type="email" placeholder="Email" onChange={handleChange} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
               <input name="whatsapp_number" placeholder="WhatsApp Number" onChange={handleChange} className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
               <input name="country_city" placeholder="Country & City" onChange={handleChange} className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
               <input name="religion" placeholder="Religion" onChange={handleChange} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
               <input name="denomination" placeholder="Denomination (if Christian)" onChange={handleChange} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
               <input name="referral_source" placeholder="How did you hear about us?" onChange={handleChange} className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>

            <div className={`p-4 rounded-xl border transition-all duration-300 ${hasClickedIG ? 'bg-green-500/10 border-green-500/30' : 'bg-indigo-500/20 border-indigo-500/30'} space-y-2`}>
                <p className="text-indigo-200 text-sm">Join the community on Instagram while you wait!</p>
                <a
                  href="https://instagram.com/coupleslaunchpad"
                  target="_blank"
                  onClick={() => setHasClickedIG(true)}
                  className={`font-bold underline text-sm transition-colors ${hasClickedIG ? 'text-green-400' : 'text-pink-400 hover:text-pink-300'}`}
                >
                  {hasClickedIG ? '✅ Link Clicked! Thank you.' : 'Click here to follow @coupleslaunchpad'}
                </a>
                <input name="instagram_handle" placeholder="Your Instagram Handle (@name)" onChange={handleChange} className="w-full mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
          </div>
        )}

        {/* --- STEP 2: SPOUSE --- */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white">Marriage Readiness</h2>
            <div className="space-y-4">
                <label className="block text-sm text-slate-300">When is the Big Day?</label>
                <input name="wedding_date" type="date" onChange={handleChange} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />

                <div className="space-y-2">
                    <p className="text-sm text-slate-300">Has your partner registered yet?</p>
                    <select name="partner_registered" onChange={handleChange} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white [&>option]:text-black focus:ring-2 focus:ring-pink-500 outline-none">
                        <option value="No">No, they are about to!</option>
                        <option value="Yes">Yes, they have registered.</option>
                    </select>
                </div>

                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-sm text-amber-200">
                    NOTE: It takes two to build! Ensure your spouse registers immediately after you.
                </div>

                <input name="spouse_name" placeholder="Spouse's Full Name" onChange={handleChange} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
                <input name="spouse_whatsapp" placeholder="Spouse's WhatsApp Number" onChange={handleChange} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
          </div>
        )}

        {/* --- STEP 3: COMMITMENT --- */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white">Integrity Check</h2>

            <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                    <input type="checkbox" name="attended_before" onChange={handleChange} className="mt-1 w-5 h-5 accent-pink-500" />
                    <span className="text-sm text-slate-300">I have attended Couples' Launchpad before.</span>
                </label>

                <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                    <input type="checkbox" name="agreed_to_feedback" onChange={handleChange} className="mt-1 w-5 h-5 accent-pink-500" />
                    <span className="text-sm text-slate-300">I agree to provide honest feedback during and after the cohort.</span>
                </label>

                <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                    <input type="checkbox" name="agreed_to_participation" onChange={handleChange} className="mt-1 w-5 h-5 accent-pink-500" />
                    <span className="text-sm text-slate-300">I agree to actively participate in sessions (Tue/Thu 8PM).</span>
                </label>
            </div>
          </div>
        )}

        {/* CUSTOM POPUP NOTIFICATION */}
        <AnimatePresence>
          {showSocialWarning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-0 right-0 mx-auto w-11/12 max-w-sm"
            >
              <div className="bg-slate-900 border border-pink-500/50 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className="bg-pink-500/20 p-2 rounded-full">
                  <AlertCircle className="text-pink-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">One Step Remaining</h4>
                  <p className="text-xs text-slate-300">Please click the link to join our Instagram community first! 💍</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4 relative z-10">
          <button onClick={step === 1 ? onBack : () => setStep(s => s - 1)} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
            <ArrowLeft />
          </button>

          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-900/20"
          >
            {step === 3 ? 'Submit Application' : 'Next Step'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};