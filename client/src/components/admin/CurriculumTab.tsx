import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, ChevronRight, ChevronDown, BookOpen, FileVideo,
  Pencil, Trash2, X, AlertTriangle, Layers, Save, RotateCcw,
} from 'lucide-react';
import { supabase, API_BASE_URL } from '../../config';
import { useToast, ToastContainer } from '../shared/Toast';
import { CustomDropdown } from './CustomDropdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  program_name: string;
  title: string;
  sort_order: number;
}

interface Lesson {
  id: string;
  module_id: string;
  module_title: string;
  program_name: string;
  title: string;
  description: string;
  video_id: string;
  estimated_time: string;
  assignment_prompt: string;
  sort_order: number;
  scheduled_start_time?: string;
}

type PanelMode =
  | { type: 'create-module' }
  | { type: 'edit-module'; item: Module }
  | { type: 'create-lesson' }
  | { type: 'edit-lesson'; item: Lesson }
  | { type: 'edit-settings' };

interface DeleteTarget {
  kind: 'module' | 'lesson';
  id: string;
  title: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
}

const PROGRAMS = ['Ready for a Soulmate', 'Couples Launchpad'];

const LABEL: Record<string, string> = {
  'Ready for a Soulmate': 'RFASM',
  'Couples Launchpad': 'CLP',
};

const PILL_COLOR: Record<string, string> = {
  'Ready for a Soulmate': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  'Couples Launchpad': 'bg-pink-500/15 text-pink-300 border-pink-500/20',
};

// ─── Settings Form ────────────────────────────────────────────────────────────

const SettingsForm = ({
  onSave,
}: {
  onSave: () => void;
}) => {
  const { toasts, dismiss, toast } = useToast();
  const [settings, setSettings] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers });
      if (res.ok) setSettings(await res.json());
    };
    fetchSettings();
  }, []);

  const update = async (pName: string, vID: string) => {
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ program_name: pName, mid_checkpoint_video_id: vID })
      });
      if (res.ok) {
        toast.success(`Settings updated for ${pName}`);
        onSave();
      }
    } catch {
      toast.error('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="space-y-6">
        {PROGRAMS.map(p => {
          const s = settings.find(st => st.program_name === p) || { mid_checkpoint_video_id: '' };
          return (
            <div key={p} className="p-4 bg-white/3 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${PILL_COLOR[p]}`}>{p}</span>
              </div>
              <Field label="Mid-Program Checkpoint Video ID">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className={inputCls} 
                    value={s.mid_checkpoint_video_id} 
                    onChange={e => {
                      const ns = [...settings];
                      const idx = ns.findIndex(st => st.program_name === p);
                      if (idx >= 0) ns[idx].mid_checkpoint_video_id = e.target.value;
                      else ns.push({ program_name: p, mid_checkpoint_video_id: e.target.value });
                      setSettings(ns);
                    }}
                    placeholder="YouTube ID (e.g. dQw4w9WgXcQ)"
                  />
                  <button 
                    onClick={() => update(p, s.mid_checkpoint_video_id)}
                    disabled={saving}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </Field>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─── Field component ──────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors';

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

const DeleteModal = ({
  target, onConfirm, onCancel, isLoading,
}: { target: DeleteTarget; onConfirm: () => void; onCancel: () => void; isLoading: boolean }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-400 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Delete {target.kind === 'module' ? 'Module' : 'Lesson'}?</h3>
            <p className="text-slate-400 text-sm mt-1">
              <span className="text-white font-medium">"{target.title}"</span> will be permanently removed.
              {target.kind === 'module' && <span className="text-red-400"> All lessons inside it will also be deleted.</span>}
            </p>
          </div>
          <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-white transition-colors flex-shrink-0"><X size={16} /></button>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ─── Module Form ───────────────────────────────────────────────────────────────

const blankModule = { program_name: PROGRAMS[0], title: '', sort_order: 1 };

const ModuleForm = ({
  initial, modules, onSave, onCancel, mode,
}: {
  initial?: Module;
  modules: Module[];
  onSave: () => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}) => {
  const { toasts, dismiss, toast } = useToast();
  const [form, setForm] = useState(initial
    ? { program_name: initial.program_name, title: initial.title, sort_order: initial.sort_order }
    : { ...blankModule, sort_order: modules.length + 1 });
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await authHeaders();
      const url = mode === 'edit' ? `${API_BASE_URL}/admin/modules?id=${initial!.id}` : `${API_BASE_URL}/admin/modules`;
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(mode === 'edit' ? 'Module updated!' : 'Module created!');
      onSave();
      if (mode === 'create') setForm({ ...blankModule, sort_order: modules.length + 2 });
    } catch {
      toast.error('Failed to save module. Please retry.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <form onSubmit={handle} className="space-y-4">
        <Field label="Program">
          <CustomDropdown
            value={form.program_name}
            onChange={val => setForm({ ...form, program_name: val })}
            options={PROGRAMS.map(p => ({ label: p, value: p }))}
          />
        </Field>
        <Field label="Module Title">
          <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. Module 1: Introduction" />
        </Field>
        <Field label="Sort Order">
          <input required type="number" min={1} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className={inputCls} />
        </Field>
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-colors">
              <RotateCcw size={14} /> Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
            <Save size={14} /> {saving ? 'Saving…' : mode === 'edit' ? 'Update Module' : 'Create Module'}
          </button>
        </div>
      </form>
    </>
  );
};

// ─── Lesson Form ───────────────────────────────────────────────────────────────

const blankLesson = { module_id: '', title: '', description: '', video_id: '', estimated_time: '15 mins', assignment_prompt: '', sort_order: 1, scheduled_start_time: '' };

const LessonForm = ({
  initial, modules, onSave, onCancel, mode,
}: {
  initial?: Lesson;
  modules: Module[];
  onSave: () => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}) => {
  const { toasts, dismiss, toast } = useToast();
  const [form, setForm] = useState(initial
    ? {
        module_id: initial.module_id,
        title: initial.title,
        description: initial.description,
        video_id: initial.video_id,
        estimated_time: initial.estimated_time,
        assignment_prompt: initial.assignment_prompt,
        sort_order: initial.sort_order,
        scheduled_start_time: initial.scheduled_start_time ? new Date(initial.scheduled_start_time).toISOString().slice(0, 16) : ''
      }
    : { ...blankLesson });
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.module_id) { toast.error('Please select a parent module.'); return; }
    setSaving(true);
    try {
      const headers = await authHeaders();
      const url = mode === 'edit' ? `${API_BASE_URL}/admin/lessons?id=${initial!.id}` : `${API_BASE_URL}/admin/lessons`;
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const payload = {
        ...form,
        sort_order: Number(form.sort_order),
        scheduled_start_time: form.scheduled_start_time ? new Date(form.scheduled_start_time).toISOString() : null
      };
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(mode === 'edit' ? 'Lesson updated!' : 'Lesson created!');
      onSave();
      if (mode === 'create') setForm({ ...blankLesson });
    } catch {
      toast.error('Failed to save lesson. Please retry.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <form onSubmit={handle} className="space-y-4">
        <Field label="Parent Module">
          <CustomDropdown
            value={form.module_id}
            onChange={val => setForm({ ...form, module_id: val })}
            options={[
              { label: '— Select a module —', value: '' },
              ...modules.map(m => ({
                label: `[${LABEL[m.program_name] ?? m.program_name}] ${m.title}`,
                value: m.id
              }))
            ]}
          />
        </Field>
        <Field label="Lesson Title">
          <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. Understanding Your Worth" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="YouTube Video ID">
            <input type="text" value={form.video_id} onChange={e => setForm({ ...form, video_id: e.target.value })} className={inputCls} placeholder="e.g. dQw4w9WgXcQ" />
          </Field>
          <Field label="Sort Order">
            <input required type="number" min={1} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Est. Duration">
            <input required type="text" value={form.estimated_time} onChange={e => setForm({ ...form, estimated_time: e.target.value })} className={inputCls} placeholder="30 mins" />
          </Field>
          <Field label="Start Time (Optional)">
            <input type="datetime-local" value={form.scheduled_start_time} onChange={e => setForm({ ...form, scheduled_start_time: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="What will students learn?" />
        </Field>
        <Field label="Assignment Prompt">
          <textarea required value={form.assignment_prompt} onChange={e => setForm({ ...form, assignment_prompt: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="What should they submit after watching?" />
        </Field>
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-colors">
              <RotateCcw size={14} /> Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
            <Save size={14} /> {saving ? 'Saving…' : mode === 'edit' ? 'Update Lesson' : 'Create Lesson'}
          </button>
        </div>
      </form>
    </>
  );
};

// ─── Main CurriculumTab ────────────────────────────────────────────────────────

export const CurriculumTab = () => {
  const { toasts, dismiss, toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<PanelMode>({ type: 'create-module' });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const [mRes, lRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/modules`, { headers }),
        fetch(`${API_BASE_URL}/admin/lessons`, { headers }),
      ]);
      const [mData, lData] = await Promise.all([mRes.json(), lRes.json()]);
      setModules(mData || []);
      setLessons(lData || []);
      // auto-expand all modules on first load
      setExpandedModules(new Set((mData || []).map((m: Module) => m.id)));
    } catch { toast.error('Could not load curriculum data.'); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Group lessons by module_id
  const lessonsByModule = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    lessons.forEach(l => { (map[l.module_id] ??= []).push(l); });
    return map;
  }, [lessons]);

  // Toggle module expand
  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const headers = await authHeaders();
      const endpoint = deleteTarget.kind === 'module' ? 'modules' : 'lessons';
      const res = await fetch(`${API_BASE_URL}/admin/${endpoint}?id=${deleteTarget.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      toast.success(`${deleteTarget.kind === 'module' ? 'Module' : 'Lesson'} deleted.`);
      setDeleteTarget(null);
      // If we were editing the deleted item, reset panel
      setPanel(p => {
        if ((p.type === 'edit-module' && p.item.id === deleteTarget.id) ||
            (p.type === 'edit-lesson' && p.item.id === deleteTarget.id)) {
          return { type: 'create-module' };
        }
        return p;
      });
      fetchAll();
    } catch {
      toast.error('Delete failed. Please try again.');
    } finally { setIsDeleting(false); }
  };

  // Panel title
  const panelTitle: Record<PanelMode['type'], string> = {
    'create-module': 'New Module',
    'edit-module': 'Edit Module',
    'create-lesson': 'New Lesson',
    'edit-lesson': 'Edit Lesson',
    'edit-settings': 'Special Content',
  };

  const panelIcon: Record<PanelMode['type'], React.ReactNode> = {
    'create-module': <Layers size={16} className="text-indigo-400" />,
    'edit-module': <Pencil size={16} className="text-indigo-400" />,
    'create-lesson': <FileVideo size={16} className="text-pink-400" />,
    'edit-lesson': <Pencil size={16} className="text-pink-400" />,
    'edit-settings': <Save size={16} className="text-amber-400" />,
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Curriculum Manager</h2>
            <p className="text-slate-500 text-sm mt-0.5">{modules.length} modules · {lessons.length} lessons</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPanel({ type: 'create-module' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold hover:bg-indigo-600/30 transition-colors"
            >
              <PlusCircle size={15} /> Module
            </button>
            <button
              onClick={() => setPanel({ type: 'create-lesson' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600/20 border border-pink-500/30 text-pink-300 text-sm font-semibold hover:bg-pink-600/30 transition-colors"
            >
              <PlusCircle size={15} /> Lesson
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">

          {/* LEFT: Curriculum Tree */}
          <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
              <BookOpen size={15} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Curriculum Tree</span>
            </div>

            {modules.length === 0 ? (
              <div className="py-16 text-center text-slate-600 text-sm italic">No modules yet. Create one →</div>
            ) : (
              <div className="divide-y divide-white/5">
                {modules.map(mod => {
                  const isExpanded = expandedModules.has(mod.id);
                  const modLessons = lessonsByModule[mod.id] ?? [];
                  const isEditingThis = panel.type === 'edit-module' && panel.item.id === mod.id;

                  return (
                    <div key={mod.id}>
                      {/* Module row */}
                      <div className={`group flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors ${isEditingThis ? 'bg-indigo-500/5' : ''}`}>
                        <button onClick={() => toggleModule(mod.id)} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                        <Layers size={14} className="text-indigo-400 flex-shrink-0" />
                        <span className="flex-1 text-sm font-semibold text-slate-200 truncate">{mod.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PILL_COLOR[mod.program_name] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {LABEL[mod.program_name] ?? mod.program_name}
                        </span>
                        <span className="text-[10px] text-slate-600 w-4 text-right">{modLessons.length}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            onClick={() => setPanel({ type: 'edit-module', item: mod })}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-300 flex items-center justify-center transition-colors"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ kind: 'module', id: mod.id, title: mod.title })}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Lessons */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {modLessons.length === 0 ? (
                              <div className="pl-14 pr-5 py-2.5 text-xs text-slate-600 italic">No lessons yet.</div>
                            ) : modLessons.map(les => {
                              const isEditingLesson = panel.type === 'edit-lesson' && panel.item.id === les.id;
                              return (
                                <div
                                  key={les.id}
                                  className={`group flex items-center gap-3 pl-12 pr-5 py-3 border-t border-white/3 hover:bg-white/2 transition-colors ${isEditingLesson ? 'bg-pink-500/5' : ''}`}
                                >
                                  <FileVideo size={13} className="text-pink-400/70 flex-shrink-0" />
                                  <span className="flex-1 text-sm text-slate-400 truncate">{les.title}</span>
                                  <span className="text-[10px] text-slate-600 hidden sm:block">{les.estimated_time}</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                    <button
                                      onClick={() => setPanel({ type: 'edit-lesson', item: les })}
                                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-pink-500/20 text-slate-500 hover:text-pink-300 flex items-center justify-center transition-colors"
                                    >
                                      <Pencil size={11} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({ kind: 'lesson', id: les.id, title: les.title })}
                                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Form Panel */}
          <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl overflow-hidden sticky top-0">
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
              {panelIcon[panel.type]}
              <span className="text-sm font-bold text-white">{panelTitle[panel.type]}</span>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={panel.type + (panel.type === 'edit-module' || panel.type === 'edit-lesson' ? panel.item.id : '')}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {panel.type === 'create-module' && (
                    <ModuleForm modules={modules} mode="create" onSave={fetchAll} />
                  )}
                  {panel.type === 'edit-module' && (
                    <ModuleForm
                      modules={modules}
                      mode="edit"
                      initial={panel.item}
                      onSave={() => { fetchAll(); setPanel({ type: 'create-module' }); }}
                      onCancel={() => setPanel({ type: 'create-module' })}
                    />
                  )}
                  {panel.type === 'create-lesson' && (
                    <LessonForm modules={modules} mode="create" onSave={fetchAll} />
                  )}
                  {panel.type === 'edit-lesson' && (
                    <LessonForm
                      modules={modules}
                      mode="edit"
                      initial={panel.item}
                      onSave={() => { fetchAll(); setPanel({ type: 'create-lesson' }); }}
                      onCancel={() => setPanel({ type: 'create-lesson' })}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
};