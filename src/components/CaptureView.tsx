import React, { useState, useRef, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Mic, MicOff, Sparkles, CheckCircle, Upload } from 'lucide-react';
import { saveTrainingData } from '../lib/db';
import UserAvatar from './UserAvatar';

interface CaptureViewProps {
  onOrganizeClick?: (mode?: 'login' | 'signup') => void;
}

const EmailSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Successfully subscribed!' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to subscribe. Please try again.' });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-center justify-center gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-base transition-all duration-200"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className={`px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 ${
            isSubmitting || !email
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isSubmitting ? 'Subscribing...' : 'Early Access'}
        </button>
      </form>
      {message && (
        <div className={`absolute top-full mt-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

const CaptureView: React.FC<CaptureViewProps> = ({ onOrganizeClick }) => {
  const { processAndSave, setCurrentView, user, signOut } = useGenieNotesStore();
  // Simple capture - always capture as thought, AI will determine if it's todo or insight
  const entryType: 'thought' | 'journal' = 'thought';
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
      setTranscript('');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async () => {
    const textToProcess = transcript || inputText;
    if (!textToProcess.trim()) return;
    
    // If not logged in, trigger auth flow (default to signup for new users)
    if (!user) {
      if (onOrganizeClick) {
        onOrganizeClick('signup');
      }
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setShowSuccess(false);
    
    try {
      // Always capture as thought - AI will determine if it's todo or insight
      // Redirect to mindbox after saving
      await processAndSave(textToProcess, 'thought', undefined);
      
      setShowSuccess(true);
      setInputText('');
      setTranscript('');
      setIsRecording(false);
      
      // Show redirecting state
      setIsRedirecting(true);
      
      // Redirect will be handled by store after entry is saved
      // The store will navigate to the appropriate view based on entry type
      setTimeout(() => {
        setIsRedirecting(false);
        setShowSuccess(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error processing input:', error);
      setError(error?.message || 'Failed to save entry. Make sure the database table exists.');
      setTimeout(() => setError(null), 5000);
      setIsRedirecting(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await saveTrainingData(text, 'file', file.name);
      setShowUpload(false);
      alert('File uploaded successfully! The AI will learn from this content.');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextUpload = async () => {
    const text = prompt('Paste your text here to train the AI:');
    if (!text || !text.trim()) return;

    try {
      await saveTrainingData(text.trim(), 'text');
      alert('Text uploaded successfully! The AI will learn from this content.');
    } catch (error) {
      console.error('Error uploading text:', error);
      alert('Failed to upload text. Please try again.');
    }
  };

  const currentText = transcript || inputText;
  const hasContent = currentText.trim().length > 0;

  // Show full-screen loader when processing or redirecting
  if (isProcessing || isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-900 mb-2">
            {isProcessing ? 'Capturing your thought...' : 'Taking you to your thoughts space...'}
          </p>
          <p className="text-sm text-slate-500">
            {isProcessing ? 'Organizing and saving...' : 'Almost there!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements - only show when not logged in */}
      {!user && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-50 w-full px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 drop-shadow-sm" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Thouthy</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('mindbox')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Mindbox
                </button>
                <UserAvatar user={user} onLogout={signOut} />
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (onOrganizeClick) {
                      onOrganizeClick('login');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    if (onOrganizeClick) {
                      onOrganizeClick('signup');
                    }
                  }}
                  className="px-5 py-2.5 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className={`relative z-10 w-full max-w-6xl mx-auto px-8 ${user ? 'pt-8 pb-8' : 'pt-12 pb-20'}`}>
        {/* Hero Section - only show when not logged in */}
        {!user && (
          <div className="text-center mb-20">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              Give every thought a meaning
            </h1>
            
            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Every thought you have is captured, acted on, and turned into something worth sharing.
            </p>
            
            {/* Email Subscription */}
            <EmailSubscription />
          </div>
        )}

        {/* Main Input Card */}
        <div id="capture-input" className={`bg-white rounded-2xl shadow-sm p-8 sm:p-10 relative z-10 ${user ? 'max-w-3xl mx-auto' : ''} hover:shadow-md transition-shadow duration-200`}>
          <div className="relative z-10">

          {/* Input Area */}
          <div className="mb-6">
            <textarea
              value={transcript || inputText}
              onChange={(e) => {
                if (transcript) {
                  setTranscript(e.target.value);
                } else {
                  setInputText(e.target.value);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What's on your mind? Share your thoughts, tasks, ideas..."
              className="w-full p-5 text-base border border-slate-200 bg-white rounded-lg hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none transition-all h-32"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-md animate-pulse' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              
              {/* Training Upload Button */}
              <div className="relative">
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="p-3 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-200"
                  title="Upload training data"
                >
                  <Upload className="w-5 h-5" />
                </button>
                
                {showUpload && (
                  <div className="absolute left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-10 min-w-[140px]">
                    <button
                      onClick={handleTextUpload}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Upload Text
                    </button>
                    <label className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      Upload File
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".txt,.md,.doc,.docx"
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Voice Status */}
              {entryType === 'thought' && isRecording && (
                <div className="flex items-center gap-2 text-red-600 ml-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!hasContent || isProcessing}
              className={`px-8 py-3 rounded-xl font-medium text-base transition-all duration-200 flex items-center gap-2 ${
                hasContent && !isProcessing
                  ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Capturing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Capture</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Thought captured and saved!
                </span>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Benefits Section - Simple and Clean */}
        {!user && (
          <div className="mt-20 text-center">
            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="text-4xl">✨</div>
                <h3 className="font-semibold text-slate-900 text-base">AI-Powered Organization</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your thoughts are automatically categorized, tagged, and summarized
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-4xl">📝</div>
                <h3 className="font-semibold text-slate-900 text-base">Turn Insights into Posts</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  AI identifies valuable insights and drafts ready-to-share content
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-4xl">🔒</div>
                <h3 className="font-semibold text-slate-900 text-base">Never Lose a Thought</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Everything is saved, organized, and searchable forever
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptureView;
