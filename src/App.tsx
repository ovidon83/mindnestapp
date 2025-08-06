import { useState } from 'react';
import { Brain, CheckSquare, BookOpen, MessageCircle, BarChart3 } from 'lucide-react';
import { CaptureView } from './components/CaptureView';
import { ToDoView } from './components/ToDoView';
import { JournalView } from './components/JournalView';
import { ThoughtsView } from './components/ThoughtsView';
import { AnalyticsView } from './components/AnalyticsView';
import { AppView } from './types';

function App() {
  const [activeView, setActiveView] = useState<AppView>('capture');

  const views = [
    { 
      key: 'capture' as AppView, 
      label: 'Capture', 
      icon: Brain, 
      color: 'purple',
      description: 'Quick capture & organize'
    },
    { 
      key: 'todos' as AppView, 
      label: 'To-Do', 
      icon: CheckSquare, 
      color: 'blue',
      description: 'Tasks by urgency'
    },
    { 
      key: 'journal' as AppView, 
      label: 'Journal', 
      icon: BookOpen, 
      color: 'green',
      description: 'Daily reflections'
    },
    { 
      key: 'thoughts' as AppView, 
      label: 'Thoughts', 
      icon: MessageCircle, 
      color: 'indigo',
      description: 'Random musings'
    },
    { 
      key: 'analytics' as AppView, 
      label: 'Analytics', 
      icon: BarChart3, 
      color: 'rose',
      description: 'Insights & trends'
    },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'capture': return <CaptureView />;
      case 'todos': return <ToDoView />;
      case 'journal': return <JournalView />;
      case 'thoughts': return <ThoughtsView />;
      case 'analytics': return <AnalyticsView />;
      default: return <CaptureView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation - Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
        <div className="grid grid-cols-5 gap-1 p-2">
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