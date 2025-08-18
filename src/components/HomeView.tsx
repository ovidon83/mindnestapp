import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays,
  ChevronUp,
  ChevronDown,
  Edit,
  CheckCircle,
  Trash2,
  BarChart3,
  Tag,
  Undo2,
  Clock
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [undoEntry, setUndoEntry] = useState<{ id: string; previousStatus: TaskStatus } | null>(null);
  
  // Toggle states for different time periods
  const [expandedSections, setExpandedSections] = useState({
    today: true,      // Today is expanded by default
    thisWeek: true,   // This Week is expanded by default
    next7Days: false, // Next 7 Days collapsed by default
    later: false,     // Later collapsed by default
    done: false       // Done collapsed by default
  });

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
  const endOfNextWeek = new Date(today);
  endOfNextWeek.setDate(today.getDate() + 14);

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

  // Next 7 Days: 7-14 days from now
  const next7DaysEntries = tagFilteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (thisWeekEntries.some(weekEntry => weekEntry.id === entry.id)) return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate > endOfWeek && entry.dueDate <= endOfNextWeek) return true;
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate > endOfWeek && entry.pinnedForDate <= endOfNextWeek) return true;
    return false;
  });

  // Later: everything else (exclude today, this week, and next 7 days entries)
  const laterEntries = tagFilteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (thisWeekEntries.some(weekEntry => weekEntry.id === entry.id)) return false;
    if (next7DaysEntries.some(nextEntry => nextEntry.id === entry.id)) return false;
    return true;
  });

  // Done: all completed entries
  const doneEntries = tagFilteredEntries.filter(entry => entry.status === 'completed');

  // Get all unique tags for grouping
  const getAllTags = () => {
    const allTags = new Set<string>();
    filteredEntries.forEach(entry => {
      entry.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
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

  // Handle completion with undo functionality
  const handleCompleteEntry = (entry: Entry) => {
    const previousStatus = entry.status;
    completeEntry(entry.id);
    
    // Show undo dialog
    setUndoEntry({ id: entry.id, previousStatus });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setUndoEntry(null);
    }, 3000);
  };

  const handleUndo = () => {
    if (undoEntry) {
      updateEntry(undoEntry.id, { status: undoEntry.previousStatus });
      setUndoEntry(null);
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

  // Simple up/down reordering instead of broken drag and drop
  const moveEntryUp = (entryId: string) => {
    const currentEntries = tagFilteredEntries; // Use tagFilteredEntries directly
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
    const currentEntries = tagFilteredEntries; // Use tagFilteredEntries directly
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
    const isSelected = false; // Removed selectedEntries state, so no selection here
    const isOverdue = entry.dueDate && entry.isDeadline !== false && new Date(entry.dueDate) < new Date() && entry.status !== 'completed';
    const isCompleted = entry.status === 'completed';
    const isUrgent = entry.priority === 'urgent' || isOverdue;
    const isPinned = entry.pinnedForDate && entry.pinnedForDate.toDateString() === today.toDateString();

    // Get type display text and color
    const getTypeDisplay = (type: EntryType) => {
      switch (type) {
        case 'task': return { text: 'Task', color: 'bg-blue-100 text-blue-800' };
        case 'event': return { text: 'Event', color: 'bg-green-100 text-green-800' };
        case 'idea': return { text: 'Idea', color: 'bg-purple-100 text-purple-800' };
        case 'insight': return { text: 'Insight', color: 'bg-yellow-100 text-yellow-800' };
        case 'reflection': return { text: 'Reflection', color: 'bg-orange-100 text-orange-800' };
        case 'journal': return { text: 'Journal', color: 'bg-indigo-100 text-indigo-800' };
        case 'reminder': return { text: 'Reminder', color: 'bg-red-100 text-red-800' };
        case 'note': return { text: 'Note', color: 'bg-gray-100 text-gray-800' };
        default: return { text: 'Note', color: 'bg-gray-100 text-gray-800' };
      }
    };

    const typeDisplay = getTypeDisplay(entry.type);

    return (
      <>
        <div 
          className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          } ${isCompleted ? 'bg-green-50 border-green-200' : ''} ${isUrgent ? 'border-l-4 border-l-orange-400 bg-orange-50' : ''}`}
          data-entry-card
          data-entry-id={entry.id}
        >
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Checkbox for completion */}
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleCompleteEntry(entry)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isCompleted}
                />
              </div>
              
              {/* Star icon for pinning */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    if (isPinned) {
                      updateEntry(entry.id, { pinnedForDate: undefined });
                    } else {
                      const today = new Date();
                      today.setHours(9, 0, 0, 0);
                      updateEntry(entry.id, { pinnedForDate: today });
                    }
                  }}
                  className="text-gray-400 hover:text-yellow-500 transition-colors"
                  title={isPinned ? "Unpin" : "Pin to today"}
                >
                  {isPinned ? (
                    <span className="text-yellow-500">★</span>
                  ) : (
                    <span className="text-gray-400">☆</span>
                  )}
                </button>
              </div>
              
              {/* Main content - clean and organized */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {/* Title */}
                <h3 className={`text-sm font-medium text-gray-900 truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                  {entry.content}
                </h3>
                
                {/* Type pill - inline with title */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeDisplay.color} flex-shrink-0`}>
                  {typeDisplay.text}
                </span>
                
                {/* Status indicators - only show what's relevant */}
                {isOverdue && !isCompleted && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex-shrink-0">
                    Overdue
                  </span>
                )}
                
                {/* Due date - only show if different from current tab context */}
                {entry.dueDate && !isPinned && expandedSections.today && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    isOverdue 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {formatDate(entry.dueDate)}
                  </span>
                )}
              </div>
              
              {/* Right side - tags and actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {entry.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        +{entry.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Action buttons - clean and simple */}
                <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                  {/* Essential actions */}
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  {/* Deadline toggle - user controlled */}
                  {entry.dueDate && (
                    <button
                      onClick={() => {
                        const isCurrentlyDeadline = entry.isDeadline !== false; // Default to true if not set
                        updateEntry(entry.id, { isDeadline: !isCurrentlyDeadline });
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        entry.isDeadline !== false 
                          ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      title={entry.isDeadline !== false ? "Remove deadline (keep as dated note)" : "Set as deadline"}
                    >
                      {entry.isDeadline !== false ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* Move to dropdown - clean single button */}
                  {!isCompleted && (
                    <div className="relative group">
                      <button className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                        <Calendar className="w-4 h-4" />
                      </button>
                      
                      {/* Clean dropdown for move actions */}
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 min-w-36">
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
                            onClick={() => {
                              updateEntry(entry.id, { pinnedForDate: undefined, dueDate: undefined });
                            }}
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
                    <>
                      <button
                        onClick={() => moveEntryUp(entry.id)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveEntryDown(entry.id)}
                        disabled={index === tagFilteredEntries.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {/* Delete action */}
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Expanded Details */}
            {editingEntry?.id === entry.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={editingEntry.content}
                      onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={editingEntry.type}
                        onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as EntryType })}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                      >
                        <option value="task">Task</option>
                        <option value="idea">Idea</option>
                        <option value="event">Event</option>
                        <option value="note">Note</option>
                        <option value="journal">Journal</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
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
              onClick={() => setExpandedSections({ ...expandedSections, today: !expandedSections.today })}
              className={`px-4 py-2 text-sm font-medium ${expandedSections.today ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Today {todayEntries.length > 0 && `(${todayEntries.length})`}
            </button>
            <button
              onClick={() => setExpandedSections({ ...expandedSections, thisWeek: !expandedSections.thisWeek })}
              className={`px-4 py-2 text-sm font-medium ${expandedSections.thisWeek ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              This Week {thisWeekEntries.length > 0 && `(${thisWeekEntries.length})`}
            </button>
            <button
              onClick={() => setExpandedSections({ ...expandedSections, next7Days: !expandedSections.next7Days })}
              className={`px-4 py-2 text-sm font-medium ${expandedSections.next7Days ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Next 7 Days {next7DaysEntries.length > 0 && `(${next7DaysEntries.length})`}
            </button>
            <button
              onClick={() => setExpandedSections({ ...expandedSections, later: !expandedSections.later })}
              className={`px-4 py-2 text-sm font-medium ${expandedSections.later ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Later {laterEntries.length > 0 && `(${laterEntries.length})`}
            </button>
            <button
              onClick={() => setExpandedSections({ ...expandedSections, done: !expandedSections.done })}
              className={`px-4 py-2 text-sm font-medium ${expandedSections.done ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-800 hover:text-gray-800'}`}
            >
              Done {doneEntries.length > 0 && `(${doneEntries.length})`}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {tagFilteredEntries.length > 0 && (
              <>
                <button
                  onClick={() => setCurrentView('capture')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + Add Entry
                </button>
              </>
            )}
          </div>
        </div>

        {/* Undo Dialog */}
        {undoEntry && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Entry completed successfully!</span>
            </div>
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {tagFilteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No entries</p>
              <button
                onClick={() => setCurrentView('capture')}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add an entry
              </button>
            </div>
          )}
          
          {/* Today Section */}
          {expandedSections.today && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  📅 Today ({todayEntries.length})
                </h3>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, today: false })}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {todayEntries.length > 0 ? (
                todayEntries.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    <EntryCard entry={entry} index={index} />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No entries for today</p>
                </div>
              )}
            </div>
          )}

          {/* This Week Section */}
          {expandedSections.thisWeek && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  📅 This Week ({thisWeekEntries.length})
                </h3>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, thisWeek: false })}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {thisWeekEntries.length > 0 ? (
                thisWeekEntries.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    <EntryCard entry={entry} index={index} />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No entries for this week</p>
                </div>
              )}
            </div>
          )}

          {/* Next 7 Days Section */}
          {expandedSections.next7Days && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  📅 Next 7 Days ({next7DaysEntries.length})
                </h3>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, next7Days: false })}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {next7DaysEntries.length > 0 ? (
                next7DaysEntries.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    <EntryCard entry={entry} index={index} />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No entries for next 7 days</p>
                </div>
              )}
            </div>
          )}

          {/* Later Section */}
          {expandedSections.later && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  📅 Later ({laterEntries.length})
                </h3>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, later: false })}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {laterEntries.length > 0 ? (
                laterEntries.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    <EntryCard entry={entry} index={index} />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No entries for later</p>
                </div>
              )}
            </div>
          )}

          {/* Done Section */}
          {expandedSections.done && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  ✅ Done ({doneEntries.length})
                </h3>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, done: false })}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {doneEntries.length > 0 ? (
                doneEntries.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    <EntryCard entry={entry} index={index} />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No completed entries</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};