import { CalendarHeart } from 'lucide-react';

export const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <CalendarHeart className="text-pink-400" /> Anniversaries & Birthdays
        </h1>
        <p className="text-slate-400">
          This page will soon display your upcoming anniversaries and birthdays, allowing you to celebrate your special moments together.
        </p>
      </div>
    </div>
  );
};
