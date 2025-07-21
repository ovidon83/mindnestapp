import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Save,
  Loader2,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Quote,
  Wind,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

interface Quote {
  text: string;
  author: string;
  category: string;
}

const dailyQuotes: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "mindfulness" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh", category: "mindfulness" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama", category: "happiness" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "mindfulness" },
  { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra", category: "peace" },
  { text: "Every breath we take, every step we make, can be filled with peace, joy and serenity.", author: "Thich Nhat Hanh", category: "mindfulness" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass", category: "meditation" },
];

export const JournalView: React.FC = () => {
  const [journalContent, setJournalContent] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad' | 'terrible'>('okay');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'breathing' | 'meditation' | 'journal'>('breathing');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathingTime, setBreathingTime] = useState(0);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [breathingPhaseTime, setBreathingPhaseTime] = useState(0);
  const [showBreathingCountdown, setShowBreathingCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Meditation state
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationTime, setMeditationTime] = useState(300); // 5 minutes in seconds
  const [meditationProgress, setMeditationProgress] = useState(0);
  const [showMeditationStart, setShowMeditationStart] = useState(false);
  
  const { addJournalEntry, journalEntries } = useMindnestStore();
  const breathingIntervalRef = useRef<NodeJS.Timeout>();
  const meditationIntervalRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Get quote of the day based on date
  const getQuoteOfTheDay = (): Quote => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return dailyQuotes[dayOfYear % dailyQuotes.length];
  };

  const quoteOfTheDay = getQuoteOfTheDay();

  const moodEmojis = {
    great: '😊',
    good: '🙂',
    okay: '😐',
    bad: '😔',
    terrible: '😢'
  };

  const moodLabels = {
    great: 'Great',
    good: 'Good',
    okay: 'Okay',
    bad: 'Bad',
    terrible: 'Terrible'
  };

  // Sound functions
  const playStartSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.5); // A5 note
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  const playEndSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.5); // A4 note
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime + 1); // A3 note
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);
  };

  const playPhaseSound = (phase: string) => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let frequency = 440;
    if (phase === 'inhale') frequency = 523; // C5
    else if (phase === 'hold1') frequency = 659; // E5
    else if (phase === 'exhale') frequency = 392; // G4
    else if (phase === 'hold2') frequency = 440; // A4
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playCountdownSound = (number: number) => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequency for each countdown number
    const frequency = 440 + (number * 55); // A4, B4, C5
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Voice guidance using Web Speech API
  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Try to use a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Samantha'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const speakBreathingGuidance = (phase: string, count: number) => {
    if (!voiceEnabled) return;
    
    // Only speak on the first second of each phase (when count is 4)
    if (count !== 4) return;
    
    let text = '';
    if (phase === 'inhale') {
      text = 'Inhale';
    } else if (phase === 'hold1') {
      text = 'Hold';
    } else if (phase === 'exhale') {
      text = 'Exhale';
    } else if (phase === 'hold2') {
      text = 'Hold';
    }
    
    if (text) speak(text);
  };

  const speakCountdown = (phaseTime: number) => {
    if (!voiceEnabled) return;
    
    // Speak countdown numbers: 3, 2, 1
    if (phaseTime === 1) speak('3');
    else if (phaseTime === 2) speak('2');
    else if (phaseTime === 3) speak('1');
  };

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Breathing exercise logic
  useEffect(() => {
    if (breathingActive) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathingTime(prev => {
          const newTime = prev + 1;
          const cycleTime = 16; // 4s inhale + 4s hold1 + 4s exhale + 4s hold2
          const cycleProgress = newTime % cycleTime;
          
          if (cycleProgress < 4) {
            // Inhale phase
            if (breathingPhase !== 'inhale') {
              setBreathingPhase('inhale');
              setBreathingPhaseTime(0);
              playPhaseSound('inhale');
              speakBreathingGuidance('inhale', 4); // Speak at start of phase
            }
            const phaseTime = breathingPhaseTime + 1;
            setBreathingPhaseTime(phaseTime);
            speakCountdown(phaseTime); // Speak countdown numbers
          } else if (cycleProgress < 8) {
            // Hold 1 phase
            if (breathingPhase !== 'hold1') {
              setBreathingPhase('hold1');
              setBreathingPhaseTime(0);
              playPhaseSound('hold1');
              speakBreathingGuidance('hold1', 4); // Speak at start of phase
            }
            const phaseTime = breathingPhaseTime + 1;
            setBreathingPhaseTime(phaseTime);
            speakCountdown(phaseTime); // Speak countdown numbers
          } else if (cycleProgress < 12) {
            // Exhale phase
            if (breathingPhase !== 'exhale') {
              setBreathingPhase('exhale');
              setBreathingPhaseTime(0);
              playPhaseSound('exhale');
              speakBreathingGuidance('exhale', 4); // Speak at start of phase
            }
            const phaseTime = breathingPhaseTime + 1;
            setBreathingPhaseTime(phaseTime);
            speakCountdown(phaseTime); // Speak countdown numbers
          } else {
            // Hold 2 phase
            if (breathingPhase !== 'hold2') {
              setBreathingPhase('hold2');
              setBreathingPhaseTime(0);
              playPhaseSound('hold2');
              speakBreathingGuidance('hold2', 4); // Speak at start of phase
            }
            const phaseTime = breathingPhaseTime + 1;
            setBreathingPhaseTime(phaseTime);
            speakCountdown(phaseTime); // Speak countdown numbers
          }
          
          if (newTime % cycleTime === 0) {
            setBreathingCycle(prev => prev + 1);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
    }

    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
    };
  }, [breathingActive, breathingPhase, breathingPhaseTime]);

  // Meditation timer logic
  useEffect(() => {
    if (meditationActive && meditationTime > 0) {
      meditationIntervalRef.current = setInterval(() => {
        setMeditationTime(prev => {
          const newTime = prev - 1;
          const progress = ((300 - newTime) / 300) * 100;
          setMeditationProgress(progress);
          
          if (newTime <= 0) {
            setMeditationActive(false);
            playEndSound();
            return 300;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (meditationIntervalRef.current) {
        clearInterval(meditationIntervalRef.current);
      }
    }

    return () => {
      if (meditationIntervalRef.current) {
        clearInterval(meditationIntervalRef.current);
      }
    };
  }, [meditationActive, meditationTime]);

  const startBreathing = () => {
    setShowBreathingCountdown(true);
    setCountdownNumber(3);
    playStartSound();
    
    const countdownInterval = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev > 1) {
          playCountdownSound(prev);
          return prev - 1;
        } else {
          clearInterval(countdownInterval);
          playCountdownSound(1);
          
          setTimeout(() => {
            setShowBreathingCountdown(false);
            setBreathingActive(true);
            setBreathingTime(0);
            setBreathingCycle(0);
            setBreathingPhaseTime(0);
            setBreathingPhase('inhale');
          }, 1000);
          
          return 1;
        }
      });
    }, 1000);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathingTime(0);
    setBreathingCycle(0);
    setBreathingPhaseTime(0);
    setBreathingPhase('inhale');
    setShowBreathingCountdown(false);
  };

  const startMeditation = () => {
    setShowMeditationStart(true);
    playStartSound();
    
    setTimeout(() => {
      setShowMeditationStart(false);
      setMeditationActive(true);
      setMeditationTime(300);
      setMeditationProgress(0);
    }, 3000);
  };

  const stopMeditation = () => {
    setMeditationActive(false);
    setMeditationTime(300);
    setMeditationProgress(0);
    setShowMeditationStart(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveJournal = async () => {
    if (!journalContent.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      addJournalEntry({
        content: journalContent.trim(),
        mood,
      });
      setJournalContent('');
      setMood('okay');
      setAiInsight('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeEntry = async () => {
    if (!journalContent.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const result = await AIService.reflectOnDay(journalContent);
      if (result.success && result.data) {
        setAiInsight(result.data.reflection);
      }
    } catch (error) {
      console.error('Error analyzing entry:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMoodTrend = () => {
    const recentEntries = journalEntries.slice(0, 7);
    if (recentEntries.length === 0) return null;
    
    const moodScores = {
      great: 5,
      good: 4,
      okay: 3,
      bad: 2,
      terrible: 1
    };
    
    const averageScore = recentEntries.reduce((sum, entry) => 
      sum + moodScores[entry.mood], 0) / recentEntries.length;
    
    if (averageScore >= 4) return 'trending up';
    if (averageScore <= 2) return 'trending down';
    return 'stable';
  };

  const moodTrend = getMoodTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-gray-800 mb-2">Daily Journal</h1>
          <p className="text-gray-600 font-medium">Your sacred space for reflection and mindfulness</p>
        </div>

        {/* Quote of the Day */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-8 mb-8">
          <div className="text-center">
            <Quote size={32} className="mx-auto text-amber-600 mb-4" />
            <blockquote className="text-xl font-serif italic text-gray-800 mb-4">
              "{quoteOfTheDay.text}"
            </blockquote>
            <cite className="text-sm text-gray-600">— {quoteOfTheDay.author}</cite>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-amber-200">
            <div className="flex space-x-2">
              {[
                { id: 'breathing', label: 'Breathing', icon: Wind },
                { id: 'meditation', label: 'Meditation', icon: Brain },
                { id: 'journal', label: 'Journal', icon: BookOpen }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeSection === id
                      ? 'bg-amber-100 text-amber-800 shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sound and Voice Toggles */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              soundEnabled 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>
          
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              voiceEnabled 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>

        {/* Content Sections */}
        {activeSection === 'breathing' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-8">
            <div className="text-center">
              <h2 className="text-3xl font-serif font-bold text-gray-800 mb-8">Breathing Exercise</h2>
              <p className="text-lg text-gray-600 mb-8">A guided 5-minute breathing practice to center yourself</p>
              
              {/* Breathing Countdown Screen */}
              {showBreathingCountdown && (
                <div className="relative mb-8">
                  <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-8 border-blue-300 flex items-center justify-center animate-pulse">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600 mb-4 animate-bounce">
                        {countdownNumber}
                      </div>
                      <div className="text-2xl font-semibold text-blue-800 mb-2">Get Ready</div>
                      <div className="text-blue-600">Breathing exercise starting...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Breathing Circle */}
              {!showBreathingCountdown && (
                <div className="relative mb-8">
                  <div className="w-80 h-80 mx-auto relative">
                    {/* Outer ring with phase indicator */}
                    <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                    <div 
                      className={`absolute inset-0 rounded-full border-8 border-transparent transition-all duration-1000 ${
                        breathingPhase === 'inhale' 
                          ? 'border-blue-500' 
                          : breathingPhase === 'hold1'
                          ? 'border-yellow-500'
                          : breathingPhase === 'exhale'
                          ? 'border-green-500'
                          : 'border-purple-500'
                      }`}
                      style={{
                        clipPath: `polygon(0 0, ${(breathingPhaseTime / 4) * 100}% 0, ${(breathingPhaseTime / 4) * 100}% 100%, 0 100%)`
                      }}
                    ></div>
                    
                    {/* Main breathing circle */}
                    <div className={`absolute inset-8 rounded-full flex items-center justify-center transition-all duration-1000 ${
                      breathingPhase === 'inhale' 
                        ? 'bg-blue-100 scale-110' 
                        : breathingPhase === 'hold1'
                        ? 'bg-yellow-100 scale-105'
                        : breathingPhase === 'exhale'
                        ? 'bg-green-100 scale-100'
                        : 'bg-purple-100 scale-100'
                    }`}>
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-4 transition-colors duration-1000 ${
                          breathingPhase === 'inhale' ? 'text-blue-600' : 
                          breathingPhase === 'hold1' ? 'text-yellow-600' : 
                          breathingPhase === 'exhale' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {breathingPhase === 'inhale' ? 'Inhale' : 
                           breathingPhase === 'hold1' ? 'Hold' : 
                           breathingPhase === 'exhale' ? 'Exhale' : 'Hold'}
                        </div>
                        
                        {/* Phase timer - cleaner display */}
                        <div className="text-4xl font-mono text-gray-700 mb-3 font-bold">
                          {Math.max(0, 4 - breathingPhaseTime)}s
                        </div>
                        
                        {/* Progress dots */}
                        <div className="flex justify-center space-x-2 mb-4">
                          {[0, 1, 2, 3].map((dot) => (
                            <div
                              key={dot}
                              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                breathingPhaseTime >= dot 
                                  ? (breathingPhase === 'inhale' ? 'bg-blue-500' : 
                                     breathingPhase === 'hold1' ? 'bg-yellow-500' : 
                                     breathingPhase === 'exhale' ? 'bg-green-500' : 'bg-purple-500')
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        
                        {/* Cycle counter */}
                        <div className="text-xl text-gray-600 font-medium">
                          Cycle {breathingCycle + 1} / 10
                        </div>
                        
                        {/* Total time */}
                        <div className="text-sm text-gray-500 mt-2">
                          {Math.floor(breathingTime / 60)}:{(breathingTime % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                {!breathingActive ? (
                  <button
                    onClick={startBreathing}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Play size={20} />
                    <span>Start Breathing</span>
                  </button>
                ) : (
                  <button
                    onClick={stopBreathing}
                    className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Pause size={20} />
                    <span>Stop</span>
                  </button>
                )}
                
                <button
                  onClick={stopBreathing}
                  className="px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <RotateCcw size={20} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-8 text-left bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">How to practice:</h3>
                <ul className="text-blue-800 space-y-2">
                  <li>• Find a comfortable seated position</li>
                  <li>• Close your eyes or soften your gaze</li>
                  <li>• Follow the 4-4-4-4 pattern: Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s)</li>
                  <li>• Visual guide: Blue (inhale) → Yellow (hold) → Green (exhale) → Purple (hold)</li>
                  <li>• Voice guidance: "Inhale... 3... 2... 1... Hold... 3... 2... 1..."</li>
                  <li>• Complete 10 cycles for a 5-minute practice</li>
                  <li>• Focus on the sensation of your breath</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Meditation */}
        {activeSection === 'meditation' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-8">
            <div className="text-center">
              <h2 className="text-3xl font-serif font-bold text-gray-800 mb-8">Silent Meditation</h2>
              <p className="text-lg text-gray-600 mb-8">A gentle 5-minute meditation to find inner peace</p>
              
              {/* Meditation Start Screen */}
              {showMeditationStart && (
                <div className="mb-8">
                  <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border-8 border-purple-300 flex items-center justify-center animate-pulse">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🧘‍♀️</div>
                      <div className="text-2xl font-bold text-purple-800 mb-2">Preparing...</div>
                      <div className="text-purple-600">Get comfortable and ready to begin</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Meditation Timer */}
              {!showMeditationStart && (
                <div className="relative mb-8">
                  <div className="w-80 h-80 mx-auto rounded-full border-8 border-gray-200 flex items-center justify-center relative overflow-hidden">
                    {/* Progress ring */}
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500 transition-all duration-1000"
                      style={{ transform: `rotate(${meditationProgress * 3.6}deg)` }}
                    ></div>
                    
                    {/* Inner content */}
                    <div className="text-center z-10 relative">
                      <div className="text-6xl font-mono font-bold text-gray-800 mb-2">
                        {formatTime(meditationTime)}
                      </div>
                      <div className="text-xl text-gray-600 mb-4">
                        {meditationActive ? 'Meditating...' : 'Ready to begin'}
                      </div>
                      
                      {/* Progress percentage */}
                      <div className="text-sm text-purple-600 font-medium">
                        {Math.round(meditationProgress)}% complete
                      </div>
                    </div>
                    
                    {/* Floating particles for visual interest */}
                    {meditationActive && (
                      <>
                        <div className="absolute top-4 left-4 w-2 h-2 bg-purple-300 rounded-full animate-ping"></div>
                        <div className="absolute top-8 right-8 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute bottom-8 left-8 w-1 h-1 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute bottom-4 right-4 w-2 h-2 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4 mb-8">
                {!meditationActive && !showMeditationStart ? (
                  <button
                    onClick={startMeditation}
                    className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Play size={20} />
                    <span>Start Meditation</span>
                  </button>
                ) : (
                  <button
                    onClick={stopMeditation}
                    className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Pause size={20} />
                    <span>Stop</span>
                  </button>
                )}
                
                <button
                  onClick={stopMeditation}
                  className="px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <RotateCcw size={20} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="text-left bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">Meditation Guide:</h3>
                <ul className="text-purple-800 space-y-2">
                  <li>• Sit comfortably with your back straight but relaxed</li>
                  <li>• Close your eyes and take a few deep breaths</li>
                  <li>• Focus on your natural breath - don't try to change it</li>
                  <li>• When your mind wanders, gently return to your breath</li>
                  <li>• Be kind to yourself - meditation is a practice</li>
                  <li>• There's no "right" way - just be present</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Journal Section */}
        {activeSection === 'journal' && (
          <div className="space-y-8">
            {/* Mood Trend */}
            {moodTrend && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp size={24} className="text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Mood Journey</h3>
                    <p className="text-gray-600">
                      Your emotional landscape has been {moodTrend} over the last week
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* New Entry Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-8">
              <h2 className="text-2xl font-serif font-semibold text-gray-800 mb-6">Today's Reflection</h2>
              
              {/* Mood Selection */}
              <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  How is your heart feeling today?
                </label>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((moodKey) => (
                    <button
                      key={moodKey}
                      onClick={() => setMood(moodKey)}
                      className={`flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        mood === moodKey
                          ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-lg'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <span className="text-2xl">{moodEmojis[moodKey]}</span>
                      <span className="font-medium">{moodLabels[moodKey]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Journal Content */}
              <div className="mb-6">
                <label htmlFor="journal-content" className="block text-lg font-medium text-gray-700 mb-3">
                  What's stirring in your soul?
                </label>
                <textarea
                  id="journal-content"
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Write freely about your day, your thoughts, your dreams, your challenges, or anything that's calling for your attention..."
                  className="w-full h-40 px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-400 resize-none text-gray-800 font-serif text-lg leading-relaxed"
                />
              </div>

              {/* AI Insight */}
              {aiInsight && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-amber-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <Sparkles size={20} className="text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-2">Gentle Reflection</h4>
                      <p className="text-purple-800 leading-relaxed">{aiInsight}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSaveJournal}
                  disabled={!journalContent.trim() || isSaving}
                  className="px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Reflection</span>
                    </>
                  )}
                </button>
                
                {journalContent.trim() && (
                  <button
                    onClick={handleAnalyzeEntry}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Reflecting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Get Insight</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Recent Entries */}
            <div>
              <h2 className="text-2xl font-serif font-semibold text-gray-800 mb-6">Your Journey</h2>
              <div className="space-y-6">
                {journalEntries.length === 0 ? (
                  <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200">
                    <BookOpen size={64} className="mx-auto text-amber-400 mb-6" />
                    <h3 className="text-xl font-medium text-gray-800 mb-3">Begin Your Story</h3>
                    <p className="text-gray-600">Your first journal entry awaits above</p>
                  </div>
                ) : (
                  journalEntries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-8"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-3xl">{moodEmojis[entry.mood]}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">{moodLabels[entry.mood]}</h3>
                            <p className="text-sm text-gray-500 font-medium">
                              {new Date(entry.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed font-serif text-lg mb-4">{entry.content}</p>
                      
                      {entry.aiReflection && (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-start space-x-3">
                            <MessageSquare size={18} className="text-amber-600 mt-1" />
                            <p className="text-amber-800 leading-relaxed">{entry.aiReflection}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 