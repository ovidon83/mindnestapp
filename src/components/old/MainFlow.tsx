import React, { useState } from 'react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';
import { Sparkles, Inbox, Lightbulb, Heart, Calendar, CheckCircle, Trash2 } from 'lucide-react';

// Section types for the main flow
const SECTIONS = ['today', 'act', 'reflect', 'create', 'inbox', 'categories', 'cleanup'] as const;
type SectionType = typeof SECTIONS[number];

export const MainFlow: React.FC = () => {
  const [section, setSection] = useState<SectionType>('today');
  const [thoughtInput, setThoughtInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiNextSteps, setAiNextSteps] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState('');
  const { thoughts, addThought, updateThought, deleteThought } = useMindnestStore();

  // Helper: Get today's date string
  const todayStr = new Date().toDateString();

  // Helper: Categorize thoughts for views
  const categorized = {
    task: thoughts.filter(t => t.metadata?.category === 'task'),
    emotion: thoughts.filter(t => t.metadata?.category === 'emotion'),
    idea: thoughts.filter(t => t.metadata?.category === 'idea'),
    reminder: thoughts.filter(t => t.metadata?.category === 'reminder'),
    reflection: thoughts.filter(t => t.metadata?.category === 'reflection'),
  };

  // Helper: Thoughts for Today (priority, due, urgent, etc.)
  const todayThoughts = thoughts.filter(t => {
    const due = t.metadata?.dueDate ? new Date(t.metadata.dueDate).toDateString() : null;
    return (
      t.status === 'To Do' ||
      due === todayStr ||
      t.priority === 'high' ||
      (t.tags && t.tags.some(tag => ['today', 'urgent'].includes(tag.toLowerCase())))
    );
  });

  // Helper: Inbox (unreviewed)
  const inboxThoughts = thoughts.filter(t => t.status === 'To Do');

  // Helper: Mental Cleanup (thoughts from yesterday, last week, etc.)
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const yesterdayThoughts = thoughts.filter(t => new Date(t.timestamp).toDateString() === yesterday);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekThoughts = thoughts.filter(t => new Date(t.timestamp) < weekAgo);

  // Handle new thought submission
  const handleThoughtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtInput.trim()) return;
    setIsProcessing(true);
    setConfirmation('');
    setAiNextSteps([]);
    try {
      const result = await AIService.analyzeThought(thoughtInput);
      if (result.success && result.data) {
        const aiData = result.data as any;
        setAiNextSteps(Array.isArray(aiData.nextSteps) ? aiData.nextSteps : []);
        addThought({
          content: thoughtInput,
          type: 'random',
          tags: aiData.tags || [],
          metadata: {
            category: aiData.category || 'idea',
            label: aiData.label || 'personal',
            priority: aiData.priority || 'medium',
            dueDate: aiData.dueDate ? new Date(aiData.dueDate) : undefined,
            linkedThoughts: aiData.linkedThoughts || [],
            status: 'new',
            aiInsights: aiData.insight,
            mood: aiData.mood,
          },
        });
        setConfirmation('Got it. I’ll take it from here.');
        setThoughtInput('');
      }
    } catch {
      setConfirmation('Thought captured. (AI unavailable)');
      setThoughtInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Section renderers
  const renderToday = () => (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Today</h1>
      <p className="mb-4 text-gray-600">Your priority thoughts for the day</p>
      <div className="space-y-2 mb-6">
        {todayThoughts.length === 0 ? (
          <div className="text-gray-400 text-center">No priority thoughts for today</div>
        ) : (
          todayThoughts.map(t => (
            <div key={t.id} className="bg-white rounded-lg border p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-medium text-blue-700 mr-2">{t.metadata?.category}</span>
                <span className="text-gray-800">{t.content}</span>
              </div>
              <button onClick={() => updateThought(t.id, { status: 'Done' })} className="text-green-600 hover:text-green-800"><CheckCircle size={18} /></button>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 bg-blue-100 text-blue-700 rounded-lg py-2" onClick={() => setSection('act')}>Act</button>
        <button className="flex-1 bg-purple-100 text-purple-700 rounded-lg py-2" onClick={() => setSection('reflect')}>Reflect</button>
        <button className="flex-1 bg-green-100 text-green-700 rounded-lg py-2" onClick={() => setSection('create')}>Create</button>
      </div>
    </div>
  );

  const renderThoughtEntry = () => (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2">What's on your mind?</h2>
      <form onSubmit={handleThoughtSubmit} className="mb-4">
        <textarea
          value={thoughtInput}
          onChange={e => setThoughtInput(e.target.value)}
          className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Type anything..."
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!thoughtInput.trim() || isProcessing}
          className="mt-2 w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >{isProcessing ? 'Processing...' : 'Add Thought'}</button>
      </form>
      {confirmation && <div className="text-green-700 mb-2">{confirmation}</div>}
      {aiNextSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2 mb-1"><Sparkles size={16} className="text-blue-600" /><span className="font-medium">Next Steps</span></div>
          <ul className="list-disc pl-6 text-blue-800 text-sm">
            {aiNextSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}
    </div>
  );

  const renderInbox = () => (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Inbox size={20}/> Thought Inbox</h2>
      <p className="mb-4 text-gray-600">All new, unreviewed thoughts land here.</p>
      <div className="space-y-2">
        {inboxThoughts.length === 0 ? (
          <div className="text-gray-400 text-center">Inbox is empty</div>
        ) : (
          inboxThoughts.map(t => (
            <div key={t.id} className="bg-white rounded-lg border p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-medium text-blue-700 mr-2">{t.metadata?.category}</span>
                <span className="text-gray-800">{t.content}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateThought(t.id, { status: 'Done' })} className="text-green-600 hover:text-green-800"><CheckCircle size={18} /></button>
                <button onClick={() => deleteThought(t.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Lightbulb size={20}/> Categories</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(categorized).map(([cat, arr]) => (
          <button key={cat} className="bg-gray-100 rounded-full px-4 py-1 text-sm font-medium" onClick={() => setSection(cat as SectionType)}>{cat} ({arr.length})</button>
        ))}
      </div>
      <div className="space-y-2">
        {Object.entries(categorized).map(([cat, arr]) => arr.length > 0 && (
          <div key={cat} className="mb-4">
            <div className="font-semibold text-blue-700 mb-1 capitalize">{cat}</div>
            {arr.map(t => (
              <div key={t.id} className="bg-white rounded-lg border p-4 flex items-center justify-between shadow-sm mb-1">
                <span className="text-gray-800">{t.content}</span>
                <span className="text-xs text-gray-500 ml-2">{new Date(t.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCleanup = () => (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Calendar size={20}/> Mental Cleanup</h2>
      <div className="mb-4">
        <div className="font-medium text-gray-700 mb-1">Yesterday's Thoughts</div>
        {yesterdayThoughts.length === 0 ? <div className="text-gray-400">None</div> : yesterdayThoughts.map(t => (
          <div key={t.id} className="bg-white rounded-lg border p-3 mb-1 flex items-center justify-between">
            <span className="text-gray-800">{t.content}</span>
            <button onClick={() => updateThought(t.id, { status: 'Done' })} className="text-green-600 hover:text-green-800"><CheckCircle size={16} /></button>
          </div>
        ))}
      </div>
      <div>
        <div className="font-medium text-gray-700 mb-1">Older Thoughts</div>
        {weekThoughts.length === 0 ? <div className="text-gray-400">None</div> : weekThoughts.map(t => (
          <div key={t.id} className="bg-white rounded-lg border p-3 mb-1 flex items-center justify-between">
            <span className="text-gray-800">{t.content}</span>
            <button onClick={() => updateThought(t.id, { status: 'Done' })} className="text-gray-400 hover:text-gray-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // Section navigation (bottom nav for mobile, side for desktop)
  const navItems = [
    { id: 'today', label: 'Today', icon: <Calendar size={20}/> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={20}/> },
    { id: 'categories', label: 'Categories', icon: <Lightbulb size={20}/> },
    { id: 'cleanup', label: 'Cleanup', icon: <Heart size={20}/> },
    { id: 'create', label: 'Create', icon: <Sparkles size={20}/> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1">
        {section === 'today' && renderToday()}
        {section === 'create' && renderThoughtEntry()}
        {section === 'inbox' && renderInbox()}
        {section === 'categories' && renderCategories()}
        {section === 'cleanup' && renderCleanup()}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10 md:static md:border-t-0 md:bg-transparent md:justify-center md:py-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id as SectionType)}
            className={`flex flex-col items-center px-2 py-1 text-xs font-medium transition-colors ${section === item.id ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}; 