import React, { useState } from 'react';
import { 
  Calendar, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Eye, 
  BookOpen, 
  Bell, 
  FileText, 
  BarChart3, 
  CheckCircle,
  X,
  Edit,
  Trash2,
  Clock,
  CalendarDays
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
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'thisWeek' | 'upcoming' | 'completed'>('today');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showBatchBar, setShowBatchBar] = useState(false);
  const [draggedEntry, setDraggedEntry] = useState<string | null>(null);
  const [dragOverEntry, setDragOverEntry] = useState<string | null>(null);

  const {
    entries,
    updateEntry,
    deleteEntry,
    completeEntry,
    setCurrentView,
    getTopTags
  } = useGenieNotesStore();

  // Get raw entries from store and apply all filtering consistently
  const rawEntries = entries;
  const topTags = getTopTags(rawEntries);

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

  // Date-based organization using new directive system
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  // Overdue: tasks with dueDate < today and not completed
  const overdueEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate < today) return true;
    return false;
  });

  // Today: due today OR pinned for today
  const todayEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate.toDateString() === today.toDateString()) return true;
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate.toDateString() === today.toDateString()) return true;
    return false;
  });

  // This Week: within next 7 days (exclude today entries)
  const thisWeekEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate >= today && entry.dueDate <= endOfWeek) return true;
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate >= today && entry.pinnedForDate <= endOfWeek) return true;
    return false;
  });

  // Upcoming: everything else (exclude today and this week entries)
  const upcomingEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (thisWeekEntries.some(weekEntry => weekEntry.id === entry.id)) return false;
    return true;
  });

  // Completed: all completed entries
  const completedEntries = filteredEntries.filter(entry => entry.status === 'completed');

  // Get current tab entries with proper sorting
  const getCurrentTabEntries = () => {
    let entries: Entry[] = [];
    
    switch (activeTab) {
      case 'overdue': 
        entries = overdueEntries;
        break;
      case 'today': 
        entries = todayEntries;
        break;
      case 'thisWeek': 
        entries = thisWeekEntries;
        break;
      case 'upcoming': 
        entries = upcomingEntries;
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

  // Batch actions
  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
    setShowBatchBar(newSelected.size > 0);
  };

  const selectAllInTab = () => {
    const newSelected = new Set(selectedEntries);
    currentTabEntries.forEach(entry => newSelected.add(entry.id));
    setSelectedEntries(newSelected);
    setShowBatchBar(true);
  };

  const clearSelection = () => {
    setSelectedEntries(new Set());
    setShowBatchBar(false);
  };

  const batchPinToToday = () => {
    selectedEntries.forEach(entryId => {
      updateEntry(entryId, { pinnedForDate: today });
    });
    clearSelection();
  };

  const batchComplete = () => {
    selectedEntries.forEach(entryId => {
      completeEntry(entryId);
    });
    clearSelection();
  };

  const batchDelete = () => {
    if (confirm(`Delete ${selectedEntries.size} selected entries?`)) {
      selectedEntries.forEach(entryId => {
        deleteEntry(entryId);
      });
      clearSelection();
    }
  };

  // Helper functions
  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <Target className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'insight': return <TrendingUp className="w-4 h-4" />;
      case 'reflection': return <Eye className="w-4 h-4" />;
      case 'journal': return <BookOpen className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100';
      case 'event': return 'bg-green-100';
      case 'idea': return 'bg-purple-100';
      case 'insight': return 'bg-yellow-100';
      case 'reflection': return 'bg-orange-100';
      case 'journal': return 'bg-indigo-100';
      case 'reminder': return 'bg-red-100';
      case 'note': return 'bg-gray-100';
      default: return 'bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

  // Drag and Drop functionality
  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    setDraggedEntry(entryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, entryId: string) => {
    e.preventDefault();
    if (draggedEntry && draggedEntry !== entryId) {
      setDragOverEntry(entryId);
    }
  };

  const handleDragLeave = () => {
    setDragOverEntry(null);
  };

  const handleDrop = (e: React.DragEvent, targetEntryId: string) => {
    e.preventDefault();
    if (draggedEntry && draggedEntry !== targetEntryId) {
      // Get the current order of entries
      const currentEntries = getCurrentTabEntries();
      const draggedIndex = currentEntries.findIndex(entry => entry.id === draggedEntry);
      const targetIndex = currentEntries.findIndex(entry => entry.id === targetEntryId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Create a new order array
        const newOrder = [...currentEntries];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        
        // Update the order by modifying timestamps to maintain the new order
        // This is a simple approach - in a real app you might want a dedicated order field
        const baseTime = new Date().getTime();
        newOrder.forEach((entry, index) => {
          if (entry.id === draggedEntry) {
            // Update the dragged entry's timestamp to maintain its new position
            const newTimestamp = baseTime - (index * 1000); // 1 second intervals
            updateEntry(entry.id, { createdAt: new Date(newTimestamp) });
          }
        });
      }
    }
    setDraggedEntry(null);
    setDragOverEntry(null);
  };

  // Time period change functions
  const moveToToday = (entryId: string) => {
    updateEntry(entryId, { pinnedForDate: today });
  };

  const moveToThisWeek = (entryId: string) => {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    updateEntry(entryId, { pinnedForDate: nextWeek });
  };

  const moveToUpcoming = (entryId: string) => {
    updateEntry(entryId, { pinnedForDate: undefined, dueDate: undefined });
  };

  const moveToOverdue = (entryId: string) => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    updateEntry(entryId, { dueDate: yesterday });
  };

  // Entry card component
  const EntryCard: React.FC<{ entry: Entry }> = ({ entry }) => {
    const isSelected = selectedEntries.has(entry.id);
    const isOverdue = entry.dueDate && new Date(entry.dueDate) < new Date() && entry.status !== 'completed';
    const isDragging = draggedEntry === entry.id;
    const isDragOver = dragOverEntry === entry.id;
    const isCompleted = entry.status === 'completed';
    const isUrgent = entry.priority === 'urgent' || isOverdue;

    return (
      <div 
        className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-sm ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-blue-400 bg-blue-50' : ''} ${isCompleted ? 'bg-green-50 border-green-200' : ''} ${isUrgent ? 'border-l-4 border-l-orange-400' : ''}`}
        draggable={!isCompleted}
        onDragStart={!isCompleted ? (e) => handleDragStart(e, entry.id) : undefined}
        onDragOver={!isCompleted ? (e) => handleDragOver(e, entry.id) : undefined}
        onDragLeave={!isCompleted ? handleDragLeave : undefined}
        onDrop={!isCompleted ? (e) => handleDrop(e, entry.id) : undefined}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleEntrySelection(entry.id)}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(entry.type)}
                <h3 className={`font-medium truncate ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {entry.content}
                </h3>
                {isCompleted && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Completed
                  </span>
                )}
                {isUrgent && !isCompleted && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    Urgent
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {entry.dueDate && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isOverdue 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {formatDate(entry.dueDate)}
                  </span>
                )}
                
                {entry.tags.length > 0 && (
                  <div className="flex gap-1">
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tag}
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
            </div>
            
            <div className="flex items-center gap-1">
              {/* Time Period Change Actions - Only for non-completed items */}
              {!isCompleted && (
                <div className="flex gap-1 mr-2">
                  <button
                    onClick={() => moveToToday(entry.id)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Move to Today"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveToThisWeek(entry.id)}
                    className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                    title="Move to This Week"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveToUpcoming(entry.id)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Move to Upcoming"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  {!isOverdue && (
                    <button
                      onClick={() => moveToOverdue(entry.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Move to Overdue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Standard Actions */}
              <button
                onClick={() => handleEditEntry(entry)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              {!isCompleted ? (
                <button
                  onClick={() => completeEntry(entry.id)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                  title="Mark as completed"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => updateEntry(entry.id, { status: 'pending' })}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  title="Mark as pending"
                >
                  <CheckCircle className="w-4 h-4 fill-current" />
                </button>
              )}
              
              <button
                onClick={() => deleteEntry(entry.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Capture Button */}
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Capture
            </button>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search your thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={activeFilters.type}
                onChange={(e) => setActiveFilters({ ...activeFilters, type: e.target.value as EntryType })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="task">Tasks</option>
                <option value="idea">Ideas</option>
                <option value="event">Events</option>
                <option value="note">Notes</option>
                <option value="journal">Journal</option>
              </select>
              
              <select
                value={activeFilters.status}
                onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value as TaskStatus })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={activeFilters.needsReview || false}
                  onChange={(e) => setActiveFilters({ ...activeFilters, needsReview: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Review Only
              </label>
            </div>
            
            {/* Insights Toggle */}
            <button
              onClick={() => setInsightsDrawerOpen(!insightsDrawerOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Insights"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 mb-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'overdue' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Overdue {overdueEntries.length > 0 && `(${overdueEntries.length})`}
            </button>
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
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'upcoming' ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Upcoming {upcomingEntries.length > 0 && `(${upcomingEntries.length})`}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'completed' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
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
                  <EntryCard entry={entry} />
                  {/* Drag and Drop Visual Indicator */}
                  {index < currentTabEntries.length - 1 && (
                    <div className="h-2 flex items-center justify-center">
                      <div className="w-8 h-0.5 bg-gray-200 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-ns-resize" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch Actions Bar */}
      {showBatchBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedEntries.size} item{selectedEntries.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={batchPinToToday}
                  className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Pin to Today
                </button>
                <button
                  onClick={batchComplete}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={batchDelete}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights drawer */}
      {insightsDrawerOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-30 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
              <button
                onClick={() => setInsightsDrawerOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
              <div className="space-y-2">
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
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Top Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      #{tag.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {filteredEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-sm">
                    <div className={`p-1 rounded ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                    </div>
                    <span className="text-gray-900 truncate">{entry.content}</span>
                    <span className="text-gray-500 text-xs">
                      {formatTimeAgo(entry.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Edit Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingEntry.type}
                    onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as EntryType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="task">Task</option>
                    <option value="idea">Idea</option>
                    <option value="insight">Insight</option>
                    <option value="note">Note</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateEntry(editingEntry.id, editingEntry);
                    setEditingEntry(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
