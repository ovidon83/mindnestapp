import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought } from '../types';
import { ListTodo, CheckCircle2, Circle, Filter } from 'lucide-react';
import Navigation from './Navigation';

type TodoFilter = 'all' | 'active' | 'completed';

const ToDoView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    updateTodoData,
  } = useGenieNotesStore();

  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Filter thoughts that have To-Do potential (even without spark)
  const todoThoughts = useMemo(() => {
    return thoughts.filter(thought => {
      const potential = thought.potential || thought.bestPotential;
      return potential === 'To-Do';
    });
  }, [thoughts]);

  // Get completion status
  const completedTodos = useMemo(() => {
    const completed: Record<string, boolean> = {};
    todoThoughts.forEach(thought => {
      completed[thought.id] = thought.todoData?.completed || false;
    });
    return completed;
  }, [todoThoughts]);

  const filteredTodos = useMemo(() => {
    if (filter === 'all') return todoThoughts;
    if (filter === 'active') {
      return todoThoughts.filter(thought => !completedTodos[thought.id]);
    }
    return todoThoughts.filter(thought => completedTodos[thought.id]);
  }, [todoThoughts, filter, completedTodos]);

  const selectedThought = useMemo(() => {
    return filteredTodos.find(t => t.id === selectedThoughtId) || filteredTodos[0] || null;
  }, [filteredTodos, selectedThoughtId]);

  const handleToggleComplete = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;

    const newCompleted = !completedTodos[thoughtId];
    await updateTodoData(thoughtId, { 
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : undefined,
    });
  };

  const handleSaveNotes = async (thoughtId: string) => {
    await updateTodoData(thoughtId, { notes: notes[thoughtId] || '' });
  };

  // Auto-select first thought if none selected, or navigate to specific thought
  React.useEffect(() => {
    const navigateToThought = sessionStorage.getItem('navigateToThought');
    if (navigateToThought && filteredTodos.some(t => t.id === navigateToThought)) {
      setSelectedThoughtId(navigateToThought);
      sessionStorage.removeItem('navigateToThought');
    } else if (!selectedThoughtId && filteredTodos.length > 0) {
      setSelectedThoughtId(filteredTodos[0].id);
    }
  }, [filteredTodos, selectedThoughtId]);

  // Load notes for selected thought
  React.useEffect(() => {
    if (selectedThought) {
      setNotes(prev => ({
        ...prev,
        [selectedThought.id]: selectedThought.todoData?.notes || '',
      }));
    }
  }, [selectedThought]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading thoughts...</p>
        </div>
      </div>
    );
  }

  const activeCount = todoThoughts.filter(t => !completedTodos[t.id]).length;
  const completedCount = todoThoughts.filter(t => completedTodos[t.id]).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
      <Navigation
        currentView="todo"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {todoThoughts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <ListTodo className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No to-dos yet</h3>
            <p className="text-slate-500 mb-4">Mark thoughts as "To-Do" in the Thoughts view to see them here.</p>
            <button
              onClick={() => setCurrentView('thoughts')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Thoughts
            </button>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="mb-6 flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm max-w-md">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All ({todoThoughts.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
              {/* Left Column: List of To-Dos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-lg font-semibold text-slate-900">To-Do Items</h2>
                  <p className="text-sm text-slate-600 mt-1">{filteredTodos.length} item{filteredTodos.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                    {filteredTodos.map((thought) => {
                      const isSelected = thought.id === selectedThoughtId;
                      const isCompleted = completedTodos[thought.id];

                      return (
                        <button
                          key={thought.id}
                          onClick={() => setSelectedThoughtId(thought.id)}
                          className={`w-full p-4 text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 border-l-4 border-emerald-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(thought.id);
                              }}
                              className={`mt-0.5 flex-shrink-0 ${
                                isCompleted ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                              } transition-colors`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-relaxed mb-2 ${
                                  isSelected
                                    ? 'text-emerald-900 font-medium'
                                    : isCompleted
                                    ? 'text-slate-500 line-through'
                                    : 'text-slate-800'
                                }`}
                              >
                                {thought.originalText}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {thought.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-lg"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {isCompleted && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                                    Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected To-Do Details */}
              {selectedThought && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        onClick={() => handleToggleComplete(selectedThought.id)}
                        className={`mt-1 flex-shrink-0 ${
                          completedTodos[selectedThought.id]
                            ? 'text-emerald-600'
                            : 'text-slate-400 hover:text-emerald-600'
                        } transition-colors`}
                      >
                        {completedTodos[selectedThought.id] ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {selectedThought.originalText}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedThought.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                          {completedTodos[selectedThought.id] && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={notes[selectedThought.id] || ''}
                          onChange={(e) => setNotes(prev => ({ ...prev, [selectedThought.id]: e.target.value }))}
                          onBlur={() => handleSaveNotes(selectedThought.id)}
                          placeholder="Add notes, context, or details about this to-do..."
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                          rows={8}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Notes are saved automatically when you click away
                        </p>
                      </div>

                      {selectedThought.summary && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-1">Summary</p>
                          <p className="text-sm text-slate-700">{selectedThought.summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ToDoView;
