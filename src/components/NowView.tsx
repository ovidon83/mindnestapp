import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, Shuffle, Zap, Coffee, Battery } from 'lucide-react';
import { useADHDStore } from '../store/adhd-store';

export const NowView: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { 
    getNowTask, 
    startTask, 
    completeTask, 
    snoozeTask, 
    getActiveTasks,
    updateTask 
  } = useADHDStore();
  
  const currentTask = getNowTask();
  const activeTasks = getActiveTasks();
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStarted && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, startTime]);
  
  // Auto-reset when task changes
  useEffect(() => {
    setIsStarted(false);
    setStartTime(null);
    setElapsedTime(0);
  }, [currentTask?.id]);
  
  const handleStart = () => {
    if (!currentTask) return;
    
    const now = new Date();
    setIsStarted(true);
    setStartTime(now);
    startTask(currentTask.id);
  };
  
  const handleFinish = () => {
    if (!currentTask) return;
    
    completeTask(currentTask.id);
    setShowCelebration(true);
    setIsStarted(false);
    
    // Auto-hide celebration
    setTimeout(() => setShowCelebration(false), 3000);
  };
  
  const handleSnooze = () => {
    if (!currentTask) return;
    
    snoozeTask(currentTask.id, 60);
    setIsStarted(false);
    setStartTime(null);
    setElapsedTime(0);
  };
  
  const handleSwap = () => {
    if (!currentTask) return;
    
    // Move current task to later and pick next one
    updateTask(currentTask.id, { 
      tags: [...currentTask.tags.filter(tag => tag !== 'now'), 'later']
    });
    setIsStarted(false);
    setStartTime(null);
    setElapsedTime(0);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getEnergyIcon = (tags: string[]) => {
    if (tags.includes('low_energy')) return <Coffee className="text-green-600" size={20} />;
    if (tags.includes('high_energy')) return <Zap className="text-red-600" size={20} />;
    return <Battery className="text-yellow-600" size={20} />;
  };
  
  const getEnergyLabel = (tags: string[]) => {
    if (tags.includes('low_energy')) return 'Low Energy';
    if (tags.includes('high_energy')) return 'High Energy';
    return 'Medium Energy';
  };
  
  const getEnergyColor = (tags: string[]) => {
    if (tags.includes('low_energy')) return 'bg-green-50 border-green-200';
    if (tags.includes('high_energy')) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Zap className="text-indigo-600" size={36} />
            Focus Now
          </h1>
          <p className="text-gray-600 font-medium">One task. Full attention. You've got this.</p>
        </div>

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Amazing!</h2>
              <p className="text-gray-600">You completed a task. Done is better than perfect!</p>
            </div>
          </div>
        )}

        {/* Current Task */}
        {currentTask ? (
          <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 p-8 mb-8 ${getEnergyColor(currentTask.tags)}`}>
            {/* Energy indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {getEnergyIcon(currentTask.tags)}
              <span className="text-sm font-medium text-gray-700">
                {getEnergyLabel(currentTask.tags)}
              </span>
            </div>
            
            {/* Task content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">
                {currentTask.content}
              </h2>
              
              {currentTask.tags.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                  {currentTask.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/60 text-gray-600 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Timer */}
            {isStarted && (
              <div className="text-center mb-8">
                <div className="text-4xl font-mono font-bold text-indigo-600 mb-2">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-gray-600">Time focused</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isStarted ? (
                <button
                  onClick={handleStart}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Play size={20} />
                  <span className="font-semibold">Let's Begin</span>
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <CheckCircle size={20} />
                  <span className="font-semibold">Finish</span>
                </button>
              )}
              
              <button
                onClick={handleSnooze}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <Clock size={20} />
                <span>Snooze 1h</span>
              </button>
              
              <button
                onClick={handleSwap}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <Shuffle size={20} />
                <span>Swap</span>
              </button>
            </div>
            
            {/* Encouraging message */}
            <div className="text-center mt-6">
              <p className="text-gray-600 font-medium">
                {isStarted 
                  ? "You're doing great! One step at a time." 
                  : "Ready when you are. No pressure, just progress."
                }
              </p>
            </div>
          </div>
        ) : (
          /* No current task */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">You're all caught up!</h2>
            <p className="text-gray-600 mb-6">
              No tasks ready for "now" focus. Add some tasks in the Unpack view or check your Today list.
            </p>
            
            {activeTasks.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  You have {activeTasks.length} other task{activeTasks.length !== 1 ? 's' : ''} waiting. 
                  Check your Today or Later lists to prioritize one.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
            📊 Your Progress
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {activeTasks.length}
              </div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">
                {activeTasks.filter(t => t.completedAt).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {activeTasks.filter(t => t.startedAt && !t.completedAt).length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};