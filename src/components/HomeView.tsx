import React, { useState, useEffect } from 'react';
import { useAllyMindStore } from '../store';
import { Entry, TimeBucket, Priority } from '../types';
import { 
  Search, 
  Clock, 
  CheckCircle,
  Circle,
  Star,
  MoreHorizontal,
  HelpCircle
} from 'lucide-react';

const HomeView: React.FC = () => {
  const {
    entries,
    homeViewPrefs,
    getGroupedEntries,
    setSearchQuery,
    toggleEntryComplete,
    toggleEntryPin,
    updateEntry,
    setCurrentView
  } = useAllyMindStore();

  const [expandedEntryIds, setSelectedExpandedIds] = useState<Set<string>>(new Set());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const [searchInput, setSearchInput] = useState(homeViewPrefs.searchQuery);
  const [activeView, setActiveView] = useState<'todo' | 'thoughts'>('todo');

  const groupedEntries = getGroupedEntries();
  const totalEntries = entries.length;
  

  


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
  }, []);

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
    const isExpanded = expandedEntryIds.has(entry.id);
    const isCompleted = entry.type === 'task' && entry.completed;

    return (
      <div 
        className={`
          group relative border-b border-slate-200/30 hover:bg-white/60 transition-all duration-200
          ${isCompleted ? 'opacity-75 bg-slate-50/50' : ''}
        `}
      >
        <div className="flex items-center px-8 py-4">
          {/* Task completion status */}
          {entry.type === 'task' && (
            <button
              onClick={() => toggleEntryComplete(entry.id)}
              className={`mr-4 p-2 rounded-xl transition-all duration-200 ${
                isCompleted 
                  ? 'text-green-500 bg-green-50/80 hover:bg-green-100/80' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/80'
              }`}
              title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              {isCompleted ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>
          )}

          {/* Type indicator for thoughts */}
          {entry.type === 'thought' && (
            <div className="mr-4 p-2 text-blue-500">
              <Circle className="w-6 h-6" />
            </div>
          )}

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
            
            {/* Tags */}
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

          {/* Pin toggle */}
          <button
            onClick={() => toggleEntryPin(entry.id)}
            className={`mr-4 p-2 rounded-xl transition-all duration-200 ${
              entry.pinned 
                ? 'text-yellow-500 bg-yellow-50/80 hover:bg-yellow-100/80' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <Star className="w-5 h-5" fill={entry.pinned ? 'currentColor' : 'none'} />
          </button>

          {/* Quick actions */}
          <div className="flex items-center space-x-2">
            {entry.type === 'task' && !isCompleted && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + 1);
                  updateEntry(entry.id, { dueAt: newDate });
                }}
                className="p-2 text-blue-500 hover:bg-blue-50/80 rounded-xl transition-all duration-200"
                title="Defer to tomorrow"
              >
                <Clock className="w-5 h-5" />
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
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
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
                {totalEntries} entries organized
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
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-3 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition-all duration-200"
              title="Keyboard shortcuts"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/30 px-8 py-4">
        <div className="flex items-center space-x-8">
          {/* View Tabs */}
          <div className="flex space-x-1 bg-slate-100/80 rounded-xl p-1">
            <button
              onClick={() => setActiveView('todo')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'todo'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📋 To-Do
            </button>
            <button
              onClick={() => setActiveView('thoughts')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'thoughts'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              💭 Thoughts
            </button>
          </div>

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
        </div>
      </div>



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
        {/* Always show Today section first */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/30">
          <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-50/80 to-indigo-100/80">
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-slate-800">Today</h2>
              <span className="text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                {entries.filter(entry => {
                  if (activeView === 'todo' && entry.type !== 'task') return false;
                  if (activeView === 'thoughts' && entry.type !== 'thought') return false;
                  return entry.timeBucket === 'today' || entry.timeBucket === 'overdue';
                }).length}
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {entries
              .filter(entry => {
                if (activeView === 'todo' && entry.type !== 'task') return false;
                if (activeView === 'thoughts' && entry.type !== 'thought') return false;
                return entry.timeBucket === 'today' || entry.timeBucket === 'overdue';
              })
              .map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
          </div>
        </div>

        {/* Show other time buckets */}
        {Object.entries(groupedEntries)
          .filter(([groupName]) => groupName !== 'today' && groupName !== 'overdue')
          .map(([groupName, groupEntries]) => {
            // Filter entries based on active view
            const filteredEntries = groupEntries.filter(entry => {
              if (activeView === 'todo' && entry.type !== 'task') return false;
              if (activeView === 'thoughts' && entry.type !== 'thought') return false;
              return true;
            });
            
            if (filteredEntries.length === 0) return null;
            
            return (
              <div key={groupName} className="bg-white/80 backdrop-blur-sm border-b border-slate-200/30">
                {/* Group header */}
                <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-slate-50/80 to-slate-100/80">
                  <div className="flex items-center space-x-4">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <h2 className="text-xl font-bold text-slate-800">
                      {getTimeBucketLabel(groupName as TimeBucket)}
                    </h2>
                    <span className="text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                      {filteredEntries.length}
                    </span>
                  </div>
                </div>
                
                {/* Group content */}
                <div className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            );
          })}
        
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
                setSearchQuery('');
                setSearchInput('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;