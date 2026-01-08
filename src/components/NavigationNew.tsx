import React from 'react';
import { Brain, Plus, Sparkles, BookOpen, Send } from 'lucide-react';
import { AppView } from '../types';
import UserAvatar from './UserAvatar';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: any;
  onLogout: () => void;
  onCaptureClick?: () => void;
}

const NavigationNew: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  user,
  onLogout,
  onCaptureClick,
}) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <button 
            onClick={() => onViewChange('library')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
              Thouty
            </span>
          </button>

          {/* Center: Navigation Tabs */}
          <div className="flex items-center bg-slate-100/80 rounded-full p-1">
            <button
              onClick={() => onViewChange('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentView === 'library' || currentView === 'thoughts' || currentView === 'home'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </button>
            <button
              onClick={() => onViewChange('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentView === 'studio' || currentView === 'shareit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Share Studio</span>
            </button>
          </div>

          {/* Right: New Thought + Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCaptureClick || (() => onViewChange('capture'))}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">New Thought</span>
            </button>
            <UserAvatar user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationNew;
