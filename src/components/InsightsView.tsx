import React, { useState } from 'react';
import { useGenieNotesStore } from '../store';
import { Entry } from '../types';
import { Lightbulb, Trash2, BarChart3, X, Clock, Search } from 'lucide-react';
import Analytics from './Analytics';

const InsightsView: React.FC = () => {
  const { entries, setCurrentView, deleteEntry, user, signOut, currentView } = useGenieNotesStore();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter to only show insights
  const insights = entries.filter(e => e.type === 'insight');
  
  // Apply search filter
  const filteredInsights = searchQuery === '' 
    ? insights 
    : insights.filter(entry => 
        entry.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this insight?')) {
      await deleteEntry(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Search and Analytics */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px]"
              />
            </div>
            {/* Analytics Button */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[44px] flex-shrink-0"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Analytics entries={insights} type="insight" />
        </div>
      )}

      {/* Content */}
      <div className="w-full px-8 py-6">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? 'No insights match your search' : 'No insights yet'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Capture your first insight to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Capture Insight
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      Insight
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(insight.id)}
                    className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-sm sm:text-base text-slate-900 font-medium mb-2 line-clamp-3">
                  {insight.originalText}
                </div>
                
                {insight.summary && insight.summary !== insight.originalText && (
                  <div className="text-xs sm:text-sm text-slate-600 mb-3 line-clamp-2">
                    {insight.summary}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(insight.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsView;

