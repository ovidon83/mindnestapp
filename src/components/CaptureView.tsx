import React, { useState, useRef, useEffect } from 'react';
import { useAllyMindStore } from '../store';
import { Mic, MicOff, Sparkles, CheckCircle, Circle } from 'lucide-react';

const CaptureView: React.FC = () => {
  const { processInputWithAI, setCurrentView } = useAllyMindStore();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const recognitionRef = useRef<any>(null);

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
    
    setIsProcessing(true);
    
    try {
      // Process with AI - this will automatically classify, extract time, prioritize, and create entries
      processInputWithAI(textToProcess);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Reset form
      setInputText('');
      setTranscript('');
      setIsRecording(false);
      
      // Navigate to Home view to see the entries
      setTimeout(() => setCurrentView('home'), 2000);
      
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentText = transcript || inputText;
  const hasContent = currentText.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AllyMind</h1>
          <p className="text-lg text-gray-600">Because your thoughts deserve intelligent organization!</p>
          

        </div>

        {/* Main Input Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Input Area */}
          <div className="mb-6">
            <textarea
              value={currentText}
              onChange={(e) => {
                if (transcript) {
                  setTranscript(e.target.value);
                } else {
                  setInputText(e.target.value);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="What's on your mind? Share your thoughts, tasks, ideas..."
              className="w-full h-32 p-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-lg scale-110' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
              
              {/* Voice Status */}
              {isRecording && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!hasContent || isProcessing}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center space-x-2 ${
                hasContent && !isProcessing
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Organize</span>
                </>
              )}
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Thoughts organized successfully!</span>
              </div>
            </div>
          )}

          {/* Voice Instructions */}
          {!isRecording && !hasContent && (
            <div className="mt-6 text-center text-gray-500">
              <p className="text-sm">💡 Try saying: "Need to finish the report by Friday, also call mom tomorrow"</p>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Smart Tasks</h3>
            <p className="text-sm text-gray-600">Automatic task detection and organization</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
            <Circle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Thought Capture</h3>
            <p className="text-sm text-gray-600">Capture ideas, insights, and reflections</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
            <Sparkles className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">AI Organization</h3>
            <p className="text-sm text-gray-600">Intelligent categorization and prioritization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureView;