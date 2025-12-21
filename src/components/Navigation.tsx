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
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Brain - more prominent and refined */}
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400 relative z-10 group-hover:text-teal-300 transition-colors duration-300" strokeWidth={2} fill="none" />
              
              {/* Refined sparkles - fewer, more strategic placement */}
              <Sparkles className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-400 opacity-60 group-hover:opacity-90 transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
              <Sparkles className="absolute bottom-1 left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 text-teal-300 opacity-50 group-hover:opacity-80 transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
              
              {/* Subtle outer ring on hover */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-teal-500/0 group-hover:ring-teal-500/20 transition-all duration-300"></div>
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
                indigo: isActive ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50',
                blue: isActive ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50',
                slate: isActive ? 'bg-stone-50 text-slate-700 border border-stone-200' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50',
                purple: isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50',
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
              className="px-4 py-2 text-sm font-medium bg-stone-50 text-slate-700 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors duration-200 flex items-center gap-2 min-h-[40px]"
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

