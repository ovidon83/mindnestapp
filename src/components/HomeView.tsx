import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  Tag, 
  CheckCircle, 
  Edit3, 
  Trash2, 
  Eye,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Lightbulb,
  BookOpen,
  Bell,
  FileText,
  BarChart3
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { EntryType, Priority, TaskStatus } from '../types';

export const HomeView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all' as EntryType | 'all',
    priority: 'all' as Priority | 'all',
    status: 'all' as TaskStatus | 'all',
    needsReview: false
  });

  const { 
    getFilteredEntries,
    getEntriesNeedingReview,
    getUrgentEntries,
    completeEntry,
    deleteEntry,
    markReviewed,
    setEditingEntry: setStoreEditingEntry,
    getTopTags
  } = useGenieNotesStore();

  const allEntries = getFilteredEntries();
  const reviewEntries = getEntriesNeedingReview();
  const urgentEntries = getUrgentEntries();
  const topTags = getTopTags(allEntries);

  // Debug logging
  console.log('=== HomeView Debug ===');
  console.log('All entries:', allEntries);
  console.log('Review entries:', reviewEntries);
  console.log('Urgent entries:', urgentEntries);
  console.log('Top tags:', topTags);

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <Target className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      case 'idea': return <Lightbulb className="w-5 h-5" />;
      case 'insight': return <TrendingUp className="w-5 h-5" />;
      case 'reflection': return <Eye className="w-5 h-5" />;
      case 'journal': return <BookOpen className="w-5 h-5" />;
      case 'reminder': return <Bell className="w-5 h-5" />;
      case 'note': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-green-100 text-green-800 border-green-200';
      case 'idea': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'insight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reflection': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'journal': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'reminder': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'note': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Welcome Home
              </h1>
              <p className="text-gray-600 text-lg">
                Your personal thought sanctuary and productivity hub
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{allEntries.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              {urgentEntries.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200 bg-red-50">
                  <div className="text-2xl font-bold text-red-600">{urgentEntries.length}</div>
                  <div className="text-sm text-red-500">Urgent</div>
                </div>
              )}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{reviewEntries.length}</div>
                <div className="text-sm text-gray-500">Review</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{topTags.length}</div>
                <div className="text-sm text-gray-500">Tags</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={activeFilters.type}
                onChange={(e) => setActiveFilters({...activeFilters, type: e.target.value as EntryType | 'all'})}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">All Types</option>
                <option value="task">Tasks</option>
                <option value="event">Events</option>
                <option value="idea">Ideas</option>
                <option value="insight">Insights</option>
                <option value="reflection">Reflections</option>
                <option value="journal">Journal</option>
                <option value="reminder">Reminders</option>
                <option value="note">Notes</option>
              </select>
              
              <select
                value={activeFilters.priority}
                onChange={(e) => setActiveFilters({...activeFilters, priority: e.target.value as Priority | 'all'})}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Urgent & Review */}
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent Section */}
            {urgentEntries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-500" />
                    Urgent Items
                  </h2>
                  <span className="text-sm text-gray-500">{urgentEntries.length} items</span>
                </div>
                <div className="space-y-3">
                  {urgentEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                            {entry.priority}
                          </span>
                          {entry.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(entry.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => completeEntry(entry.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Section */}
            {reviewEntries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-orange-500" />
                    Needs Review
                  </h2>
                  <span className="text-sm text-gray-500">{reviewEntries.length} items</span>
                </div>
                <div className="space-y-3">
                  {reviewEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => markReviewed(entry.id)}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Entries */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  All Entries
                </h2>
                <span className="text-sm text-gray-500">{allEntries.length} items</span>
              </div>
              <div className="space-y-3">
                {allEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                          {entry.priority}
                        </span>
                        {entry.tags && entry.tags.length > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {entry.tags[0]}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {getRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setStoreEditingEntry(entry.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Analytics & Tags */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks</span>
                  <span className="font-medium text-gray-900">
                    {allEntries.filter(e => e.type === 'task').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ideas</span>
                  <span className="font-medium text-gray-900">
                    {allEntries.filter(e => e.type === 'idea').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Insights</span>
                  <span className="font-medium text-gray-900">
                    {allEntries.filter(e => e.type === 'insight').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-gray-900">
                    {allEntries.filter(e => e.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Tags */}
            {topTags.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-500" />
                  Top Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topTags.slice(0, 8).map((tag) => (
                    <span
                      key={tag.tag}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200"
                    >
                      #{tag.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {allEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{entry.content}</p>
                      <p className="text-xs text-gray-500">{getRelativeTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
