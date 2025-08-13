import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  Edit2, 
  Trash2, 
  Plus,
  Search,
  Zap,
  Target,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType, Priority } from '../types';

export const NextUpView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tasks' | 'events' | 'ideas'>('all');
  
  const { 
    getNextUpEntries, 
    getTodayEntries, 
    getThisWeekEntries, 
    getUpcomingEntries,
    completeEntry,
    deleteEntry,
    setCurrentView,
    debugEntries
  } = useGenieNotesStore();

  const nextUpEntries = getNextUpEntries();
  const todayEntries = getTodayEntries();
  const thisWeekEntries = getThisWeekEntries();
  const upcomingEntries = getUpcomingEntries();

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Zap className="w-4 h-4" />;
      case 'insight': return <Target className="w-4 h-4" />;
      case 'reflection': return <TrendingUp className="w-4 h-4" />;
      case 'journal': return <CalendarDays className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'idea': return 'bg-purple-100 text-purple-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'reflection': return 'bg-indigo-100 text-indigo-800';
      case 'journal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderEntryCard = (entry: Entry) => (
    <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
            {getTypeIcon(entry.type)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{entry.content}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                {entry.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                {entry.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => completeEntry(entry.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Mark complete"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => setCurrentView('inbox')}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => deleteEntry(entry.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
        {entry.dueDate && (
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{formatDate(entry.dueDate)}</span>
            {entry.dueDate.toDateString() === new Date().toDateString() && (
              <span className="text-orange-600 font-medium">• Due today</span>
            )}
          </div>
        )}
        
        {entry.startDate && (
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{formatDate(entry.startDate)} at {formatTime(entry.startDate)}</span>
          </div>
        )}
        
        {entry.location && (
          <div className="flex items-center space-x-1">
            <MapPin size={14} />
            <span>{entry.location}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              #{tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{entry.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Auto-actions */}
      {entry.autoActions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Auto-actions:</div>
          <div className="space-y-1">
            {entry.autoActions.slice(0, 2).map(action => (
              <div key={action.id} className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${action.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={action.completed ? 'line-through text-gray-400' : 'text-gray-600'}>
                  {action.content}
                </span>
                {action.dueDate && (
                  <span className="text-gray-400">
                    (due {formatDate(action.dueDate)})
                  </span>
                )}
              </div>
            ))}
            {entry.autoActions.length > 2 && (
              <span className="text-xs text-gray-400">
                +{entry.autoActions.length - 2} more actions
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSection = (title: string, entries: Entry[], emptyMessage: string, color: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
          {entries.length}
        </span>
      </div>
      
      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map(renderEntryCard)}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Next Up</h1>
              <p className="text-gray-600">Your prioritized action items and upcoming commitments</p>
            </div>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Capture New</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              {(['all', 'tasks', 'events', 'ideas'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Debug Button */}
            <button
              onClick={() => {
                const debug = debugEntries();
                console.log('Debug result:', debug);
                alert(`Total entries: ${debug.total}, Next Up: ${debug.nextUp}`);
              }}
              className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              title="Debug entries visibility"
            >
              🐛 Debug
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Now & Today */}
          <div>
            {renderSection(
              'Now',
              nextUpEntries.slice(0, 5),
              'No urgent items right now. Great job staying on top of things!',
              'bg-blue-100 text-blue-800'
            )}
            
            {renderSection(
              'Today',
              todayEntries.slice(0, 5),
              'Nothing scheduled for today. Time to plan ahead!',
              'bg-green-100 text-green-800'
            )}
          </div>

          {/* Right Column - This Week & Upcoming */}
          <div>
            {renderSection(
              'This Week',
              thisWeekEntries.slice(0, 5),
              'No items scheduled this week. Consider adding some goals!',
              'bg-purple-100 text-purple-800'
            )}
            
            {renderSection(
              'Upcoming',
              upcomingEntries.slice(0, 5),
              'No upcoming items. Great planning ahead!',
              'bg-orange-100 text-orange-800'
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{nextUpEntries.length}</div>
              <div className="text-sm text-gray-600">Next Up</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{todayEntries.length}</div>
              <div className="text-sm text-gray-600">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{thisWeekEntries.length}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{upcomingEntries.length}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
