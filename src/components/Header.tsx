import { useState } from 'react';
import { 
  Search, 
  Settings,
  Lightbulb,
  BookOpen,
  StickyNote,
  CheckSquare,
  Zap,
  Briefcase
} from 'lucide-react';
import { AppSection } from '../types';

interface HeaderProps {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  setShowSearchModal: (show: boolean) => void;
}

export function Header({ currentSection, setCurrentSection, focusMode, setFocusMode, setShowSearchModal }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'thoughts' as AppSection, label: 'Thoughts', icon: Lightbulb },
    { id: 'journal' as AppSection, label: 'Journal', icon: BookOpen },
    { id: 'notes' as AppSection, label: 'Notes', icon: StickyNote },
    { id: 'todos' as AppSection, label: 'To-Do', icon: CheckSquare },
    { id: 'ideas' as AppSection, label: 'Ideas', icon: Zap },
    { id: 'projects' as AppSection, label: 'Projects', icon: Briefcase }
  ];

  if (focusMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setFocusMode(false)}
          className="p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Clean & Minimal */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Mindnest
            </h1>
          </div>

          {/* Navigation - Clean Tab Design */}
          <div className="hidden md:flex items-center space-x-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentSection(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentSection === id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Right Actions - Minimal */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 text-sm transition-all duration-200"
              />
            </div>

            <button 
              onClick={() => setShowSearchModal(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <Search className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setFocusMode(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-100 py-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentSection(id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  currentSection === id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 