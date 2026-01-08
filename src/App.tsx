import React, { useEffect, useState } from 'react';
import { useGenieNotesStore } from './store';
import { supabase, hasSupabaseCredentials } from './lib/supabase';
import CaptureView from './components/CaptureView';
import LibraryView from './components/LibraryView';
import ShareStudioView from './components/ShareStudioView';
import Auth from './components/Auth';

// Thouty - Your Thought Companion

const App: React.FC = () => {
  const { currentView, user, setUser, loadThoughts, loadActions, setCurrentView } = useGenieNotesStore();
  const [initializing, setInitializing] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Handle initial hash and browser back/forward buttons
  useEffect(() => {
    // Check initial hash on mount
    const initialHash = window.location.hash.slice(1);
    const validViews = ['capture', 'library', 'studio', 'thoughts', 'home', 'shareit'];
    if (initialHash && validViews.includes(initialHash)) {
      // Map old views to new views
      const viewMap: Record<string, string> = {
        'thoughts': 'library',
        'home': 'library',
        'shareit': 'studio',
      };
      const view = viewMap[initialHash] || initialHash;
      setCurrentView(view as any);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view, event.state.thoughtId);
      } else {
        // Fallback: check hash or default to library
        const hash = window.location.hash.slice(1);
        if (hash && validViews.includes(hash)) {
          const viewMap: Record<string, string> = {
            'thoughts': 'library',
            'home': 'library',
            'shareit': 'studio',
          };
          const view = viewMap[hash] || hash;
          setCurrentView(view as any);
        } else {
          // Default to library view if no hash or invalid hash
          setCurrentView('library');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentView]);

  useEffect(() => {
    if (!hasSupabaseCredentials) {
      setInitializing(false);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadThoughts();
        loadActions();
        // Check hash first, then default to library
        const hash = window.location.hash.slice(1);
        const validViews = ['capture', 'library', 'studio', 'thoughts', 'home', 'shareit'];
        if (hash && validViews.includes(hash)) {
          const viewMap: Record<string, string> = {
            'thoughts': 'library',
            'home': 'library',
            'shareit': 'studio',
          };
          const view = viewMap[hash] || hash;
          setCurrentView(view as any);
        } else {
          // Set default view to Library when logged in
          setCurrentView('library');
        }
      }
      setInitializing(false);
    }).catch(() => {
      setInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = useGenieNotesStore.getState().user;
      const wasLoggedOut = !currentUser && session?.user;
      const isLoggedIn = !!session?.user;
      const wasLoggedIn = !!currentUser;
      
      // Only update if auth state actually changed
      if ((isLoggedIn && !wasLoggedIn) || (!isLoggedIn && wasLoggedIn)) {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Only load if not already loading
          const state = useGenieNotesStore.getState();
          if (!state.loading) {
            loadThoughts();
            loadActions();
          }
          // If user just logged in and there's pending text, navigate to capture view
          if (wasLoggedOut && useGenieNotesStore.getState().pendingText) {
            useGenieNotesStore.getState().setCurrentView('capture');
          }
        } else {
          useGenieNotesStore.setState({ thoughts: [], actions: [] });
        }
      }
    });

    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - loadThoughts/loadActions are stable

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
        // Authenticated: Show new streamlined app views
        <>
          {currentView === 'capture' ? (
            <CaptureView />
          ) : currentView === 'studio' || currentView === 'shareit' ? (
            <ShareStudioView />
          ) : (
            <LibraryView />
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