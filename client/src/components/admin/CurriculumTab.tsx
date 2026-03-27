import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { supabase } from '../../config';
import { CustomDropdown } from './CustomDropdown';

export const CurriculumTab = () => {
  const [curriculumModules, setCurriculumModules] = useState<any[]>([]);
  const [isInjecting, setIsInjecting] = useState(false);

  const [moduleForm, setModuleForm] = useState({ program_name: '', title: '', sort_order: 1 });
  const [lessonForm, setLessonForm] = useState({ module_id: '', title: '', description: '', video_id: '', estimated_time: '15 mins', assignment_prompt: '', sort_order: 1 });

  const fetchModules = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/admin/modules`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
      if (res.ok) setCurriculumModules(await res.json() || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchModules(); }, []);

  // --- THE FIX: ALWAYS include the base programs, plus any found in the DB ---
  const uniquePrograms = useMemo(() => {
    const basePrograms = ['Ready for a Soulmate', 'launchpad'];
    const dbPrograms = curriculumModules.map(m => m.program_name);

    // Combine them and remove any duplicates
    return Array.from(new Set([...basePrograms, ...dbPrograms]));
  }, [curriculumModules]);

  useEffect(() => {
    if (uniquePrograms.length > 0 && !moduleForm.program_name) {
      setModuleForm(prev => ({ ...prev, program_name: uniquePrograms[0] as string }));
    }
  }, [uniquePrograms]);

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInjecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/admin/modules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...moduleForm, sort_order: Number(moduleForm.sort_order) })
      });
      if (!res.ok) throw new Error("Failed");
      alert("Module created successfully!");
      setModuleForm(prev => ({ ...prev, title: '', sort_order: prev.sort_order + 1 }));
      fetchModules();
    } catch (err) { alert("Error creating module."); } finally { setIsInjecting(false); }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.module_id) return alert("Select a Module first.");
    setIsInjecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/admin/lessons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...lessonForm, sort_order: Number(lessonForm.sort_order) })
      });
      if (!res.ok) throw new Error("Failed");
      alert("Lesson created successfully!");
      setLessonForm(prev => ({ ...prev, title: '', description: '', video_id: '', assignment_prompt: '', sort_order: prev.sort_order + 1 }));
    } catch (err) { alert("Error creating lesson."); } finally { setIsInjecting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Curriculum Manager</h2>
        <p className="text-slate-400">Inject new modules and lessons directly into the database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-300"><PlusCircle size={20} /> Create New Module</h3>
          <form onSubmit={handleModuleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Program</label>
              <CustomDropdown
                value={moduleForm.program_name}
                onChange={(val) => setModuleForm({...moduleForm, program_name: val})}
                options={uniquePrograms.map(p => ({ label: p as string, value: p as string }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Module Title</label>
              <input required type="text" value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort Order</label>
              <input required type="number" min="1" value={moduleForm.sort_order} onChange={e => setModuleForm({...moduleForm, sort_order: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" />
            </div>
            <button type="submit" disabled={isInjecting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-4">{isInjecting ? 'Injecting...' : 'Save Module'}</button>
          </form>
        </div>

        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-pink-400"><PlusCircle size={20} /> Create New Lesson</h3>
          <form onSubmit={handleLessonSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parent Module</label>
              <CustomDropdown value={lessonForm.module_id} onChange={(val) => setLessonForm({...lessonForm, module_id: val})} options={curriculumModules.map(m => ({ label: `[${m.program_name}] ${m.title}`, value: m.id }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lesson Title</label>
              <input required type="text" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">YouTube Video ID</label>
              <input type="text" value={lessonForm.video_id} onChange={e => setLessonForm({...lessonForm, video_id: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Est. Time</label><input required type="text" value={lessonForm.estimated_time} onChange={e => setLessonForm({...lessonForm, estimated_time: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort Order</label><input required type="number" min="1" value={lessonForm.sort_order} onChange={e => setLessonForm({...lessonForm, sort_order: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" /></div>
            </div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label><textarea value={lessonForm.description} onChange={e => setLessonForm({...lessonForm, description: e.target.value})} rows={2} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 resize-none"></textarea></div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assignment Prompt</label><textarea required value={lessonForm.assignment_prompt} onChange={e => setLessonForm({...lessonForm, assignment_prompt: e.target.value})} rows={2} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 resize-none"></textarea></div>
            <button type="submit" disabled={isInjecting} className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-4">{isInjecting ? 'Injecting...' : 'Save Lesson'}</button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};