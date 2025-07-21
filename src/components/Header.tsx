import React from 'react';
import { 
  Search, 
  Settings,
  Bell
} from 'lucide-react';

export interface HeaderProps {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  setShowSearchModal: () => void;
  extraTabs?: Array<{ id: string; label: string; icon?: string }>;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentSection,
  setCurrentSection,
  focusMode,
  setFocusMode,
  setShowSearchModal,
  extraTabs = [],
}) => {
  const tabs = [
    { id: 'thoughts', label: 'Thoughts', icon: '🧠' },
    { id: 'journal', label: 'Journal', icon: '📝' },
    { id: 'todos', label: 'To-Do', icon: '✅' },
    ...extraTabs,
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
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                GenieNotes
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentSection(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentSection === tab.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={setShowSearchModal}
              className="p-2 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <Search size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors">             <Bell size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors">         <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentSection(tab.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentSection === tab.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}; 