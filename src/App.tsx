import { useState } from 'react';
import { Header } from './components/Header';
import { JournalView } from './components/JournalView';
import { ToDoList } from './components/ToDoList';
import { ThoughtsView } from './components/ThoughtsView';

type TabType = 'thoughts' | 'journal' | 'todos';

function App() {
  const [currentSection, setCurrentSection] = useState<TabType>('thoughts');

  const renderContent = () => {
    switch (currentSection) {
      case 'thoughts':
        return <ThoughtsView />;
      case 'journal':
        return <JournalView />;
      case 'todos':
        return <ToDoList />;
      default:
        return <ThoughtsView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentSection={currentSection}
        setCurrentSection={(section: string) => setCurrentSection(section as TabType)}
        focusMode={false}
        setFocusMode={() => {}}
        setShowSearchModal={() => {}}
      />
      <div className="transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
}

export default App; 