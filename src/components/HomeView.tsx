import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  Tag, 
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
import { EntryType, Priority, TaskStatus, Entry } from '../types';

export const HomeView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all' as EntryType | 'all',
    priority: 'all' as Priority | 'all',
    status: 'all' as TaskStatus | 'all',
    needsReview: false
  });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { 
    getFilteredEntries,
    getEntriesNeedingReview,
    getUrgentEntries,
    deleteEntry,
    markReviewed,
    getTopTags,
    updateEntry
  } = useGenieNotesStore();

  const allEntries = getFilteredEntries();
  const reviewEntries = getEntriesNeedingReview();
  const urgentEntries = getUrgentEntries();
  const topTags = getTopTags(allEntries);

  // Apply search filter
  const searchFilteredEntries = searchQuery.trim() 
    ? allEntries.filter(entry => 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.location && entry.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allEntries;

  // Apply active filters
  const filteredEntries = searchFilteredEntries.filter(entry => {
    // Filter by type
    if (activeFilters.type !== 'all' && entry.type !== activeFilters.type) return false;
    
    // Filter by priority
    if (activeFilters.priority !== 'all' && entry.priority !== activeFilters.priority) return false;
    
    // Filter by status
    if (activeFilters.status !== 'all' && entry.status !== activeFilters.status) return false;
    
    // Filter by review status
    if (activeFilters.needsReview && !entry.needsReview) return false;
    
    return true;
  });

  // Date-based organization
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const todayEntries = filteredEntries.filter(entry => {
    // Check if entry has "today" tag or mentions today
    if (entry.tags?.some(tag => tag.toLowerCase().includes('today'))) return true;
    
    // Check if entry mentions "today" in content
    if (entry.content.toLowerCase().includes('today')) return true;
    
    // Check if due date is today
    if (entry.dueDate && entry.dueDate >= today && entry.dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) return true;
    
    // Check if created today
    if (entry.createdAt >= today && entry.createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) return true;
    
    return false;
  });

  const thisWeekEntries = filteredEntries.filter(entry => {
    // Check if entry has "this week" tag or mentions this week
    if (entry.tags?.some(tag => tag.toLowerCase().includes('week') || tag.toLowerCase().includes('weekly'))) return true;
    
    // Check if entry mentions "this week" in content
    if (entry.content.toLowerCase().includes('this week') || entry.content.toLowerCase().includes('week')) return true;
    
    // Check if due date is this week
    if (entry.dueDate && entry.dueDate >= today && entry.dueDate < endOfWeek) return true;
    
    // Check if created this week
    if (entry.createdAt >= today && entry.createdAt < endOfWeek) return true;
    
    return false;
  });

  const upcomingEntries = filteredEntries.filter(entry => {
    // Check if entry has "upcoming" tag
    if (entry.tags?.some(tag => tag.toLowerCase().includes('upcoming') || tag.toLowerCase().includes('future'))) return true;
    
    // Check if entry mentions future dates
    if (entry.content.toLowerCase().includes('next week') || entry.content.toLowerCase().includes('next month') || 
        entry.content.toLowerCase().includes('tomorrow') || entry.content.toLowerCase().includes('upcoming')) return true;
    
    // Check if due date is in the future
    if (entry.dueDate && entry.dueDate > endOfWeek) return true;
    
    return false;
  });

  // Debug logging
  console.log('=== HomeView Debug ===');
  console.log('All entries:', allEntries);
  console.log('Today entries:', todayEntries);
  console.log('This week entries:', thisWeekEntries);
  console.log('Upcoming entries:', upcomingEntries);
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

  // Sort entries with urgent items first, then by priority and recency
  const sortEntries = (entries: Entry[]) => {
    return entries.sort((a, b) => {
      // First: urgent items go to the top
      const aIsUrgent = a.priority === 'urgent' || (a.dueDate && a.dueDate <= new Date());
      const bIsUrgent = b.priority === 'urgent' || (b.dueDate && b.dueDate <= new Date());
      
      if (aIsUrgent && !bIsUrgent) return -1;
      if (!aIsUrgent && bIsUrgent) return 1;
      
      // Second: if both are urgent or both are not urgent, sort by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Third: if same priority, sort by due date (earlier due dates first)
      if (a.dueDate && b.dueDate) {
        const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
        if (dateDiff !== 0) return dateDiff;
      } else if (a.dueDate && !b.dueDate) return -1;
      else if (!a.dueDate && b.dueDate) return 1;
      
      // Fourth: if same priority and due date, sort by creation time (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleSaveEntry = (updatedEntry: Partial<Entry>) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, {
        ...updatedEntry,
        updatedAt: new Date()
      });
      setShowEditModal(false);
      setEditingEntry(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingEntry(null);
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
              {todayEntries.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">{todayEntries.length}</div>
                  <div className="text-sm text-blue-500">Today</div>
                </div>
              )}
              {thisWeekEntries.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{thisWeekEntries.length}</div>
                  <div className="text-sm text-green-500">This Week</div>
                </div>
              )}
              {upcomingEntries.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600">{upcomingEntries.length}</div>
                  <div className="text-sm text-purple-500">Upcoming</div>
                </div>
              )}
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

              <select
                value={activeFilters.status}
                onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value as TaskStatus | 'all'})}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>

              <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={activeFilters.needsReview}
                  onChange={(e) => setActiveFilters({...activeFilters, needsReview: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Review Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Urgent & Review */}
          <div className="lg:col-span-2 space-y-6">
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
                  {sortEntries(reviewEntries).slice(0, 3).map((entry) => (
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
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditEntry(entry)}
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
                        <button
                          onClick={() => markReviewed(entry.id)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today Section */}
            {todayEntries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Today
                  </h2>
                  <span className="text-sm text-gray-500">{todayEntries.length} items</span>
                </div>
                <div className="space-y-3">
                  {sortEntries(todayEntries).slice(0, 4).map((entry) => {
                    const isUrgent = entry.priority === 'urgent' || 
                      (entry.dueDate && entry.dueDate <= new Date());
                    
                    return (
                      <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isUrgent 
                          ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}>
                        <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                          {getTypeIcon(entry.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                              {entry.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                              {entry.priority}
                            </span>
                            {isUrgent && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
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
                            onClick={() => handleEditEntry(entry)}
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* This Week Section */}
            {thisWeekEntries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    This Week
                  </h2>
                  <span className="text-sm text-gray-500">{thisWeekEntries.length} items</span>
                </div>
                <div className="space-y-3">
                  {sortEntries(thisWeekEntries).slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                      <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                            {entry.priority}
                          </span>
                          {entry.tags && entry.tags.length > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                              {entry.tags[0]}
                            </span>
                          )}
                          {entry.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(entry.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
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
            )}

            {/* Upcoming Section */}
            {upcomingEntries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Upcoming
                  </h2>
                  <span className="text-sm text-gray-500">{upcomingEntries.length} items</span>
                </div>
                <div className="space-y-3">
                  {sortEntries(upcomingEntries).slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
                      <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                            {entry.priority}
                          </span>
                          {entry.tags && entry.tags.length > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              {entry.tags[0]}
                            </span>
                          )}
                          {entry.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(entry.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
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
            )}

            {/* Recent Entries (fallback when no time-based entries) */}
            {todayEntries.length === 0 && thisWeekEntries.length === 0 && upcomingEntries.length === 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    Recent Entries
                  </h2>
                  <span className="text-sm text-gray-500">{allEntries.length} items</span>
                </div>
                <div className="space-y-3">
                  {sortEntries(allEntries).slice(0, 3).map((entry) => (
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
                          onClick={() => handleEditEntry(entry)}
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
            )}
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

      {/* Edit Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Edit Entry</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({...editingEntry, content: e.target.value})}
                  className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter your thought content..."
                />
              </div>

              {/* Type and Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={editingEntry.type}
                    onChange={(e) => setEditingEntry({...editingEntry, type: e.target.value as EntryType})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="task">Task</option>
                    <option value="event">Event</option>
                    <option value="idea">Idea</option>
                    <option value="insight">Insight</option>
                    <option value="reflection">Reflection</option>
                    <option value="journal">Journal</option>
                    <option value="reminder">Reminder</option>
                    <option value="note">Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={editingEntry.priority}
                    onChange={(e) => setEditingEntry({...editingEntry, priority: e.target.value as Priority})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Status and Due Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingEntry.status}
                    onChange={(e) => setEditingEntry({...editingEntry, status: e.target.value as TaskStatus})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    value={editingEntry.dueDate ? new Date(editingEntry.dueDate.getTime() - editingEntry.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingEntry({...editingEntry, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tags and Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editingEntry.tags?.join(', ') || ''}
                    onChange={(e) => setEditingEntry({...editingEntry, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={editingEntry.location || ''}
                    onChange={(e) => setEditingEntry({...editingEntry, location: e.target.value || undefined})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editingEntry.notes || ''}
                  onChange={(e) => setEditingEntry({...editingEntry, notes: e.target.value || undefined})}
                  className="w-full h-20 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add additional notes..."
                />
              </div>

              {/* Review Settings */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingEntry.needsReview || false}
                    onChange={(e) => setEditingEntry({...editingEntry, needsReview: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Needs Review</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEntry(editingEntry)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
