import { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, User, Loader2, Search } from 'lucide-react';
import { fetchLMS, postLMS } from '../../lib/api';

interface Question {
  id: string;
  user_id: string;
  user_name: string;
  program_name: string;
  question_text: string;
  answer_text: string | null;
  is_answered: boolean;
  answered_at: string | null;
  created_at: string;
}

export const QATab = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('pending');

  const loadQuestions = async () => {
    try {
      const data = await fetchLMS('/admin/qa');
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions for admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleReply = async (questionId: string) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await postLMS('/admin/qa/answer', {
        question_id: questionId,
        answer: replyContent
      });
      setReplyingTo(null);
      setReplyContent('');
      await loadQuestions();
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          (filter === 'pending' && !q.is_answered) || 
                          (filter === 'answered' && q.is_answered);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-3xl p-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Student Q&A</h2>
          <p className="text-slate-400 text-sm mt-1">Manage and respond to student inquiries across all programs.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search students or content..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all w-64"
            />
          </div>
          
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
            {(['all', 'pending', 'answered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  filter === f ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-pink-500" size={40} />
          <p className="text-slate-500">Loading inquiries...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-600">
            <MessageSquare size={32} />
          </div>
          <p className="text-slate-500">No questions found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredQuestions.map((q) => (
            <div 
              key={q.id} 
              className={`bg-[#0a0a16] border rounded-3xl overflow-hidden transition-all duration-300 ${
                q.is_answered ? 'border-white/5 opacity-80' : 'border-pink-500/30 shadow-[0_0_20px_rgba(219,39,119,0.05)]'
              }`}
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/10">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{q.user_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/5 rounded text-slate-500">
                          {q.program_name === 'launchpad' ? 'CLP 5.0' : 'RFASM'}
                        </span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                          <Clock size={10} />
                          {new Date(q.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!q.is_answered && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      PENDING REPLY
                    </div>
                  )}
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                  <p className="text-slate-300 leading-relaxed italic">"{q.question_text}"</p>
                </div>

                {q.is_answered ? (
                  <div className="flex gap-4 border-t border-white/5 pt-6">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Host Response</span>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {new Date(q.answered_at!).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">{q.answer_text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border-t border-white/5 pt-6">
                    {replyingTo === q.id ? (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <textarea
                          autoFocus
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Type your thoughtful response here..."
                          className="w-full h-32 bg-black/40 border border-pink-500/30 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-pink-500 transition-all resize-none shadow-inner"
                        />
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                            className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReply(q.id)}
                            disabled={isSubmitting || !replyContent.trim()}
                            className="flex items-center gap-2 px-8 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            {isSubmitting ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setReplyingTo(q.id)}
                        className="w-full py-3 border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-pink-400 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                      >
                        <MessageSquare size={16} className="group-hover:scale-110 transition-transform" />
                        Reply to Student
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
