import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Plus, Trash2, CalendarHeart } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Category {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'venue',
    title: 'Venue & Logistics',
    items: [
      { id: 'v1', text: 'Book Reception Venue', completed: false },
      { id: 'v2', text: 'Secure Church/Ceremony Location', completed: false },
      { id: 'v3', text: 'Pay initial deposits', completed: false },
    ]
  },
  {
    id: 'attire',
    title: 'Attire & Grooming',
    items: [
      { id: 'a1', text: 'Purchase Wedding Dress', completed: false },
      { id: 'a2', text: 'Purchase Groom\'s Suit', completed: false },
      { id: 'a3', text: 'Book Makeup Artist', completed: false },
    ]
  },
  {
    id: 'vendors',
    title: 'Vendors & Media',
    items: [
      { id: 'vd1', text: 'Hire Photographer/Videographer', completed: false },
      { id: 'vd2', text: 'Book Caterer & Finalize Menu', completed: false },
      { id: 'vd3', text: 'Hire DJ/Band', completed: false },
    ]
  }
];

export const InteractiveChecklistPage = () => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('clp_wedding_checklist');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [newItemText, setNewItemText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    localStorage.setItem('clp_wedding_checklist', JSON.stringify(categories));
  }, [categories]);

  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
        };
      }
      return cat;
    }));
  };

  const addItem = (categoryId: string) => {
    const text = newItemText[categoryId];
    if (!text || text.trim() === '') return;

    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: [...cat.items, { id: Math.random().toString(), text, completed: false }]
        };
      }
      return cat;
    }));

    setNewItemText({ ...newItemText, [categoryId]: '' });
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
      }
      return cat;
    }));
  };

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedItems = categories.reduce((acc, cat) => acc + cat.items.filter(i => i.completed).length, 0);
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CalendarHeart className="text-pink-400" size={32} />
              <h1 className="text-3xl font-bold text-white tracking-tight">The Master Checklist</h1>
            </div>
            <p className="text-pink-200/80">Plan your perfect day, together. Tick off what's done, add what's missing.</p>
          </div>
          
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 w-full md:w-64 backdrop-blur-md shrink-0">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-300">Overall Progress</span>
              <span className="text-2xl font-bold text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="mt-3 text-xs text-slate-400 text-center">
              {completedItems} of {totalItems} tasks completed
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const catCompleted = category.items.filter(i => i.completed).length;
          const catTotal = category.items.length;
          const isAllDone = catTotal > 0 && catCompleted === catTotal;

          return (
            <motion.div 
              key={category.id}
              layout
              className={`bg-[#111827] border rounded-2xl p-6 transition-colors duration-500 ${isAllDone ? 'border-green-500/30 bg-green-900/5' : 'border-white/5'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {category.title}
                  {isAllDone && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Complete</motion.span>}
                </h2>
                <span className="text-sm font-medium text-slate-400">{catCompleted} / {catTotal}</span>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {category.items.map(item => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-center justify-between group p-4 rounded-xl border transition-all ${item.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                    >
                      <button 
                        onClick={() => toggleItem(category.id, item.id)}
                        className="flex items-center gap-4 flex-1 text-left"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="text-green-500 shrink-0" size={24} />
                        ) : (
                          <Circle className="text-slate-600 group-hover:text-pink-400 transition-colors shrink-0" size={24} />
                        )}
                        <span className={`text-sm font-medium transition-colors ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {item.text}
                        </span>
                      </button>
                      <button 
                        onClick={() => deleteItem(category.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add New Item */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); addItem(category.id); }}
                  className="flex items-center gap-3 pt-3"
                >
                  <input 
                    type="text"
                    value={newItemText[category.id] || ''}
                    onChange={(e) => setNewItemText({ ...newItemText, [category.id]: e.target.value })}
                    placeholder="Add a new task..."
                    className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!newItemText[category.id]}
                    className="p-3 bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </form>

              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
