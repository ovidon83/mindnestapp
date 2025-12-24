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
      // Use EmailJS - simple email service
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
      
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            email: email,
            to_email: 'ovidon83@gmail.com',
            subject: 'New Thouthy Early Access Subscription',
            message: `New email subscription: ${email}`,
          },
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Successfully subscribed! We\'ll be in touch soon.' });
        setEmail('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.text || 'Failed to subscribe. Please try again.' });
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
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base transition-all duration-200"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 min-h-[44px] ${
            isSubmitting || !email
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 shadow-lg hover:shadow-xl font-bold'
          }`}
        >
          {isSubmitting ? 'Subscribing...' : 'Early Access'}
        </button>
      </form>
      {message && (
        <div className={`absolute top-full mt-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
          message.type === 'success' 
            ? 'bg-purple-50 text-purple-700 border border-purple-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
  };

const CaptureView: React.FC<CaptureViewProps> = ({ onOrganizeClick }) => {
  const { processAndSave, setCurrentView, user, signOut, pendingText, setPendingText } = useGenieNotesStore();
  
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
    
    // If not logged in, preserve text and trigger auth flow
    if (!user) {
      setPendingText(textToProcess.trim());
      // Keep the text in the textarea so user sees it after login
      if (onOrganizeClick) {
        onOrganizeClick('signup');
      }
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setShowSuccess(false);
    
    try {
      // Determine if it's short-form or long-form (journal)
      // Long-form: > 500 characters or multiple paragraphs
      const isLongForm = textToProcess.trim().length > 500 || (textToProcess.match(/\n\n/g) || []).length >= 2;
      const entryType = isLongForm ? 'journal' : 'thought';
      
      // Always capture as single canonical entity - AI will add metadata
      await processAndSave(textToProcess, entryType);
      
      setShowSuccess(true);
      setInputText('');
      setTranscript('');
      setIsRecording(false);
      
      // Show redirecting state
      setIsRedirecting(true);
      
      // Redirect will be handled by store after entry is saved
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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/95 backdrop-blur-md border-b-2 border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white relative z-10" strokeWidth={2.5} fill="white" fillOpacity="0.3" />
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Thouthy</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('mindbox')}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-lg transition-all min-h-[40px] sm:min-h-[44px]"
                >
                  <span className="hidden sm:inline">Mindbox</span>
                  <span className="sm:hidden">Box</span>
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
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-lg transition-all min-h-[40px] sm:min-h-[44px]"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    if (onOrganizeClick) {
                      onOrganizeClick('signup');
                    }
                  }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:border-purple-400 transition-all min-h-[40px] sm:min-h-[44px]"
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
          {/* Hero Section */}
          <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden flex items-center bg-gradient-to-br from-pink-50/30 via-orange-50/20 to-purple-50/30">
            {/* Floating background elements - warm pastel colors */}
            <div className="absolute top-10 left-10 w-96 h-96 bg-pink-200/25 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="text-slate-900">Give your </span>
                <span className="relative inline-block">
                  <span className="text-purple-600 italic font-bold">thoughts</span>
                  {/* Wavy underline */}
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-2 sm:h-3 -z-10" viewBox="0 0 200 15" preserveAspectRatio="none">
                    <path d="M0,12 Q25,3 50,12 T100,12 T150,12 T200,12" stroke="#9333ea" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
                  </svg>
                </span>
                <span className="text-slate-900"> real </span>
                <span className="relative inline-block">
                  <span className="text-yellow-500 italic font-bold">meaning</span>
                  {/* Wavy underline */}
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-2 sm:h-3 -z-10" viewBox="0 0 200 15" preserveAspectRatio="none">
                    <path d="M0,12 Q25,3 50,12 T100,12 T150,12 T200,12" stroke="#eab308" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
                  </svg>
                </span>
            </h1>
              <div className="max-w-3xl mx-auto px-2 mb-8 sm:mb-10">
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 mb-4 sm:mb-6 font-normal leading-relaxed">
                  Capture every thought. <span className="font-semibold text-slate-900">Thouthy</span> identifies the ones with real potential — and turns them into action.
                </p>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 tracking-wide">
                Capture. Observe. Act
              </p>
              <div className="mt-6 sm:mt-8 px-2">
                <EmailSubscription />
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
                    <span className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium shadow-sm">
                      "State inspection for the Equinox"
                    </span>
                    <span className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-xs sm:text-sm text-indigo-800 font-medium shadow-sm">
                      "AI can give startups a false sense of speed"
                    </span>
                    <span className="px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800 font-medium shadow-sm">
                      "Need an information detox!"
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

          {/* Showcase Section - Redesigned */}
          <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50/30 to-white relative overflow-hidden">
            {/* Enhanced decorative elements */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-56 h-56 bg-orange-100/30 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                  See it in <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 bg-clip-text text-transparent italic">action</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
                  How a single thought turns into meaning and action over time.
                </p>
              </div>

              {/* Flow: Capture → Spark → Potential → Action */}
              <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
                
                {/* User Section */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 sm:p-8 border border-blue-200/60">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">You</span>
                    </div>
                    <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">What you do</h3>
                  </div>
                  
                  {/* Step 1: Raw Thought Captured */}
                  <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mic className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-slate-900">You capture</h3>
                        <p className="text-xs text-slate-500">Voice or text, instantly</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                        "AI is really accelerating everything! Including bugs, misalignment, bad decisions, technical debt. It 10x whatever you put in its hands."
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">Saved as a living thought — always editable</p>
                  </div>
                </div>

                {/* Subtle Transition */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative bg-white px-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Thouthy Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 border border-purple-200/60">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-xs font-semibold text-purple-900 uppercase tracking-wide">What Thouthy does</h3>
                  </div>

                    {/* Step 2: Spark Detected */}
                    <div className="relative mb-6">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 to-amber-300 transform -translate-x-1/2 hidden sm:block"></div>
                      <div className="bg-white rounded-xl shadow-md border-2 border-amber-200 p-6 sm:p-8 relative">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-base font-medium text-slate-900">Spark detected</h3>
                            <p className="text-xs text-slate-500">Automatically — a sign this thought matters</p>
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <p className="text-sm text-slate-700 mb-2">
                            <span className="font-semibold text-amber-700">Why it matters:</span> Strong opinion, clear problem, recurring theme
                          </p>
                          <p className="text-xs text-slate-600 italic">You can also mark thoughts as Sparks yourself</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Potential Revealed */}
                    <div className="relative mb-6">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-purple-300 transform -translate-x-1/2 hidden sm:block"></div>
                      <div className="bg-white rounded-xl shadow-md border-2 border-purple-200 p-6 sm:p-8 relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-slate-900">This thought could become...</h3>
                        <p className="text-xs text-slate-500">Potential revealed</p>
                      </div>
                    </div>

                    {/* Social Posts - Platform Specific */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4">Post</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* LinkedIn */}
                        <div className="bg-white rounded-lg border-2 border-blue-100 shadow-sm overflow-hidden">
                          <div className="p-3 bg-blue-50 flex items-center gap-2 border-b border-blue-100">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{userInitials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 truncate">{userName}</div>
                              <div className="text-[10px] text-gray-500">Developer • 1st</div>
                            </div>
                            <Linkedin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-gray-900 leading-relaxed">
                              AI accelerates everything—the good and the bad. It 10x's whatever you put in its hands.
                            </p>
                            <p className="text-xs text-gray-900 leading-relaxed mt-2">
                              Give it messy code? You'll get 10x messier code faster. Give it clear problems? You'll get 10x better solutions.
                            </p>
                            <p className="text-xs text-gray-900 leading-relaxed mt-2">
                              The lesson: quality gates and alignment matter more than ever. What are you feeding your AI?
                            </p>
                          </div>
                        </div>

                        {/* Twitter/X */}
                        <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm overflow-hidden">
                          <div className="p-3 bg-white flex items-center gap-2 border-b border-slate-200">
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{userInitials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 truncate">{userName}</div>
                              <div className="text-[10px] text-gray-500">@username</div>
                            </div>
                            <Twitter className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-gray-900 leading-relaxed">
                              AI 10x's whatever you give it.
                            </p>
                            <p className="text-xs text-gray-900 leading-relaxed mt-2">
                              Bugs → 10x bugs
                              <br />
                              Technical debt → 10x debt
                              <br />
                              Bad decisions → 10x bad decisions
                            </p>
                            <p className="text-xs text-gray-900 leading-relaxed mt-2">
                              Quality gates aren't optional anymore. 🚀
                            </p>
                          </div>
                        </div>

                        {/* Instagram */}
                        <div className="bg-white rounded-lg border-2 border-rose-100 shadow-sm overflow-hidden">
                          <div className="p-2 bg-white flex items-center justify-between border-b border-rose-100">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[10px] font-bold">{userInitials}</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900">{userName.toLowerCase().replace(/\s+/g, '')}</span>
                            </div>
                            <Instagram className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          </div>
                          <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-gray-900 leading-relaxed">
                              <span className="font-semibold">{userName.toLowerCase().replace(/\s+/g, '')}</span> AI accelerates everything—bugs, technical debt, bad decisions. It 10x's whatever you put in. Quality gates are non-negotiable. 💡
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Other Potentials */}
                    <div className="space-y-4">
                      {/* Conversation */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm font-semibold text-slate-700">Conversation</span>
                          </div>
                          <span className="text-xs text-slate-500">Talking points</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600">• "AI amplifies everything—good and bad. Quality gates are critical."</p>
                          <p className="text-xs text-slate-600">• "What we put in determines what we get out—10x."</p>
                          <p className="text-xs text-slate-600">• "Technical debt compounds faster with AI. We need better processes."</p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-semibold text-slate-700">Email</span>
                          </div>
                          <span className="text-xs text-slate-500">Draft ready</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-700">Subject: AI Quality Gates - A Critical Discussion</p>
                          <p className="text-xs text-slate-600">Hi [Name],</p>
                          <p className="text-xs text-slate-600">I've been thinking about how AI accelerates everything we give it—including technical debt and bad decisions. Quality gates aren't optional anymore. Would love to discuss our approach to this.</p>
                          <p className="text-xs text-slate-600">Best,</p>
                        </div>
                      </div>

                      {/* Idea to Explore */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span className="text-sm font-semibold text-slate-700">Idea to explore</span>
                          </div>
                          <span className="text-xs text-slate-500">Next steps</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600">• Research AI quality frameworks and best practices</p>
                          <p className="text-xs text-slate-600">• Explore technical debt measurement tools</p>
                          <p className="text-xs text-slate-600">• Document quality gates for AI-assisted development</p>
                        </div>
                      </div>
                    </div>

                        <p className="text-xs text-slate-500 mt-6 italic text-center">You can add your own Potential anytime</p>
                      </div>
                    </div>

                    {/* Step 4: Action Taken */}
                    <div className="relative">
                      <div className="bg-white rounded-xl shadow-md border-2 border-emerald-200 p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-base font-medium text-slate-900">Action taken</h3>
                            <p className="text-xs text-slate-500">You choose when to act — linked back to the original thought</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 mb-1">Posted on LinkedIn</p>
                              <p className="text-xs text-slate-600">Using the draft from Potential</p>
                              <p className="text-xs text-slate-500 mt-2 italic">Always connected to your original thought</p>
                            </div>
                          </div>
                        </div>
                      </div>
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
        /* Logged in view - match landing page design exactly */
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
                  <span className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium shadow-sm">
                    "State inspection for the Equinox"
                  </span>
                  <span className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-xs sm:text-sm text-indigo-800 font-medium shadow-sm">
                    "AI can give startups a false sense of speed"
                  </span>
                  <span className="px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800 font-medium shadow-sm">
                    "Need an information detox!"
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
      )}
    </div>
  );
};

export default CaptureView;
