import { useState } from 'react';
import { Sun, Archive, Brain, Target } from 'lucide-react';
import { NowView } from './components/NowView';
import { TodayView } from './components/TodayView';
import { LaterView } from './components/LaterView';
import { UnpackView } from './components/UnpackView';
import { AppView } from './types';

function App() {
  const [activeView, setActiveView] = useState<AppView>('now');

  const views = [
    { 
      key: 'now' as AppView, 
      label: 'Now', 
      icon: Target, 
      color: 'indigo',
      description: 'Focus on one task'
    },
    { 
      key: 'today' as AppView, 
      label: 'Today', 
      icon: Sun, 
      color: 'orange',
      description: 'Plan your day'
    },
    { 
      key: 'later' as AppView, 
      label: 'Later', 
      icon: Archive, 
      color: 'slate',
      description: 'Safe backlog storage'
    },
    { 
      key: 'unpack' as AppView, 
      label: 'Unpack', 
      icon: Brain, 
      color: 'purple',
      description: 'Brain dump & organize'
    },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'now': return <NowView />;
      case 'today': return <TodayView />;
      case 'later': return <LaterView />;
      case 'unpack': return <UnpackView />;
      default: return <NowView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation - Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {views.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeView === key
                  ? `bg-${color}-100 text-${color}-700`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Navigation - Top */}
      <header className="bg-white border-b border-gray-200 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                MindNest ADHD
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex space-x-1">
              {views.map(({ key, label, icon: Icon, color, description }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`group flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeView === key
                      ? `bg-${color}-100 text-${color}-700 shadow-sm`
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title={description}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {renderView()}
      </main>
    </div>
  );
}

export default App; 