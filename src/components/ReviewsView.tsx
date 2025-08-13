import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Target, 
  BarChart3,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { ReviewSummary } from '../types';

export const ReviewsView: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const { 
    generateDailyReview, 
    generateWeeklyReview, 
    generateMonthlyReview,
    setCurrentView 
  } = useGenieNotesStore();

  const getCurrentReview = (): ReviewSummary => {
    switch (activePeriod) {
      case 'daily':
        return generateDailyReview();
      case 'weekly':
        return generateWeeklyReview();
      case 'monthly':
        return generateMonthlyReview();
      default:
        return generateDailyReview();
    }
  };

  const review = getCurrentReview();

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return period;
    }
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'daily':
        return <Calendar className="w-5 h-5" />;
      case 'weekly':
        return <TrendingUp className="w-5 h-5" />;
      case 'monthly':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    if (activePeriod === 'daily') {
      return start.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (activePeriod === 'weekly') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return start.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  };

  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'okay': return '😐';
      case 'bad': return '😔';
      case 'terrible': return '😢';
      default: return '😐';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reviews & Summaries</h1>
              <p className="text-gray-600">Track your progress and gain insights from your daily activities</p>
            </div>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-2 bg-white rounded-lg border border-gray-200 p-1 w-fit">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activePeriod === period
                    ? 'bg-blue-100 text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {getPeriodIcon(period)}
                <span>{getPeriodLabel(period)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Entries</h3>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{review.totalEntries}</div>
            <p className="text-sm text-gray-600">New this {activePeriod}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Tasks Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{review.completedTasks}</div>
            <p className="text-sm text-gray-600">
              {getCompletionRate(review.completedTasks, review.totalEntries)}% completion
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Upcoming Deadlines</h3>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{review.upcomingDeadlines}</div>
            <p className="text-sm text-gray-600">Need attention</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Mood</h3>
              <span className="text-2xl">{getMoodEmoji(review.moodTrend)}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {review.moodTrend ? review.moodTrend.charAt(0).toUpperCase() + review.moodTrend.slice(1) : 'N/A'}
            </div>
            <p className="text-sm text-gray-600">Overall feeling</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Top Tags */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tags & Themes</h3>
              {review.topTags.length > 0 ? (
                <div className="space-y-3">
                  {review.topTags.map((tag, index) => (
                    <div key={tag.tag} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">#{tag.tag}</span>
                      </div>
                      <span className="text-sm text-gray-600">{tag.count} entries</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No tags found for this period</p>
              )}
            </div>
          </div>

          {/* Top Themes */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Themes</h3>
              {review.topThemes.length > 0 ? (
                <div className="space-y-3">
                  {review.topThemes.map((theme, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{theme}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No themes identified</p>
              )}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
            {review.insights.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {review.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-blue-900">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No insights available for this period</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>Period: {formatDateRange(review.startDate, review.endDate)}</span>
          </div>
          
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Download size={16} />
              <span>Export</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
