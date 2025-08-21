import React, { useState, useCallback, useEffect } from 'react';
import { useAllyMindStore } from '../store';
import { Entry, EntryType, TimeBucket, Priority, GroupingMode } from '../types';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  Clock, 
  Type, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  Circle,
  Star,
  StarOff,
  MoreHorizontal,

  HelpCircle,
  CheckSquare,
  Square
} from 'lucide-react';

const HomeView: React.FC = () => {
  const {
    entries,
    homeViewPrefs,
    getGroupedEntries,
    setGrouping,
    setFilters,
    toggleGroupCollapsed,
    setSearchQuery,
    toggleEntryComplete,
    toggleEntryPin,
    updateEntry,
    deleteEntry,
    bulkComplete,
    bulkDelete,
    bulkDefer,
    setCurrentView
  } = useAllyMindStore();

  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [expandedEntryIds, setSelectedExpandedIds] = useState<Set<string>>(new Set());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const [searchInput, setSearchInput] = useState(homeViewPrefs.searchQuery);

  const groupedEntries = getGroupedEntries();
  const totalEntries = entries.length;
  const filteredCount = Object.values(groupedEntries).reduce((sum, group) => sum + group.length, 0);
  

  


  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case '/':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case 'j':
          e.preventDefault();
          // Navigate down
          break;
        case 'k':
          e.preventDefault();
          // Navigate up
          break;
        case 'x':
          e.preventDefault();
          // Select current row
          break;
        case 'p':
          e.preventDefault();
          // Pin/unpin current row
          break;
        case 'c':
          e.preventDefault();
          // Complete current task
          break;
        case 'd':
          e.preventDefault();
          // Defer menu
          break;
        case 'g':
          // Handle g+t, g+y, g+n combinations
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setGrouping]);

  const handleEntrySelect = useCallback((entryId: string) => {
    setSelectedEntryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);



  const handleDeselectAll = useCallback(() => {
    setSelectedEntryIds(new Set());
  }, []);

  const handleBulkComplete = useCallback(() => {
    const taskIds = Array.from(selectedEntryIds).filter(id => {
      const entry = entries.find(e => e.id === id);
      return entry?.type === 'task';
    });
    bulkComplete(taskIds);
    setSelectedEntryIds(new Set());
  }, [selectedEntryIds, entries, bulkComplete]);

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(`Delete ${selectedEntryIds.size} selected entries?`)) {
      bulkDelete(Array.from(selectedEntryIds));
      setSelectedEntryIds(new Set());
    }
  }, [selectedEntryIds, bulkDelete]);

  const handleBulkDefer = useCallback((timeBucket: TimeBucket) => {
    bulkDefer(Array.from(selectedEntryIds), timeBucket);
    setSelectedEntryIds(new Set());
  }, [selectedEntryIds, bulkDefer]);

  const getTimeBucketLabel = (timeBucket: TimeBucket): string => {
    const labels: Record<TimeBucket, string> = {
      overdue: 'Overdue',
      today: 'Today',
      tomorrow: 'Tomorrow',
      this_week: 'This Week',
      next_week: 'Next Week',
      later: 'Later',
      someday: 'Someday',
      none: 'No Due Date'
    };
    return labels[timeBucket];
  };

  const getTimeBucketColor = (timeBucket: TimeBucket): string => {
    const colors: Record<TimeBucket, string> = {
      overdue: 'text-red-600 bg-red-100',
      today: 'text-green-600 bg-green-100',
      tomorrow: 'text-blue-600 bg-blue-100',
      this_week: 'text-purple-600 bg-purple-100',
      next_week: 'text-indigo-600 bg-indigo-100',
      later: 'text-gray-600 bg-gray-100',
      someday: 'text-gray-500 bg-gray-50',
      none: 'text-gray-400 bg-gray-50'
    };
    return colors[timeBucket];
  };

  const getPriorityColor = (priority?: Priority): string => {
    const colors: Record<Priority, string> = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-gray-600'
    };
    return priority ? colors[priority] : 'text-gray-400';
  };

  const formatDate = (date: Date | string | undefined): string => {
    try {
      // Handle different date formats safely
      let dateObj: Date;
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'No date';
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      if (dateObj.toDateString() === today.toDateString()) return 'Today';
      if (dateObj.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      
      const diffTime = dateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return 'Invalid date';
    }
  };

  const EntryRow: React.FC<{ entry: Entry }> = ({ entry }) => {
    const isSelected = selectedEntryIds.has(entry.id);
    const isExpanded = expandedEntryIds.has(entry.id);
    const isCompleted = entry.type === 'task' && entry.completed;

    return (
      <div 
        className={`
          group relative border-b border-slate-200/30 hover:bg-white/60 transition-all duration-200
          ${isSelected ? 'bg-blue-50/80 border-blue-300/50' : ''}
          ${isCompleted ? 'opacity-60' : ''}
        `}
      >
        <div className="flex items-center px-8 py-4">
          {/* Selection checkbox */}
          <div className="mr-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleEntrySelect(entry.id)}
              className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200"
            />
          </div>

          {/* Type icon */}
          <div className="mr-4">
            {entry.type === 'task' ? (
              <CheckCircle className={`w-6 h-6 ${isCompleted ? 'text-green-500' : 'text-slate-400'} transition-colors duration-200`} />
            ) : (
              <Circle className="w-6 h-6 text-blue-400 transition-colors duration-200" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4">
              <h3 
                className={`
                  text-base font-semibold text-slate-800 truncate flex-1
                  ${isCompleted ? 'line-through text-slate-500' : ''}
                  transition-all duration-200
                `}
              >
                {entry.title}
              </h3>
              
              {/* Due date badge */}
              {entry.dueAt && (
                <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getTimeBucketColor(entry.timeBucket)} shadow-sm`}>
                  {formatDate(entry.dueAt)}
                </span>
              )}
            </div>
            
            {/* Tags - inline with title */}
            {entry.tags.length > 0 && (
              <div className="flex items-center mt-2 space-x-2">
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-full border border-slate-200/50 shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="text-xs text-slate-500 font-medium">+{entry.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {/* Priority indicator */}
          {entry.priority && (
            <div className={`mr-4 text-xs font-bold ${getPriorityColor(entry.priority)} px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm`}>
              {entry.priority.toUpperCase()}
            </div>
          )}

          {/* AI confidence */}
          {entry.aiConfidence !== undefined && entry.aiConfidence < 0.8 && (
            <div className="mr-4">
              <HelpCircle className="w-5 h-5 text-yellow-500" />
            </div>
          )}

          {/* Pin toggle */}
          <button
            onClick={() => toggleEntryPin(entry.id)}
            className="mr-4 p-2 hover:bg-white/80 rounded-xl transition-all duration-200"
          >
            {entry.pinned ? (
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-5 h-5 text-slate-400" />
            )}
          </button>

                    {/* Actions */}
          <div className="flex items-center space-x-2">
            {entry.type === 'task' && (
              <button
                onClick={() => toggleEntryComplete(entry.id)}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200"
                title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              >
                {isCompleted ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>
            )}
            
            <button
              onClick={() => setSelectedExpandedIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(entry.id)) {
                  newSet.delete(entry.id);
                } else {
                  newSet.add(entry.id);
                }
                return newSet;
              })}
              className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200"
            >
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-8 pb-6 bg-gradient-to-r from-slate-50/80 to-slate-100/80 border-t border-slate-200/30">
            <div className="text-sm text-slate-700 mb-4 leading-relaxed">
              {entry.body}
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span className="font-medium">Created {formatDate(entry.createdAt)}</span>
              {entry.aiConfidence !== undefined && (
                <span className="font-medium">AI confidence: {Math.round(entry.aiConfidence * 100)}%</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {entry.type === 'task' && (
                <>
                  <button
                    onClick={() => {
                      const newDate = new Date();
                      newDate.setDate(newDate.getDate() + 1);
                      updateEntry(entry.id, { dueAt: newDate });
                    }}
                    className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date();
                      newDate.setDate(newDate.getDate() + 7);
                      updateEntry(entry.id, { dueAt: newDate });
                    }}
                    className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Next Week
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  const tag = prompt('Enter tag:');
                  if (tag) {
                    updateEntry(entry.id, { tags: [...entry.tags, tag] });
                  }
                }}
                className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Add Tag
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Delete this entry?')) {
                    deleteEntry(entry.id);
                  }
                }}
                className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                AllyMind
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {filteredCount} of {totalEntries} entries
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('capture')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              + New Entry
            </button>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl hover:bg-white transition-all duration-200 border border-slate-200/50 shadow-sm hover:shadow-md font-medium"
            >
              ← Back to Capture
            </button>
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-3 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition-all duration-200"
              title="Keyboard shortcuts"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/30 px-8 py-6">
        <div className="flex items-center space-x-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Search entries... (Press / to focus)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Grouping */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-600">Group by:</span>
            <select
              value={homeViewPrefs.grouping}
              onChange={(e) => setGrouping(e.target.value as GroupingMode)}
              className="px-4 py-3 border border-slate-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
            >
              <option value="none">None</option>
              <option value="time">Time</option>
              <option value="type">Type</option>
              <option value="time_type">Time ▸ Type</option>
              <option value="type_time">Type ▸ Time</option>
            </select>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={homeViewPrefs.filters.types.length === 2 ? 'both' : homeViewPrefs.filters.types[0]}
              onChange={(e) => {
                const value = e.target.value;
                const types: EntryType[] = value === 'both' ? ['task', 'thought'] : [value as EntryType];
                setFilters({ types });
              }}
              className="px-4 py-3 border border-slate-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
            >
              <option value="both">All Types</option>
              <option value="task">Tasks Only</option>
              <option value="thought">Thoughts Only</option>
            </select>
          </div>

          {/* Clear filters */}
          {filteredCount < totalEntries && (
            <button
              onClick={() => {
                setFilters({
                  types: ['task', 'thought'],
                  timeBuckets: ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday'],
                  status: 'incomplete',
                  pinnedOnly: false,
                });
                setSearchQuery('');
                setSearchInput('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedEntryIds.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedEntryIds.size} entries selected
            </span>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkComplete}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Complete Tasks
              </button>
              
              <button
                onClick={() => handleBulkDefer('tomorrow')}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Defer to Tomorrow
              </button>
              
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Delete
              </button>
              
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      {showKeyboardShortcuts && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-yellow-200/50 px-8 py-4">
          <div className="text-sm font-medium text-amber-800">
            <strong>⌨️ Keyboard shortcuts:</strong> / (search), j/k (navigate), x (select), p (pin), c (complete), d (defer), g+t (group by time), g+y (group by type), g+n (no grouping)
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {Object.entries(groupedEntries).map(([groupName, groupEntries]) => (
          <div key={groupName} className="bg-white/80 backdrop-blur-sm border-b border-slate-200/30">
            {/* Group header */}
            <div 
              className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:from-slate-100/80 hover:to-slate-200/80 cursor-pointer transition-all duration-200"
              onClick={() => toggleGroupCollapsed(groupName)}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {homeViewPrefs.grouping === 'time' && <Clock className="w-5 h-5 text-slate-500" />}
                  {homeViewPrefs.grouping === 'type' && <Type className="w-5 h-5 text-slate-500" />}
                  {homeViewPrefs.grouping === 'none' && <Grid3X3 className="w-5 h-5 text-slate-500" />}
                </div>
                
                <h2 className="text-xl font-bold text-slate-800">
                  {groupName === 'All Entries' ? 'All Entries' : 
                   homeViewPrefs.grouping === 'time' ? getTimeBucketLabel(groupName as TimeBucket) :
                   homeViewPrefs.grouping === 'type' ? (groupName === 'task' ? 'Tasks' : 'Thoughts') :
                   groupName}
                </h2>
                
                <span className="text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                  {groupEntries.length}
                </span>
              </div>
              
              <button className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                {homeViewPrefs.collapsedGroups[groupName] ? (
                  <ChevronRight className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>
            </div>
            
            {/* Group content */}
            {!homeViewPrefs.collapsedGroups[groupName] && (
              <div className="divide-y divide-gray-100">
                {groupEntries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Empty state */}
        {Object.keys(groupedEntries).length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setFilters({
                  types: ['task', 'thought'],
                  timeBuckets: ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday', 'none'],
                  status: 'both',
                  pinnedOnly: false,
                });
                setSearchQuery('');
                setSearchInput('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;