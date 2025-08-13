import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Plus
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { EntryType } from '../types';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  const { 
    entries, 
    setCurrentView
  } = useGenieNotesStore();

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <Clock className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Plus className="w-4 h-4" />;
      case 'insight': return <Calendar className="w-4 h-4" />;
      case 'reflection': return <Calendar className="w-4 h-4" />;
      case 'journal': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-green-100 text-green-800 border-green-200';
      case 'idea': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'insight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reflection': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'journal': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - date.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEntriesForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return entries.filter(entry => {
      const entryDate = entry.dueDate || entry.startDate;
      if (!entryDate) return false;
      
      return entryDate >= startOfDay && entryDate <= endOfDay;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const renderMonthView = () => {
    const days = getMonthDays(currentDate);
    const monthName = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEntries = getEntriesForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                
                {/* Entries for this day */}
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map(entry => (
                    <div
                      key={entry.id}
                      className={`text-xs p-1 rounded border ${getTypeColor(entry.type)} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => setCurrentView('inbox')}
                      title={entry.content}
                    >
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(entry.type)}
                        <span className="truncate">{entry.content}</span>
                      </div>
                      {entry.startDate && (
                        <div className="text-xs opacity-75">
                          {formatTime(entry.startDate)}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(currentDate);
    const weekStart = days[0];
    const weekEnd = days[6];
    const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Week of {weekRange}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEntries = getEntriesForDate(day);
            
            return (
              <div key={index} className="min-h-[400px]">
                <div className={`text-center p-2 mb-2 rounded-lg ${
                  isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className="text-sm font-medium">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {day.getDate()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {dayEntries.map(entry => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-lg border ${getTypeColor(entry.type)} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => setCurrentView('inbox')}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {getTypeIcon(entry.type)}
                        <span className="text-xs font-medium capitalize">{entry.type}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {entry.content}
                      </div>
                      {entry.startDate && (
                        <div className="text-xs text-gray-600 flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{formatTime(entry.startDate)}</span>
                        </div>
                      )}
                      {entry.location && (
                        <div className="text-xs text-gray-600 flex items-center space-x-1">
                          <MapPin size={12} />
                          <span>{entry.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">View your schedule and upcoming events</p>
            </div>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="flex space-x-2 bg-white rounded-lg border border-gray-200 p-1 w-fit">
            {(['month', 'week'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-blue-100 text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {entries.filter(e => e.type === 'event').length}
            </div>
            <p className="text-sm text-gray-600">Scheduled events</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Upcoming Tasks</h3>
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {entries.filter(e => e.type === 'task' && e.dueDate && e.dueDate > new Date()).length}
            </div>
            <p className="text-sm text-gray-600">Due soon</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">This Week</h3>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {getWeekDays(currentDate).reduce((total, day) => total + getEntriesForDate(day).length, 0)}
            </div>
            <p className="text-sm text-gray-600">Total entries</p>
          </div>
        </div>
      </div>
    </div>
  );
};
