import React from 'react';
import { Brain, Plus, Sparkles, CheckCircle, Calendar, X, Share2, ListTodo } from 'lucide-react';
import { AppView } from '../types';
import UserAvatar from './UserAvatar';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: any;
  onLogout: () => void;
  onCaptureClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  user,
  onLogout,
  onCaptureClick,
}) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b-2 border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" strokeWidth={2.5} fill="white" fillOpacity="0.3" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Thouthy</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onViewChange('thoughts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'thoughts'
                  ? 'bg-purple-100/70 text-purple-700 border border-dashed border-purple-300/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Thoughts
            </button>
            <button
              onClick={() => onViewChange('shareit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'shareit'
                  ? 'bg-indigo-100/70 text-indigo-700 border border-dashed border-indigo-300/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              To Share
            </button>
            <button
              onClick={() => onViewChange('todo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'todo'
                  ? 'bg-emerald-100/70 text-emerald-700 border border-dashed border-emerald-300/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              To Do
            </button>
            <button
              onClick={() => onViewChange('review')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'review'
                  ? 'bg-pink-100/70 text-pink-700 border border-dashed border-pink-300/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Review
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCaptureClick || (() => onViewChange('capture'))}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Capture</span>
            </button>
            <UserAvatar user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
