import React, { useState } from 'react';
import { useAllyMindStore } from './store';
import { AppView } from './types';
import CaptureView from './components/CaptureView';
import HomeView from './components/HomeView';

const App: React.FC = () => {
  const { currentView, setCurrentView } = useAllyMindStore();

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