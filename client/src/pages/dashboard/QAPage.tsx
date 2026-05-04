import { useState, useEffect } from 'react';
import { MessageCircle, Send, Clock, CheckCircle2, User, ArrowLeft, Loader2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLMS, postLMS } from '../../lib/api';

interface Question {
  id: string;
  question_text: string;
  answer_text: string | null;
  is_answered: boolean;
  answered_at: string | null;
  created_at: string;
}

export const QAPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProgram = localStorage.getItem('tai_active_program') || '';

  const loadQuestions = async () => {
    try {
      const data = await fetchLMS(`/lms/qa?program=${activeProgram}`);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [activeProgram]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      await postLMS(`/lms/qa?program=${activeProgram}`, { text: newQuestion });
      setNewQuestion('');
      await loadQuestions();
    } catch (err) {
      console.error('Failed to submit question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white tracking-tight">Q&A with Host</h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Have a question for <span className="text-pink-500 font-semibold">Temitope Ayenigba</span>? Ask away and get personal guidance on your journey.
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{questions.length}</div>
            <div className="text-xs text-slate-400">Questions Asked</div>
          </div>
        </div>
      </div>

      {/* Ask Question Section */}
      <div className="bg-[#111827] border border-white/5 rounded-3xl p-1 shadow-2xl overflow-hidden group">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
              <MessageCircle size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Ask a New Question</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What's on your mind? Be as detailed as possible..."
              className="w-full h-32 bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newQuestion.trim()}
                className="flex items-center gap-2 px-8 py-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-600/20 active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {isSubmitting ? 'Sending...' : 'Send to Host'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">Your Conversation</h3>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-pink-500" size={40} />
            <p className="text-slate-500">Loading your questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-600">
              <MessageCircle size={40} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">No questions yet</h4>
              <p className="text-slate-500 max-w-sm mx-auto text-sm">
                Your questions and the host's responses will appear here once you start the conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div 
                key={q.id} 
                className="bg-[#111827] border border-white/5 rounded-3xl p-1 overflow-hidden hover:border-white/10 transition-all"
              >
                <div className="p-6 md:p-8 space-y-6">
                  {/* Question */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                      <User size={18} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">You</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{q.question_text}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  {q.is_answered ? (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 ml-4 md:ml-12 relative group overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-500/20">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-pink-400">Temitope Ayenigba <span className="text-[10px] text-slate-500 ml-1 font-normal">(Host)</span></span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                              {new Date(q.answered_at!).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-relaxed italic">"{q.answer_text}"</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-4 md:ml-12 text-slate-500 text-xs italic bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5">
                      <Loader2 size={12} className="animate-spin" />
                      Awaiting response from host...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
