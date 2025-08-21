import React from 'react';
import { useAllyMindStore } from './store';
import CaptureView from './components/CaptureView';
import HomeView from './components/HomeView';

const App: React.FC = () => {
  const { currentView } = useAllyMindStore();

  return (
    <div className="App">
      {currentView === 'capture' ? (
        <CaptureView />
      ) : (
        <HomeView />
      )}
    </div>
  );
};

export default App; 