import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Action } from '../types';
import { CheckCircle, Circle, Trash2, Linkedin, Twitter, Instagram, ArrowLeft } from 'lucide-react';
import Navigation from './Navigation';

type ActionTypeFilter = 'all' | 'post' | 'conversation' | 'project';

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

  const [filter, setFilter] = useState<ActionTypeFilter>('all');

  const getThoughtForAction = (thoughtId: string) => {
    return thoughts.find(t => t.id === thoughtId);
  };

  const filteredActions = useMemo(() => {
    if (filter === 'all') return actions;
    return actions.filter(action => action.type === filter);
  }, [actions, filter]);

  const handleToggleComplete = async (action: Action) => {
    await updateAction(action.id, { completed: !action.completed });
  };

  const renderPostAction = (action: Action) => {
    // Determine platform from content length or type
    const isLinkedIn = action.content.length > 200;
    const isX = action.content.length < 150;
    const isInstagram = !isLinkedIn && !isX;

    if (isLinkedIn) {
      return (
        <div className="bg-white rounded-xl border-2 border-dashed border-blue-300/60 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.user_metadata?.name || 'You'}
                </span>
                <Linkedin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-slate-500">• 2h</span>
              </div>
              <p className="text-xs text-slate-500">Software Engineer</p>
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {action.content}
            </p>
          </div>
          <div className="flex items-center gap-4 pt-3 border-t border-slate-200/50">
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span className="text-xs">24</span>
            </button>
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">8</span>
            </button>
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs">12</span>
            </button>
          </div>
        </div>
      );
    } else if (isX) {
      return (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300/60 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.user_metadata?.name || 'You'}
                </span>
                <Twitter className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                <span className="text-xs text-slate-500">@username • 1h</span>
              </div>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {action.content}
            </p>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50">
            <button className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">5</span>
            </button>
            <button className="flex items-center gap-1 text-slate-500 hover:text-green-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">12</span>
            </button>
            <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs">8</span>
            </button>
          </div>
        </div>
      );
    } else {
      // Instagram
      return (
        <div className="bg-white rounded-xl border-2 border-dashed border-pink-300/60 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-purple-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') || 'you'}
                </span>
                <Instagram className="w-3.5 h-3.5 text-pink-600 flex-shrink-0" />
                <span className="text-xs text-slate-500">• 3h</span>
              </div>
            </div>
          </div>
          <div className="mb-2.5">
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {action.content}
            </p>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50">
            <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs">42</span>
            </button>
            <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">6</span>
            </button>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <Navigation
        currentView="actions"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Actions</h1>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {(['all', 'post', 'conversation', 'project'] as ActionTypeFilter[]).map((actionType) => (
              <button
                key={actionType}
                onClick={() => setFilter(actionType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === actionType
                    ? 'bg-emerald-100/70 text-emerald-700 border border-dashed border-emerald-300/50'
                    : 'bg-white/60 text-slate-600 border border-dashed border-slate-300/50 hover:bg-slate-50/60'
                }`}
              >
                {actionType === 'all' ? 'All' : actionType}
              </button>
            ))}
          </div>
        </div>

        {/* Actions List */}
        {filteredActions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">
              {filter === 'all'
                ? 'No actions yet. Create actions from thoughts with potential.'
                : `No ${filter} actions yet.`}
            </p>
            <button
              onClick={() => setCurrentView('thoughts')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              View Thoughts
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActions.map((action) => {
              const thought = getThoughtForAction(action.thoughtId);
              return (
                <div
                  key={action.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed p-6 transition-colors ${
                    action.completed
                      ? 'border-slate-200/50 bg-slate-50/50'
                      : action.type === 'post'
                      ? 'border-blue-300/60'
                      : action.type === 'conversation'
                      ? 'border-orange-300/60'
                      : 'border-emerald-300/60'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <button
                      onClick={() => handleToggleComplete(action)}
                      className="mt-1 flex-shrink-0"
                    >
                      {action.completed ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-600 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3
                            className={`text-lg font-semibold mb-2 ${
                              action.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}
                          >
                            {action.title}
                          </h3>
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              action.type === 'post'
                                ? 'bg-blue-100/70 text-blue-700 border border-dashed border-blue-300/50'
                                : action.type === 'conversation'
                                ? 'bg-orange-100/70 text-orange-700 border border-dashed border-orange-300/50'
                                : 'bg-emerald-100/70 text-emerald-700 border border-dashed border-emerald-300/50'
                            }`}
                          >
                            {action.type === 'post' ? 'Share' : action.type === 'conversation' ? 'Conversation' : 'To-Do'}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteAction(action.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Render based on action type */}
                      {action.type === 'post' && action.content && (
                        <div className="mb-4">{renderPostAction(action)}</div>
                      )}

                      {action.type === 'conversation' && action.content && (
                        <div className="mb-4 p-4 bg-orange-50/50 rounded-xl border-2 border-dashed border-orange-200/50">
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {action.content}
                          </p>
                        </div>
                      )}

                      {action.type === 'project' && (
                        <div className="mb-4 p-4 bg-emerald-50/50 rounded-xl border-2 border-dashed border-emerald-200/50">
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {action.content || action.title}
                          </p>
                        </div>
                      )}

                      {thought && (
                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                          <p className="text-xs text-slate-500 mb-1">From thought:</p>
                          <p className="text-sm text-slate-700 italic">
                            "{thought.originalText.substring(0, 100)}
                            {thought.originalText.length > 100 ? '...' : ''}"
                          </p>
                          <button
                            onClick={() => setCurrentView('thoughts')}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-700 transition-colors"
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
