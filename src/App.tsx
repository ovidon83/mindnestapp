import { useState } from 'react';
import { Header } from './components/Header';
import { RandomThoughtInput } from './components/RandomThoughtInput';
import { JournalView } from './components/JournalView';
import { NoteEditor } from './components/NoteEditor';
import { ToDoList } from './components/ToDoList';
import { ProjectSpace } from './components/ProjectSpace';
import { IdeasView } from './components/IdeasView';
import { AppSection } from './types';

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('thoughts');
  const [focusMode, setFocusMode] = useState(false);

  const handleCategoryRoute = (category: string) => {
    switch (category) {
      case 'ideas':
        setCurrentSection('ideas');
        break;
      case 'todos':
        setCurrentSection('todos');
        break;
      case 'notes':
        setCurrentSection('notes');
        break;
      case 'journal':
        setCurrentSection('journal');
        break;
      default:
        setCurrentSection('thoughts');
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'thoughts':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <RandomThoughtInput onCategoryRoute={handleCategoryRoute} />
          </div>
        );
      case 'journal':
        return <JournalView />;
      case 'notes':
        return <NoteEditor />;
      case 'todos':
        return <ToDoList />;
      case 'projects':
        return <ProjectSpace />;
      case 'ideas':
        return <IdeasView />;
      default:
        return <JournalView />;
    }
  };

  return (
    <div className={`min-h-screen ${focusMode ? 'bg-white' : 'bg-gray-50'}`}>
      <Header
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        setShowSearchModal={() => {}}
      />
      <div className={`transition-all duration-300 ${focusMode ? 'pt-0' : 'pt-0'}`}>
        {renderContent()}
      </div>
    </div>
  );
}

export default App; 