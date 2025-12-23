import React, { useEffect, useState } from 'react';
import { useGenieNotesStore } from './store';
import { supabase, hasSupabaseCredentials } from './lib/supabase';
import CaptureView from './components/CaptureView';
import MindboxView from './components/MindboxView';
import ShareItView from './components/ShareItView';
import CompanionView from './components/CompanionView';
import ProfileView from './components/ProfileView';
import Navigation from './components/Navigation';
import Auth from './components/Auth';

const App: React.FC = () => {
  const { currentView, user, setUser, loadEntries } = useGenieNotesStore();
  const [initializing, setInitializing] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!hasSupabaseCredentials) {
      setInitializing(false);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadEntries();
      }
      setInitializing(false);
    }).catch(() => {
      setInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const wasLoggedOut = !useGenieNotesStore.getState().user && session?.user;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadEntries();
        // If user just logged in and there's pending text, navigate to capture view
        if (wasLoggedOut && useGenieNotesStore.getState().pendingText) {
          useGenieNotesStore.getState().setCurrentView('capture');
        }
      } else {
        useGenieNotesStore.setState({ entries: [] });
      }
    });

    return () => subscription?.unsubscribe();
  }, [setUser, loadEntries]);

  // Show error if Supabase credentials are missing
  if (!hasSupabaseCredentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border-2 border-red-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Configuration Required</h2>
            <p className="text-slate-600 mb-4">
              Supabase credentials are missing. Please set the following environment variables in Render:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left mb-4">
              <code className="text-sm text-slate-800 block mb-2">VITE_SUPABASE_URL</code>
              <code className="text-sm text-slate-800">VITE_SUPABASE_ANON_KEY</code>
            </div>
            <p className="text-xs text-slate-500">
              After setting these variables, redeploy your service on Render.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          ) : currentView === 'profile' ? (
            <ProfileView />
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