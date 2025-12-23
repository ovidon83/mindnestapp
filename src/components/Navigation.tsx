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
    <nav className="bg-white/60 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200/50">
      <div className="w-full px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 py-3 sm:py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 via-orange-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" strokeWidth={3} fill="white" fillOpacity="0.2" />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/40 via-orange-400/40 to-purple-400/40 rounded-2xl animate-pulse"></div>
              <div className="absolute -inset-1 bg-gradient-to-br from-pink-500/20 via-orange-500/20 to-purple-500/20 rounded-2xl blur-md"></div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-orange-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Thouthy</span>
          </div>
          
          {/* Middle: Navigation tabs - scrollable on mobile, inline on desktop */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide sm:flex-1 sm:flex sm:justify-center sm:gap-1">
            <div className="flex items-center gap-1 min-w-max sm:min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
              const colorClasses = {
                indigo: isActive ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                blue: isActive ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                slate: isActive ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                purple: isActive ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
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
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:via-orange-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 min-h-[40px]"
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

