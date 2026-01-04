import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Bell, Clock, Calendar, Brain, Sparkles, CheckCircle } from 'lucide-react';
import Navigation from './Navigation';

type ReviewFrequency = 'daily' | 'weekly';

const MindReview: React.FC = () => {
  const {
    thoughts,
    actions,
    loading,
    user,
    signOut,
    setCurrentView,
  } = useGenieNotesStore();

  const [frequency, setFrequency] = useState<ReviewFrequency>('daily');
  const [dismissedNudge, setDismissedNudge] = useState(false);

  // Calculate stats based on frequency
  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (frequency === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      // Weekly - last 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const recentThoughts = thoughts.filter(
      thought => new Date(thought.createdAt) >= startDate
    );
    const recentActions = actions.filter(
      action => new Date(action.createdAt) >= startDate
    );

    return {
      total: recentThoughts.length,
      sparks: recentThoughts.filter(t => t.isSpark).length,
      actions: recentActions.length,
      completed: recentActions.filter(a => a.completed).length,
    };
  }, [thoughts, actions, frequency]);

  const shouldShowNudge = !dismissedNudge && stats.total > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/20">
      <Navigation
        currentView="review"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Review Frequency Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFrequency('daily')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                frequency === 'daily'
                  ? 'bg-purple-100/70 text-purple-700 border-dashed border-purple-300/50'
                  : 'bg-white/60 text-slate-600 border-dashed border-slate-300/50 hover:bg-slate-50/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Daily</span>
            </button>
            <button
              onClick={() => setFrequency('weekly')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                frequency === 'weekly'
                  ? 'bg-purple-100/70 text-purple-700 border-dashed border-purple-300/50'
                  : 'bg-white/60 text-slate-600 border-dashed border-slate-300/50 hover:bg-slate-50/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Weekly</span>
            </button>
          </div>
        </div>

        {/* Gentle Nudge Card */}
        {shouldShowNudge && (
          <div className="mb-6 bg-gradient-to-br from-purple-50/80 to-pink-50/60 rounded-xl border-2 border-dashed border-purple-300/60 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-200/70 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-purple-700" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-800 mb-1">
                  Time for a quick review?
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  You have {stats.total} new thought{stats.total !== 1 ? 's' : ''} this{' '}
                  {frequency === 'daily' ? 'day' : 'week'}. Take{' '}
                  {frequency === 'daily' ? '2' : '5'} minutes to review and organize them.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentView('home');
                      setDismissedNudge(true);
                    }}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                  >
                    Review Now
                  </button>
                  <button
                    onClick={() => setDismissedNudge(true)}
                    className="px-3 py-1.5 bg-white/60 text-slate-600 rounded-lg text-xs font-medium border border-dashed border-slate-300/50 hover:bg-slate-50/60 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 rounded-lg p-4 border border-dashed border-amber-300/50 text-center">
            <div className="text-2xl font-bold text-amber-700 mb-1">{stats.sparks}</div>
            <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Sparks
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-4 border border-dashed border-emerald-300/50 text-center">
            <div className="text-2xl font-bold text-emerald-700 mb-1">{stats.actions}</div>
            <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Actions
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-4 border border-dashed border-blue-300/50 text-center">
            <div className="text-2xl font-bold text-blue-700 mb-1">{stats.completed}</div>
            <div className="text-xs text-slate-600">Completed</div>
          </div>
          <div className="bg-white/60 rounded-lg p-4 border border-dashed border-purple-300/50 text-center">
            <div className="text-2xl font-bold text-purple-700 mb-1">{stats.total}</div>
            <div className="text-xs text-slate-600">Total</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-slate-300/50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="p-4 bg-purple-50/50 rounded-lg border border-dashed border-purple-300/50 hover:bg-purple-100/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-slate-900">Review Thoughts</span>
              </div>
              <p className="text-xs text-slate-600">
                Organize and act on your thoughts
              </p>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="p-4 bg-emerald-50/50 rounded-lg border border-dashed border-emerald-300/50 hover:bg-emerald-100/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-900">View Actions</span>
              </div>
              <p className="text-xs text-slate-600">
                See all your completed and pending actions
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindReview;

