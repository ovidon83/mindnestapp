import React, { useState, useRef, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Mic, MicOff, Sparkles, CheckCircle, Upload, Search, Mail, Twitter, Linkedin, Instagram, Brain } from 'lucide-react';
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
  const accumulatedTranscriptRef = useRef<string>('');

  // Check if speech recognition is available
  const isSpeechRecognitionAvailable = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  // Initialize speech recognition
  useEffect(() => {
    if (isSpeechRecognitionAvailable()) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        // Accumulate transcript from all results
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          
          // Process all results from resultIndex to accumulate new results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              // Add to accumulated final transcript
              accumulatedTranscriptRef.current += transcript + ' ';
            } else {
              // Show interim results
              interimTranscript += transcript;
            }
          }
          
          // Update transcript: show accumulated final results + current interim
          setTranscript((accumulatedTranscriptRef.current + interimTranscript).trim());
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          // Handle specific error types
          let errorMessage = 'Voice input error. ';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'Microphone not found. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
            case 'aborted':
              // User stopped recording, not an error
              return;
            default:
              errorMessage = `Voice input error: ${event.error}`;
          }
          
          setError(errorMessage);
          setTimeout(() => setError(null), 5000);
        };
        
        recognitionRef.current.onend = () => {
          // Only set recording to false if it wasn't manually stopped
          // This handles cases where recognition stops automatically (e.g., timeout)
          if (isRecording) {
            setIsRecording(false);
          }
        };
        
        recognitionRef.current.onstart = () => {
          setIsRecording(true);
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setError('Voice input is not supported in this browser.');
      }
    }
  }, []);

  const startRecording = () => {
    if (!isSpeechRecognitionAvailable()) {
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (recognitionRef.current) {
      try {
        // Clear previous transcript and reset accumulated transcript
        setTranscript('');
        accumulatedTranscriptRef.current = '';
        setError(null);
        
        // Start recognition
        recognitionRef.current.start();
      } catch (error: any) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
        
        if (error.name === 'InvalidStateError') {
          setError('Voice input is already running. Please stop it first.');
        } else {
          setError('Failed to start voice input. Please try again.');
        }
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
      }
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
      await processAndSave(textToProcess, 'thought');
      
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-neutral-50 to-stone-100 relative overflow-hidden">
      {/* Modern background elements - only show when not logged in */}
      {!user && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-stone-50/30 to-transparent"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-amber-100/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-100/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-50 w-full px-4 sm:px-8 py-4 sm:py-6 backdrop-blur-sm bg-white/70 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Brain - more prominent and refined */}
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400 relative z-10 group-hover:text-teal-300 transition-colors duration-300" strokeWidth={2} fill="none" />
              
              {/* Refined sparkles - fewer, more strategic placement */}
              <Sparkles className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-400 opacity-60 group-hover:opacity-90 transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
              <Sparkles className="absolute bottom-1 left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 text-teal-300 opacity-50 group-hover:opacity-80 transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
              
              {/* Subtle outer ring on hover */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-teal-500/0 group-hover:ring-teal-500/20 transition-all duration-300"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Thouthy</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
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
                  className="px-5 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {!user ? (
        <>
          {/* Hero Section - Separated and Modern */}
          <section className="relative z-10 pt-16 sm:pt-24 pb-12 sm:pb-16">
            {/* Discrete background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 via-transparent to-transparent -z-10"></div>
            <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center relative">
              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight">
                <span className="text-slate-900">
                  Give every thought
                </span>
                <br />
                <span className="text-teal-700">
                  a meaning
                </span>
              </h1>
              
              {/* Sub-headline */}
              <p className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Master your inner world and step into your most powerful self
              </p>
              
              {/* Email Subscription */}
              <div className="mt-10">
                <EmailSubscription />
              </div>
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="relative z-10 py-16 sm:py-20">
            {/* Discrete background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/20 to-transparent -z-10"></div>
            <div className="max-w-5xl mx-auto px-4 sm:px-8 relative">
              <div className="relative">
                {/* Decorative background element */}
                <div className="absolute inset-0 bg-stone-50/30 rounded-3xl blur-3xl -z-10"></div>
                
                <div className="text-center space-y-8 sm:space-y-10">
                  {/* Main statement - larger and more prominent */}
                  <div className="relative inline-block">
                    <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-800">
                      Thouthy is your thinking companion.
                    </p>
                    {/* Decorative underline */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-teal-500 rounded-full"></div>
                  </div>
                  
                  {/* Three motivations - elegant horizontal layout */}
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-base sm:text-lg md:text-xl font-medium py-6">
                    <span className="px-5 py-2.5 rounded-full bg-stone-100 border border-stone-200 text-slate-700 shadow-sm hover:shadow-md transition-all">Peace of mind</span>
                    <span className="px-5 py-2.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 shadow-sm hover:shadow-md transition-all">Self-expression</span>
                    <span className="px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm hover:shadow-md transition-all">Leverage</span>
                  </div>
                  
                  {/* Final statement - emphasized */}
                  <div className="pt-4">
                    <p className="text-xl sm:text-2xl md:text-3xl text-slate-900 font-semibold">
                      All start in the same place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sticky/Floating Capture Card - Always in view */}
          <div className="relative z-20 -mt-8 mb-16">
            {/* Discrete background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/10 to-transparent -z-10"></div>
            <div className="max-w-2xl mx-auto px-4 sm:px-8 relative">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-lg border border-stone-200/60 p-6 sm:p-8 lg:p-10 hover:shadow-xl transition-all duration-300">
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">What's on your mind</h2>
                </div>
                
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
                    placeholder="Share your thoughts, tasks, ideas..."
                    className="w-full p-5 text-base border-2 border-stone-200 bg-white rounded-xl hover:border-teal-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none transition-all h-32"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Voice Input Button */}
                    {isSpeechRecognitionAvailable() ? (
                      <button
                        onClick={handleVoiceInput}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                          isRecording 
                            ? 'bg-red-500 text-white shadow-md animate-pulse' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={isRecording ? 'Stop recording' : 'Start voice input'}
                        type="button"
                      >
                        {isRecording ? (
                          <MicOff className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </button>
                    ) : (
                      <button
                        className="p-3 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
                        title="Voice input not supported in this browser"
                        type="button"
                        disabled
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                    
                    {/* Training Upload Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-200"
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
                    {isRecording && (
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
                    className={`px-6 sm:px-8 py-3 rounded-xl font-medium text-base transition-all duration-200 flex items-center gap-2 ${
                      hasContent && !isProcessing
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
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
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {/* Success Message */}
                {showSuccess && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
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
          </div>

          {/* Showcase Section - App Features */}
          <section className="relative z-10 py-20 sm:py-28">
            {/* Discrete background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/40 to-transparent -z-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-8 relative">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                  See it in action
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                  Discover how Thouthy transforms your thoughts into organized, actionable insights
                </p>
              </div>

              {/* Feature Showcase Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Feature 1: Capture */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Instant Capture</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="italic">"for the most part expensive soccer academies don't offer more than free rec soccer in the US. Coaches focus only on fun, no intensity, no coach-driven development. Just more games, lots of travel and ton more money."</p>
                      <p className="text-xs text-slate-500 mt-2">💬 Voice captured while driving</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-4">
                    Voice, text, or upload—capture thoughts instantly, anywhere. No friction, just pure flow.
                  </p>
                </div>

                {/* Feature 2: Organization */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Save & Organize</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      AI automatically classifies as Task, Insight, or Thought and saves everything securely.
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium flex-shrink-0 mt-0.5">Insight</span>
                        <p className="text-slate-700 text-xs italic flex-1">"for the most part expensive soccer academies don't offer more than free rec soccer in the US. Coaches focus only on fun, no intensity, no coach-driven development. Just more games, lots of travel and ton more money."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Search & Never Lose */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Search & Never Lose</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Instantly find any thought, idea, or task. Your entire mind archive, searchable forever.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 bg-white rounded-lg px-3 py-2 border border-slate-200">
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="text-xs italic text-slate-400">soccer... something about training</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700">1 result found</p>
                        <div className="flex items-start gap-2 p-2 bg-white rounded border border-stone-100 hover:border-teal-200 transition-colors">
                          <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-medium mt-0.5 flex-shrink-0">Insight</span>
                          <p className="text-xs text-slate-600 flex-1 italic">"for the most part expensive soccer academies don't offer more than free rec soccer in the US. Coaches focus only on fun, no intensity, no coach-driven development. Just more games, lots of travel and ton more money."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: AI Insights */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">AI Insights & Next Steps</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Get contextual research-based notes and actionable sub-tasks for every entry.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="font-medium text-xs text-slate-500 mb-2">AI Note:</p>
                      <p className="italic text-xs">"Research shows US youth soccer focuses on participation over development. European academies emphasize technical skills and competitive intensity. The pay-to-play model creates barriers..."</p>
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <p className="font-medium text-xs text-slate-500 mb-1">Sub-tasks:</p>
                        <ul className="text-xs space-y-1 text-slate-600">
                          <li>• Compare US vs European youth development models</li>
                          <li>• Research cost-benefit of academy programs</li>
                          <li>• Document specific development gaps</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 5: Social Sharing */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Post About Insights</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Turn valuable insights into ready-to-post content for LinkedIn, Twitter, Instagram.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">in</div>
                        <p className="text-xs text-slate-600 italic">"The pay-to-play model in US youth soccer is broken. Parents invest thousands in academy programs that prioritize fun over development. Meanwhile, free recreational leagues offer the same quality..."</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">𝕏</div>
                        <p className="text-xs text-slate-600 italic">"US soccer's problem: expensive academies that don't develop players. Rec soccer is free and just as good. We're paying for fun, not progress."</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Instagram className="w-6 h-6 text-pink-600 flex-shrink-0" />
                        <p className="text-xs text-slate-600 italic">"Why are we paying thousands for soccer academies when rec leagues offer the same development? The real issue: we're prioritizing fun over growth. Time to rethink youth soccer in America."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 6: Companion */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Companion</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Get personalized observations and patterns from your thoughts. Your AI thinking companion.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="font-medium text-xs text-slate-500 mb-2">Observation:</p>
                      <p className="italic text-xs">"You're consistently reflecting on youth development and coaching philosophy. This suggests deep concern about systemic issues in sports education. Your insights about pay-to-play models could be valuable for other coaches and parents."</p>
                      <p className="text-xs text-slate-500 mt-3">Pattern detected: Coaching & development focus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 border-t border-stone-200 bg-stone-50/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Brand */}
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Thouthy
                  </h3>
                  <p className="text-sm text-slate-600">
                    Your thinking companion
                  </p>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                  <a
                    href="mailto:hello@thouthy.com"
                    className="p-2 rounded-lg bg-white border border-stone-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 transition-all"
                    aria-label="Email"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                  <a
                    href="https://twitter.com/thouthy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-sky-500 hover:border-sky-200 transition-all"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://linkedin.com/company/thouthy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="https://instagram.com/thouthy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-pink-600 hover:border-pink-200 transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Copyright */}
              <div className="mt-8 pt-8 border-t border-stone-200 text-center">
                <p className="text-sm text-slate-500">
                  © {new Date().getFullYear()} Thouthy. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </>
      ) : (
        /* Logged in view - simpler layout */
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8 pt-8 pb-8">
          {/* Main Input Card */}
          <div id="capture-input" className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 sm:p-10 hover:shadow-md transition-shadow duration-200">
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
              className="w-full p-5 text-base border border-stone-200 bg-white rounded-lg hover:border-stone-300 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 resize-none transition-all h-32"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Voice Input Button */}
              {isSpeechRecognitionAvailable() ? (
                <button
                  onClick={handleVoiceInput}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-md animate-pulse' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                  type="button"
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <button
                  className="p-3 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                  title="Voice input not supported in this browser"
                  type="button"
                  disabled
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              
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
              {isRecording && (
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
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
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
        </div>
      )}
    </div>
  );
};

export default CaptureView;
