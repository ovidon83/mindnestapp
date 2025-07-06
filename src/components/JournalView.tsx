import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Heart, Smile, Meh, Frown, Play, Pause, RotateCcw, BookOpen, Timer } from 'lucide-react';
import { useMindnestStore } from '../store';

type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

const moodIcons = {
  great: { icon: Smile, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  good: { icon: Smile, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  okay: { icon: Meh, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  bad: { icon: Frown, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  terrible: { icon: Frown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

// Enhanced Breathing Exercise with Countdown
const BreathingExercise: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycle, setCycle] = useState(0);
  const [totalCycles, setTotalCycles] = useState(5);

  const phaseDurations = { inhale: 4, hold: 7, exhale: 8 };
  const phaseLabels = { inhale: 'Breathe In', hold: 'Hold', exhale: 'Breathe Out' };

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return phaseDurations.hold;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return phaseDurations.exhale;
          } else {
            // Complete cycle
            setCycle((c) => {
              const newCycle = c + 1;
              if (newCycle >= totalCycles) {
                setIsActive(false);
                return 0;
              }
              return newCycle;
            });
            setPhase('inhale');
            return phaseDurations.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, totalCycles]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('inhale');
    setTimeLeft(4);
    setCycle(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(4);
    setCycle(0);
  };

  const progress = ((phaseDurations[phase] - timeLeft) / phaseDurations[phase]) * 100;

  return (
    <div className="relative">
      <div className="text-center space-y-6">
        {/* Breathing Circle */}
        <div className="relative mx-auto">
          <div className="w-40 h-40 sm:w-48 sm:h-48 relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke={
                  phase === 'inhale' ? '#3b82f6' : 
                  phase === 'hold' ? '#8b5cf6' : 
                  '#10b981'
                }
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-light text-gray-800 mb-1">
                  {timeLeft}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">
                  {phaseLabels[phase]}
                </div>
              </div>
            </div>
            
            {/* Breathing animation circle */}
            <div 
              className={`absolute inset-4 rounded-full transition-all duration-1000 ${
                isActive 
                  ? phase === 'inhale' 
                    ? 'bg-blue-100 scale-110' 
                    : phase === 'hold'
                    ? 'bg-purple-100 scale-110'
                    : 'bg-emerald-100 scale-90'
                  : 'bg-gray-50'
              }`}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="text-lg font-light text-gray-800">
            {isActive ? `Cycle ${cycle + 1} of ${totalCycles}` : '4-7-8 Breathing'}
          </div>
          <div className="text-sm text-gray-600">
            {isActive ? 'Focus on your breath' : 'Inhale 4s • Hold 7s • Exhale 8s'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={isActive ? handleStop : handleStart}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              isActive 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            {isActive ? 'Stop' : 'Start'}
          </button>
          
          {!isActive && (
            <select
              value={totalCycles}
              onChange={(e) => setTotalCycles(Number(e.target.value))}
              className="px-3 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
            >
              <option value={3}>3 cycles</option>
              <option value={5}>5 cycles</option>
              <option value={10}>10 cycles</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Meditation Timer
const MeditationTimer: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [duration, setDuration] = useState(300);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
    }
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsActive(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="text-center space-y-6">
      {/* Timer Circle */}
      <div className="relative mx-auto">
        <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-light text-gray-800">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <div className="text-lg font-light text-gray-800">
          {isActive ? 'Meditating...' : timeLeft === 0 ? 'Session Complete' : 'Meditation Timer'}
        </div>
        <div className="text-sm text-gray-600">
          {isActive ? 'Focus on your breath and be present' : 'Choose your duration and begin'}
        </div>
      </div>

      {/* Duration Selection */}
      {!isActive && timeLeft === duration && (
        <div className="flex justify-center gap-2">
          {[300, 600, 900, 1200].map((dur) => (
            <button
              key={dur}
              onClick={() => handleDurationChange(dur)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                duration === dur 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dur / 60}min
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={isActive ? handleStop : handleStart}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
            isActive 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
          {isActive ? 'Pause' : timeLeft === 0 ? 'Start' : 'Resume'}
        </button>
        
        {(timeLeft !== duration || timeLeft === 0) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export const JournalView: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<Mood>('okay');
  const [entryContent, setEntryContent] = useState('');
  const [activeSection, setActiveSection] = useState<'breathing' | 'meditation' | 'journal'>('journal');
  
  const { journalEntries, addJournalEntry } = useMindnestStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryContent.trim()) return;

    addJournalEntry({
      content: entryContent.trim(),
      mood: currentMood,
    });
    
    setEntryContent('');
    setCurrentMood('okay');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <BookOpen size={24} className="text-white sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight mb-2">
            Daily Reflection
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
            Center yourself, then capture your thoughts and feelings.
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              { id: 'breathing', label: 'Breathe', icon: Heart },
              { id: 'meditation', label: 'Meditate', icon: Timer },
              { id: 'journal', label: 'Journal', icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Breathing Section */}
          {activeSection === 'breathing' && (
            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8">
              <BreathingExercise />
            </div>
          )}

          {/* Meditation Section */}
          {activeSection === 'meditation' && (
            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8">
              <MeditationTimer />
            </div>
          )}

          {/* Journal Section */}
          {activeSection === 'journal' && (
            <div className="space-y-8">
              {/* Mood Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 text-center">
                  How are you feeling?
                </h3>
                <div className="flex justify-center gap-3 sm:gap-4">
                  {Object.entries(moodIcons).map(([mood, { icon: Icon, color, bg, border }]) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setCurrentMood(mood as Mood)}
                      className={`p-4 rounded-2xl transition-all duration-200 ${
                        currentMood === mood 
                          ? `${bg} ${color} ring-2 ring-offset-2 ring-gray-300` 
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Journal Entry Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <textarea
                    value={entryContent}
                    onChange={(e) => setEntryContent(e.target.value)}
                    placeholder="What's on your mind today? Write freely about your thoughts, feelings, and experiences..."
                    className="w-full h-64 sm:h-80 p-6 bg-gray-50 border-0 rounded-3xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 text-base sm:text-lg leading-relaxed resize-none transition-all duration-200"
                  />
                  
                  {/* Character count */}
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                    {entryContent.length} characters
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={!entryContent.trim()}
                    className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    <Heart size={18} />
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Recent Entries */}
        {journalEntries.length > 0 && activeSection === 'journal' && (
          <div className="mt-12 sm:mt-16">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
              Recent Reflections
            </h3>
            <div className="space-y-4">
              {journalEntries.slice(0, 3).map((entry) => {
                const MoodIcon = moodIcons[entry.mood].icon;
                const entryDate = typeof entry.date === 'string' ? new Date(Date.parse(entry.date)) : entry.date;
                
                return (
                  <div key={entry.id} className="p-6 bg-gray-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${moodIcons[entry.mood].bg}`}>
                          <MoodIcon size={16} className={moodIcons[entry.mood].color} />
                        </div>
                        <span className="text-sm text-gray-600 capitalize font-medium">
                          {entry.mood}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(entryDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {entry.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 