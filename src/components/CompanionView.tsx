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
      'from-purple-100 to-pink-100',
      'from-blue-100 to-cyan-100',
      'from-amber-100 to-orange-100',
      'from-emerald-100 to-teal-100',
      'from-indigo-100 to-purple-100',
    ];
    return gradients[index % gradients.length];
  };

  if (observations.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Brain className="w-4 h-4 text-yellow-900" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
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
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
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
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-md`}>
                    <Icon className={`w-6 h-6 text-purple-600`} />
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

