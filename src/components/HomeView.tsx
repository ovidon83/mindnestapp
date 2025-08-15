import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays,
  ChevronUp,
  ChevronDown,
  Clock,
  Edit,
  CheckCircle,
  Trash2,
  BarChart3,
  Tag
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType, TaskStatus } from '../types';

export const HomeView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all',
    status: 'all',
    needsReview: false
  });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [insightsDrawerOpen, setInsightsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'thisWeek' | 'later' | 'completed'>('today');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const {
    entries,
    updateEntry,
    deleteEntry,
    completeEntry,
    setCurrentView
  } = useGenieNotesStore();

  // Get raw entries from store and apply all filtering consistently
  const rawEntries = entries;

  // Apply search filter
  const searchFilteredEntries = searchQuery.trim() 
    ? rawEntries.filter(entry => 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.location && entry.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : rawEntries;

  // Apply active filters
  const filteredEntries = searchFilteredEntries.filter(entry => {
    // Filter by type
    if (activeFilters.type !== 'all' && entry.type !== activeFilters.type) return false;
    
    // Filter by status
    if (activeFilters.status !== 'all' && entry.status !== activeFilters.status) return false;
    
    // Filter by review status
    if (activeFilters.needsReview && !entry.needsReview) return false;
    
    return true;
  });

  // Apply tag filter
  const tagFilteredEntries = selectedTag 
    ? filteredEntries.filter(entry => entry.tags.includes(selectedTag))
    : filteredEntries;

  // Date-based organization using new directive system
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  // Today: due today OR pinned for today (including overdue items)
  const todayEntries = tagFilteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate.toDateString() === today.toDateString()) return true;
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate.toDateString() === today.toDateString()) return true;
    // Include overdue items in today view
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate < today) return true;
    return false;
  });

  // This Week: within next 7 days (exclude today entries)
  const thisWeekEntries = tagFilteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate >= today && entry.dueDate <= endOfWeek) return true;
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate >= today && entry.pinnedForDate <= endOfWeek) return true;
    return false;
  });

  // Later: everything else (exclude today and this week entries)
  const laterEntries = tagFilteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (thisWeekEntries.some(weekEntry => weekEntry.id === entry.id)) return false;
    return true;
  });

  // Completed: all completed entries
  const completedEntries = tagFilteredEntries.filter(entry => entry.status === 'completed');

  // Get current tab entries with proper sorting
  const getCurrentTabEntries = () => {
    let entries: Entry[] = [];
    
    switch (activeTab) {
      case 'today': 
        entries = todayEntries;
        break;
      case 'thisWeek': 
        entries = thisWeekEntries;
        break;
      case 'later': 
        entries = laterEntries;
        break;
      case 'completed': 
        entries = completedEntries;
        break;
      default: 
        entries = todayEntries;
    }
    
    // Sort entries: urgent first, then by creation date (newest first)
    return entries.sort((a, b) => {
      // First priority: urgent items (high priority or overdue)
      const aIsUrgent = a.priority === 'urgent' || (a.dueDate && new Date(a.dueDate) < new Date());
      const bIsUrgent = b.priority === 'urgent' || (b.dueDate && new Date(b.dueDate) < new Date());
      
      if (aIsUrgent && !bIsUrgent) return -1;
      if (!aIsUrgent && bIsUrgent) return 1;
      
      // Second priority: creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const currentTabEntries = getCurrentTabEntries();

  // Get all unique tags for grouping
  const getAllTags = () => {
    const allTags = new Set<string>();
    filteredEntries.forEach(entry => {
      entry.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // Batch actions
  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const selectAllInTab = () => {
    const newSelected = new Set(selectedEntries);
    currentTabEntries.forEach(entry => newSelected.add(entry.id));
    setSelectedEntries(newSelected);
  };

  // Helper functions
  const formatDate = (date: Date) => {
    if (!date) return '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
  };

  const handleSaveEntry = () => {
    if (editingEntry) {
      updateEntry(editingEntry.id, editingEntry);
      setEditingEntry(null);
    }
  };

  // Time period change functions - FIXED
  const moveToToday = (entryId: string) => {
    const today = new Date();
    today.setHours(9, 0, 0, 0); // Set to 9 AM
    updateEntry(entryId, { pinnedForDate: today, dueDate: today });
  };

  const moveToThisWeek = (entryId: string) => {
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
    nextMonday.setHours(9, 0, 0, 0); // Set to Monday 9 AM
    updateEntry(entryId, { pinnedForDate: nextMonday, dueDate: nextMonday });
  };

  const moveToLater = (entryId: string) => {
    updateEntry(entryId, { pinnedForDate: undefined, dueDate: undefined });
  };

  // Simple up/down reordering instead of broken drag and drop
  const moveEntryUp = (entryId: string) => {
    const currentEntries = getCurrentTabEntries();
    const currentIndex = currentEntries.findIndex(entry => entry.id === entryId);
    
    if (currentIndex > 0) {
      const now = new Date();
      const newEntries = [...currentEntries];
      const [movedItem] = newEntries.splice(currentIndex, 1);
      newEntries.splice(currentIndex - 1, 0, movedItem);
      
      // Update timestamps to maintain order
      newEntries.forEach((entry, index) => {
        const newTimestamp = new Date(now.getTime() - (index * 1000));
        updateEntry(entry.id, { createdAt: newTimestamp });
      });
    }
  };

  const moveEntryDown = (entryId: string) => {
    const currentEntries = getCurrentTabEntries();
    const currentIndex = currentEntries.findIndex(entry => entry.id === entryId);
    
    if (currentIndex < currentEntries.length - 1) {
      const now = new Date();
      const newEntries = [...currentEntries];
      const [movedItem] = newEntries.splice(currentIndex, 1);
      newEntries.splice(currentIndex + 1, 0, movedItem);
      
      // Update timestamps to maintain order
      newEntries.forEach((entry, index) => {
        const newTimestamp = new Date(now.getTime() - (index * 1000));
        updateEntry(entry.id, { createdAt: newTimestamp });
      });
    }
  };

  // Entry card component
  const EntryCard: React.FC<{ entry: Entry; index: number }> = ({ entry, index }) => {
    const isSelected = selectedEntries.has(entry.id);
    const isOverdue = entry.dueDate && new Date(entry.dueDate) < new Date() && entry.status !== 'completed';
    const isCompleted = entry.status === 'completed';
    const isUrgent = entry.priority === 'urgent' || isOverdue;
    const isPinned = entry.pinnedForDate && entry.pinnedForDate.toDateString() === today.toDateString();

    // Get type display text and color
    const getTypeDisplay = (type: EntryType) => {
      switch (type) {
        case 'task': return { text: 'Task', color: 'bg-blue-100 text-blue-700' };
        case 'event': return { text: 'Event', color: 'bg-green-100 text-green-700' };
        case 'idea': return { text: 'Idea', color: 'bg-purple-100 text-purple-700' };
        case 'insight': return { text: 'Insight', color: 'bg-yellow-100 text-yellow-700' };
        case 'reflection': return { text: 'Reflection', color: 'bg-orange-100 text-orange-700' };
        case 'journal': return { text: 'Journal', color: 'bg-indigo-100 text-indigo-700' };
        case 'reminder': return { text: 'Reminder', color: 'bg-red-100 text-red-700' };
        case 'note': return { text: 'Note', color: 'bg-gray-100 text-gray-700' };
        default: return { text: 'Note', color: 'bg-gray-100 text-gray-700' };
      }
    };

    const typeDisplay = getTypeDisplay(entry.type);

    return (
      <>
        <div 
          className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-sm ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          } ${isCompleted ? 'bg-green-50 border-green-200' : ''} ${isUrgent ? 'border-l-4 border-l-orange-400 bg-orange-50' : ''}`}
          data-entry-card
          data-entry-id={entry.id}
        >
          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleEntrySelection(entry.id)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              
              {/* Main content - vertically centered */}
              <div className="flex-1 min-w-0 text-center flex flex-col justify-center">
                {/* Type pill and title row */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeDisplay.color}`}>
                    {typeDisplay.text}
                  </span>
                  
                  <h3 className={`font-medium text-gray-900 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {entry.content}
                  </h3>
                  
                  {isCompleted && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  )}
                </div>
                
                {/* Status and priority row */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  {isUrgent && !isCompleted && (
                    <div className="flex items-center gap-1">
                      {isPinned && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium font-semibold">
                          ⭐ PINNED
                        </span>
                      )}
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {isOverdue ? 'Overdue' : 'Urgent'}
                      </span>
                    </div>
                  )}
                  
                  {/* Only show due date if it's different from current tab context */}
                  {entry.dueDate && !isPinned && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isOverdue 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {formatDate(entry.dueDate)}
                    </span>
                  )}
                </div>
                
                {/* Tags row - cleaner layout */}
                {entry.tags.length > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{entry.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Action buttons and ordering arrows on the right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Primary actions */}
                <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  {!isCompleted ? (
                    <button
                      onClick={() => completeEntry(entry.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Mark as completed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateEntry(entry.id, { status: 'pending' })}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Mark as pending"
                    >
                      <CheckCircle className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
                
                {/* Time period management */}
                {!isCompleted && (
                  <div className="relative group">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                      title="Change time period"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 min-w-32">
                      <div className="py-1">
                        <button
                          onClick={() => moveToToday(entry.id)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Move to Today
                        </button>
                        <button
                          onClick={() => moveToThisWeek(entry.id)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2"
                        >
                          <CalendarDays className="w-4 h-4 text-purple-500" />
                          Move to This Week
                        </button>
                        <button
                          onClick={() => moveToLater(entry.id)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4 text-gray-500" />
                          Move to Later
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Ordering arrows */}
                {!isCompleted && (
                  <div className="flex flex-col items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      onClick={() => moveEntryUp(entry.id)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveEntryDown(entry.id)}
                      disabled={index === currentTabEntries.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Destructive action */}
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Expanded Details */}
            {editingEntry?.id === entry.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={editingEntry.content}
                      onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={editingEntry.type}
                        onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as EntryType })}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="task">Task</option>
                        <option value="idea">Idea</option>
                        <option value="event">Event</option>
                        <option value="note">Note</option>
                        <option value="journal">Journal</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEntry()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingEntry(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('capture')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Capture
              </button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your thoughts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={activeFilters.type}
                onChange={(e) => setActiveFilters({ ...activeFilters, type: e.target.value as EntryType | 'all' })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="task">Tasks</option>
                <option value="idea">Ideas</option>
                <option value="event">Events</option>
                <option value="note">Notes</option>
                <option value="journal">Journal</option>
              </select>
              
              <select
                value={activeFilters.status}
                onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value as TaskStatus | 'all' })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={activeFilters.needsReview}
                  onChange={(e) => setActiveFilters({ ...activeFilters, needsReview: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                Review Only
              </label>
              
              <button
                onClick={() => setInsightsDrawerOpen(!insightsDrawerOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Insights"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tag Grouping */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Tag className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Group by Tag:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedTag === null 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Tags
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {getAllTags().map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTag === tag 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'today' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Today {todayEntries.length > 0 && `(${todayEntries.length})`}
            </button>
            <button
              onClick={() => setActiveTab('thisWeek')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'thisWeek' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              This Week {thisWeekEntries.length > 0 && `(${thisWeekEntries.length})`}
            </button>
            <button
              onClick={() => setActiveTab('later')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'later' ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Later {laterEntries.length > 0 && `(${laterEntries.length})`}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'completed' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-800 hover:text-gray-800'}`}
            >
              Completed {completedEntries.length > 0 && `(${completedEntries.length})`}
            </button>
          </div>
          
          {currentTabEntries.length > 0 && (
            <button
              onClick={selectAllInTab}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Select All
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {currentTabEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No {activeTab} entries</p>
              <button
                onClick={() => setCurrentView('capture')}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add a {activeTab} entry
              </button>
            </div>
          )}
          
          {currentTabEntries.length > 0 && (
            <div className="space-y-3">
              {currentTabEntries.map((entry, index) => (
                <div key={entry.id} className="relative">
                  <EntryCard entry={entry} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};