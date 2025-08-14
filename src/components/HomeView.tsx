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
  BarChart3,
  CheckCircle
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
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'upcoming' | 'completed'>('today');

  const {
    entries,
    deleteEntry,
    updateEntry,
    getTopTags,
    changeEntryTimePeriod,
    adjustPriority,
    markReviewed
  } = useGenieNotesStore();

  // Auto-cleanup on mount to ensure data consistency
  React.useEffect(() => {
    // No cleanup needed - user doesn't want this functionality
  }, []);

  // Get raw entries from store and apply all filtering consistently
  const rawEntries = entries; // Use raw entries from store
  const reviewEntries = rawEntries.filter(entry => entry.needsReview);
  const topTags = getTopTags(rawEntries);

  // Apply search filter
  const searchFilteredEntries = searchQuery.trim() 
    ? rawEntries.filter(entry => 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.location && entry.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : rawEntries;

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

  // Date-based organization using new directive system
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const todayEntries = filteredEntries.filter(entry => {
    // EXCLUDE completed entries from time-based views
    if (entry.status === 'completed') return false;
    
    // Check if entry is pinned to today
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate.toDateString() === today.toDateString()) return true;
    
    // Check if entry has "today" tag (legacy support)
    if (entry.tags?.some(tag => tag.toLowerCase().includes('today'))) return true;
    
    // Check if entry mentions "today" in content
    if (entry.content.toLowerCase().includes('today')) return true;
    
    // Check if due date is today
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate >= today && entry.dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) return true;
    
    // Check if created today
    if (entry.createdAt && entry.createdAt instanceof Date && entry.createdAt >= today && entry.createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) return true;
    
    return false;
  });

  const thisWeekEntries = filteredEntries.filter(entry => {
    // EXCLUDE completed entries from time-based views
    if (entry.status === 'completed') return false;
    
    // EXCLUDE entries that are already in today
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    
    // Check if entry targets current week
    if (entry.targetWeek === 'currentWeek') return true;
    
    // Check if entry has "this week" tag (legacy support)
    if (entry.tags?.some(tag => tag.toLowerCase().includes('week') || tag.toLowerCase().includes('weekly'))) return true;
    
    // Check if entry mentions "this week" in content
    if (entry.content.toLowerCase().includes('this week') || entry.content.toLowerCase().includes('week')) return true;
    
    // Check if due date is this week
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate >= today && entry.dueDate < endOfWeek) return true;
    
    // Check if created this week
    if (entry.createdAt && entry.createdAt instanceof Date && entry.createdAt >= today && entry.createdAt < endOfWeek) return true;
    
    return false;
  });

  const upcomingEntries = filteredEntries.filter(entry => {
    // EXCLUDE completed entries from time-based views
    if (entry.status === 'completed') return false;
    
    // EXCLUDE entries that are already in today or this week
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (thisWeekEntries.some(weekEntry => weekEntry.id === entry.id)) return false;
    
    // Check if entry targets next week
    if (entry.targetWeek === 'nextWeek') return true;
    
    // Check if entry has "upcoming" tag (legacy support)
    if (entry.tags?.some(tag => tag.toLowerCase().includes('upcoming') || tag.toLowerCase().includes('future'))) return true;
    
    // Check if entry mentions future dates
    if (entry.content.toLowerCase().includes('next week') || entry.content.toLowerCase().includes('next month') || 
        entry.content.toLowerCase().includes('tomorrow') || entry.content.toLowerCase().includes('upcoming')) return true;
    
    // Check if due date is in the future
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate > endOfWeek) return true;
    
    return false;
  });

  // Get completed entries separately
  const completedEntries = filteredEntries.filter(entry => entry.status === 'completed');

  // Debug logging with detailed counts
  console.log('=== HomeView Debug ===');
  console.log('Raw entries from store:', rawEntries.length);
  console.log('Filtered entries (after search + filters):', filteredEntries.length);
  console.log('Today entries:', todayEntries.length);
  console.log('This week entries:', thisWeekEntries.length);
  console.log('Upcoming entries:', upcomingEntries.length);
  console.log('Review entries:', reviewEntries.length);
  console.log('Completed entries:', completedEntries.length);
  
  // Show ALL raw entries to find the missing one
  console.log('=== ALL RAW ENTRIES ===');
  rawEntries.forEach((entry, index) => {
    console.log(`Entry ${index + 1}:`, {
      id: entry.id,
      content: entry.content,
      type: entry.type,
      status: entry.status,
      priority: entry.priority,
      pinnedForDate: entry.pinnedForDate,
      dueDate: entry.dueDate,
      createdAt: entry.createdAt,
      tags: entry.tags
    });
  });
  
  // Check for duplicate counting
  const todayIds = todayEntries.map(e => e.id);
  const weekIds = thisWeekEntries.map(e => e.id);
  const upcomingIds = upcomingEntries.map(e => e.id);
  
  const duplicatesTodayWeek = todayIds.filter(id => weekIds.includes(id));
  const duplicatesTodayUpcoming = todayIds.filter(id => upcomingIds.includes(id));
  const duplicatesWeekUpcoming = weekIds.filter(id => upcomingIds.includes(id));
  
  console.log('Duplicates between Today and This Week:', duplicatesTodayWeek.length, duplicatesTodayWeek);
  console.log('Duplicates between Today and Upcoming:', duplicatesTodayUpcoming.length, duplicatesTodayUpcoming);
  console.log('Duplicates between This Week and Upcoming:', duplicatesWeekUpcoming.length, duplicatesWeekUpcoming);
  
  // Log individual entries for debugging
  console.log('Today entries details:', todayEntries.map(e => ({ id: e.id, content: e.content, type: e.type, pinnedForDate: e.pinnedForDate, dueDate: e.dueDate, createdAt: e.createdAt })));
  console.log('This week entries details:', thisWeekEntries.map(e => ({ id: e.id, content: e.content, type: e.type, targetWeek: e.targetWeek, dueDate: e.dueDate, createdAt: e.createdAt })));
  
  // Debug the missing entry specifically
  console.log('=== DEBUGGING MISSING ENTRY ===');
  const missingEntry = rawEntries.find(entry => 
    entry.content.includes('Review 2013s classic schedule and talk to Lauren about changing the game on 10/18 for later')
  );
  if (missingEntry) {
    console.log('Missing entry found:', missingEntry);
    console.log('Why not in Today?');
    console.log('- Has today tag?', missingEntry.tags?.some(tag => tag.toLowerCase().includes('today')));
    console.log('- Mentions today?', missingEntry.content.toLowerCase().includes('today'));
    console.log('- Due date today?', missingEntry.dueDate && missingEntry.dueDate instanceof Date && missingEntry.dueDate >= today && missingEntry.dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000));
    console.log('- Created today?', missingEntry.createdAt && missingEntry.createdAt instanceof Date && missingEntry.createdAt >= today && missingEntry.createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000));
    console.log('- Pinned to today?', missingEntry.pinnedForDate && missingEntry.pinnedForDate instanceof Date && missingEntry.pinnedForDate.toDateString() === today.toDateString());
    
    console.log('Why not in This Week?');
    console.log('- Has week tag?', missingEntry.tags?.some(tag => tag.toLowerCase().includes('week') || tag.toLowerCase().includes('weekly')));
    console.log('- Mentions week?', missingEntry.content.toLowerCase().includes('this week') || missingEntry.content.toLowerCase().includes('week'));
    console.log('- Due date this week?', missingEntry.dueDate && missingEntry.dueDate instanceof Date && missingEntry.dueDate >= today && missingEntry.dueDate < endOfWeek);
    console.log('- Created this week?', missingEntry.createdAt && missingEntry.createdAt instanceof Date && missingEntry.createdAt >= today && missingEntry.createdAt < endOfWeek);
    console.log('- Target week?', missingEntry.targetWeek);
    
    console.log('Why not in Upcoming?');
    console.log('- Has upcoming tag?', missingEntry.tags?.some(tag => tag.toLowerCase().includes('upcoming') || tag.toLowerCase().includes('future')));
    console.log('- Mentions future?', missingEntry.content.toLowerCase().includes('next week') || missingEntry.content.toLowerCase().includes('next month') || missingEntry.content.toLowerCase().includes('tomorrow') || missingEntry.content.toLowerCase().includes('upcoming'));
    console.log('- Due date future?', missingEntry.dueDate && missingEntry.dueDate instanceof Date && missingEntry.dueDate > endOfWeek);
    console.log('- Target week next?', missingEntry.targetWeek);
  }

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
      case 'task': return 'bg-blue-100 text-blue-700';
      case 'event': return 'bg-green-100 text-green-700';
      case 'idea': return 'bg-purple-100 text-purple-700';
      case 'insight': return 'bg-indigo-100 text-indigo-700';
      case 'reflection': return 'bg-pink-100 text-pink-700';
      case 'journal': return 'bg-yellow-100 text-yellow-700';
      case 'reminder': return 'bg-orange-100 text-orange-700';
      case 'note': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
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

  // Get entries for the current active tab
  const getCurrentTabEntries = () => {
    switch (activeTab) {
      case 'today':
        return todayEntries;
      case 'week':
        return thisWeekEntries;
      case 'upcoming':
        return upcomingEntries;
      case 'completed':
        return completedEntries;
      default:
        return todayEntries;
    }
  };

  // Set default tab based on available entries
  React.useEffect(() => {
    if (todayEntries.length > 0 && activeTab === 'today') return;
    if (thisWeekEntries.length > 0 && activeTab === 'week') return;
    if (upcomingEntries.length > 0 && activeTab === 'upcoming') return;
    if (completedEntries.length > 0 && activeTab === 'completed') return;
    
    // Set to first tab with entries
    if (todayEntries.length > 0) setActiveTab('today');
    else if (thisWeekEntries.length > 0) setActiveTab('week');
    else if (upcomingEntries.length > 0) setActiveTab('upcoming');
    else if (completedEntries.length > 0) setActiveTab('completed');
  }, [todayEntries.length, thisWeekEntries.length, upcomingEntries.length, completedEntries.length, activeTab]);

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
          </div>

          {/* Stats Cards - Beautiful Design */}
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {/* Total Entries */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-blue-700">{filteredEntries.length}</div>
                    <div className="text-sm font-medium text-blue-600">Total</div>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </div>

              {/* Today */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-green-700">{todayEntries.length}</div>
                    <div className="text-sm font-medium text-green-600">Today</div>
                  </div>
                  <div className="p-3 bg-green-200 rounded-xl">
                    <Calendar className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>

              {/* This Week */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-purple-700">{thisWeekEntries.length}</div>
                    <div className="text-sm font-medium text-purple-600">This Week</div>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-xl">
                    <Target className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </div>

              {/* Needs Review */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-orange-700">{reviewEntries.length}</div>
                    <div className="text-sm font-medium text-orange-600">Review</div>
                  </div>
                  <div className="p-3 bg-orange-200 rounded-xl">
                    <Eye className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State - Beautiful Design */
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-8 mb-6 shadow-lg border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No thoughts captured yet</h3>
              <p className="text-gray-600 mb-4">Start by capturing your first thought, idea, or task</p>
              <button 
                onClick={() => window.location.href = '/#capture'}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Capture Your First Thought
              </button>
            </div>
          )}
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
                          {/* Only show user tags - no type or priority pills */}
                          {entry.tags && entry.tags.length > 0 && (
                            <>
                              {[...new Set(entry.tags)].map((tag, index) => (
                                <span key={`${entry.id}-${tag}-${index}`} className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  {tag}
                                </span>
                              ))}
                            </>
                          )}
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {/* Priority Indicator - Subtle and clean */}
                        {entry.priority === 'urgent' && (
                          <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full" title="Urgent Priority">
                            <Zap className="w-3 h-3 text-red-600" />
                          </div>
                        )}
                        {entry.priority === 'high' && (
                          <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full" title="High Priority">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          </div>
                        )}
                        {entry.priority === 'medium' && (
                          <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full" title="Medium Priority">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                          </div>
                        )}
                        {entry.priority === 'low' && (
                          <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full" title="Low Priority">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => adjustPriority(entry.id, 'up')}
                          disabled={entry.priority === 'urgent'}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Increase priority"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => adjustPriority(entry.id, 'down')}
                          disabled={entry.priority === 'low'}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Decrease priority"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
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
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              changeEntryTimePeriod(entry.id, e.target.value as 'today' | 'week' | 'upcoming');
                              e.target.value = ''; // Reset selection
                            }
                          }}
                          className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer font-medium text-gray-700 hover:border-blue-300 shadow-sm"
                        >
                          <option value="" className="text-gray-500">📅 Move to...</option>
                          <option value="today" className="text-green-700">🟢 Today</option>
                          <option value="week" className="text-blue-700">🔵 This Week</option>
                          <option value="upcoming" className="text-purple-700">🟣 Upcoming</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time-based Tabs */}
            {(todayEntries.length > 0 || thisWeekEntries.length > 0 || upcomingEntries.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                  {todayEntries.length > 0 && (
                    <button
                      onClick={() => setActiveTab('today')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === 'today'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Today</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          {todayEntries.length}
                        </span>
                      </div>
                    </button>
                  )}
                  
                  {thisWeekEntries.length > 0 && (
                    <button
                      onClick={() => setActiveTab('week')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === 'week'
                          ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>This Week</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                          {thisWeekEntries.length}
                        </span>
                      </div>
                    </button>
                  )}
                  
                  {upcomingEntries.length > 0 && (
                    <button
                      onClick={() => setActiveTab('upcoming')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === 'upcoming'
                          ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Upcoming</span>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                          {upcomingEntries.length}
                        </span>
                      </div>
                    </button>
                  )}
                  
                  {completedEntries.length > 0 && (
                    <button
                      onClick={() => setActiveTab('completed')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === 'completed'
                          ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                          {completedEntries.length}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {getCurrentTabEntries().length > 0 ? (
                    <div className="space-y-3">
                      {sortEntries(getCurrentTabEntries()).slice(0, 6).map((entry) => {
                        const isUrgent = entry.priority === 'urgent' || 
                          (entry.dueDate && entry.dueDate <= new Date());
                        
                        const getTabColor = () => {
                          switch (activeTab) {
                            case 'today':
                              return isUrgent ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100';
                            case 'week':
                              return 'bg-green-50 border-green-200 hover:bg-green-100';
                            case 'upcoming':
                              return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
                            case 'completed':
                              return 'bg-green-50 border-green-200 hover:bg-green-100';
                            default:
                              return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
                          }
                        };
                        
                        return (
                          <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${getTabColor()}`}>
                            {/* Left: Task Icon */}
                            <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                              {getTypeIcon(entry.type)}
                            </div>
                            
                            {/* Center: Content and Tags */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{entry.content}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {/* Only show user tags - no type or priority pills */}
                                {entry.tags && entry.tags.length > 0 && (
                                  <>
                                    {[...new Set(entry.tags)].map((tag, index) => (
                                      <span key={`${entry.id}-${tag}-${index}`} className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                        {tag}
                                      </span>
                                    ))}
                                  </>
                                )}
                                <span className="text-xs text-gray-500">
                                  {getRelativeTime(entry.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Right: Priority Indicator and Actions */}
                            <div className="flex items-center gap-2">
                              {/* Priority Indicator - Subtle and clean */}
                              {entry.priority === 'urgent' && (
                                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full" title="Urgent Priority">
                                  <Zap className="w-4 h-4 text-red-600" />
                                </div>
                              )}
                              {entry.priority === 'high' && (
                                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full" title="High Priority">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                </div>
                              )}
                              {entry.priority === 'medium' && (
                                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full" title="Medium Priority">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                </div>
                              )}
                              {entry.priority === 'low' && (
                                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full" title="Low Priority">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => adjustPriority(entry.id, 'up')}
                                  disabled={entry.priority === 'urgent'}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Increase priority"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => adjustPriority(entry.id, 'down')}
                                  disabled={entry.priority === 'low'}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Decrease priority"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
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
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      changeEntryTimePeriod(entry.id, e.target.value as 'today' | 'week' | 'upcoming');
                                      e.target.value = ''; // Reset selection
                                    }
                                  }}
                                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer font-medium text-gray-700 hover:border-blue-300 shadow-sm"
                                >
                                  <option value="" className="text-gray-500">📅 Move to...</option>
                                  <option value="today" className="text-green-700">🟢 Today</option>
                                  <option value="week" className="text-blue-700">🔵 This Week</option>
                                  <option value="upcoming" className="text-purple-700">🟣 Upcoming</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No entries in this time period</p>
                      <p className="text-sm">Try switching to another tab or adjusting your filters</p>
                    </div>
                  )}
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
                    {filteredEntries.filter(e => e.type === 'task').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ideas</span>
                  <span className="font-medium text-gray-900">
                    {filteredEntries.filter(e => e.type === 'idea').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Insights</span>
                  <span className="font-medium text-gray-900">
                    {filteredEntries.filter(e => e.type === 'insight').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-gray-700">
                    {filteredEntries.filter(e => e.status === 'completed').length}
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
                {filteredEntries.slice(0, 3).map((entry) => (
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Entry</h2>
              <p className="text-sm text-gray-600 mt-1">Update your thought, task, or idea</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({...editingEntry, content: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter title"
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date and Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editingEntry.dueDate && editingEntry.dueDate instanceof Date ? editingEntry.dueDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingEntry({...editingEntry, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

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
              </div>

              {/* Pinned Date and Target Week Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pin to Date</label>
                  <input
                    type="date"
                    value={editingEntry.pinnedForDate && editingEntry.pinnedForDate instanceof Date ? editingEntry.pinnedForDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingEntry({...editingEntry, pinnedForDate: e.target.value ? new Date(e.target.value) : undefined})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Week</label>
                  <select
                    value={editingEntry.targetWeek || ''}
                    onChange={(e) => setEditingEntry({...editingEntry, targetWeek: e.target.value || undefined})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No specific week</option>
                    <option value="currentWeek">This Week</option>
                    <option value="nextWeek">Next Week</option>
                  </select>
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
