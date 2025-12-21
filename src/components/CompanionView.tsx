import React, { useState, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { generateCompanionObservations } from '../lib/ai';
import { Sparkles, RefreshCw, Loader2, Brain, Lightbulb, Heart, TrendingUp } from 'lucide-react';

const CACHE_KEY = 'companion_observations';
const CACHE_TIMESTAMP_KEY = 'companion_observations_timestamp';

const CompanionView: React.FC = () => {
  const { entries } = useGenieNotesStore();
  const [observations, setObservations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load cached observations on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setObservations(parsed);
        if (cachedTimestamp) {
          setLastUpdated(new Date(cachedTimestamp));
        }
      } catch (error) {
        console.error('Error loading cached observations:', error);
      }
    }
  }, []);

  const updateObservations = async () => {
    if (entries.length === 0) {
      alert('No entries to analyze. Start capturing thoughts first!');
      return;
    }

    setLoading(true);
    try {
      const obs = await generateCompanionObservations(entries);
      setObservations(obs);
      const now = new Date();
      setLastUpdated(now);
      
      // Cache the observations
      localStorage.setItem(CACHE_KEY, JSON.stringify(obs));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toISOString());
    } catch (error) {
      console.error('Error generating observations:', error);
      alert('Error generating observations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRandomIcon = (index: number) => {
    const icons = [Brain, Lightbulb, Heart, TrendingUp, Sparkles];
    return icons[index % icons.length];
  };

  const getRandomGradient = (index: number) => {
    const gradients = [
      'from-teal-50 to-emerald-50',
      'from-slate-50 to-stone-50',
      'from-amber-50 to-orange-50',
      'from-emerald-50 to-teal-50',
      'from-stone-50 to-slate-50',
    ];
    return gradients[index % gradients.length];
  };

  if (observations.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50/40 via-blue-50/30 to-pink-50/30 relative overflow-hidden">
        {/* Playful background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200/15 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/15 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 relative z-10">
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                <Brain className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Ready to discover patterns?
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {entries.length === 0 
                ? 'Start capturing thoughts to see patterns emerge.'
                : 'Click below to analyze your thoughts and discover insights.'}
            </p>
            <button
              onClick={updateObservations}
              disabled={loading || entries.length === 0}
              className="px-6 py-3 bg-white/80 text-slate-700 border-2 border-yellow-300 rounded-full font-medium hover:border-yellow-400 hover:bg-yellow-50/80 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto backdrop-blur-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Generate Insights</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100/60 via-blue-100/50 to-pink-100/60 relative overflow-hidden">
      {/* Playful background elements - MUCH more visible */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-300/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-300/25 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      {/* Floating decorative shapes */}
      <div className="absolute top-20 right-20 w-20 h-20 bg-yellow-400/40 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-32 left-32 w-16 h-16 bg-blue-400/40 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }}></div>
      <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-pink-400/40 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-3xl">🤖</span>
              Your Companion
            </h1>
            {lastUpdated && (
              <p className="text-sm text-slate-500">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={updateObservations}
            disabled={loading}
            className="px-5 py-2.5 bg-white/80 text-slate-700 border-2 border-yellow-300 rounded-full font-medium hover:border-yellow-400 hover:bg-yellow-50/80 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 backdrop-blur-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Update Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Observations */}
        <div className="space-y-4">
          {observations.map((observation, index) => {
            const Icon = getRandomIcon(index);
            const gradient = getRandomGradient(index);
            
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md`}>
                    <Icon className={`w-6 h-6 text-slate-700`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 leading-relaxed text-base font-medium">
                      {observation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompanionView;

