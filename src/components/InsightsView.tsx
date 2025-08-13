import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  Zap,
  Download,
  Share2,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { EntryType } from '../types';

export const InsightsView: React.FC = () => {
  const { getAnalytics, setCurrentView } = useGenieNotesStore();
  const analytics = getAnalytics();

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <Target className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Zap className="w-4 h-4" />;
      case 'insight': return <BarChart3 className="w-4 h-4" />;
      case 'reflection': return <TrendingUp className="w-4 h-4" />;
      case 'journal': return <Clock className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'idea': return 'bg-purple-100 text-purple-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'reflection': return 'bg-indigo-100 text-indigo-800';
      case 'journal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductivityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProductivityScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  const getMoodScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMoodScoreLabel = (score: number) => {
    if (score >= 4) return 'Great';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Okay';
    if (score >= 1) return 'Bad';
    return 'Terrible';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insights & Analytics</h1>
              <p className="text-gray-600">Discover patterns and trends in your productivity and thinking</p>
            </div>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex space-x-2 bg-white rounded-lg border border-gray-200 p-1 w-fit">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setCurrentView('capture')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  range === '30d' // Assuming '30d' is the default or current range
                    ? 'bg-blue-100 text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {getTimeRangeLabel(range)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Entries</h3>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.totalEntries}</div>
            <p className="text-sm text-gray-600">All time</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</div>
            <p className="text-sm text-gray-600">Tasks completed</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Productivity Score</h3>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className={`text-2xl font-bold ${getProductivityScoreColor(analytics.productivityScore)}`}>
              {analytics.productivityScore}
            </div>
            <p className="text-sm text-gray-600">{getProductivityScoreLabel(analytics.productivityScore)}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Average Mood</h3>
              <span className="text-2xl">😊</span>
            </div>
            <div className={`text-2xl font-bold ${getMoodScoreColor(analytics.averageMood)}`}>
              {analytics.averageMood}/5
            </div>
            <p className="text-sm text-gray-600">{getMoodScoreLabel(analytics.averageMood)}</p>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Entries by Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Entries by Type</h3>
            {Object.entries(analytics.entriesByType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.entriesByType)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(type as EntryType)}`}>
                          {getTypeIcon(type as EntryType)}
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalEntries) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>

          {/* Top Tags */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tags</h3>
            {analytics.topTags.length > 0 ? (
              <div className="space-y-3">
                {analytics.topTags.slice(0, 8).map((tag, index) => (
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
                    <span className="text-sm text-gray-600">{tag.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No tags found</p>
            )}
          </div>
        </div>

        {/* Time-based Analytics */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Entries by Hour */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Hour</h3>
            {analytics.entriesByTime.length > 0 ? (
              <div className="space-y-2">
                {analytics.entriesByTime.map(({ hour, count }) => (
                  <div key={hour} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-12">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${(count / Math.max(...analytics.entriesByTime.map(t => t.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No time data available</p>
            )}
          </div>

          {/* Entries by Day */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Day</h3>
            {analytics.entriesByDay.length > 0 ? (
              <div className="space-y-2">
                {analytics.entriesByDay.map(({ day, count }) => (
                  <div key={day} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-16">{day}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full" 
                        style={{ width: `${(count / Math.max(...analytics.entriesByDay.map(d => d.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No day data available</p>
            )}
          </div>
        </div>

        {/* Insights Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Productivity Patterns</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Most active during {analytics.entriesByTime.length > 0 ? 
                  analytics.entriesByTime.reduce((max, current) => current.count > max.count ? current : max).hour + ' ' + 
                  (analytics.entriesByTime.reduce((max, current) => current.count > max.count ? current : max).hour < 12 ? 'AM' : 'PM') : 'unknown'} hours</p>
                <p>• {analytics.completionRate}% task completion rate</p>
                <p>• Productivity score: {analytics.productivityScore}/100</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Content Trends</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Most common type: {Object.entries(analytics.entriesByType).length > 0 ? 
                  Object.entries(analytics.entriesByType).reduce((max, current) => current[1] > max[1] ? current : max)[0] : 'none'}</p>
                <p>• Top tag: {analytics.topTags.length > 0 ? '#' + analytics.topTags[0].tag : 'none'}</p>
                <p>• Average mood: {getMoodScoreLabel(analytics.averageMood)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>Data from {getTimeRangeLabel('30d')}</span>
          </div>
          
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Download size={16} />
              <span>Export Report</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Share2 size={16} />
              <span>Share Insights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
