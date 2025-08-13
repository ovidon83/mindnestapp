import React from 'react';
import { Brain, Lightbulb } from 'lucide-react';
import { useGenieNotesStore } from './store';
import { CaptureView } from './components/CaptureView';
import { ThoughtsView } from './components/ThoughtsView';

export const App: React.FC = () => {
  const { appState, setCurrentView } = useGenieNotesStore();
  const { currentView } = appState;

  const views = [
    { key: 'capture' as const, label: 'Capture', icon: Brain, color: 'blue', description: 'Capture your thoughts' },
    { key: 'thoughts' as const, label: 'Thoughts', icon: Lightbulb, color: 'purple', description: 'Manage your collection' }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'capture': return <CaptureView />;
      case 'thoughts': return <ThoughtsView />;
      default: return <CaptureView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
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
            <nav className="flex space-x-1">
              {views.map((view) => (
                <button
                  key={view.key}
                  onClick={() => setCurrentView(view.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    currentView === view.key
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  <span>{view.label}</span>
                </button>
              ))}
            </nav>
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