import React, { useState } from 'react';
import { useGenieNotesStore } from '../store';
import { Entry } from '../types';
import { CheckCircle2, Circle, Trash2, BarChart3, X, Clock } from 'lucide-react';
import Analytics from './Analytics';

const ToDoView: React.FC = () => {
  const { entries, setCurrentView, deleteEntry, updateEntry, user, signOut, currentView } = useGenieNotesStore();
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filter to only show todos
  const todos = entries.filter(e => e.type === 'todo');
  const completedTodos = todos.filter(t => t.completed);
  const activeTodos = todos.filter(t => !t.completed);

  const handleToggleComplete = async (todo: Entry) => {
    await updateEntry(todo.id, { completed: !todo.completed });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this to-do?')) {
      await deleteEntry(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-1">To-Do</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {activeTodos.length} active • {completedTodos.length} completed
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[44px] flex-shrink-0"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Analytics entries={todos} type="todo" />
        </div>
      )}

      {/* Content */}
      <div className="w-full px-4 sm:px-8 py-4 sm:py-6">
        {todos.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Circle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No to-dos yet</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 px-4">
              Create your first to-do to get started
            </p>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-6 py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium min-h-[44px]"
            >
              Create To-Do
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Active Todos */}
            {activeTodos.length > 0 && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Active</h2>
                <div className="space-y-2">
                  {activeTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className="mt-0.5 flex-shrink-0 text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-900 font-medium mb-1">
                            {todo.originalText}
                          </div>
                          {todo.nextStep && (
                            <div className="text-sm text-emerald-700 mt-2">
                              → {todo.nextStep}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(todo.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Completed</h2>
                <div className="space-y-2">
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 opacity-75"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className="mt-0.5 flex-shrink-0 text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-600 line-through">
                            {todo.originalText}
                          </div>
                          {todo.nextStep && (
                            <div className="text-sm text-slate-400 mt-2 line-through">
                              → {todo.nextStep}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(todo.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToDoView;

