import React, { useState, useEffect } from 'react';
import { useAllyMindStore } from '../store';
import { Entry } from '../types';
import { 
  Search, 
  Circle,
  Star
} from 'lucide-react';

const HomeView: React.FC = () => {
  const {
    entries,
    homeViewPrefs,
    setSearchQuery,
    toggleEntryComplete,
    toggleEntryPin,
    setCurrentView
  } = useAllyMindStore();

  const [searchInput, setSearchInput] = useState(homeViewPrefs.searchQuery);
  const [activeView, setActiveView] = useState<'todo' | 'thoughts'>('todo');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);



  const SimpleTaskRow: React.FC<{ entry: Entry }> = ({ entry }) => {
    const isCompleted = entry.type === 'task' && entry.completed;
    
    return (
      <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
        {/* Task completion status */}
        {entry.type === 'task' && (
          <button
            onClick={() => toggleEntryComplete(entry.id)}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              isCompleted 
                ? 'bg-green-500 border-green-500' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            {isCompleted && (
              <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto mt-0.5"></div>
            )}
          </button>
        )}

        {/* Type indicator for thoughts */}
        {entry.type === 'thought' && (
          <div className="w-5 h-5 text-blue-500">
            <Circle className="w-5 h-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 
            className={`text-sm font-medium text-slate-900 truncate ${
              isCompleted ? 'line-through text-slate-500' : ''
            }`}
          >
            {entry.title}
          </h3>
          
          {/* Priority indicator */}
          {entry.priority && (
            <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
              entry.priority === 'urgent' ? 'bg-red-100 text-red-700' :
              entry.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              entry.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {entry.priority}
            </span>
          )}
        </div>

        {/* Pin toggle */}
        <button
          onClick={() => toggleEntryPin(entry.id)}
          className={`p-1 rounded transition-colors ${
            entry.pinned 
              ? 'text-yellow-500 hover:text-yellow-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Star className="w-4 h-4" fill={entry.pinned ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AllyMind</h1>
          </div>
          
          <button
            onClick={() => setCurrentView('capture')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            + New Entry
          </button>
        </div>
      </div>

      {/* Simple Navigation */}
      <div className="border-b border-slate-200 px-6 py-3">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveView('todo')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeView === 'todo'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveView('thoughts')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeView === 'thoughts'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Thoughts
          </button>
          
          {/* Simple Search */}
          <div className="flex-1 max-w-sm ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {/* Today Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Today</h2>
            <span className="text-sm text-slate-500">
              {entries.filter(entry => 
                (activeView === 'todo' && entry.type === 'task') ||
                (activeView === 'thoughts' && entry.type === 'thought')
              ).filter(entry => entry.timeBucket === 'today' || entry.timeBucket === 'overdue').length} items
            </span>
          </div>
          
          <div className="space-y-2">
            {entries
              .filter(entry => {
                if (activeView === 'todo' && entry.type !== 'task') return false;
                if (activeView === 'thoughts' && entry.type !== 'thought') return false;
                return entry.timeBucket === 'today' || entry.timeBucket === 'overdue';
              })
              .map((entry) => (
                <SimpleTaskRow key={entry.id} entry={entry} />
              ))}
          </div>
        </div>

        {/* This Week Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">This Week</h2>
            <span className="text-sm text-slate-500">
              {entries.filter(entry => 
                (activeView === 'todo' && entry.type === 'task') ||
                (activeView === 'thoughts' && entry.type === 'thought')
              ).filter(entry => entry.timeBucket === 'tomorrow' || entry.timeBucket === 'this_week').length} items
            </span>
          </div>
          
          <div className="space-y-2">
            {entries
              .filter(entry => {
                if (activeView === 'todo' && entry.type !== 'task') return false;
                if (activeView === 'thoughts' && entry.type !== 'thought') return false;
                return entry.timeBucket === 'tomorrow' || entry.timeBucket === 'this_week';
              })
              .map((entry) => (
                <SimpleTaskRow key={entry.id} entry={entry} />
              ))}
          </div>
        </div>

        {/* Later Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Later</h2>
            <span className="text-sm text-slate-500">
              {entries.filter(entry => 
                (activeView === 'todo' && entry.type === 'task') ||
                (activeView === 'thoughts' && entry.type === 'thought')
              ).filter(entry => entry.timeBucket === 'next_week' || entry.timeBucket === 'later' || entry.timeBucket === 'someday').length} items
            </span>
          </div>
          
          <div className="space-y-2">
            {entries
              .filter(entry => {
                if (activeView === 'todo' && entry.type !== 'task') return false;
                if (activeView === 'thoughts' && entry.type !== 'thought') return false;
                return entry.timeBucket === 'next_week' || entry.timeBucket === 'later' || entry.timeBucket === 'someday';
              })
              .map((entry) => (
                <SimpleTaskRow key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
