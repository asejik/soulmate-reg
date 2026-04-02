import { Heart, MessageCircle, Phone, Mail, Instagram, CheckCircle2, Smartphone, Video, Palette, Mic, Calendar, Users } from 'lucide-react';

export const VolunteerPage = () => {
  const roles = [
    { title: "Social Media Creators", icon: Smartphone, color: "text-pink-400", bg: "bg-pink-500/10" },
    { title: "Video Editors", icon: Video, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Graphic Designers", icon: Palette, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { title: "Audio Editors", icon: Mic, color: "text-purple-400", bg: "bg-purple-500/10" },
    { title: "Content Planners", icon: Calendar, color: "text-orange-400", bg: "bg-orange-500/10" },
    { title: "Prayer Team", icon: Heart, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      
      {/* Header Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
          <Users size={14} /> Join the Workforce
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Your Creativity Can <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 text-glow">Help Heal Lives</span>
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          At Temitope Ayenigba Initiative (TAi), our mission is to help people heal and become all they are meant to be in love and in life. We believe your gift has a place in this work.
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role, idx) => (
          <div key={idx} className="group bg-[#111827] border border-white/5 rounded-3xl p-6 hover:border-white/10 hover:bg-white/[0.02] transition-all shadow-xl">
            <div className={`w-12 h-12 ${role.bg} ${role.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <role.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{role.title}</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
               <CheckCircle2 size={14} className="text-blue-500" /> Open Position
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -ml-32 -mb-32 rounded-full" />
        
        <div className="space-y-4 relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Restoring Hearts Together</h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base">
            Are you creative and passionate about people? Do you find joy in helping others grow, heal, and become whole? Join our volunteer team today.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 relative z-10">
          {/* WhatsApp Button */}
          <a 
            href="https://chat.whatsapp.com/CzH2JBcFsnU03WVeAlx6Wj?mode=gi_t" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-full font-bold text-lg shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle size={24} fill="white" /> Join Volunteer Group
          </a>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 w-full border-t border-white/5">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                <Phone size={18} />
              </div>
              <span className="text-sm font-medium text-slate-300">08038573781</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors text-ellipsis overflow-hidden">
                <Mail size={18} />
              </div>
              <span className="text-sm font-medium text-slate-300 break-all">temitopeayenigbainnitiative@gmail.com</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                <Instagram size={18} />
              </div>
              <span className="text-sm font-medium text-slate-300">@temitopeayenigbainnitiative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};