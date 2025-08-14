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
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Pin,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType, Priority } from '../types';

export const HomeView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    needsReview: false
  });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [insightsDrawerOpen, setInsightsDrawerOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    overdue: false,
    today: false,
    thisWeek: false,
    upcoming: false
  });
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showBatchBar, setShowBatchBar] = useState(false);

  const {
    entries,
    updateEntry,
    deleteEntry,
    completeEntry,
    changeEntryTimePeriod,
    adjustPriority,
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

  // Overdue: tasks with dueDate < today and not completed
  const overdueEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate < today) return true;
    return false;
  });

  // Today: due today OR pinnedForDate=today
  const todayEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    
    // Check if pinned to today
    if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate.toDateString() === today.toDateString()) return true;
    
    // Check if due today
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate >= today && entry.dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) return true;
    
    return false;
  });

  // This Week: within next 7 days (group by weekday)
  const thisWeekEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    
    if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate >= today && entry.dueDate < endOfWeek) return true;
    if (entry.targetWeek === 'currentWeek') return true;
    return false;
  });

  // Upcoming: everything else
  const upcomingEntries = filteredEntries.filter(entry => {
    if (entry.status === 'completed') return false;
    if (todayEntries.some(todayEntry => todayEntry.id === entry.id)) return false;
    if (thisWeekEntries.some(weekEntry => weekEntry.id === entry.id)) return false;
    return true;
  });

  // Group This Week entries by weekday
  const thisWeekByDay = thisWeekEntries.reduce((acc, entry) => {
    const dueDate = entry.dueDate instanceof Date ? entry.dueDate : new Date();
    const dayName = dueDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!acc[dayName]) acc[dayName] = [];
    acc[dayName].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

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

  const selectAllInSection = (sectionEntries: Entry[]) => {
    const newSelected = new Set(selectedEntries);
    sectionEntries.forEach(entry => newSelected.add(entry.id));
    setSelectedEntries(newSelected);
    setShowBatchBar(true);
  };

  const clearSelection = () => {
    setSelectedEntries(new Set());
    setShowBatchBar(false);
  };

  const batchPinToToday = () => {
    selectedEntries.forEach(entryId => {
      changeEntryTimePeriod(entryId, 'today');
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

  // Toggle section collapse
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRelativeTime = (date: Date) => {
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

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

  // Entry card component
  const EntryCard = ({ entry, showCheckbox = true }: { entry: Entry; showCheckbox?: boolean }) => {
    const [expanded, setExpanded] = useState(false);
    const isSelected = selectedEntries.has(entry.id);

    return (
      <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-sm ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}>
        {/* Compact line */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleEntrySelection(entry.id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            )}
            
            <div className="flex items-center gap-2 text-gray-500">
              {getTypeIcon(entry.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{entry.content}</h3>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Due date chip */}
              {entry.dueDate && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {formatDueDate(entry.dueDate)}
                </span>
              )}
              
              {/* Priority chip */}
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(entry.priority)}`}>
                {entry.priority}
              </span>
              
              {/* Tag pills */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-1">
                  {entry.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 2 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      +{entry.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
              
              {/* Time ago */}
              <span className="text-xs text-gray-500">
                {getRelativeTime(entry.createdAt)}
              </span>
              
              {/* Today toggle pill */}
              <button
                onClick={() => {
                  if (entry.pinnedForDate && entry.pinnedForDate.toDateString() === today.toDateString()) {
                    updateEntry(entry.id, { pinnedForDate: undefined });
                  } else {
                    updateEntry(entry.id, { pinnedForDate: today });
                  }
                }}
                className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                  entry.pinnedForDate && entry.pinnedForDate.toDateString() === today.toDateString()
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                }`}
                title="Pin to Today (Y)"
              >
                <Pin className="w-3 h-3" />
              </button>
            </div>
            
            {/* Expand/collapse */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-3 space-y-3">
              {/* Note content */}
              {entry.content && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Note</h4>
                  <p className="text-sm text-gray-600">{entry.content}</p>
                </div>
              )}
              
              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => adjustPriority(entry.id, 'up')}
                  disabled={entry.priority === 'urgent'}
                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Increase priority"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => adjustPriority(entry.id, 'down')}
                  disabled={entry.priority === 'low'}
                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Decrease priority"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => completeEntry(entry.id)}
                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                  title="Mark as completed"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingEntry(entry)}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                  title="Edit entry"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  title="Delete entry"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Move to dropdown */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      changeEntryTimePeriod(entry.id, e.target.value as 'today' | 'week' | 'upcoming');
                      e.target.value = '';
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-all"
                >
                  <option value="">Move to...</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section component
  const Section = ({ 
    title, 
    entries, 
    accentColor, 
    collapsible = true, 
    collapsed = false, 
    onToggle,
    showSelectAll = false,
    children 
  }: {
    title: string;
    entries: Entry[];
    accentColor: string;
    collapsible?: boolean;
    collapsed?: boolean;
    onToggle?: () => void;
    showSelectAll?: boolean;
    children?: React.ReactNode;
  }) => {
    if (entries.length === 0 && !children) return null;
    
    return (
      <div className="mb-8">
        <div className={`flex items-center justify-between mb-4 p-4 rounded-lg ${accentColor}`}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <span className="px-2 py-1 text-sm font-medium bg-white/80 text-gray-700 rounded-full">
              {entries.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {showSelectAll && entries.length > 0 && (
              <button
                onClick={() => selectAllInSection(entries)}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white/80 rounded-lg hover:bg-white transition-colors"
              >
                Select All
              </button>
            )}
            
            {collapsible && (
              <button
                onClick={onToggle}
                className="p-1 text-gray-600 hover:text-gray-800 rounded transition-colors"
              >
                {collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
        
        {!collapsed && (
          <div className="space-y-3">
            {children || entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Capture button */}
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Capture
            </button>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search your thoughts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={activeFilters.type}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Types</option>
                <option value="task">Tasks</option>
                <option value="idea">Ideas</option>
                <option value="insight">Insights</option>
                <option value="note">Notes</option>
              </select>
              
              <select
                value={activeFilters.priority}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={activeFilters.status}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={activeFilters.needsReview}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, needsReview: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                Review Only
              </label>
            </div>
            
            {/* Insights toggle */}
            <button
              onClick={() => setInsightsDrawerOpen(!insightsDrawerOpen)}
              className={`p-2 rounded-lg transition-colors ${
                insightsDrawerOpen 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle Insights"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Overdue Section */}
        <Section
          title="Overdue"
          entries={overdueEntries}
          accentColor="bg-red-50 border-l-4 border-red-400"
          collapsed={collapsedSections.overdue}
          onToggle={() => toggleSection('overdue')}
          showSelectAll={true}
        >
          {overdueEntries.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-700 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Overdue Tasks</span>
              </div>
              <p className="text-sm text-red-600 mb-3">
                These tasks are past their due date. Consider carrying them to Today or updating their due dates.
              </p>
              <button
                onClick={batchPinToToday}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Carry Selected to Today
              </button>
            </div>
          )}
        </Section>

        {/* Today Section */}
        <Section
          title="Today"
          entries={todayEntries}
          accentColor="bg-blue-50 border-l-4 border-blue-400"
          collapsed={collapsedSections.today}
          onToggle={() => toggleSection('today')}
        >
          {todayEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No tasks for today</p>
              <p className="text-sm mb-4">Add some tasks or pin items from upcoming</p>
              <button
                onClick={() => setCurrentView('capture')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          )}
        </Section>

        {/* This Week Section */}
        <Section
          title="This Week"
          entries={thisWeekEntries}
          accentColor="bg-violet-50 border-l-4 border-violet-400"
          collapsed={collapsedSections.thisWeek}
          onToggle={() => toggleSection('thisWeek')}
        >
          {Object.entries(thisWeekByDay).map(([dayName, dayEntries]) => (
            <div key={dayName} className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">{dayName}</h3>
                <button
                  onClick={() => {
                    // Pin first item to today
                    if (dayEntries.length > 0) {
                      updateEntry(dayEntries[0].id, { pinnedForDate: today });
                    }
                  }}
                  className="px-2 py-1 text-xs font-medium text-violet-700 bg-violet-100 rounded hover:bg-violet-200 transition-colors"
                >
                  Pin to Today
                </button>
              </div>
              <div className="space-y-2">
                {dayEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* Upcoming Section */}
        <Section
          title="Upcoming / Someday"
          entries={upcomingEntries}
          accentColor="bg-gray-50 border-l-4 border-gray-400"
          collapsed={collapsedSections.upcoming}
          onToggle={() => toggleSection('upcoming')}
        >
          {upcomingEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No upcoming items</p>
              <p className="text-sm">All your tasks are organized for today and this week</p>
            </div>
          )}
        </Section>
      </div>

      {/* Batch actions bar */}
      {showBatchBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {selectedEntries.size} items selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={batchPinToToday}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Pin to Today
                </button>
                <button
                  onClick={batchComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mark Complete
                </button>
                <button
                  onClick={batchDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
                      {getRelativeTime(entry.createdAt)}
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
              
              <div className="grid grid-cols-2 gap-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingEntry.priority}
                    onChange={(e) => setEditingEntry({ ...editingEntry, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
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
