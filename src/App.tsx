import React, { useEffect, useState } from 'react';
import { useGenieNotesStore } from './store';
import { supabase } from './lib/supabase';
import CaptureView from './components/CaptureView';
import MindboxView from './components/MindboxView';
import ShareItView from './components/ShareItView';
import CompanionView from './components/CompanionView';
import Navigation from './components/Navigation';
import Auth from './components/Auth';

const App: React.FC = () => {
  const { currentView, user, setUser, loadEntries } = useGenieNotesStore();
  const [initializing, setInitializing] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadEntries();
      }
      setInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadEntries();
      } else {
        useGenieNotesStore.setState({ entries: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, loadEntries]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        // Landing page: Show capture view with login/signup options
        <CaptureView 
          onOrganizeClick={(mode?: 'login' | 'signup') => {
            if (mode) {
              setAuthMode(mode);
            }
            setShowAuth(true);
          }} 
        />
      ) : (
        // Authenticated: Show normal app views
        <>
          {currentView !== 'capture' && (
            <Navigation 
              currentView={currentView} 
              onViewChange={(view) => useGenieNotesStore.getState().setCurrentView(view)} 
            />
          )}
          {currentView === 'capture' ? (
            <CaptureView />
          ) : currentView === 'mindbox' ? (
            <MindboxView />
          ) : currentView === 'shareit' ? (
            <ShareItView />
          ) : currentView === 'companion' ? (
            <CompanionView />
          ) : (
            <MindboxView />
          )}
        </>
      )}
      
      {/* Auth Modal */}
      {showAuth && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
            <button
              onClick={() => {
                setShowAuth(false);
                setAuthMode('login');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            <Auth 
              initialMode={authMode}
              onModeChange={setAuthMode}
              onAuthSuccess={() => {
                setShowAuth(false);
                setAuthMode('login');
                // Auth state change will be handled by the useEffect
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App; 