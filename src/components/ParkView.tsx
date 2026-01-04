import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import Navigation from './Navigation';
import { Thought } from '../types';
import { ParkingCircle, Search, Calendar, ChevronDown } from 'lucide-react';

type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month' | Date;

const ParkView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    updateThought,
    unparkThought,
  } = useGenieNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    date?: DateFilter;
  }>({});
  const [expandedFilterDropdown, setExpandedFilterDropdown] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [customDate, setCustomDate] = useState<string>('');

  // Filter to only parked thoughts
  const parkedThoughts = useMemo(() => {
    return thoughts.filter(thought => thought.isParked === true);
  }, [thoughts]);

  // Filter thoughts
  const filteredThoughts = useMemo(() => {
    let filtered = parkedThoughts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thought =>
        thought.originalText.toLowerCase().includes(query) ||
        thought.summary.toLowerCase().includes(query) ||
        thought.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Date filter
    if (activeFilters.date && activeFilters.date !== 'All') {
      const now = new Date();
      let startDate: Date;

      if (activeFilters.date instanceof Date) {
        startDate = new Date(activeFilters.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(activeFilters.date);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(thought => {
          const thoughtDate = new Date(thought.createdAt);
          return thoughtDate >= startDate && thoughtDate <= endDate;
        });
      } else {
        switch (activeFilters.date) {
          case 'Today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'This Week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'This Month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        filtered = filtered.filter(thought => {
          const thoughtDate = new Date(thought.createdAt);
          return thoughtDate >= startDate;
        });
      }
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [parkedThoughts, searchQuery, activeFilters, sortBy]);

  const handleDateFilter = (date: DateFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      date,
    }));
  };

  const handleUnpark = async (thoughtId: string) => {
    await unparkThought(thoughtId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-white">
      <Navigation
        currentView="park"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
              <ParkingCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Park</h1>
              <p className="text-slate-600 mt-1">Your parked thoughts ready to revive</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search parked thoughts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border-2 border-slate-200 text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Filter */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={() => setExpandedFilterDropdown(expandedFilterDropdown === 'date' ? null : 'date')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  activeFilters.date && activeFilters.date !== 'All'
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Date</span>
                {activeFilters.date && activeFilters.date !== 'All' && (
                  <span className="px-1.5 py-0.5 bg-amber-600 text-white text-xs rounded-full">
                    {activeFilters.date instanceof Date 
                      ? activeFilters.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : activeFilters.date}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedFilterDropdown === 'date' ? 'rotate-180' : ''}`} />
              </button>
              {expandedFilterDropdown === 'date' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-20 min-w-[200px] overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    {(['All', 'Today', 'This Week', 'This Month'] as (DateFilter | string)[]).map(date => (
                      <button
                        key={date}
                        onClick={() => {
                          handleDateFilter(date as DateFilter);
                          setExpandedFilterDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors rounded-lg flex items-center gap-2 ${
                          (activeFilters.date === date || (date === 'All' && !activeFilters.date)) && !(activeFilters.date instanceof Date)
                            ? 'bg-amber-50 text-amber-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {date !== 'All' && <Calendar className="w-3 h-3" />}
                        {date}
                      </button>
                    ))}
                    <div className="border-t border-slate-200 my-1"></div>
                    <div className="px-3 py-2">
                      <label className="block text-xs text-slate-600 mb-1">Custom Date</label>
                      <input
                        type="date"
                        value={customDate || (activeFilters.date instanceof Date ? activeFilters.date.toISOString().split('T')[0] : '')}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          if (dateValue) {
                            const selectedDate = new Date(dateValue);
                            setActiveFilters(prev => ({
                              ...prev,
                              date: selectedDate,
                            }));
                            setCustomDate(dateValue);
                          } else {
                            setActiveFilters(prev => ({
                              ...prev,
                              date: 'All',
                            }));
                            setCustomDate('');
                          }
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sortBy === 'oldest'
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>

        {/* Thoughts List */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <ParkingCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {parkedThoughts.length === 0 ? 'No parked thoughts' : 'No thoughts match your filters'}
            </h3>
            <p className="text-slate-500">
              {parkedThoughts.length === 0 
                ? 'Park thoughts to review them later'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThoughts.map((thought) => (
              <div
                key={thought.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <p className="text-sm text-slate-800 leading-relaxed mb-2">{thought.originalText}</p>
                  {thought.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {thought.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {new Date(thought.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => handleUnpark(thought.id)}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                  >
                    Revive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkView;

