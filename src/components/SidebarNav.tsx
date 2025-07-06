import React from 'react';
import { 
  Brain, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  FolderOpen, 
  Search,
  Settings,
  X
} from 'lucide-react';

type AppSection = 'thoughts' | 'journal' | 'notes' | 'todos' | 'projects';

interface SidebarNavProps {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setShowSearchModal: (show: boolean) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
}

const navItems: { id: AppSection; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'thoughts', label: 'Thoughts', icon: Brain },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'todos', label: 'To-Do', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentSection,
  setCurrentSection,
  sidebarOpen,
  setSidebarOpen,
  setShowSearchModal,
  focusMode,
  setFocusMode
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
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full bg-white/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Mindnest
            </h1>
            <p className="text-sm text-gray-500 mt-1">Your personal space</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setCurrentSection(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      currentSection === id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Search size={20} />
              <span className="font-medium">Search</span>
            </button>
            
            <button
              onClick={() => setFocusMode(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Settings size={20} />
              <span className="font-medium">Focus Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-gray-200/50 p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <div className="w-6 h-0.5 bg-current"></div>
            <div className="w-6 h-0.5 bg-current"></div>
            <div className="w-6 h-0.5 bg-current"></div>
          </div>
          <span className="font-medium">Menu</span>
        </button>
      </div>
    </>
  );
}; 