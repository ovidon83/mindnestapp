import React from 'react';
import { useGenieNotesStore } from '../store';
import { Action } from '../types';
import { CheckCircle, Circle, Trash2, ArrowLeft } from 'lucide-react';
import UserAvatar from './UserAvatar';

const ActionsView: React.FC = () => {
  const { 
    actions, 
    thoughts,
    loading, 
    user, 
    signOut, 
    setCurrentView, 
    updateAction, 
    deleteAction,
  } = useGenieNotesStore();

  const getThoughtForAction = (thoughtId: string) => {
    return thoughts.find(t => t.id === thoughtId);
  };

  const handleToggleComplete = async (action: Action) => {
    await updateAction(action.id, { completed: !action.completed });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('thoughts')}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Actions</h1>
            </div>
            <UserAvatar user={user} onLogout={signOut} />
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">
              No actions yet. Create actions from thoughts with potential.
            </p>
            <button
              onClick={() => setCurrentView('thoughts')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Thoughts
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => {
              const thought = getThoughtForAction(action.thoughtId);
              return (
                <div
                  key={action.id}
                  className={`bg-white rounded-lg border-2 p-6 transition-colors ${
                    action.completed
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleComplete(action)}
                      className="mt-1 flex-shrink-0"
                    >
                      {action.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-blue-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`text-lg font-semibold mb-1 ${
                            action.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}>
                            {action.title}
                          </h3>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {action.type}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteAction(action.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {action.content && (
                        <div className={`mt-3 p-3 bg-slate-50 rounded-lg ${
                          action.completed ? 'opacity-60' : ''
                        }`}>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {action.content}
                          </p>
                        </div>
                      )}
                      
                      {thought && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-1">From thought:</p>
                          <p className="text-sm text-slate-700 italic">
                            "{thought.originalText.substring(0, 100)}
                            {thought.originalText.length > 100 ? '...' : ''}"
                          </p>
                          <button
                            onClick={() => {
                              setCurrentView('thoughts');
                              // Could scroll to thought if needed
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                          >
                            View original thought →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionsView;

