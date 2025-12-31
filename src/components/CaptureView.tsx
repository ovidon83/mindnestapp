import React, { useState, useRef, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Mic, MicOff, Sparkles, CheckCircle, Upload, Search, Mail, Twitter, Linkedin, Instagram, Brain, Lightbulb, Calendar, X, Bell, Clock, FileText, MessageSquare } from 'lucide-react';
import { saveTrainingData } from '../lib/db';
import UserAvatar from './UserAvatar';
import Navigation from './Navigation';

interface CaptureViewProps {
  onOrganizeClick?: (mode?: 'login' | 'signup') => void;
}


const CaptureView: React.FC<CaptureViewProps> = ({ onOrganizeClick }) => {
  const { processAndSaveThought, setCurrentView, user, signOut, pendingText, setPendingText } = useGenieNotesStore();
  
  // Get user name from signup flow
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Your Name';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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

  // Handle restoring pending text after login
  useEffect(() => {
    if (user && pendingText) {
      // User just logged in and we have pending text - restore it to inputText
      // Navigate to capture view so user can see and save their thought
      setInputText(pendingText);
      setCurrentView('capture');
      // Clear pendingText after a short delay to ensure it's shown
      setTimeout(() => {
        setPendingText(null);
      }, 100);
    }
  }, [user, pendingText, setCurrentView, setPendingText]);

  const handleSubmit = async () => {
    const textToProcess = transcript || inputText;
    if (!textToProcess.trim()) return;
    
    // If not logged in, trigger login/signup
    if (!user) {
      if (onOrganizeClick) {
        // Save text as pending so it can be restored after login
        setPendingText(textToProcess.trim());
        onOrganizeClick('signup');
      }
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setShowSuccess(false);
    
    try {
      // Process and save thought (AI will detect Spark and suggest Potentials)
      await processAndSaveThought(textToProcess.trim());
      
      setShowSuccess(true);
      setInputText('');
      setTranscript('');
      setIsRecording(false);
      
      // Show redirecting state
      setIsRedirecting(true);
      
      // Redirect will be handled by store after thought is saved
      setTimeout(() => {
        setIsRedirecting(false);
        setShowSuccess(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error processing input:', error);
      setError(error?.message || 'Failed to save thought. Make sure the database table exists.');
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

  // Show pending text if available (after login), otherwise show current input
  const currentText = pendingText || transcript || inputText;
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
    <div className="min-h-screen bg-white">
      {/* Navigation - Use Navigation component when logged in, custom nav for landing page */}
      {user ? (
        <Navigation
          currentView="capture"
          onViewChange={setCurrentView}
          user={user}
          onLogout={signOut}
        />
      ) : (
        <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/95 backdrop-blur-md border-b-2 border-blue-100 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white relative z-10" strokeWidth={2.5} fill="white" fillOpacity="0.3" />
              </div>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Thouthy</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <button
                onClick={() => onOrganizeClick?.('login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all min-h-[40px] sm:min-h-[44px]"
              >
                Sign In
              </button>
              <button
                onClick={() => onOrganizeClick?.('signup')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 hover:from-pink-600 hover:via-orange-600 hover:to-purple-600 rounded-lg transition-all shadow-lg hover:shadow-xl min-h-[40px] sm:min-h-[44px]"
              >
                Sign Up
              </button>
            </div>
          </div>
        </nav>
      )}

      {!user ? (
        <>
          {/* Hero Section */}
          <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden flex items-center bg-gradient-to-br from-pink-50/30 via-orange-50/20 to-purple-50/30">
            {/* Floating background elements - warm pastel colors */}
            <div className="absolute top-10 left-10 w-96 h-96 bg-pink-200/25 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="text-slate-900">Collect your </span>
                <span className="relative inline-block">
                  <span className="text-purple-600 italic font-bold">thoughts</span>
                  {/* Wavy underline */}
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-2 sm:h-3 -z-10" viewBox="0 0 200 15" preserveAspectRatio="none">
                    <path d="M0,12 Q25,3 50,12 T100,12 T150,12 T200,12" stroke="#9333ea" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
                  </svg>
                </span>
                <br className="hidden sm:block" />
                <span className="text-slate-900">Act on the ones that </span>
                <span className="relative inline-block">
                  <span className="text-orange-500 italic font-bold">matter</span>
                  {/* Wavy underline */}
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-2 sm:h-3 -z-10" viewBox="0 0 200 15" preserveAspectRatio="none">
                    <path d="M0,12 Q25,3 50,12 T100,12 T150,12 T200,12" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
                  </svg>
                </span>
            </h1>
              <div className="max-w-3xl mx-auto px-2 mb-8 sm:mb-10">
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 mb-4 sm:mb-6 font-normal leading-relaxed">
                  Every thought deserves a home. <span className="font-semibold text-slate-900">Thouthy</span> collects them all, then shows you which ones have <span className="font-semibold text-amber-600">spark</span> and <span className="font-semibold text-purple-600">potential</span> — so you can <span className="font-semibold text-emerald-600">act</span> on them.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-lg sm:text-xl md:text-2xl font-semibold text-slate-700 mb-6 sm:mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Collect</span>
                </div>
                <div className="hidden sm:block text-slate-400">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span>Discover</span>
                </div>
                <div className="hidden sm:block text-slate-400">→</div>
                <div className="relative flex items-center gap-2 py-12 sm:py-16">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="relative z-10">Act</span>
                  
                  {/* Container for lines and pills - closer to Act */}
                  <div className="absolute left-full top-0 bottom-0 ml-2 w-24 sm:w-32 md:w-40">
                    {/* SVG for divergent lines starting from left (Act) pointing to left edge of pills */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                      {/* Line to Share (top) - points to left edge */}
                      <line x1="0" y1="50%" x2="100%" y2="20%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                      {/* Line to To-Do - points to left edge */}
                      <line x1="0" y1="50%" x2="100%" y2="40%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                      {/* Line to Conversation - points to left edge */}
                      <line x1="0" y1="50%" x2="100%" y2="60%" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                      {/* Line to Just a Thought (bottom) - points to left edge */}
                      <line x1="0" y1="50%" x2="100%" y2="80%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                    </svg>
                    
                    {/* 4 Action pills at end of lines - evenly spaced vertically */}
                    <div className="absolute top-[20%] -translate-y-1/2 left-full z-20">
                      <div className="px-2.5 py-1 bg-indigo-100/90 text-indigo-700 rounded-full text-xs font-medium border border-dashed border-indigo-300/60 shadow-sm flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm">
                        <div className="flex items-center gap-0.5">
                          <Linkedin className="w-3 h-3" />
                          <Instagram className="w-3 h-3" />
                          <Twitter className="w-3 h-3" />
                        </div>
                        <span>Share</span>
                      </div>
                    </div>
                    <div className="absolute top-[40%] -translate-y-1/2 left-full z-20">
                      <div className="px-2.5 py-1 bg-emerald-100/90 text-emerald-700 rounded-full text-xs font-medium border border-dashed border-emerald-300/60 shadow-sm flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm">
                        <CheckCircle className="w-3 h-3" />
                        To-Do
                      </div>
                    </div>
                    <div className="absolute top-[60%] -translate-y-1/2 left-full z-20">
                      <div className="px-2.5 py-1 bg-orange-100/90 text-orange-700 rounded-full text-xs font-medium border border-dashed border-orange-300/60 shadow-sm flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm">
                        <MessageSquare className="w-3 h-3" />
                        Conversation
                      </div>
                    </div>
                    <div className="absolute top-[80%] -translate-y-1/2 left-full z-20">
                      <div className="px-2.5 py-1 bg-indigo-100/90 text-indigo-700 rounded-full text-xs font-medium border border-dashed border-indigo-300/60 shadow-sm flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm">
                        <Brain className="w-3 h-3" />
                        Just a Thought
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </div>
          </section>

          {/* Capture Card */}
          <div className="py-12 sm:py-16 bg-white relative overflow-visible">
            {/* Floating background orbs - subtle */}
            <div className="absolute top-10 right-10 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-100/20 rounded-full blur-3xl"></div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="p-6 sm:p-8 lg:p-10 xl:p-12 bg-white/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50">
                <div className="mb-6 sm:mb-8 lg:mb-10 text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
                    <span className="text-slate-900">What's on your </span>
                    <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 bg-clip-text text-transparent italic pr-1">mind?</span>
                  </h2>
                  {/* Floating example thoughts under heading */}
                  <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-4">
                    <span className="px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-xs sm:text-sm text-purple-800 font-medium shadow-sm">
                      "Gratitude practice changed my perspective on daily challenges"
                    </span>
                    <span className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-medium shadow-sm">
                      "Call mom this weekend to catch up"
                    </span>
                    <span className="px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800 font-medium shadow-sm">
                      "Small acts of kindness create ripple effects"
                    </span>
                  </div>
                </div>
                
                <div className="mb-6 sm:mb-8 relative">
                  {/* Subtle gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 via-orange-50/50 to-purple-50/50 rounded-xl sm:rounded-2xl"></div>
                  <textarea
                    value={pendingText || transcript || inputText}
                    onChange={(e) => {
                      if (pendingText) {
                        setPendingText(e.target.value);
                        setInputText(e.target.value);
                      } else if (transcript) {
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
                    className="relative w-full p-4 sm:p-6 text-sm sm:text-base lg:text-lg bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-300/50 resize-none h-32 sm:h-44 lg:h-52 border border-slate-200/60 shadow-sm hover:border-pink-200/80 transition-all"
                  />
                    </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0">
                  <div className="flex items-center gap-2">
                    {/* Voice Input Button */}
                    {isSpeechRecognitionAvailable() ? (
                      <button
                        onClick={handleVoiceInput}
                        className={`p-3 sm:p-3.5 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                          isRecording 
                            ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                            : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 hover:from-blue-200 hover:to-cyan-200 hover:scale-105'
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
                        className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                        className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 hover:from-blue-200 hover:to-cyan-200 transition-all shadow-md hover:shadow-lg hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Upload training data"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                      
                      {showUpload && (
                        <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
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
                    className={`w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl min-h-[44px] ${
                      hasContent && !isProcessing
                        ? 'bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white hover:from-pink-600 hover:via-orange-600 hover:to-purple-600 hover:scale-105'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Capturing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Capture</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

                {/* Success Message */}
                {showSuccess && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-purple-700">
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

          {/* The Journey of a Thought */}
          <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50/30 to-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16 sm:mb-20">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                  The journey of a <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 bg-clip-text text-transparent italic">thought</span>
                </h2>
              </div>

              <div className="space-y-20 sm:space-y-28">
                {/* Step 1: Capture */}
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  <div className="w-full lg:w-1/2 flex-shrink-0 order-2 lg:order-1">
                    {/* Sketch-style App Mockup - Capture Screen */}
                    <div className="relative">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-dashed border-blue-300/60 shadow-lg" style={{ transform: 'rotate(-1deg)' }}>
                        <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b-2 border-dashed border-blue-200/40 px-4 py-3 flex items-center justify-between rounded-t-2xl">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-pink-400 to-orange-400 rounded-lg flex items-center justify-center shadow-sm">
                              <Brain className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-bold text-slate-800">Thouthy</span>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="mb-4">
                            <h4 className="text-xl font-bold text-slate-900 mb-2">What's on your <span className="text-purple-500 italic">mind?</span></h4>
                          </div>
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-5 border-2 border-dashed border-slate-300/50 mb-4">
                            <p className="text-slate-700 leading-relaxed italic text-sm">
                              "AI speeds everything up. Good and bad stuff. 10x multiplier."
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-5 py-2.5 bg-gradient-to-r from-pink-400 via-orange-400 to-purple-400 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md">
                              <Sparkles className="w-3.5 h-3.5" />
                              Capture
                            </button>
                            <button className="p-2.5 bg-blue-100/60 text-blue-600 rounded-xl border border-dashed border-blue-300/50">
                              <Mic className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Decorative sketch lines */}
                      <div className="absolute -top-2 -right-2 w-16 h-16 border-2 border-dashed border-pink-300/40 rounded-full opacity-60"></div>
                      <div className="absolute -bottom-3 -left-3 w-12 h-12 border-2 border-dashed border-orange-300/40 rounded-full opacity-50"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left order-1 lg:order-2">
                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Capture</h3>
                    <p className="text-lg sm:text-xl text-slate-600 mb-3 leading-relaxed">
                      A thought appears at the wrong moment. Normally, it's lost.
                    </p>
                    <p className="text-base sm:text-lg text-slate-500">
                      <span className="text-slate-700 font-semibold">Thouthy:</span> You capture it instantly.
                    </p>
                  </div>
                </div>

                {/* Step 2: Discover */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16">
                  <div className="w-full lg:w-1/2 flex-shrink-0 order-2 lg:order-1">
                    {/* Sketch-style App Mockup - Discover (Spark & Potential) */}
                    <div className="relative">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-dashed border-amber-300/60 shadow-lg" style={{ transform: 'rotate(1deg)' }}>
                        <div className="bg-gradient-to-r from-amber-50/50 to-purple-50/50 border-b-2 border-dashed border-amber-200/40 px-4 py-3 rounded-t-2xl">
                          <h3 className="text-lg font-bold text-slate-800">Thoughts</h3>
                        </div>
                        <div className="p-5">
                          {/* Thought Card */}
                          <div className="bg-white rounded-xl border-2 border-dashed border-amber-300/60 p-5 shadow-sm mb-4 relative">
                            {/* 3. Spark icon - top right (can be clicked to add manually) */}
                            <button className="absolute -top-2 -right-2 w-8 h-8 bg-amber-200/80 rounded-full flex items-center justify-center border-2 border-dashed border-amber-400/60 shadow-sm hover:bg-amber-300/80 transition-colors">
                              <Sparkles className="w-4 h-4 text-amber-700" />
                            </button>
                            
                            {/* 1. Raw thought */}
                            <p className="text-slate-800 text-sm leading-relaxed mb-3 pr-8">
                              AI speeds everything up. Good and bad stuff. 10x multiplier.
                            </p>
                            
                            {/* 2. AI-based topic pills */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="px-2.5 py-1 bg-blue-100/70 text-blue-700 rounded-lg text-xs font-medium border border-dashed border-blue-300/50">
                                tech
                              </span>
                              <span className="px-2.5 py-1 bg-indigo-100/70 text-indigo-700 rounded-lg text-xs font-medium border border-dashed border-indigo-300/50">
                                work
                              </span>
                            </div>
                            
                            {/* 4. AI-based potential buttons/pills with CTA */}
                            <div className="flex flex-wrap gap-2">
                              <button className="px-3 py-1.5 bg-purple-100/70 text-purple-700 rounded-lg text-xs font-medium border border-dashed border-purple-300/60 hover:bg-purple-200/70 transition-colors flex items-center gap-1.5">
                                <span>💬</span>
                                <span>Share</span>
                                <span className="text-purple-500">→</span>
                              </button>
                              <button className="px-3 py-1.5 bg-emerald-100/70 text-emerald-700 rounded-lg text-xs font-medium border border-dashed border-emerald-300/60 hover:bg-emerald-200/70 transition-colors flex items-center gap-1.5">
                                <span>✓</span>
                                <span>To-Do</span>
                                <span className="text-emerald-500">→</span>
                              </button>
                              <button className="px-3 py-1.5 bg-orange-100/70 text-orange-700 rounded-lg text-xs font-medium border border-dashed border-orange-300/60 hover:bg-orange-200/70 transition-colors flex items-center gap-1.5">
                                <span>💭</span>
                                <span>Conversation</span>
                                <span className="text-orange-500">→</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Decorative sketch lines */}
                      <div className="absolute -top-3 -left-3 w-14 h-14 border-2 border-dashed border-amber-300/40 rounded-full opacity-60"></div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 border-2 border-dashed border-purple-300/40 rounded-full opacity-50"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left order-1 lg:order-2">
                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Discover</h3>
                    <p className="text-lg sm:text-xl text-slate-600 mb-3 leading-relaxed">
                      The thought finds meaning — revealing its <span className="font-semibold text-amber-600">spark</span> and what it <span className="font-semibold text-purple-600">could become</span>.
                    </p>
                    <p className="text-base sm:text-lg text-slate-500">
                      <span className="text-slate-700 font-semibold">Thouthy:</span> Evaluates it and shows potential, without forcing anything.
                    </p>
                  </div>
                </div>

                {/* Step 3: Organize */}
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  <div className="w-full lg:w-1/2 flex-shrink-0 order-2 lg:order-1">
                    {/* Sketch-style App Mockup - All Thoughts View */}
                    <div className="relative">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-dashed border-indigo-300/60 shadow-lg" style={{ transform: 'rotate(-0.5deg)' }}>
                        <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border-b-2 border-dashed border-indigo-200/40 px-4 py-3 flex items-center justify-between rounded-t-2xl">
                          <h3 className="text-lg font-bold text-slate-800">Thoughts</h3>
                          <div className="flex items-center gap-2">
                            <button className="px-2.5 py-1 bg-indigo-100/70 text-indigo-700 rounded-lg text-xs font-medium border border-dashed border-indigo-300/50">All</button>
                            <button className="px-2.5 py-1 bg-white/50 text-slate-600 rounded-lg text-xs font-medium border border-dashed border-slate-300/50">Parked</button>
                          </div>
                        </div>
                        <div className="p-5">
                          {/* Search and filters - minimal design */}
                          <div className="mb-4">
                            {/* Search bar with filter button */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Search thoughts..." 
                                  className="w-full pl-9 pr-3 py-2 bg-white/60 rounded-lg border-2 border-dashed border-slate-300/50 text-xs focus:outline-none focus:border-indigo-300/60"
                                  readOnly
                                />
                              </div>
                              <button className="px-3 py-2 bg-white/60 rounded-lg border-2 border-dashed border-slate-300/50 hover:bg-slate-50/60 transition-colors text-xs font-medium text-slate-600 whitespace-nowrap">
                                Filter
                              </button>
                            </div>
                            
                            {/* Active filters as chips - only show when filters are active */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-1 bg-purple-100/70 text-purple-700 rounded-lg text-xs font-medium border border-dashed border-purple-300/50 flex items-center gap-1.5">
                                Share
                                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" />
                              </span>
                              <span className="px-2.5 py-1 bg-slate-100/70 text-slate-600 rounded-lg text-xs font-medium border border-dashed border-slate-300/50 flex items-center gap-1.5">
                                tech
                                <X className="w-3 h-3 cursor-pointer hover:text-slate-800" />
                              </span>
                            </div>
                          </div>
                          
                          {/* Thoughts grid - Same card style as Discover */}
                          <div className="space-y-3">
                            {/* Thought 1: With Spark, Share potential */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-amber-300/60 p-4 shadow-sm relative">
                              <button className="absolute -top-2 -right-2 w-6 h-6 bg-amber-200/70 rounded-full flex items-center justify-center border border-dashed border-amber-300/50 hover:bg-amber-300/70 transition-colors">
                                <Sparkles className="w-3 h-3 text-amber-700" />
                              </button>
                              <p className="text-slate-800 text-xs leading-relaxed mb-3 pr-7">
                                Small acts of kindness create ripple effects
                              </p>
                              {/* Topic tags and CTAs on same row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 bg-purple-100/70 text-purple-700 text-xs rounded-lg border border-dashed border-purple-300/50">insight</span>
                                  <span className="px-2 py-0.5 bg-indigo-100/70 text-indigo-700 text-xs rounded-lg border border-dashed border-indigo-300/50">wellbeing</span>
                                </div>
                                {/* Potential CTAs - right side */}
                                <div className="flex flex-wrap gap-1.5">
                                  <button className="px-2.5 py-1 bg-purple-100/70 text-purple-700 rounded-lg text-xs font-medium border border-dashed border-purple-300/60 hover:bg-purple-200/70 transition-colors flex items-center gap-1">
                                    <span>💬</span>
                                    <span>Share</span>
                                    <span className="text-purple-500 text-xs">→</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Thought 2: Reflection/Insight */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200/50 p-4 shadow-sm">
                              <p className="text-slate-800 text-xs leading-relaxed mb-3">
                                Morning coffee ritual is my favorite part of the day
                              </p>
                              {/* Topic tags - no CTAs for this reflection */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 bg-slate-100/70 text-slate-600 text-xs rounded-lg border border-dashed border-slate-300/50">routine</span>
                                <span className="px-2 py-0.5 bg-indigo-100/70 text-indigo-700 text-xs rounded-lg border border-dashed border-indigo-300/50">wellbeing</span>
                              </div>
                            </div>
                            
                            {/* Thought 3: With To-Do potential */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200/50 p-4 shadow-sm">
                              <p className="text-slate-800 text-xs leading-relaxed mb-3">
                                Call mom this weekend to catch up
                              </p>
                              {/* Topic tags and CTAs on same row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 bg-pink-100/70 text-pink-700 text-xs rounded-lg border border-dashed border-pink-300/50">personal</span>
                                  <span className="px-2 py-0.5 bg-indigo-100/70 text-indigo-700 text-xs rounded-lg border border-dashed border-indigo-300/50">family</span>
                                </div>
                                {/* Potential CTAs - right side */}
                                <div className="flex flex-wrap gap-1.5">
                                  <button className="px-2.5 py-1 bg-emerald-100/70 text-emerald-700 rounded-lg text-xs font-medium border border-dashed border-emerald-300/60 hover:bg-emerald-200/70 transition-colors flex items-center gap-1">
                                    <span>✓</span>
                                    <span>To-Do</span>
                                    <span className="text-emerald-500 text-xs">→</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Thought 4: With Conversation potential */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200/50 p-4 shadow-sm">
                              <p className="text-slate-800 text-xs leading-relaxed mb-3">
                                Team meetings feel unproductive. Too many voices, no clear decisions.
                              </p>
                              {/* Topic tags and CTAs on same row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 bg-slate-100/70 text-slate-600 text-xs rounded-lg border border-dashed border-slate-300/50">work</span>
                                </div>
                                {/* Potential CTAs - right side */}
                                <div className="flex flex-wrap gap-1.5">
                                  <button className="px-2.5 py-1 bg-orange-100/70 text-orange-700 rounded-lg text-xs font-medium border border-dashed border-orange-300/60 hover:bg-orange-200/70 transition-colors flex items-center gap-1">
                                    <span>💭</span>
                                    <span>Conversation</span>
                                    <span className="text-orange-500 text-xs">→</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Decorative sketch lines */}
                      <div className="absolute -top-2 -right-2 w-12 h-12 border-2 border-dashed border-indigo-300/40 rounded-full opacity-60"></div>
                      <div className="absolute -bottom-3 -left-3 w-16 h-16 border-2 border-dashed border-blue-300/40 rounded-full opacity-50"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left order-1 lg:order-2">
                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Organize</h3>
                    <p className="text-lg sm:text-xl text-slate-600 mb-3 leading-relaxed">
                      All thoughts are saved — never get lost. Search, filter by sparks, topics, or actions, and manually act on any of them.
                    </p>
                    <p className="text-base sm:text-lg text-slate-500">
                      <span className="text-slate-700 font-semibold">Thouthy:</span> Keeps everything organized and accessible. Optional Daily/Weekly Mind Review available.
                    </p>
                  </div>
                </div>

                {/* Step 4: Act */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16">
                  <div className="w-full lg:w-1/2 flex-shrink-0 order-2 lg:order-1">
                    {/* Sketch-style App Mockup - Actions with LinkedIn Post and To-Do */}
                    <div className="relative">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-dashed border-emerald-300/60 shadow-lg" style={{ transform: 'rotate(0.5deg)' }}>
                        <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-b-2 border-dashed border-emerald-200/40 px-4 py-3 flex items-center gap-3 rounded-t-2xl">
                          <span className="text-slate-400">←</span>
                          <h3 className="text-lg font-bold text-slate-800">Actions</h3>
                        </div>
                        <div className="p-5 space-y-3">
                          {/* Social Posts - All Three Platforms */}
                          <div className="grid grid-cols-1 gap-3">
                            {/* LinkedIn Post - Long Form */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-blue-300/60 p-3 shadow-sm">
                              <div className="flex items-start gap-2.5 mb-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-semibold">JD</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-semibold text-slate-800">John Doe</span>
                                    <Linkedin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-500">• 2h</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500">Software Engineer</p>
                                </div>
                              </div>
                              <div className="mb-2.5">
                                <p className="text-[10px] text-slate-800 leading-relaxed mb-1.5">
                                  AI doesn't just accelerate your work. It amplifies everything—including your mistakes.
                                </p>
                                <p className="text-[10px] text-slate-800 leading-relaxed mb-1.5">
                                  Give it messy code? You'll ship 10x messier code faster. Feed it bad data? You'll get 10x more bad insights. The multiplier works both ways.
                                </p>
                                <p className="text-[10px] text-slate-800 leading-relaxed">
                                  Quality gates aren't optional anymore. They're the difference between scaling your impact and scaling your problems.
                                </p>
                              </div>
                              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/50">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  <span className="text-[10px]">24</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-[10px]">8</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="text-[10px]">12</span>
                                </button>
                              </div>
                            </div>

                            {/* X (Twitter) Post - Short Form */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300/60 p-3 shadow-sm">
                              <div className="flex items-start gap-2.5 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-semibold">JD</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-semibold text-slate-800">John Doe</span>
                                    <Twitter className="w-3 h-3 text-slate-600 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-500">@johndoe • 1h</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mb-2">
                                <p className="text-[10px] text-slate-800 leading-relaxed">
                                  AI 10x's whatever you give it. Quality gates aren't optional anymore. 🚀
                                </p>
                              </div>
                              <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-[10px]">5</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-green-500 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span className="text-[10px]">12</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="text-[10px]">8</span>
                                </button>
                              </div>
                            </div>

                            {/* Instagram Post - Medium Form with Visual */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-pink-300/60 p-3 shadow-sm">
                              <div className="flex items-start gap-2.5 mb-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 via-purple-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-semibold">JD</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-semibold text-slate-800">johndoe</span>
                                    <Instagram className="w-3 h-3 text-pink-600 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-500">• 3h</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mb-2.5">
                                <p className="text-[10px] text-slate-800 leading-relaxed mb-1.5">
                                  AI doesn't just accelerate your work. It amplifies everything—including your mistakes. Give it messy code? You'll ship 10x messier code faster.
                                </p>
                                <p className="text-[10px] text-slate-800 leading-relaxed">
                                  Quality gates aren't optional anymore. They're the difference between scaling your impact and scaling your problems. 💡
                                </p>
                              </div>
                              <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="text-[10px]">42</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-[10px]">6</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* To-Do Item */}
                          <div className="bg-white rounded-xl border-2 border-dashed border-emerald-300/60 p-3 shadow-sm">
                            <div className="flex items-start gap-2.5">
                              <div className="w-4 h-4 border-2 border-emerald-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-2.5 h-2.5 text-emerald-600 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-xs font-semibold text-slate-800">To-Do</span>
                                </div>
                                <p className="text-[10px] text-slate-700 leading-relaxed mb-1.5">
                                  Document quality gates for AI-assisted development
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>Due: This week</span>
                                  <span>•</span>
                                  <span>Priority: High</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Decorative sketch lines */}
                      <div className="absolute -top-2 -right-2 w-12 h-12 border-2 border-dashed border-emerald-300/40 rounded-full opacity-60"></div>
                      <div className="absolute -bottom-3 -left-3 w-16 h-16 border-2 border-dashed border-blue-300/40 rounded-full opacity-50"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left order-1 lg:order-2">
                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Act</h3>
                    <p className="text-lg sm:text-xl text-slate-600 mb-3 leading-relaxed">
                      When you're ready, you act with clarity — post, to-do, conversation.
                    </p>
                    <p className="text-base sm:text-lg text-slate-500">
                      <span className="text-slate-700 font-semibold">Thouthy:</span> Generates ready-to-share posts for all social platforms, creates to-dos, and suggests conversations — helping you act on the thoughts that truly matter.
                    </p>
                  </div>
                </div>

                {/* Step 5: Thought Review */}
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  <div className="w-full lg:w-1/2 flex-shrink-0 order-2 lg:order-1">
                    {/* Sketch-style App Mockup - Thought Review */}
                    <div className="relative">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-dashed border-purple-300/60 shadow-lg" style={{ transform: 'rotate(-0.5deg)' }}>
                        <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b-2 border-dashed border-purple-200/40 px-4 py-3 flex items-center gap-3 rounded-t-2xl">
                          <Bell className="w-4 h-4 text-purple-600" />
                          <h3 className="text-lg font-bold text-slate-800">Mind Review</h3>
                        </div>
                        <div className="p-5 space-y-4">
                          {/* Review Options */}
                          <div className="flex items-center gap-3 mb-4">
                            <button className="flex-1 px-4 py-2.5 bg-purple-100/70 text-purple-700 rounded-lg text-sm font-medium border border-dashed border-purple-300/50 hover:bg-purple-200/70 transition-colors flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Daily</span>
                            </button>
                            <button className="flex-1 px-4 py-2.5 bg-white/60 text-slate-600 rounded-lg text-sm font-medium border border-dashed border-slate-300/50 hover:bg-slate-50/60 transition-colors flex items-center justify-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Weekly</span>
                            </button>
                          </div>

                          {/* Gentle Nudge Card */}
                          <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/60 rounded-xl border-2 border-dashed border-purple-300/60 p-4 shadow-sm">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 bg-purple-200/70 rounded-full flex items-center justify-center flex-shrink-0">
                                <Brain className="w-5 h-5 text-purple-700" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-800 mb-1">Time for a quick review?</h4>
                                <p className="text-xs text-slate-600 mb-3">
                                  You have 3 new thoughts today. Take 2 minutes to review and organize them.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
                                    Review Now
                                  </button>
                                  <button className="px-3 py-1.5 bg-white/60 text-slate-600 rounded-lg text-xs font-medium border border-dashed border-slate-300/50 hover:bg-slate-50/60 transition-colors">
                                    Later
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Stats Preview */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/60 rounded-lg p-3 border border-dashed border-amber-300/50 text-center">
                              <div className="text-lg font-bold text-amber-700 mb-1">5</div>
                              <div className="text-xs text-slate-600">Sparks</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3 border border-dashed border-purple-300/50 text-center">
                              <div className="text-lg font-bold text-purple-700 mb-1">8</div>
                              <div className="text-xs text-slate-600">Actions</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3 border border-dashed border-blue-300/50 text-center">
                              <div className="text-lg font-bold text-blue-700 mb-1">12</div>
                              <div className="text-xs text-slate-600">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Decorative sketch lines */}
                      <div className="absolute -top-2 -right-2 w-12 h-12 border-2 border-dashed border-purple-300/40 rounded-full opacity-60"></div>
                      <div className="absolute -bottom-3 -left-3 w-16 h-16 border-2 border-dashed border-pink-300/40 rounded-full opacity-50"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left order-1 lg:order-2">
                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Review</h3>
                    <p className="text-lg sm:text-xl text-slate-600 mb-3 leading-relaxed">
                      Periodically, you pause to review — reflect, organize, and decide what matters.
                    </p>
                    <p className="text-base sm:text-lg text-slate-500">
                      <span className="text-slate-700 font-semibold">Thouthy:</span> Gently nudges you to review your thoughts daily or weekly, helping you stay organized and intentional.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Footer - Vibrant gradient */}
          <footer className="relative z-10 border-t-2 border-slate-200/50 bg-gradient-to-br from-slate-50/40 via-blue-50/20 to-pink-50/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
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
                    className="p-2 rounded-lg bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:scale-110 transition-all shadow-sm"
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
        /* Logged in view - clean capture interface */
        <>
          <div className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 via-white to-purple-50/20 relative overflow-visible">
          {/* Floating background orbs - subtle */}
          <div className="absolute top-10 right-10 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-100/20 rounded-full blur-3xl"></div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12 bg-white/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50">
              <div className="mb-6 sm:mb-8 lg:mb-10 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
                  <span className="text-slate-900">What's on your </span>
                  <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 bg-clip-text text-transparent italic pr-1">mind?</span>
                </h2>
              </div>
              
              <div className="mb-6 sm:mb-8 relative">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 via-orange-50/50 to-purple-50/50 rounded-xl sm:rounded-2xl"></div>
                <textarea
                  value={pendingText || transcript || inputText}
                  onChange={(e) => {
                    if (pendingText) {
                      setPendingText(e.target.value);
                      setInputText(e.target.value);
                    } else if (transcript) {
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
                  className="relative w-full p-4 sm:p-6 text-sm sm:text-base lg:text-lg bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-300/50 resize-none h-32 sm:h-44 lg:h-52 border border-slate-200/60 shadow-sm hover:border-pink-200/80 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-2">
                  {/* Voice Input Button */}
                  {isSpeechRecognitionAvailable() ? (
                    <button
                      onClick={handleVoiceInput}
                      className={`p-3 sm:p-3.5 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                          : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 hover:from-blue-200 hover:to-cyan-200 hover:scale-105'
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
                      className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                      className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 hover:from-blue-200 hover:to-cyan-200 transition-all shadow-md hover:shadow-lg hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Upload training data"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    
                    {showUpload && (
                      <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
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
                  className={`w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl min-h-[44px] ${
                    hasContent && !isProcessing
                      ? 'bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white hover:from-pink-600 hover:via-orange-600 hover:to-purple-600 hover:scale-105'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Capturing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Capture</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-purple-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Thought captured and saved!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      )}

    </div>
  );
};

export default CaptureView;
