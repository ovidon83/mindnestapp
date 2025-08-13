import React from 'react';
import { Brain, Lightbulb } from 'lucide-react';
import { useGenieNotesStore } from './store';
import { CaptureView } from './components/CaptureView';
import { HomeView } from './components/HomeView';

export const App: React.FC = () => {
  const { appState, setCurrentView } = useGenieNotesStore();
  const { currentView } = appState;

  const views = [
    { key: 'capture' as const, label: 'Capture', icon: Brain, color: 'blue', description: 'Capture your thoughts' },
    { key: 'home' as const, label: 'Home', icon: Lightbulb, color: 'purple', description: 'Your dashboard' }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'capture':
        return <CaptureView />;
      case 'home':
        return <HomeView />;
      default:
        return <CaptureView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GenieNotes</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
              {views.map((view) => {
                const isActive = currentView === view.key;
                const Icon = view.icon;
                
                return (
                  <button
                    key={view.key}
                    onClick={() => setCurrentView(view.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {renderView()}
      </main>
    </div>
  );
}; 