import { useState } from 'react';
import { Brain, FileText } from 'lucide-react';
import { ThoughtsTab } from './components/ThoughtsTab';
import { CanvasTab } from './components/CanvasTab';

type TabType = 'thoughts' | 'canvas';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('thoughts');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tab Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Mindnest
              </h1>
            </div>

            {/* Tab Navigation */}
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('thoughts')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'thoughts'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Brain size={18} />
                <span>Thoughts</span>
              </button>
              <button
                onClick={() => setActiveTab('canvas')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'canvas'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText size={18} />
                <span>Canvas</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'thoughts' && <ThoughtsTab />}
        {activeTab === 'canvas' && <CanvasTab />}
      </main>
    </div>
  );
}

export default App; 