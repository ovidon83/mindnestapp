import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought, PotentialType } from '../types';
import { Sparkles, Search, Calendar, X, ParkingCircle, ChevronDown, CheckCircle2, Circle, Edit2, Save } from 'lucide-react';
import Navigation from './Navigation';

type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month';
type PotentialFilter = 'All' | PotentialType;

const ThoughtsView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    updateThought,
    addSpark,
    removeSpark,
    setPotential,
    parkThought,
    unparkThought,
    updateTodoData,
  } = useGenieNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    potential?: PotentialFilter;
    date?: DateFilter;
    topics?: string[];
    parked?: boolean;
    spark?: boolean;
  }>({});
  const [expandedActionDropdown, setExpandedActionDropdown] = useState<string | null>(null);
  const [expandedFilterDropdown, setExpandedFilterDropdown] = useState<string | null>(null);
  const [completionPrompt, setCompletionPrompt] = useState<string | null>(null);
  const [editingThoughtId, setEditingThoughtId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Extract unique topics from thoughts
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    thoughts.forEach(thought => {
      thought.tags.forEach(tag => topics.add(tag));
    });
    return Array.from(topics).sort();
  }, [thoughts]);

  // Filter thoughts
  const filteredThoughts = useMemo(() => {
    let filtered = thoughts;

    // Search filter - search in original text, summary, and tags (including parked)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thought =>
        thought.originalText.toLowerCase().includes(query) ||
        thought.summary.toLowerCase().includes(query) ||
        thought.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Potential filter
    if (activeFilters.potential && activeFilters.potential !== 'All') {
      filtered = filtered.filter(thought => {
        const potential = thought.potential || thought.bestPotential;
        return potential === activeFilters.potential;
      });
    }

    // Date filter
    if (activeFilters.date && activeFilters.date !== 'All') {
      const now = new Date();
      filtered = filtered.filter(thought => {
        const thoughtDate = new Date(thought.createdAt);
        switch (activeFilters.date) {
          case 'Today':
            return thoughtDate.toDateString() === now.toDateString();
          case 'This Week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return thoughtDate >= weekAgo;
          case 'This Month':
            return thoughtDate.getMonth() === now.getMonth() && thoughtDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Topic filter
    if (activeFilters.topics && activeFilters.topics.length > 0) {
      filtered = filtered.filter(thought =>
        activeFilters.topics!.some(topic => thought.tags.includes(topic as any))
      );
    }

    // Parked filter - Hide parked thoughts from main view unless:
    // - Explicitly filtering for parked
    // - Searching (parked thoughts should appear in search)
    if (activeFilters.parked === undefined) {
      // If not explicitly filtering for parked, hide parked thoughts (unless searching)
      if (!searchQuery.trim()) {
        filtered = filtered.filter(thought => !thought.isParked);
      }
    } else {
      // Explicit filter for parked
      filtered = filtered.filter(thought => thought.isParked === activeFilters.parked);
    }

    // Spark filter
    if (activeFilters.spark !== undefined) {
      filtered = filtered.filter(thought => thought.isSpark === activeFilters.spark);
    }

    return filtered;
  }, [thoughts, searchQuery, activeFilters]);

  const handleRemoveFilter = (type: 'potential' | 'date' | 'topic' | 'parked' | 'spark', value?: string) => {
    if (type === 'topic' && value) {
      setActiveFilters(prev => ({
        ...prev,
        topics: prev.topics?.filter(t => t !== value),
      }));
    } else {
      setActiveFilters(prev => {
        const newFilters = { ...prev };
        if (type === 'potential') {
          delete newFilters.potential;
        } else if (type === 'date') {
          delete newFilters.date;
        } else if (type === 'parked') {
          delete newFilters.parked;
        } else if (type === 'spark') {
          delete newFilters.spark;
        }
        return newFilters;
      });
    }
  };

  const handlePotentialFilter = (potential: PotentialFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      potential: prev.potential === potential ? undefined : potential,
    }));
  };

  const handleDateFilter = (date: DateFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      date: prev.date === date ? undefined : date,
    }));
  };

  const handleTopicFilter = (topic: string) => {
    setActiveFilters(prev => ({
      ...prev,
      topics: prev.topics?.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...(prev.topics || []), topic],
    }));
  };

  const handleParkedFilter = () => {
    setActiveFilters(prev => {
      const newParked = prev.parked === undefined ? true : prev.parked ? undefined : true;
      // If enabling parked, disable spark (mutually exclusive)
      return {
        ...prev,
        parked: newParked,
        spark: newParked === true ? undefined : prev.spark,
      };
    });
  };

  const handleSparkFilter = () => {
    setActiveFilters(prev => {
      const newSpark = prev.spark === undefined ? true : prev.spark ? undefined : true;
      // If enabling spark, disable parked (mutually exclusive)
      return {
        ...prev,
        spark: newSpark,
        parked: newSpark === true ? undefined : prev.parked,
      };
    });
  };

  const handleSetPotential = async (thoughtId: string, potential: PotentialType) => {
    await setPotential(thoughtId, potential);
    setExpandedActionDropdown(null);
  };

  const handleStartEdit = (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (thought) {
      setEditingThoughtId(thoughtId);
      setEditingText(thought.originalText);
    }
  };

  const handleSaveEdit = async (thoughtId: string) => {
    if (editingText.trim()) {
      await updateThought(thoughtId, { originalText: editingText.trim() });
    }
    setEditingThoughtId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingThoughtId(null);
    setEditingText('');
  };

  const handleToggleTodoComplete = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    
    const isCurrentlyCompleted = thought.todoData?.completed || false;
    const newCompleted = !isCurrentlyCompleted;
    
    // If marking as complete, show prompt to park or keep
    if (newCompleted && !isCurrentlyCompleted) {
      setCompletionPrompt(thoughtId);
    } else {
      // Unmarking as complete
      await updateTodoData(thoughtId, { 
        completed: false,
        completedAt: undefined,
      });
    }
  };

  const handleCompleteAndKeep = async (thoughtId: string) => {
    await updateTodoData(thoughtId, { 
      completed: true,
      completedAt: new Date(),
    });
    setCompletionPrompt(null);
  };

  const handleCompleteAndPark = async (thoughtId: string) => {
    await updateTodoData(thoughtId, { 
      completed: true,
      completedAt: new Date(),
    });
    await parkThought(thoughtId);
    setCompletionPrompt(null);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (expandedActionDropdown && !target.closest('.action-dropdown-container')) {
        setExpandedActionDropdown(null);
      }
      if (expandedFilterDropdown && !target.closest('.filter-dropdown-container')) {
        setExpandedFilterDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedActionDropdown, expandedFilterDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading thoughts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
      <Navigation
        currentView="thoughts"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search thoughts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border-2 border-slate-200 text-base focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 shadow-sm"
            />
          </div>

          {/* Filter Dropdowns - Compact */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Filter Dropdown */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={() => setExpandedFilterDropdown(expandedFilterDropdown === 'date' ? null : 'date')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  activeFilters.date && activeFilters.date !== 'All'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Date</span>
                {activeFilters.date && activeFilters.date !== 'All' && (
                  <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {activeFilters.date}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedFilterDropdown === 'date' ? 'rotate-180' : ''}`} />
              </button>
              {expandedFilterDropdown === 'date' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-20 min-w-[140px] overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    {(['All', 'Today', 'This Week', 'This Month'] as DateFilter[]).map(date => (
                      <button
                        key={date}
                        onClick={() => {
                          handleDateFilter(date);
                          setExpandedFilterDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors rounded-lg flex items-center gap-2 ${
                          activeFilters.date === date
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {date !== 'All' && <Calendar className="w-3 h-3" />}
                        {date}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Potential Filter Dropdown */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={() => setExpandedFilterDropdown(expandedFilterDropdown === 'potential' ? null : 'potential')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  activeFilters.potential && activeFilters.potential !== 'All'
                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Potential</span>
                {activeFilters.potential && activeFilters.potential !== 'All' && (
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                    {activeFilters.potential}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedFilterDropdown === 'potential' ? 'rotate-180' : ''}`} />
              </button>
              {expandedFilterDropdown === 'potential' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-20 min-w-[160px] overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    {(['All', 'Share', 'To-Do', 'Insight', 'Just a thought'] as PotentialFilter[]).map(potential => (
                      <button
                        key={potential}
                        onClick={() => {
                          handlePotentialFilter(potential);
                          setExpandedFilterDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors rounded-lg ${
                          activeFilters.potential === potential
                            ? 'bg-purple-50 text-purple-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {potential}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Topics Filter Dropdown */}
            {availableTopics.length > 0 && (
              <div className="relative filter-dropdown-container">
                <button
                  onClick={() => setExpandedFilterDropdown(expandedFilterDropdown === 'topics' ? null : 'topics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    activeFilters.topics && activeFilters.topics.length > 0
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Topics</span>
                  {activeFilters.topics && activeFilters.topics.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-slate-600 text-white text-xs rounded-full">
                      {activeFilters.topics.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedFilterDropdown === 'topics' ? 'rotate-180' : ''}`} />
                </button>
                {expandedFilterDropdown === 'topics' && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-20 min-w-[140px] max-w-[200px] max-h-[200px] overflow-y-auto">
                    <div className="p-1.5 space-y-0.5">
                      {availableTopics.map(topic => (
                        <button
                          key={topic}
                          onClick={() => {
                            handleTopicFilter(topic);
                            // Don't close dropdown to allow multiple selections
                          }}
                          className={`w-full px-3 py-2 text-left text-xs transition-colors rounded-lg flex items-center gap-2 ${
                            activeFilters.topics?.includes(topic)
                              ? 'bg-slate-50 text-slate-700'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${activeFilters.topics?.includes(topic) ? 'bg-slate-600' : 'border border-slate-300'}`} />
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spark Toggle */}
            <button
              onClick={handleSparkFilter}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                activeFilters.spark === true
                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spark</span>
            </button>

            {/* Parked Toggle */}
            <button
              onClick={handleParkedFilter}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                activeFilters.parked === true
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ParkingCircle className="w-3.5 h-3.5" />
              <span>Parked</span>
            </button>
          </div>

          {/* Active Filters as Pills */}
          {(activeFilters.potential || activeFilters.date || activeFilters.topics?.length || activeFilters.parked || activeFilters.spark) && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {activeFilters.potential && activeFilters.potential !== 'All' && (
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200 flex items-center gap-2">
                  {activeFilters.potential}
                  <X
                    className="w-4 h-4 cursor-pointer hover:text-purple-900"
                    onClick={() => handleRemoveFilter('potential')}
                  />
                </span>
              )}
              {activeFilters.date && activeFilters.date !== 'All' && (
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {activeFilters.date}
                  <X
                    className="w-4 h-4 cursor-pointer hover:text-blue-900"
                    onClick={() => handleRemoveFilter('date')}
                  />
                </span>
              )}
              {activeFilters.topics?.map(topic => (
                <span
                  key={topic}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 flex items-center gap-2"
                >
                  {topic}
                  <X
                    className="w-4 h-4 cursor-pointer hover:text-slate-900"
                    onClick={() => handleRemoveFilter('topic', topic)}
                  />
                </span>
              ))}
              {activeFilters.spark && (
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium border border-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Spark
                  <X
                    className="w-4 h-4 cursor-pointer hover:text-amber-900"
                    onClick={() => handleRemoveFilter('spark')}
                  />
                </span>
              )}
              {activeFilters.parked && (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 flex items-center gap-2">
                  Parked
                  <X
                    className="w-4 h-4 cursor-pointer hover:text-slate-900"
                    onClick={() => handleRemoveFilter('parked')}
                  />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thoughts Grid */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">
              {searchQuery || Object.keys(activeFilters).length > 0
                ? 'No thoughts match your filters.'
                : 'No thoughts yet. Capture your first thought!'}
            </p>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Capture a Thought
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {filteredThoughts.map((thought) => {
              const currentPotential = thought.potential || thought.bestPotential;
              const isTodo = currentPotential === 'To-Do';
              const isCompleted = thought.todoData?.completed || false;
              
              const potentialConfig = {
                'Share': { label: 'Share', color: 'purple', icon: '💬' },
                'To-Do': { label: 'To-Do', color: 'emerald', icon: '✓' },
                'Insight': { label: 'Insight', color: 'orange', icon: '💭' },
                'Just a thought': { label: 'Just a thought', color: 'slate', icon: '💭' },
              };

              // Available potentials - all thoughts can select any potential
              const availablePotentials: PotentialType[] = ['Share', 'To-Do', 'Insight', 'Just a thought'];

              return (
                <div
                  key={thought.id}
                  className={`bg-white rounded-xl border-2 border-dashed border-slate-200/50 p-4 shadow-sm relative flex flex-col ${
                    thought.isParked ? 'opacity-60' : ''
                  }`}
                >
                  {/* Spark Icon - Top Right */}
                  {thought.isSpark && (
                    <div className="absolute top-2 right-2 z-10">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                  )}

                  {/* Thought Text */}
                  <div className="flex items-start gap-2 mb-3 pr-7 flex-1">
                    {/* To-Do Completion Icon (if To-Do) - Next to text */}
                    {isTodo && (
                      <button
                        onClick={() => handleToggleTodoComplete(thought.id)}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${
                          isCompleted
                            ? 'text-emerald-600 hover:text-emerald-700'
                            : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    {editingThoughtId === thought.id ? (
                      <div className="flex-1 flex flex-col gap-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleSaveEdit(thought.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className={`text-slate-800 text-sm leading-relaxed flex-1 w-full p-2 border-2 border-dashed border-slate-300 rounded-lg resize-none focus:outline-none focus:border-purple-400 ${isCompleted ? 'line-through text-slate-500' : ''}`}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(thought.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <span className="text-xs text-slate-500 ml-auto">⌘+Enter to save</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 group relative">
                        <p className={`text-slate-800 text-sm leading-relaxed flex-1 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {thought.originalText}
                        </p>
                        <button
                          onClick={() => handleStartEdit(thought.id)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50"
                          title="Edit thought"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Simple CTA Row - Show for all thoughts with potential or spark */}
                  {(currentPotential || thought.isSpark) && (
                    <div className="mt-auto pt-3 border-t border-slate-200/50 flex items-center justify-between gap-2 flex-wrap">
                      {/* Left: Spark and Park */}
                      <div className="flex items-center gap-2">
                        {/* Add Spark button - show if not already a spark */}
                        {!thought.isSpark && (
                          <button
                            onClick={() => addSpark(thought.id)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-dashed border-amber-300/60 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                            title="Add spark"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Spark</span>
                          </button>
                        )}
                        {/* Park/Unpark button - show if spark exists */}
                        {thought.isSpark && (
                          <>
                            {thought.isParked ? (
                              <button
                                onClick={() => unparkThought(thought.id)}
                                className="px-2 py-1 bg-slate-100/70 text-slate-700 rounded-lg text-xs font-medium border border-dashed border-slate-300/60 hover:bg-slate-200/70 transition-colors flex items-center gap-1.5"
                              >
                                <ParkingCircle className="w-3.5 h-3.5" />
                                <span>Unpark</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => parkThought(thought.id)}
                                className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-dashed border-slate-300/50 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                              >
                                <ParkingCircle className="w-3.5 h-3.5" />
                                <span>Park</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right: Potential Dropdown - Only show if potential exists */}
                      {currentPotential && (
                        <div className="relative action-dropdown-container ml-auto">
                          <button
                            onClick={() => setExpandedActionDropdown(expandedActionDropdown === thought.id ? null : thought.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-1 ${
                              potentialConfig[currentPotential]?.color === 'purple' ? 'bg-purple-100/70 text-purple-700 border-purple-300/60 hover:bg-purple-200/70' :
                              potentialConfig[currentPotential]?.color === 'emerald' ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300/60 hover:bg-emerald-200/70' :
                              potentialConfig[currentPotential]?.color === 'orange' ? 'bg-orange-100/70 text-orange-700 border-orange-300/60 hover:bg-orange-200/70' :
                              'bg-slate-100/70 text-slate-700 border-slate-300/60 hover:bg-slate-200/70'
                            }`}
                          >
                            <span>{potentialConfig[currentPotential]?.icon}</span>
                            <span>{potentialConfig[currentPotential]?.label}</span>
                            {thought.bestPotential === currentPotential && !thought.potential && (
                              <span className="text-xs opacity-60">(AI)</span>
                            )}
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === thought.id ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {expandedActionDropdown === thought.id && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border-2 border-dashed border-slate-300/60 shadow-xl z-20 min-w-[140px] overflow-hidden">
                              <div className="p-1.5 space-y-0.5">
                                {availablePotentials.filter(p => p !== currentPotential).map((potential) => {
                                  const config = potentialConfig[potential];
                                  const hoverClass = config.color === 'purple' ? 'hover:bg-purple-50' : 
                                                    config.color === 'emerald' ? 'hover:bg-emerald-50' : 
                                                    config.color === 'orange' ? 'hover:bg-orange-50' :
                                                    'hover:bg-slate-50';
                                  const textClass = config.color === 'purple' ? 'text-purple-700' : 
                                                  config.color === 'emerald' ? 'text-emerald-700' : 
                                                  config.color === 'orange' ? 'text-orange-700' :
                                                  'text-slate-700';
                                  return (
                                    <button
                                      key={potential}
                                      onClick={() => handleSetPotential(thought.id, potential)}
                                      className={`w-full px-3 py-2 text-left text-xs ${hoverClass} transition-colors rounded-lg flex items-center gap-2 ${textClass} cursor-pointer`}
                                    >
                                      <span>{config.icon}</span>
                                      <span>{config.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* CTAs for new thoughts - Show potential picker and spark button */}
                  {!currentPotential && (
                    <div className="mt-auto pt-3 border-t border-slate-200/50 flex items-center justify-between gap-2 flex-wrap">
                      {/* Left: Spark button if not spark */}
                      {!thought.isSpark && (
                        <button
                          onClick={() => addSpark(thought.id)}
                          className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-dashed border-amber-300/60 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                          title="Add spark to make this thought shareable"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Spark</span>
                        </button>
                      )}

                      {/* Right: Potential picker - "+ Add" button */}
                      <div className="relative action-dropdown-container ml-auto">
                        <button
                          onClick={() => setExpandedActionDropdown(expandedActionDropdown === thought.id ? null : thought.id)}
                          className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-dashed border-purple-300/60 hover:bg-purple-100 transition-colors flex items-center gap-1"
                        >
                          <span>+ Add</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === thought.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedActionDropdown === thought.id && (
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border-2 border-dashed border-purple-300/60 shadow-xl z-20 min-w-[140px] overflow-hidden">
                            <div className="p-1.5 space-y-0.5">
                              {availablePotentials.map((potential) => {
                                const config = potentialConfig[potential];
                                const hoverClass = config.color === 'purple' ? 'hover:bg-purple-50' : 
                                                  config.color === 'emerald' ? 'hover:bg-emerald-50' : 
                                                  config.color === 'orange' ? 'hover:bg-orange-50' :
                                                  'hover:bg-slate-50';
                                const textClass = config.color === 'purple' ? 'text-purple-700' : 
                                                config.color === 'emerald' ? 'text-emerald-700' : 
                                                config.color === 'orange' ? 'text-orange-700' :
                                                'text-slate-700';
                                return (
                                  <button
                                    key={potential}
                                    onClick={() => handleSetPotential(thought.id, potential)}
                                    className={`w-full px-3 py-2 text-left text-xs ${hoverClass} transition-colors rounded-lg flex items-center gap-2 ${textClass} cursor-pointer`}
                                  >
                                    <span>{config.icon}</span>
                                    <span>{config.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Prompt Modal */}
      {completionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border-2 border-dashed border-slate-300/60 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Mark as Complete</h3>
            <p className="text-sm text-slate-600 mb-6">
              What would you like to do with this completed to-do?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCompleteAndKeep(completionPrompt)}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Keep Visible
              </button>
              <button
                onClick={() => handleCompleteAndPark(completionPrompt)}
                className="flex-1 px-4 py-2.5 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
              >
                Park It
              </button>
              <button
                onClick={() => setCompletionPrompt(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThoughtsView;
