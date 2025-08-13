import { 
  Brain, 
  Target, 
  Inbox, 
  Calendar, 
  BarChart3, 
  FileText,
  Zap
} from 'lucide-react';
import { useGenieNotesStore } from './store';
import { CaptureView } from './components/CaptureView';
import { NextUpView } from './components/NextUpView';
import { HomeView } from './components/HomeView';
import { CalendarView } from './components/CalendarView';
import { ReviewsView } from './components/ReviewsView';
import { InsightsView } from './components/InsightsView';
// Temporarily comment out old components to get core working
// import { ToDoView } from './components/ToDoView';
// import { JournalView } from './components/JournalView';
// import { ThoughtsView } from './components/ThoughtsView';
// import { AnalyticsView } from './components/AnalyticsView';
import type { AppView } from './types';

function App() {
  const { appState, setCurrentView } = useGenieNotesStore();
  const { currentView } = appState;

  const views = [
    {
      key: 'capture' as AppView,
      label: 'Capture',
      icon: Brain,
      color: 'blue',
      description: 'AI-powered thought capture'
    },
    { 
      key: 'nextup' as AppView, 
      label: 'Next Up', 
      icon: Target, 
      color: 'indigo', 
      description: 'Prioritized action items' 
    },
    { 
      key: 'inbox' as AppView, 
      label: 'Inbox', 
      icon: Inbox, 
      color: 'emerald', 
      description: 'All entries & quick actions' 
    },
    { 
      key: 'calendar' as AppView, 
      label: 'Calendar', 
      icon: Calendar, 
      color: 'purple', 
      description: 'Schedule & events view' 
    },
    { 
      key: 'reviews' as AppView, 
      label: 'Reviews', 
      icon: FileText, 
      color: 'orange', 
      description: 'Daily/weekly/monthly summaries' 
    },
    { 
      key: 'insights' as AppView, 
      label: 'Insights', 
      icon: BarChart3, 
      color: 'rose', 
      description: 'Analytics & patterns' 
    }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'capture':
        return <CaptureView />;
      case 'nextup':
        return <NextUpView />;
      case 'inbox':
        return <HomeView />;
      case 'calendar':
        return <CalendarView />;
      case 'reviews':
        return <ReviewsView />;
      case 'insights':
        return <InsightsView />;
      default:
        return <NextUpView />;
    }
  };

  const getViewIcon = (view: typeof views[0]) => {
    const IconComponent = view.icon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GenieNotes</span>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex space-x-1">
              {views.map((view) => (
                <button
                  key={view.key}
                  onClick={() => setCurrentView(view.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    currentView === view.key
                      ? 'bg-blue-100 text-blue-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {getViewIcon(view)}
                  <span>{view.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => {/* TODO: Implement mobile menu */}}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {renderView()}
      </main>

      {/* Mobile Navigation (Fixed Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {views.slice(0, 4).map((view) => (
            <button
              key={view.key}
              onClick={() => setCurrentView(view.key)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                currentView === view.key
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getViewIcon(view)}
              <span className="text-xs font-medium">{view.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App; 