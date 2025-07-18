import React, { useState } from 'react';
import { 
  BookOpen, 
  Save,
  Loader2,
  Sparkles,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

export const JournalView: React.FC = () => {
  const [journalContent, setJournalContent] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad' | 'terrible'>('okay');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  
  const { addJournalEntry, journalEntries } = useMindnestStore();

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
    const recentEntries = journalEntries.slice(0, 7); // Last 7 entries
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal</h1>
        <p className="text-gray-600">Reflect on your day and track your emotional patterns</p>
      </div>

      {/* Mood Trend */}
      {moodTrend && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp size={20} className="text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Mood Trend</h3>
              <p className="text-sm text-gray-600">
                Your mood has been {moodTrend} over the last 7 days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Entry Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">New Entry</h2>
        
        {/* Mood Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling?
          </label>
          <div className="flex space-x-2">
            {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((moodKey) => (
              <button
                key={moodKey}
                onClick={() => setMood(moodKey)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  mood === moodKey
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{moodEmojis[moodKey]}</span>
                <span className="text-sm font-medium">{moodLabels[moodKey]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Journal Content */}
        <div className="mb-4">
          <label htmlFor="journal-content" className="block text-sm font-medium text-gray-700 mb-2">
            What's on your mind?
          </label>
          <textarea
            id="journal-content"
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            placeholder="Write about your day, thoughts, feelings, or anything that's on your mind..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* AI Insight */}
        {aiInsight && (
          <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Sparkles size={16} className="text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 mb-1">AI Reflection</h4>
                <p className="text-sm text-purple-800">{aiInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveJournal}
            disabled={!journalContent.trim() || isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Entry</span>
              </>
            )}
          </button>
          
          {journalContent.trim() && (
            <button
              onClick={handleAnalyzeEntry}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Get AI Insight</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Entries</h2>
        <div className="space-y-4">
          {journalEntries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
              <p className="text-gray-600">Start by writing your first entry above</p>
            </div>
          ) : (
            journalEntries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{moodLabels[entry.mood]}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{entry.content}</p>
                
                {entry.aiReflection && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <MessageSquare size={16} className="text-gray-600 mt-0.5" />
                      <p className="text-sm text-gray-700">{entry.aiReflection}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 