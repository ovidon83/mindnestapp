import React, { useState } from 'react';
import { Edit2, Trash2, Check, CalendarPlus, Clock, Home, Target, Lightbulb, BookOpen, MessageCircle } from 'lucide-react';
import { useMindnestStore, Thought, TodoItem } from '../store';

interface UnifiedItem {
  id: string;
  kind: 'thought' | 'todo';
  data: Thought | TodoItem;
  date: Date;
}

export const HomeView: React.FC = () => {
  const {
    thoughts,
    todos,
    updateThought,
    deleteThought,
    updateTodo,
    deleteTodo,
    setActiveView,
  } = useMindnestStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Build unified list
  const items: UnifiedItem[] = [
    ...thoughts.map(t => ({ id: t.id, kind: 'thought' as const, data: t, date: t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp) })),
    ...todos.map(t => ({ id: t.id, kind: 'todo' as const, data: t, date: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt) }))
  ].sort((a,b) => b.date.getTime() - a.date.getTime());

  // Group by category
  const today = new Date();
  const todayItems = items.filter(item => {
    const itemDate = item.date;
    return itemDate.toDateString() === today.toDateString();
  });

  const taskItems = items.filter(item => 
    item.kind === 'todo' || 
    (item.kind === 'thought' && (item.data as Thought).type === 'todo')
  );

  const ideaItems = items.filter(item => 
    (item.data as Thought).type === 'idea'
  );

  const journalItems = items.filter(item => 
    (item.data as Thought).type === 'journal'
  );

  const thoughtItems = items.filter(item => 
    (item.data as Thought).type === 'random'
  );

  const handleEditSave = (item: UnifiedItem) => {
    if (!editContent.trim()) return;
    if (item.kind === 'thought') {
      updateThought(item.id, { content: editContent });
    } else {
      updateTodo(item.id, { content: editContent });
    }
    setEditingId(null);
    setEditContent('');
  };

  const handleNavigateToView = (view: string) => {
    setActiveView(view as any);
  };

  const formatDate = (d: Date) => d.toLocaleString();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'todo': return <Target size={16} className="text-blue-600" />;
      case 'idea': return <Lightbulb size={16} className="text-yellow-600" />;
      case 'journal': return <BookOpen size={16} className="text-green-600" />;
      case 'random': return <MessageCircle size={16} className="text-purple-600" />;
      default: return <MessageCircle size={16} className="text-gray-600" />;
    }
  };

  const renderItem = (item: UnifiedItem, isHighlighted = false) => {
    const content = item.kind === 'thought' ? (item.data as Thought).content : (item.data as TodoItem).content;
    const tags = (item.kind === 'thought' ? (item.data as Thought).tags : (item.data as TodoItem).tags) || [];
    const dueDate = item.kind === 'todo' ? (item.data as TodoItem).dueDate : (item.data as Thought).dueDate;
    const category = item.kind === 'thought' ? (item.data as Thought).type : 'todo';
    
    const baseCls = `bg-white rounded-lg border p-4 flex items-start gap-3 ${isHighlighted ? 'border-indigo-400 shadow-lg' : 'border-gray-200'}`;
    
    return (
      <div className={baseCls} key={item.id}>
        <div className="flex-1">
          {editingId === item.id ? (
            <>
              <textarea
                className="w-full border border-gray-300 rounded p-2 mb-2"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={() => handleEditSave(item)} className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1"><Check size={14}/>Save</button>
                <button onClick={() => {setEditingId(null); setEditContent('');}} className="px-3 py-1 text-sm rounded border">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(category)}
                <p className="text-gray-800 font-medium">{content}</p>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {tags.map((t,i)=>(<span key={i} className="px-2 py-0.5 bg-gray-100 text-xs rounded">#{t}</span>))}
                {dueDate && (<span className="flex items-center text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded"><Clock size={12} className="mr-1" />{new Date(dueDate).toLocaleDateString()}</span>)}
              </div>
              <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
            </>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => {setEditingId(item.id); setEditContent(content);}} className="p-1 text-gray-400 hover:text-gray-600"><Edit2 size={16}/></button>
          {dueDate && (
            <a
              href={`data:text/calendar;charset=utf8,${encodeURIComponent(`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${content}\nDTSTART:${new Date(dueDate).toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nEND:VEVENT\nEND:VCALENDAR`)}`}
              download={`${content.slice(0,20)}.ics`}
              className="p-1 text-gray-400 hover:text-green-600"
              title="Add to Calendar"
            ><CalendarPlus size={16}/></a>) }
          <button onClick={() => {
            if(item.kind==='thought') deleteThought(item.id); else deleteTodo(item.id);
          }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Home className="text-indigo-600" /> Home Dashboard
          </h1>
          <p className="text-gray-600">Your latest captures organized by category</p>
        </header>

        {/* Today Section */}
        {todayItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="text-orange-600" />
                Today ({todayItems.length})
              </h2>
            </div>
            <div className="space-y-3">
              {todayItems.map(item => renderItem(item, true))}
            </div>
          </section>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Target className="text-blue-600" />
                Tasks ({taskItems.length})
              </h2>
              <button 
                onClick={() => handleNavigateToView('todos')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {taskItems.slice(0, 5).map(item => renderItem(item))}
              {taskItems.length === 0 && (
                <p className="text-gray-500 text-sm">No tasks yet</p>
              )}
            </div>
          </section>

          {/* Ideas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb className="text-yellow-600" />
                Ideas ({ideaItems.length})
              </h2>
              <button 
                onClick={() => handleNavigateToView('thoughts')}
                className="text-sm text-yellow-600 hover:text-yellow-800"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {ideaItems.slice(0, 5).map(item => renderItem(item))}
              {ideaItems.length === 0 && (
                <p className="text-gray-500 text-sm">No ideas yet</p>
              )}
            </div>
          </section>

          {/* Journal */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="text-green-600" />
                Journal ({journalItems.length})
              </h2>
              <button 
                onClick={() => handleNavigateToView('journal')}
                className="text-sm text-green-600 hover:text-green-800"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {journalItems.slice(0, 5).map(item => renderItem(item))}
              {journalItems.length === 0 && (
                <p className="text-gray-500 text-sm">No journal entries yet</p>
              )}
            </div>
          </section>

          {/* Random Thoughts */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MessageCircle className="text-purple-600" />
                Thoughts ({thoughtItems.length})
              </h2>
              <button 
                onClick={() => handleNavigateToView('thoughts')}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {thoughtItems.slice(0, 5).map(item => renderItem(item))}
              {thoughtItems.length === 0 && (
                <p className="text-gray-500 text-sm">No thoughts yet</p>
              )}
            </div>
          </section>
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No entries yet. Capture a thought to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
