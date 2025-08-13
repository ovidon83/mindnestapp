import React, { useState } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Calendar,
  Zap,
  Target,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType, Priority, TaskStatus, ReviewReason } from '../types';

export const ThoughtsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | EntryType>('all');
  const [showReviewSection, setShowReviewSection] = useState(true);
  
  const { 
    getFilteredEntries,
    getEntriesNeedingReview,
    getUrgentEntries,
    completeEntry,
    deleteEntry,
    markReviewed,
    setEditingEntry,
    getTopTags
  } = useGenieNotesStore();

  const allEntries = getFilteredEntries();
  const reviewEntries = getEntriesNeedingReview();
  const urgentEntries = getUrgentEntries();
  const topTags = getTopTags(allEntries);

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Zap className="w-4 h-4" />;
      case 'insight': return <Target className="w-4 h-4" />;
      case 'reflection': return <TrendingUp className="w-4 h-4" />;
      case 'journal': return <CalendarDays className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      case 'note': return <Edit2 className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
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
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'note': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReviewReasonLabel = (reason: ReviewReason) => {
    switch (reason) {
      case 'unclear_outcome': return 'Unclear Outcome';
      case 'overdue': return 'Overdue';
      case 'ignored_long_time': return 'Ignored Too Long';
      case 'needs_clarification': return 'Needs Clarification';
      case 'low_confidence': return 'Low Confidence';
      default: return 'Review Needed';
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  const renderEntryCard = (entry: Entry) => (
    <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
            {getTypeIcon(entry.type)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{entry.content}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                {entry.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                {entry.status.replace('_', ' ')}
              </span>
              {entry.needsReview && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Review
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => completeEntry(entry.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Mark complete"
          >
            <CheckCircle2 size={16} />
          </button>
          <button
            onClick={() => setEditingEntry(entry.id)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => deleteEntry(entry.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
        {entry.dueDate && (
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>Due {entry.dueDate instanceof Date ? entry.dueDate.toLocaleDateString() : new Date(entry.dueDate).toLocaleDateString()}</span>
          </div>
        )}
        
        {entry.startDate && (
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{entry.startDate instanceof Date ? entry.startDate.toLocaleDateString() : new Date(entry.startDate).toLocaleDateString()}</span>
          </div>
        )}
        
        {entry.location && (
          <div className="flex items-center space-x-1">
            <MapPin size={14} />
            <span>{entry.location}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          <span>Created {formatDate(entry.createdAt)}</span>
        </div>
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {entry.tags.map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Review Info */}
      {entry.needsReview && entry.reviewReason && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              {getReviewReasonLabel(entry.reviewReason)}
            </span>
            {entry.reviewNote && (
              <span className="text-yellow-700">: {entry.reviewNote}</span>
            )}
          </div>
          <button
            onClick={() => markReviewed(entry.id)}
            className="mt-2 text-xs text-yellow-700 hover:text-yellow-800 underline"
          >
            Mark as reviewed
          </button>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">{entry.notes}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thoughts</h1>
              <p className="text-gray-600">Your collection of captured thoughts, organized and prioritized</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{allEntries.length}</div>
                <div className="text-sm text-gray-500">Total entries</div>
              </div>
              {urgentEntries.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">{urgentEntries.length}</div>
                  <div className="text-sm text-gray-500">Urgent</div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              {(['all', 'task', 'event', 'idea', 'insight', 'reflection', 'journal', 'reminder', 'note'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* To Review Section */}
          {reviewEntries.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-yellow-800 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>To Review ({reviewEntries.length})</span>
                </h2>
                <button
                  onClick={() => setShowReviewSection(!showReviewSection)}
                  className="text-yellow-700 hover:text-yellow-800"
                >
                  {showReviewSection ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showReviewSection && (
                <div className="space-y-3">
                  {reviewEntries.map(renderEntryCard)}
                </div>
              )}
            </div>
          )}

          {/* All Entries */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Entries</h2>
            {allEntries.length > 0 ? (
              <div className="space-y-3">
                {allEntries.map(renderEntryCard)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No entries found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Top Tags */}
          {topTags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tags</h3>
              <div className="flex flex-wrap gap-2">
                {topTags.map(({ tag, count }) => (
                  <span key={tag} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    #{tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
