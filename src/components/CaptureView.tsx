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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background layer - full screen for all browsers */}
      {!user && (
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-pink-50/30 via-yellow-50/20 to-white"></div>
          {/* Fun grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.15) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          {/* Multiple floating orbs - more playful */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-yellow-300/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-300/10 rounded-full blur-3xl"></div>
          {/* Floating decorative shapes */}
          <div className="absolute top-20 right-20 w-16 h-16 bg-yellow-400/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-32 w-12 h-12 bg-purple-400/30 rounded-full blur-xl"></div>
        </div>
      )}

      {/* Navigation - positioned absolutely at top */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-8 py-4 sm:py-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 group">
              {/* Playful brain icon with sparkles */}
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} fill="none" />
              {/* Fun sparkles around the brain */}
              <Sparkles className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-yellow-400 opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" strokeWidth={2} />
              <Sparkles className="absolute -bottom-0.5 -left-0.5 w-2 h-2 text-purple-300 opacity-70 group-hover:opacity-90 group-hover:scale-125 transition-all duration-300" strokeWidth={2} />
              {/* Playful hover glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-yellow-500/0 group-hover:from-purple-500/20 group-hover:to-yellow-500/20 transition-all duration-300"></div>
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
                  className="px-5 py-2.5 text-sm font-medium bg-white/80 text-slate-700 border-2 border-yellow-300 rounded-xl hover:border-yellow-400 hover:bg-yellow-50/80 transition-all shadow-md hover:shadow-lg backdrop-blur-sm"
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
          {/* Hero Section - Super Playful and Fun - extends to top */}
          <section className="relative z-10 pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center relative">
              {/* Small label - more playful */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-200/80 to-orange-200/80 text-yellow-900 text-sm font-bold rounded-full border-2 border-yellow-300/50 shadow-lg backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-yellow-600 animate-pulse" />
                  ⚡ THINK SMARTER
                </span>
              </div>
              
              {/* Main Headline - more vibrant */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
                <span className="text-slate-900">
                  Give every thought
                </span>
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">a meaning</span>
                  {/* More playful wavy underline */}
                  <svg className="absolute -bottom-3 left-0 right-0 h-5 -z-10" viewBox="0 0 300 25" preserveAspectRatio="none">
                    <path d="M0,20 Q75,5 150,20 T300,20" stroke="url(#yellowGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              
              {/* Floating hashtags - super playful elements */}
              <div className="absolute top-10 right-10 sm:right-20 hidden md:block animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-300/80 to-cyan-300/80 backdrop-blur-sm rounded-full text-blue-800 text-xs font-bold border-2 border-blue-400/60 shadow-lg transform rotate-3 hover:rotate-6 hover:scale-110 transition-all">
                  #thoughts ✨
                </div>
              </div>
              <div className="absolute bottom-20 left-10 sm:left-20 hidden md:block animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-300/80 to-orange-300/80 backdrop-blur-sm rounded-full text-yellow-800 text-xs font-bold border-2 border-yellow-400/60 shadow-lg transform -rotate-3 hover:-rotate-6 hover:scale-110 transition-all">
                  #ideas 💡
                </div>
              </div>
              <div className="absolute top-32 left-10 sm:left-20 hidden lg:block animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
                <div className="px-4 py-2 bg-gradient-to-r from-pink-300/80 to-rose-300/80 backdrop-blur-sm rounded-full text-pink-800 text-xs font-bold border-2 border-pink-400/60 shadow-lg transform rotate-6 hover:rotate-9 hover:scale-110 transition-all">
                  #insights 🚀
                </div>
              </div>
              <div className="absolute top-1/2 right-5 hidden xl:block animate-pulse">
                <div className="px-3 py-1.5 bg-yellow-300/70 backdrop-blur-sm rounded-full text-yellow-900 text-xs font-bold border-2 border-yellow-400/70 shadow-md transform rotate-12">
                  #fun
                </div>
              </div>
              
              {/* Sub-headline */}
              <p className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                Thouthy helps you capture, organize, and transform your thoughts into actionable insights, delivering clarity and meaning to your inner world.
              </p>
              
              {/* Email Subscription */}
              <div className="mt-10">
                <EmailSubscription />
              </div>
            </div>
          </section>

          {/* Philosophy Section - Vibrant and Fun */}
          <section className="relative z-10 py-20 sm:py-24 bg-gradient-to-br from-yellow-50/40 via-blue-50/30 via-pink-50/20 to-white overflow-hidden">
            {/* Floating decorative elements */}
            <div className="absolute top-10 right-20 w-20 h-20 bg-blue-300/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-20 w-16 h-16 bg-yellow-300/20 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-300/15 rounded-full blur-2xl"></div>
            <div className="max-w-5xl mx-auto px-4 sm:px-8 relative">
              <div className="text-center space-y-8 sm:space-y-10">
                {/* Main statement */}
                <div className="relative inline-block">
                  <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
                    Thouthy is your thinking companion.
                  </p>
                </div>
                
                {/* Three motivations - super playful pill design */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-base sm:text-lg md:text-xl font-bold py-8">
                  <span className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm border-2 border-purple-300 text-purple-800 hover:from-purple-200 hover:to-pink-200 hover:border-purple-400 hover:scale-110 transition-all shadow-lg hover:shadow-xl transform">✨ Peace of mind</span>
                  <span className="px-8 py-4 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 backdrop-blur-sm border-2 border-yellow-300 text-yellow-800 hover:from-yellow-200 hover:to-orange-200 hover:border-yellow-400 hover:scale-110 transition-all shadow-lg hover:shadow-xl transform">💫 Self-expression</span>
                  <span className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 backdrop-blur-sm border-2 border-blue-300 text-blue-800 hover:from-blue-200 hover:to-cyan-200 hover:border-blue-400 hover:scale-110 transition-all shadow-lg hover:shadow-xl transform">🚀 Leverage</span>
                </div>
                
                {/* Final statement */}
                <div className="pt-4">
                  <p className="text-xl sm:text-2xl md:text-3xl text-slate-900 font-semibold">
                    All start in the same place.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sticky/Floating Capture Card - Super Attractive Design */}
          <div className="relative z-20 -mt-8 mb-20 py-16">
            {/* Vibrant background for capture section */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-100/30 via-blue-100/20 via-pink-100/15 to-white"></div>
            {/* Floating decorative shapes */}
            <div className="absolute top-5 right-10 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-5 left-10 w-20 h-20 bg-yellow-200/20 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-pink-200/15 rounded-full blur-xl"></div>
            
            <div className="max-w-2xl mx-auto px-4 sm:px-8 relative">
              <div className="bg-gradient-to-br from-white via-yellow-50/40 to-blue-50/30 rounded-3xl shadow-2xl border-2 border-yellow-300/60 p-8 sm:p-10 lg:p-12 hover:shadow-3xl transition-all duration-300 backdrop-blur-sm relative overflow-visible">
                {/* Floating decorative elements around card */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/60 rounded-full blur-sm animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400/60 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-2 right-2 w-4 h-4 bg-pink-400/40 rounded-full blur-sm"></div>
                
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>💭</span>
                    <span>What's on your mind</span>
                  </h2>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    Capture your thoughts instantly, anywhere
                  </p>
                </div>
                
                {/* Super Attractive Input Area */}
                <div className="mb-6 relative">
                  {/* Animated gradient glow background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-blue-400/30 to-pink-400/30 rounded-2xl blur-2xl -z-10 animate-pulse"></div>
                  {/* Additional glow layers */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-blue-500/20 to-pink-500/20 rounded-2xl blur-xl -z-10"></div>
                  
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
                    placeholder="Share your thoughts, tasks, ideas... ✨"
                    className="w-full p-6 text-base border-2 border-yellow-300 bg-white/95 backdrop-blur-md rounded-2xl hover:border-yellow-500 focus:border-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/40 resize-none transition-all h-40 shadow-xl hover:shadow-2xl relative z-10"
                  />
                  
                  {/* Animated decorative corner elements */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full opacity-70 blur-sm animate-pulse shadow-lg"></div>
                  <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full opacity-70 blur-sm animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full opacity-50"></div>
                  <div className="absolute bottom-2 left-2 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
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
                        ? 'bg-white/80 text-slate-700 border-2 border-yellow-300 hover:border-yellow-400 hover:bg-yellow-50/80 shadow-md hover:shadow-lg backdrop-blur-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
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

          {/* Showcase Section - Super Vibrant */}
          <section className="relative z-10 py-20 sm:py-28 bg-gradient-to-br from-white via-yellow-50/25 via-blue-50/15 to-pink-50/20 overflow-hidden">
            {/* More floating decorative elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-300/15 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-28 h-28 bg-yellow-300/15 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-pink-300/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-cyan-300/10 rounded-full blur-2xl"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-8 relative">
              <div className="text-center mb-12 sm:mb-16">
                <div className="mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FEATURES</span>
                </div>
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
                <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-yellow-300 hover:scale-[1.02]">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Instant Capture</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="italic">"I keep thinking about starting a side business - maybe a consulting gig for small businesses. I have all this experience but don't know where to start. Should I do it part-time first? What about my current job? Need to figure out pricing, services, and how to find clients."</p>
                      <p className="text-xs text-slate-500 mt-2">💬 Voice captured during morning commute</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-4">
                    Voice, text, or upload—capture thoughts instantly, anywhere. No friction, just pure flow.
                  </p>
                </div>

                {/* Feature 2: Organization */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-blue-300 hover:scale-[1.02]">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Save & Organize</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      AI automatically classifies as Task, Insight, or Thought and saves everything securely.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium flex-shrink-0 mt-0.5 border border-purple-200">To-Do</span>
                        <p className="text-slate-700 text-xs italic flex-1">"I keep thinking about starting a side business - maybe a consulting gig for small businesses. I have all this experience but don't know where to start. Should I do it part-time first? What about my current job? Need to figure out pricing, services, and how to find clients."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Search & Never Lose */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-pink-300 hover:scale-[1.02]">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg">
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
                        <span className="text-xs italic text-slate-400">side business... consulting</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700">1 result found</p>
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg border-2 border-slate-100 hover:border-yellow-200 transition-colors">
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-medium mt-0.5 flex-shrink-0 border border-yellow-200">To-Do</span>
                          <p className="text-xs text-slate-600 flex-1 italic">"I keep thinking about starting a side business - maybe a consulting gig for small businesses. I have all this experience but don't know where to start..."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: AI Insights */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-purple-300 hover:scale-[1.02]">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
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
                      <p className="italic text-xs">"Starting a consulting business part-time is a smart approach. Research shows 70% of successful consultants start while employed. Key considerations: define your niche, set clear boundaries with your current job, and validate demand before going full-time..."</p>
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <p className="font-medium text-xs text-slate-500 mb-1">Sub-tasks:</p>
                        <ul className="text-xs space-y-1 text-slate-600">
                          <li>• Research consulting rates in your industry</li>
                          <li>• Define your service offerings and target market</li>
                          <li>• Create a simple business plan and timeline</li>
                          <li>• Set up a basic website or portfolio</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 5: Social Sharing */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-blue-300 hover:scale-[1.02]">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
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
                        <p className="text-xs text-slate-600 italic">"Thinking about starting a consulting side business? Here's what I learned: Start part-time while employed, define your niche clearly, and validate demand before going all-in. The key is testing the waters without burning bridges..."</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">𝕏</div>
                        <p className="text-xs text-slate-600 italic">"Starting a side consulting business? Do it part-time first. Define your niche, validate demand, then scale. Most successful consultants started while employed."</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Instagram className="w-6 h-6 text-rose-600 flex-shrink-0" />
                        <p className="text-xs text-slate-600 italic">"The side hustle to full-time journey: Start small, validate, then scale. Here's how I'm building my consulting business while keeping my day job. The key? Clear boundaries and a solid plan."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 6: Companion */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-cyan-300 hover:scale-[1.02]">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
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
                      <p className="italic text-xs">"You're consistently thinking about career growth and entrepreneurship. This pattern suggests you're ready to take the next step professionally. Your thoughts about consulting show both excitement and caution—a healthy balance. Consider starting with one small client to test the waters."</p>
                      <p className="text-xs text-slate-500 mt-3">Pattern detected: Career growth & entrepreneurship</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer - Vibrant gradient */}
          <footer className="relative z-10 border-t-2 border-yellow-200/50 bg-gradient-to-br from-yellow-50/40 via-blue-50/20 to-pink-50/10">
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
                    className="p-2 rounded-lg bg-white/80 backdrop-blur-sm border-2 border-yellow-200 text-slate-600 hover:text-yellow-600 hover:border-yellow-300 hover:scale-110 transition-all shadow-sm"
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
                    className="p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Copyright */}
              <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-500">
                  © {new Date().getFullYear()} Thouthy. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </>
      ) : (
        /* Logged in view - attractive design */
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8 pt-8 pb-8">
          {/* Main Input Card - Super Playful and Attractive */}
          <div id="capture-input" className="bg-gradient-to-br from-white via-yellow-50/40 to-blue-50/30 rounded-3xl shadow-2xl border-2 border-yellow-300/60 p-8 sm:p-10 hover:shadow-3xl transition-all duration-300 backdrop-blur-sm relative overflow-visible">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            {/* Floating decorative elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/60 rounded-full blur-sm animate-bounce"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400/60 rounded-full blur-sm animate-bounce" style={{ animationDuration: '2s' }}></div>
            <div className="absolute top-2 right-2 w-4 h-4 bg-pink-400/40 rounded-full blur-sm"></div>
            
          <div className="relative z-10">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>💭</span>
                <span>What's on your mind?</span>
              </h2>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                Capture your thoughts instantly
              </p>
            </div>

          {/* Super Attractive Input Area */}
          <div className="mb-6 relative">
            {/* Animated gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-blue-400/30 to-pink-400/30 rounded-2xl blur-2xl -z-10 animate-pulse"></div>
            {/* Additional glow layers */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-blue-500/20 to-pink-500/20 rounded-2xl blur-xl -z-10"></div>
            
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
              placeholder="Share your thoughts, tasks, ideas... ✨"
              className="w-full p-6 text-base border-2 border-yellow-300 bg-white/95 backdrop-blur-md rounded-2xl hover:border-yellow-500 focus:border-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/40 resize-none transition-all h-40 shadow-xl hover:shadow-2xl relative z-10"
            />
            
            {/* Animated decorative corner elements */}
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full opacity-70 blur-sm animate-pulse shadow-lg"></div>
            <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full opacity-70 blur-sm animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full opacity-50"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
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
                  ? 'bg-white/80 text-slate-700 border-2 border-yellow-300 hover:border-yellow-400 hover:bg-yellow-50/80 shadow-md hover:shadow-lg backdrop-blur-sm'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
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
