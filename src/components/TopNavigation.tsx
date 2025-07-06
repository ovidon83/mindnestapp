import React from 'react';
import { 
  Brain, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  FolderOpen, 
  Lightbulb,
  Search,
  Settings,
  X,
  Menu
} from 'lucide-react';

import { AppSection } from '../types';

interface TopNavigationProps {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  setShowSearchModal: (show: boolean) => void;
}

const navItems: { id: AppSection; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'thoughts', label: 'Thoughts', icon: Brain },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'todos', label: 'To-Do', icon: CheckSquare },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
];

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentSection,
  setCurrentSection,
  focusMode,
  setFocusMode,
  setShowSearchModal
}) => {
  if (focusMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setFocusMode(false)}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 hover:bg-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Mindnest
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentSection(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentSection === id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search size={20} />
            </button>
            
            <button
              onClick={() => setFocusMode(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentSection(id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    currentSection === id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 