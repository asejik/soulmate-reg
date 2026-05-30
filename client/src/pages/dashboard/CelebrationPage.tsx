import { CalendarHeart, Gift } from 'lucide-react';

export const CelebrationPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Anniversaries Section */}
      <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <CalendarHeart className="text-pink-400" /> Anniversaries
        </h1>
        <p className="text-slate-400">
          This section will soon display upcoming anniversaries, allowing you to celebrate your special moments together.
        </p>
      </div>

      {/* Page Divider */}
      <div className="flex items-center gap-4 py-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="w-2 h-2 rounded-full bg-white/20"></div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Birthdays Section */}
      <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Gift className="text-blue-400" /> Birthdays
        </h1>
        <p className="text-slate-400">
          This section will soon display upcoming birthdays to ensure you never miss a chance to celebrate.
        </p>
      </div>

    </div>
  );
};
