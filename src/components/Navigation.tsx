import React from 'react';
import { Brain, Plus, Sparkles, Share2, ListTodo, ParkingCircle, BarChart3 } from 'lucide-react';
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
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" strokeWidth={2.5} fill="white" fillOpacity="0.3" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Thouty</span>
          </div>

          {/* Center: Thoughts | Share | Do | Insights */}
          <div className="hidden md:flex items-center gap-0">
            <button
              onClick={() => onViewChange('thoughts')}
              className={`px-5 py-2.5 rounded-l-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                currentView === 'thoughts' || currentView === 'home'
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 shadow-md border-2 border-orange-200'
                  : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              <Brain className={`w-4 h-4 ${currentView === 'thoughts' || currentView === 'home' ? 'text-orange-600' : ''}`} />
              Thoughts
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button
              onClick={() => onViewChange('shareit')}
              className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                currentView === 'shareit'
                  ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-rose-700 shadow-md border-2 border-rose-200'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
              }`}
            >
              <Share2 className={`w-4 h-4 ${currentView === 'shareit' ? 'text-rose-600' : ''}`} />
              Share
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button
              onClick={() => onViewChange('todo')}
              className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                currentView === 'todo'
                  ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 shadow-md border-2 border-teal-200'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50/50'
              }`}
            >
              <ListTodo className={`w-4 h-4 ${currentView === 'todo' ? 'text-teal-600' : ''}`} />
              Do
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button
              onClick={() => onViewChange('park')}
              className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                currentView === 'park'
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 shadow-md border-2 border-orange-200'
                  : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              <ParkingCircle className={`w-4 h-4 ${currentView === 'park' ? 'text-orange-600' : ''}`} />
              Park
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button
              onClick={() => onViewChange('insights')}
              className={`px-5 py-2.5 rounded-r-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                currentView === 'insights' || currentView === 'explore'
                  ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-purple-700 shadow-md border-2 border-purple-200'
                  : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${currentView === 'insights' || currentView === 'explore' ? 'text-purple-600' : ''}`} />
              Insights
            </button>
          </div>

          {/* Right Side Actions - New Thought */}
          <div className="flex items-center gap-2">
            {/* New Thought Button */}
            <button
              onClick={onCaptureClick || (() => onViewChange('capture'))}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Thought</span>
            </button>
            <UserAvatar user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
