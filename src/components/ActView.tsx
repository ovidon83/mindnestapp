import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought } from '../types';
import { 
  CheckSquare, 
  Circle, 
  CheckCircle2, 
  Edit2, 
  Save, 
  Trash2,
  Archive,
  RotateCcw,
  MoreHorizontal,
  Plus,
  Filter,
  Clock,
  Calendar
} from 'lucide-react';
import NavigationNew from './NavigationNew';

type FilterOption = 'all' | 'active' | 'completed';
type SortOption = 'newest' | 'oldest';

const ActView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    updateThought,
    updateTodoData,
    parkThought,
    unparkThought,
    deleteThought,
    navigateToThoughtId,
    clearNavigateToThought,
  } = useGenieNotesStore();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Get to-do thoughts
  const todoThoughts = useMemo(() => {
    let filtered = thoughts.filter(t => t.potential === 'Do' && !t.isParked);
    
    if (filter === 'active') {
      filtered = filtered.filter(t => !t.todoData?.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.todoData?.completed);
    }
    
    if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filtered;
  }, [thoughts, filter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const all = thoughts.filter(t => t.potential === 'Do' && !t.isParked);
    const active = all.filter(t => !t.todoData?.completed).length;
    const completed = all.filter(t => t.todoData?.completed).length;
    return { total: all.length, active, completed };
  }, [thoughts]);

  // Handle navigation from other views
  useEffect(() => {
    if (navigateToThoughtId) {
      setHighlightedId(navigateToThoughtId);
      setFilter('all'); // Reset filter to show the thought
      clearNavigateToThought();
      
      // Scroll after delay to allow for DOM update
      setTimeout(() => {
        const el = document.querySelector(`[data-thought-id="${navigateToThoughtId}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      
      // Clear highlight after a few seconds
      setTimeout(() => setHighlightedId(null), 3000);
    }
  }, [navigateToThoughtId, clearNavigateToThought]);

  const handleToggleComplete = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    
    const isCompleted = thought.todoData?.completed;
    await updateTodoData(thoughtId, {
      completed: !isCompleted,
      completedAt: !isCompleted ? new Date() : undefined,
    });
  };

  const handleEdit = (thought: Thought) => {
    setEditingId(thought.id);
    setEditingText(thought.originalText);
    setExpandedMenu(null);
  };

  const handleSaveEdit = async () => {
    if (editingId && editingText.trim()) {
      await updateThought(editingId, { originalText: editingText.trim() });
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleArchive = async (thoughtId: string) => {
    await parkThought(thoughtId);
    setExpandedMenu(null);
  };

  const handleDelete = async (thoughtId: string) => {
    if (window.confirm('Delete this to-do?')) {
      await deleteThought(thoughtId);
      setExpandedMenu(null);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationNew
        currentView="act"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Act</h1>
          <p className="text-slate-600">
            {stats.active} active • {stats.completed} completed
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Done ({stats.completed})
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Clock className="w-4 h-4" />
                {sortBy === 'newest' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
        </div>

        {/* To-Do List */}
        {todoThoughts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'completed' ? 'No completed to-dos' : filter === 'active' ? 'All caught up!' : 'No to-dos yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all' ? 'Mark thoughts as "Do" in Thoughts view to add them here.' : ''}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setCurrentView('library')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Go to Thoughts
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {todoThoughts.map((thought) => {
              const isCompleted = thought.todoData?.completed;
              const isEditing = editingId === thought.id;
              const isHighlighted = highlightedId === thought.id;

              return (
                <div
                  key={thought.id}
                  data-thought-id={thought.id}
                  className={`group bg-white rounded-xl border-2 border-dashed transition-all duration-200 ${
                    isCompleted
                      ? 'border-slate-200/60 bg-slate-50/50'
                      : 'border-emerald-200/60 hover:border-emerald-300 hover:shadow-sm'
                  } ${isHighlighted ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(thought.id)}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${
                          isCompleted
                            ? 'text-emerald-600 hover:text-emerald-700'
                            : 'text-slate-400 hover:text-emerald-600'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm leading-relaxed ${
                            isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                          }`}>
                            {thought.originalText}
                          </p>
                        )}

                        {/* Footer */}
                        {!isEditing && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">
                              {formatDate(thought.createdAt)}
                              {isCompleted && thought.todoData?.completedAt && (
                                <span className="ml-2 text-emerald-600">
                                  • Completed {formatDate(thought.todoData.completedAt)}
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(thought)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setExpandedMenu(expandedMenu === thought.id ? null : thought.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {expandedMenu === thought.id && (
                                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                    <button
                                      onClick={() => handleArchive(thought.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Archive className="w-4 h-4" />
                                      Archive
                                    </button>
                                    <button
                                      onClick={() => handleDelete(thought.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {expandedMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setExpandedMenu(null)} />
      )}
    </div>
  );
};

export default ActView;
