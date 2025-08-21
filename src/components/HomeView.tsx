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

  const formatDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const EntryRow: React.FC<{ entry: Entry }> = ({ entry }) => {
    const isSelected = selectedEntryIds.has(entry.id);
    const isExpanded = expandedEntryIds.has(entry.id);
    const isCompleted = entry.type === 'task' && entry.completed;

    return (
      <div 
        className={`
          group relative border-b border-gray-100 hover:bg-gray-50 transition-colors
          ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
          ${isCompleted ? 'opacity-60' : ''}
        `}
      >
        <div className="flex items-center px-4 py-3">
          {/* Selection checkbox */}
          <div className="mr-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleEntrySelect(entry.id)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          {/* Type icon */}
          <div className="mr-3">
            {entry.type === 'task' ? (
              <CheckCircle className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
            ) : (
              <Circle className="w-5 h-5 text-blue-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 
                className={`
                  text-sm font-medium text-gray-900 truncate flex-1
                  ${isCompleted ? 'line-through' : ''}
                `}
              >
                {entry.title}
              </h3>
              
              {/* Due date badge */}
              {entry.dueAt && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getTimeBucketColor(entry.timeBucket)}`}>
                  {formatDate(entry.dueAt)}
                </span>
              )}
            </div>
            
            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex items-center mt-1 space-x-1">
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{entry.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {/* Priority indicator */}
          {entry.priority && (
            <div className={`mr-3 text-xs font-medium ${getPriorityColor(entry.priority)}`}>
              {entry.priority.toUpperCase()}
            </div>
          )}

          {/* AI confidence */}
          {entry.aiConfidence !== undefined && entry.aiConfidence < 0.8 && (
            <div className="mr-3">
              <HelpCircle className="w-4 h-4 text-yellow-500" />
            </div>
          )}

          {/* Pin toggle */}
          <button
            onClick={() => toggleEntryPin(entry.id)}
            className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {entry.pinned ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {entry.type === 'task' && (
              <button
                onClick={() => toggleEntryComplete(entry.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              >
                {isCompleted ? (
                  <CheckSquare className="w-4 h-4 text-green-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
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
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-3 bg-gray-50">
            <div className="text-sm text-gray-600 mb-3">
              {entry.body}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Created {entry.createdAt.toLocaleDateString()}</span>
              {entry.aiConfidence !== undefined && (
                <span>AI confidence: {Math.round(entry.aiConfidence * 100)}%</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-3">
              {entry.type === 'task' && (
                <>
                  <button
                    onClick={() => {
                      const newDate = new Date();
                      newDate.setDate(newDate.getDate() + 1);
                      updateEntry(entry.id, { dueAt: newDate });
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date();
                      newDate.setDate(newDate.getDate() + 7);
                      updateEntry(entry.id, { dueAt: newDate });
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
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
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Add Tag
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Delete this entry?')) {
                    deleteEntry(entry.id);
                  }
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AllyMind</h1>
            <p className="text-sm text-gray-500">
              {filteredCount} of {totalEntries} entries
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Entry
            </button>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Capture
            </button>
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Keyboard shortcuts"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Search entries... (Press / to focus)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Grouping */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Group by:</span>
            <select
              value={homeViewPrefs.grouping}
              onChange={(e) => setGrouping(e.target.value as GroupingMode)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">None</option>
              <option value="time">Time</option>
              <option value="type">Type</option>
              <option value="time_type">Time ▸ Type</option>
              <option value="type_time">Type ▸ Time</option>
            </select>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={homeViewPrefs.filters.types.length === 2 ? 'both' : homeViewPrefs.filters.types[0]}
              onChange={(e) => {
                const value = e.target.value;
                const types: EntryType[] = value === 'both' ? ['task', 'thought'] : [value as EntryType];
                setFilters({ types });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedEntryIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedEntryIds.size} entries selected
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkComplete}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Complete Tasks
              </button>
              
              <button
                onClick={() => handleBulkDefer('tomorrow')}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Defer to Tomorrow
              </button>
              
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      {showKeyboardShortcuts && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="text-sm text-yellow-800">
            <strong>Keyboard shortcuts:</strong> / (search), j/k (navigate), x (select), p (pin), c (complete), d (defer), g+t (group by time), g+y (group by type), g+n (no grouping)
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {Object.entries(groupedEntries).map(([groupName, groupEntries]) => (
          <div key={groupName} className="bg-white border-b border-gray-200">
            {/* Group header */}
            <div 
              className="flex items-center justify-between px-6 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleGroupCollapsed(groupName)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {homeViewPrefs.grouping === 'time' && <Clock className="w-4 h-4 text-gray-500" />}
                  {homeViewPrefs.grouping === 'type' && <Type className="w-4 h-4 text-gray-500" />}
                  {homeViewPrefs.grouping === 'none' && <Grid3X3 className="w-4 h-4 text-gray-500" />}
                </div>
                
                <h2 className="text-lg font-semibold text-gray-900">
                  {groupName === 'All Entries' ? 'All Entries' : 
                   homeViewPrefs.grouping === 'time' ? getTimeBucketLabel(groupName as TimeBucket) :
                   homeViewPrefs.grouping === 'type' ? (groupName === 'task' ? 'Tasks' : 'Thoughts') :
                   groupName}
                </h2>
                
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {groupEntries.length}
                </span>
              </div>
              
              <button className="text-gray-400 hover:text-gray-600">
                {homeViewPrefs.collapsedGroups[groupName] ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
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
                  timeBuckets: ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday'],
                  status: 'incomplete',
                  pinnedOnly: false,
                });
                setSearchQuery('');
                setSearchInput('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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