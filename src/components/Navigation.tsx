import React from 'react';
import { AppView } from '../types';
import { Sparkles, Share2, Plus, Inbox, Eye, User, Brain } from 'lucide-react';
import { useGenieNotesStore } from '../store';
import UserAvatar from './UserAvatar';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, signOut } = useGenieNotesStore();
  const navItems = [
    { id: 'mindbox' as AppView, label: 'Mindbox', icon: Inbox, color: 'indigo' },
    { id: 'shareit' as AppView, label: 'Share it', icon: Share2, color: 'blue' },
    { id: 'companion' as AppView, label: 'Companion', icon: Eye, color: 'slate' },
    { id: 'profile' as AppView, label: 'Profile', icon: User, color: 'purple' },
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-slate-200">
      <div className="w-full px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 py-3 sm:py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 group">
              {/* Clean, modern brain icon */}
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} fill="none" />
              {/* Subtle hover glow */}
              <div className="absolute inset-0 rounded-lg bg-emerald-500/0 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Thouthy</span>
          </div>
          
          {/* Middle: Navigation tabs - scrollable on mobile, inline on desktop */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide sm:flex-1 sm:flex sm:justify-center sm:gap-1">
            <div className="flex items-center gap-1 min-w-max sm:min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
              const colorClasses = {
                indigo: isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                blue: isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                slate: isActive ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                purple: isActive ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
              };
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap min-h-[40px] ${colorClasses[item.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: New Thought button and Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => onViewChange('capture')}
              className="px-4 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors duration-200 flex items-center gap-2 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Thought</span>
              <span className="sm:hidden">New</span>
            </button>
            {user && (
              <UserAvatar user={user} onLogout={signOut} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

