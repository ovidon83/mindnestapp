import React, { useState } from 'react';
import { Edit2, Trash2, Check, CalendarPlus, Clock, Home, Target, Lightbulb, BookOpen, MessageCircle, Search, Plus, MoreHorizontal } from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType } from '../types';

export const HomeView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tasks' | 'events' | 'ideas' | 'insights' | 'reflections' | 'journal'>('all');
  
  const { 
    entries, 
    completeEntry, 
    deleteEntry, 
    setCurrentView,
    exportToICS 
  } = useGenieNotesStore();

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <Target className="w-4 h-4" />;
      case 'event': return <CalendarPlus className="w-4 h-4" />;
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'insight': return <MessageCircle className="w-4 h-4" />;
      case 'reflection': return <BookOpen className="w-4 h-4" />;
      case 'journal': return <Home className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getFilteredEntries = () => {
    let filtered = entries;
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.type === activeFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const getTodayEntries = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return entries.filter(entry => {
      const entryDate = entry.dueDate || entry.startDate || entry.createdAt;
      return entryDate >= todayStart && entryDate <= todayEnd;
    });
  };

  const renderItemCard = (entry: Entry) => (
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
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => completeEntry(entry.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Mark complete"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setCurrentView('nextup')}
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
            <span>Due {entry.dueDate.toLocaleDateString()}</span>
          </div>
        )}
        
        {entry.startDate && (
          <div className="flex items-center space-x-1">
            <CalendarPlus size={14} />
            <span>{entry.startDate.toLocaleDateString()}</span>
          </div>
        )}
        
        <span>Created {formatDate(entry.createdAt)}</span>
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
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

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {entry.type === 'event' && (
            <button
              onClick={() => {
                const icsContent = exportToICS(entry.id);
                const blob = new Blob([icsContent], { type: 'text/calendar' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${entry.content.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
            >
              <CalendarPlus size={12} />
              <span>Add to Calendar</span>
            </button>
          )}
        </div>
        
        <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1">
          <span>View Details</span>
          <MoreHorizontal size={12} />
        </button>
      </div>
    </div>
  );

  const filteredEntries = getFilteredEntries();
  const todayEntries = getTodayEntries();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
              <p className="text-gray-600">All your entries and quick actions in one place</p>
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
              {(['all', 'tasks', 'events', 'ideas', 'insights', 'reflections', 'journal'] as const).map(filter => (
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
          </div>
        </div>

        {/* Today's Highlights */}
        {todayEntries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Highlights</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayEntries.slice(0, 6).map(renderItemCard)}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              All Entries ({filteredEntries.length})
            </h2>
            <div className="text-sm text-gray-500">
              Showing {activeFilter === 'all' ? 'all types' : activeFilter}
            </div>
          </div>
          
          {filteredEntries.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map(renderItemCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? `No entries match "${searchQuery}"` : 'Start by capturing your first thought'}
              </p>
              <button
                onClick={() => setCurrentView('capture')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Capture New Thought
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
