import React, { useState } from 'react';
import { Edit2, Trash2, Check, CalendarPlus, Clock, Home, Target, Lightbulb, BookOpen, MessageCircle, Search, Filter, Plus, Eye, MoreHorizontal } from 'lucide-react';
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
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'tasks' | 'ideas' | 'journal' | 'thoughts'>('all');

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

  const formatDate = (d: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'todo': return <Target size={16} className="text-blue-600" />;
      case 'idea': return <Lightbulb size={16} className="text-yellow-600" />;
      case 'journal': return <BookOpen size={16} className="text-green-600" />;
      case 'random': return <MessageCircle size={16} className="text-purple-600" />;
      default: return <MessageCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (item: UnifiedItem) => {
    if (item.kind === 'todo') {
      const todo = item.data as TodoItem;
      if (todo.completed) return 'bg-green-100 text-green-800';
      if (todo.priority === 'high') return 'bg-red-100 text-red-800';
      if (todo.dueDate && new Date(todo.dueDate) < today) return 'bg-orange-100 text-orange-800';
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (item: UnifiedItem) => {
    if (item.kind === 'todo') {
      const todo = item.data as TodoItem;
      if (todo.completed) return 'Completed';
      if (todo.priority === 'high') return 'High Priority';
      if (todo.dueDate && new Date(todo.dueDate) < today) return 'Overdue';
      return 'Active';
    }
    return 'Note';
  };

  const renderItemCard = (item: UnifiedItem, isHighlighted = false) => {
    const content = item.kind === 'thought' ? (item.data as Thought).content : (item.data as TodoItem).content;
    const tags = (item.kind === 'thought' ? (item.data as Thought).tags : (item.data as TodoItem).tags) || [];
    const dueDate = item.kind === 'todo' ? (item.data as TodoItem).dueDate : (item.data as Thought).dueDate;
    const category = item.kind === 'thought' ? (item.data as Thought).type : 'todo';
    
    return (
      <div 
        key={item.id} 
        className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 ${
          isHighlighted ? 'ring-2 ring-indigo-400 shadow-lg' : 'hover:border-gray-300'
        }`}
      >
        {editingId === item.id ? (
          <div className="space-y-3">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              placeholder="Edit content..."
            />
            <div className="flex gap-2">
              <button 
                onClick={() => handleEditSave(item)} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Check size={14} />
                Save
              </button>
              <button 
                onClick={() => {setEditingId(null); setEditContent('');}} 
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header with category icon and status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {getCategoryIcon(category)}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                  {getStatusText(item)}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {setEditingId(item.id); setEditContent(content);}}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => {
                    if(item.kind==='thought') deleteThought(item.id); else deleteTodo(item.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-gray-900 font-medium text-sm leading-relaxed line-clamp-3">
                {content}
              </p>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer with metadata */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(item.date)}
                </span>
                {dueDate && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <CalendarPlus size={12} />
                    {new Date(dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                View Details →
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const filters = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'today', label: 'Today', count: todayItems.length },
    { key: 'tasks', label: 'Tasks', count: taskItems.length },
    { key: 'ideas', label: 'Ideas', count: ideaItems.length },
    { key: 'journal', label: 'Journal', count: journalItems.length },
    { key: 'thoughts', label: 'Thoughts', count: thoughtItems.length },
  ];

  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'today': return todayItems;
      case 'tasks': return taskItems;
      case 'ideas': return ideaItems;
      case 'journal': return journalItems;
      case 'thoughts': return thoughtItems;
      default: return items;
    }
  };

  const filteredItems = getFilteredItems().filter(item =>
    item.kind === 'thought' 
      ? (item.data as Thought).content.toLowerCase().includes(searchQuery.toLowerCase())
      : (item.data as TodoItem).content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Home className="text-indigo-600" size={28} />
                </div>
                Home Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Your thoughts, tasks, and ideas in one place</p>
            </div>
            <button 
              onClick={() => setActiveView('capture')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Capture New
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search thoughts, tasks, ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <div className="flex bg-white border border-gray-300 rounded-xl p-1">
                {filters.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeFilter === key
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                    <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Highlights */}
        {todayItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="text-orange-600" size={20} />
                </div>
                Today's Highlights
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {todayItems.length}
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayItems.slice(0, 6).map(item => renderItemCard(item, true))}
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => renderItemCard(item))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? `No results for "${searchQuery}"` : 'Start capturing your thoughts to see them here'}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setActiveView('capture')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium"
              >
                Capture Your First Thought
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
