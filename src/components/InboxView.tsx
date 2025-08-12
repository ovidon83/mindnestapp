import React, { useState } from 'react';
import { Edit2, Trash2, Check, CalendarPlus, Clock, ListChecks } from 'lucide-react';
import { useMindnestStore, Thought, TodoItem } from '../store';

interface UnifiedItem {
  id: string;
  kind: 'thought' | 'todo';
  data: Thought | TodoItem;
  date: Date;
}

export const InboxView: React.FC = () => {
  const {
    thoughts,
    todos,
    updateThought,
    deleteThought,
    updateTodo,
    deleteTodo,
  } = useMindnestStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Build unified list
  const items: UnifiedItem[] = [
    ...thoughts.map(t => ({ id: t.id, kind: 'thought' as const, data: t, date: t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp) })),
    ...todos.map(t => ({ id: t.id, kind: 'todo' as const, data: t, date: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt) }))
  ].sort((a,b) => b.date.getTime() - a.date.getTime());

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

  const formatDate = (d: Date) => d.toLocaleString();

  // Highlight first (most recent) item
  const firstId = items.length ? items[0].id : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <ListChecks className="text-indigo-600" /> Inbox
          </h1>
          <p className="text-gray-600">Your latest captures in one place</p>
        </header>

        <div className="space-y-3">
          {items.map(item => {
            const isRecent = item.id === firstId;
            const baseCls = `bg-white rounded-lg border p-4 flex items-start gap-3 ${isRecent ? 'border-indigo-400 shadow-lg' : 'border-gray-200'}`;
            const content = item.kind === 'thought' ? (item.data as Thought).content : (item.data as TodoItem).content;
            const tags = (item.kind === 'thought' ? (item.data as Thought).tags : (item.data as TodoItem).tags) || [];
            const dueDate = item.kind === 'todo' ? (item.data as TodoItem).dueDate : (item.data as Thought).dueDate;
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
                      <p className="text-gray-800 mb-1">{content}</p>
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
          })}

          {items.length === 0 && (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">No entries yet. Capture a thought to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
