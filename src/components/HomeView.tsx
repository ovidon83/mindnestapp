import React, { useState, useEffect } from 'react';
import { useAllyMindStore } from '../store';
import { Entry, TimeBucket, Priority } from '../types';
import { 
  Search, 
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

    const TaskCard: React.FC<{ entry: Entry }> = ({ entry }) => {
    const isCompleted = entry.type === 'task' && entry.completed;
    const progress = entry.progress || 0;

    return (
      <div 
        className={`
          group relative bg-white rounded-2xl border-2 border-slate-200/50 
          hover:border-purple-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2
          ${isCompleted ? 'opacity-75 bg-gradient-to-br from-slate-50 to-slate-100' : 'hover:shadow-purple-100'}
        `}
      >
        {/* Main card content */}
        <div className="p-8">
          <div className="flex items-start space-x-6">
            {/* Task completion status */}
            {entry.type === 'task' && (
              <button
                onClick={() => toggleEntryComplete(entry.id)}
                className={`mt-2 p-3 rounded-2xl transition-all duration-300 ${
                  isCompleted 
                    ? 'text-green-600 bg-green-100 hover:bg-green-200 shadow-lg' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:shadow-md'
                }`}
                title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              >
                {isCompleted ? (
                  <CheckCircle className="w-8 h-8" />
                ) : (
                  <Circle className="w-8 h-8" />
                )}
              </button>
            )}

            {/* Type indicator for thoughts */}
            {entry.type === 'thought' && (
              <div className="mt-2 p-3 text-blue-600 bg-blue-100 rounded-2xl">
                <Circle className="w-8 h-8" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <h3 
                  className={`
                    text-2xl font-bold text-slate-800 flex-1
                    ${isCompleted ? 'line-through text-slate-500' : ''}
                    transition-all duration-300
                  `}
                >
                  {entry.title}
                </h3>
                
                {/* Priority indicator */}
                {entry.priority && (
                  <span className={`ml-4 px-4 py-2 text-sm font-bold ${getPriorityColor(entry.priority)} bg-white rounded-full border-2 border-slate-200/50 shadow-lg`}>
                    {entry.priority.toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Progress bar for tasks */}
              {entry.type === 'task' && entry.subTasks && entry.subTasks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-base font-semibold text-slate-700 mb-2">
                    <span>Progress</span>
                    <span className="text-purple-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex items-center space-x-3 mb-4">
                  {entry.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full border border-purple-200 shadow-md"
                    >
                      #{tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className="text-sm text-slate-500 font-medium">+{entry.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* AI Note Preview */}
              {entry.note && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm font-bold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">
                      🤖 AI Insight
                    </span>
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed">
                    {entry.note}
                  </p>
                </div>
              )}

              {/* Sub-tasks preview */}
              {entry.subTasks && entry.subTasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-slate-700">Sub-tasks</h4>
                  <div className="space-y-2">
                    {entry.subTasks.slice(0, 3).map((subTask) => (
                      <div key={subTask.id} className="flex items-center space-x-3 text-base">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          subTask.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-slate-300'
                        }`}></div>
                        <span className={subTask.completed ? 'text-slate-500 line-through' : 'text-slate-700'}>
                          {subTask.title}
                        </span>
                      </div>
                    ))}
                    {entry.subTasks.length > 3 && (
                      <p className="text-sm text-slate-500">+{entry.subTasks.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {/* Pin toggle */}
              <button
                onClick={() => toggleEntryPin(entry.id)}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  entry.pinned 
                    ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200 shadow-lg' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:shadow-md'
                }`}
              >
                <Star className="w-6 h-6" fill={entry.pinned ? 'currentColor' : 'none'} />
              </button>

              {/* Expand/collapse */}
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
                className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all duration-300"
                title="More options"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expandedEntryIds.has(entry.id) && (
          <div className="px-8 pb-8 border-t-2 border-slate-200/50 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
              {/* Left column - AI Note & Sub-tasks */}
              <div className="space-y-6">
                {/* AI Note Editor */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-3">
                    <span>AI Insights & Notes</span>
                    <span className="text-sm text-blue-600 bg-blue-200 px-3 py-1 rounded-full font-semibold">
                      ✏️ Editable
                    </span>
                  </h4>
                  <textarea
                    value={entry.note || ''}
                    onChange={(e) => updateEntry(entry.id, { note: e.target.value })}
                    placeholder="AI will add insights here. You can edit anytime..."
                    className="w-full h-32 px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 bg-white shadow-sm resize-none"
                  />
                </div>
                
                {/* Sub-tasks Management */}
                {entry.type === 'task' && (
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4">Sub-tasks</h4>
                    <div className="space-y-3">
                      {entry.subTasks?.map((subTask) => (
                        <div key={subTask.id} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200">
                          <button
                            onClick={() => {
                              const updatedSubTasks = entry.subTasks?.map(st => 
                                st.id === subTask.id 
                                  ? { ...st, completed: !st.completed }
                                  : st
                              ) || [];
                              updateEntry(entry.id, { subTasks: updatedSubTasks });
                            }}
                            className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                              subTask.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {subTask.completed && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </button>
                          <input
                            type="text"
                            value={subTask.title}
                            onChange={(e) => {
                              const updatedSubTasks = entry.subTasks?.map(st => 
                                st.id === subTask.id 
                                  ? { ...st, title: e.target.value }
                                  : st
                              ) || [];
                              updateEntry(entry.id, { subTasks: updatedSubTasks });
                            }}
                            className="flex-1 text-base border-none bg-transparent focus:outline-none focus:ring-0 font-medium"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newSubTask = {
                            id: Date.now().toString(),
                            title: 'New sub-task',
                            completed: false,
                            createdAt: new Date()
                          };
                          const updatedSubTasks = [...(entry.subTasks || []), newSubTask];
                          updateEntry(entry.id, { subTasks: updatedSubTasks });
                        }}
                        className="w-full py-3 text-purple-600 hover:text-purple-700 font-semibold bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 border-2 border-dashed border-purple-200 hover:border-purple-300"
                      >
                        + Add sub-task
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right column - Actions & Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const newDate = new Date();
                        newDate.setDate(newDate.getDate() + 1);
                        updateEntry(entry.id, { dueAt: newDate });
                      }}
                      className="w-full px-6 py-4 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Defer to Tomorrow
                    </button>
                    
                    <button
                      onClick={() => {
                        const newDate = new Date();
                        newDate.setDate(newDate.getDate() + 7);
                        updateEntry(entry.id, { dueAt: newDate });
                      }}
                      className="w-full px-6 py-4 text-base font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Defer to Next Week
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Details</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-base text-slate-700"><span className="font-semibold">Created:</span> {formatDate(entry.createdAt)}</p>
                    {entry.dueAt && <p className="text-base text-slate-700"><span className="font-semibold">Due:</span> {formatDate(entry.dueAt)}</p>}
                    {entry.aiConfidence && (
                      <p className="text-base text-slate-700"><span className="font-semibold">AI Confidence:</span> {Math.round(entry.aiConfidence * 100)}%</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-slate-200/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                AllyMind
              </h1>
              <p className="text-base text-slate-600 font-medium">
                Intelligent task & thought management
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('capture')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg"
            >
              + New Entry
            </button>
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-4 text-slate-500 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition-all duration-300"
              title="Keyboard shortcuts"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-8 py-12 shadow-xl">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-4">
            Good Morning! 👋
          </h2>
          <p className="text-xl text-purple-100">
            What do you plan to do today?
          </p>
        </div>
      </div>

      {/* Sub-view Navigation */}
      <div className="bg-white shadow-md border-b border-slate-200/50 px-8 py-6">
        <div className="flex items-center space-x-8">
          {/* View Tabs */}
          <div className="flex space-x-2 bg-slate-100 rounded-2xl p-2">
            <button
              onClick={() => setActiveView('todo')}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                activeView === 'todo'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
              }`}
            >
              📋 To-Do
            </button>
            <button
              onClick={() => setActiveView('thoughts')}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                activeView === 'thoughts'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
              }`}
            >
              💭 Thoughts
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-500" />
              <input
                id="search-input"
                type="text"
                placeholder="Search entries... (Press / to focus)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-14 pr-6 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 bg-white shadow-sm transition-all duration-300 text-lg"
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
        {/* Today's Tasks Section */}
        <div className="px-8 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Today's Tasks</h2>
            <p className="text-slate-600">Focus on what matters most today</p>
          </div>
          
          {/* Task Cards */}
          <div className="space-y-4">
            {entries
              .filter(entry => {
                if (activeView === 'todo' && entry.type !== 'task') return false;
                if (activeView === 'thoughts' && entry.type !== 'thought') return false;
                return entry.timeBucket === 'today' || entry.timeBucket === 'overdue';
              })
              .map((entry) => (
                <TaskCard key={entry.id} entry={entry} />
              ))}
          </div>
        </div>

        {/* Other Time Buckets */}
        {Object.entries(groupedEntries)
          .filter(([groupName]) => groupName !== 'today' && groupName !== 'overdue')
          .map(([groupName, groupEntries]) => {
            const filteredEntries = groupEntries.filter(entry => {
              if (activeView === 'todo' && entry.type !== 'task') return false;
              if (activeView === 'thoughts' && entry.type !== 'thought') return false;
              return true;
            });
            
            if (filteredEntries.length === 0) return null;
            
            return (
              <div key={groupName} className="px-8 py-6 border-t border-slate-200/30">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {getTimeBucketLabel(groupName as TimeBucket)}
                  </h2>
                  <p className="text-slate-600">{filteredEntries.length} items</p>
                </div>
                
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <TaskCard key={entry.id} entry={entry} />
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
              Try adjusting your search query
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchInput('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
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