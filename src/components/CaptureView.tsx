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
                <span className="text-slate-900">It's time to give your </span>
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
                <span className="text-slate-900">.</span>
            </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto font-normal leading-relaxed px-2">
                Never lose a thought again — and let them empower you!
                <br className="hidden sm:block" />
                <span className="font-semibold text-slate-800">Capture. Observe. Act.</span>
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
                  One thought. Infinite possibilities.
                </p>
              </div>

              {/* Hero Thought Card */}
              <div className="max-w-3xl mx-auto mb-16">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-pink-200 p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100/50 to-transparent rounded-bl-full"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">You capture</h3>
                        <p className="text-xs text-slate-500">On your morning walk</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100/30 rounded-xl p-5 border border-pink-200">
                      <p className="text-base sm:text-lg text-slate-800 leading-relaxed italic">
                        "AI is making everything faster. It accelerates whatever we put in its hands—the good and the bad. Give it messy code, lack of alignment, and so on... it'll speed up the mess exponentially."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Step Visual Flow */}
              <div className="max-w-6xl mx-auto mb-16">
                <div className="relative">
                  {/* Connecting Line - Desktop Only */}
                  <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-200 via-orange-200 to-purple-200 transform -translate-y-1/2"></div>
                  
                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
                    {/* Step 1: Analyze */}
                    <div className="relative bg-white rounded-xl shadow-lg border-2 border-orange-200 p-5 hover:shadow-xl transition-all hover:scale-105">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg z-10">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Analyzed</h4>
                        <p className="text-xs text-slate-600 mb-3">Categorized as <span className="font-semibold text-orange-600">Insight</span></p>
                        <div className="text-xs text-slate-500 italic">AI identifies patterns & context</div>
                      </div>
                    </div>

                    {/* Step 2: Connect */}
                    <div className="relative bg-white rounded-xl shadow-lg border-2 border-purple-200 p-5 hover:shadow-xl transition-all hover:scale-105">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-400 rounded-full flex items-center justify-center shadow-lg z-10">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Connected</h4>
                        <p className="text-xs text-slate-600 mb-3">Found <span className="font-semibold text-purple-600">3 related thoughts</span></p>
                        <div className="text-xs text-slate-500 italic">Links to your past insights</div>
                      </div>
                    </div>

                    {/* Step 3: Act */}
                    <div className="relative bg-white rounded-xl shadow-lg border-2 border-orange-200 p-5 hover:shadow-xl transition-all hover:scale-105">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg z-10">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Action Ready</h4>
                        <p className="text-xs text-slate-600 mb-3"><span className="font-semibold text-orange-600">To Share</span> + <span className="font-semibold text-orange-600">To-Do</span></p>
                        <div className="text-xs text-slate-500 italic">Ready-to-post drafts created</div>
                      </div>
                    </div>

                    {/* Step 4: Insights */}
                    <div className="relative bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-5 hover:shadow-xl transition-all hover:scale-105">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-full flex items-center justify-center shadow-lg z-10">
                        <span className="text-white font-bold text-sm">4</span>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Insights</h4>
                        <p className="text-xs text-slate-600 mb-3"><span className="font-semibold text-indigo-600">Trends & patterns</span></p>
                        <div className="text-xs text-slate-500 italic">20-60-90 day reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Posts Preview - Compact */}
              <div className="max-w-5xl mx-auto mb-16">
                <div className="bg-gradient-to-br from-purple-50 via-pink-50/30 to-orange-50/30 rounded-2xl p-6 sm:p-8 border-2 border-purple-200">
                  <div className="text-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Ready to share</h3>
                    <p className="text-sm text-slate-600">Draft posts generated automatically</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* LinkedIn Preview */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-3 bg-gray-50 flex items-center gap-2 border-b">
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{userInitials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-gray-900 truncate">{userName}</div>
                          <div className="text-[9px] text-gray-500">Developer • 1st</div>
                        </div>
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-900 leading-relaxed line-clamp-4">
                          AI accelerates everything—the good and the bad. Quality gates matter more than ever.
                        </p>
                      </div>
                    </div>

                    {/* X Preview */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-3 bg-white flex items-center gap-2 border-b">
                        <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{userInitials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-gray-900 truncate">{userName}</div>
                          <div className="text-[9px] text-gray-500">@username</div>
                        </div>
                        <Twitter className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-900 leading-relaxed line-clamp-4">
                          AI accelerates whatever you give it—good or bad. Quality gates matter more than ever. 🚀
                        </p>
                      </div>
                    </div>

                    {/* Instagram Preview */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-2 bg-white flex items-center justify-between border-b">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">{userInitials}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-900">{userName.toLowerCase().replace(/\s+/g, '')}</span>
                        </div>
                        <Instagram className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] text-gray-900 leading-relaxed line-clamp-2">
                          <span className="font-semibold">{userName.toLowerCase().replace(/\s+/g, '')}</span> AI is making everything faster...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Additional Features Grid */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* Feature 4: AI Insights */}
                <div className="p-4 sm:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200/60">
                  <div className="mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-pink-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">AI Insights & Next Steps</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 font-light">
                      Get contextual research-based notes and actionable sub-tasks for every entry.
                    </p>
                  </div>
                  <div className="bg-pink-50/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-pink-200/40">
                    <p className="text-xs sm:text-sm text-slate-700 italic mb-2 font-medium">"Starting a consulting business part-time is a smart approach..."</p>
                    <ul className="text-xs space-y-1 text-slate-600 font-light">
                      <li>• Research consulting rates</li>
                      <li>• Define your service offerings</li>
                    </ul>
                  </div>
                </div>

                {/* Feature 5: Social Sharing */}
                <div className="p-4 sm:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-orange-100 hover:border-orange-300">
                  <div className="mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Post About Insights</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 font-medium">
                      Turn valuable insights into ready-to-post content for LinkedIn, Twitter, Instagram.
                    </p>
                  </div>
                  <div className="bg-orange-50/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200/40">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                        <defs>
                          <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#833AB4" />
                            <stop offset="50%" stopColor="#FD1D1D" />
                            <stop offset="100%" stopColor="#FCAF45" />
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Instagram</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">"Gratitude practice works. Here's my daily routine that changed everything..."</p>
                  </div>
                </div>

                {/* Feature 6: Companion */}
                <div className="p-4 sm:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200/60">
                  <div className="mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Companion</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 font-light">
                      Get personalized observations and patterns from your thoughts.
                    </p>
                  </div>
                  <div className="bg-purple-50/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200/40">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800 mb-1">Pattern Detected</p>
                        <p className="text-xs text-slate-700 mb-2">You've had more negative or critical thoughts lately (8 of your last 12 thoughts).</p>
                        <div className="bg-white rounded-lg p-2 border border-purple-200">
                          <p className="text-xs font-medium text-purple-700 mb-1">💡 Suggestion:</p>
                          <p className="text-xs text-slate-600">Consider taking a break, practicing gratitude, or focusing on solutions rather than problems. Your thoughts show you're noticing issues—channel that into actionable improvements.</p>
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
