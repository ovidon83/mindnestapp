import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought, PotentialType } from '../types';
import { Sparkles, Search, Calendar, X, ParkingCircle, ChevronDown, CheckCircle2, Circle, Edit2, Save, ArrowRight, RotateCcw, RefreshCw, Target, Briefcase, Lightbulb, Share2 } from 'lucide-react';
import Navigation from './Navigation';
import { ExploreRecommendation } from '../lib/generate-explore-recommendations';
import { calculatePowerfulScore } from '../lib/calculate-powerful-score';

type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month' | Date; // Date for custom date selection

const ThoughtsView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    currentView,
    setCurrentView,
    updateThought,
    addSpark,
    removeSpark,
    setPotential,
    parkThought,
    unparkThought,
    updateTodoData,
    loadThoughts,
  } = useGenieNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    date?: DateFilter;
  }>({});
  const [expandedActionDropdown, setExpandedActionDropdown] = useState<string | null>(null); // Format: 'review-{id}' or 'regular-{id}'
  const [expandedFilterDropdown, setExpandedFilterDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'potential'>('latest');
  const [customDate, setCustomDate] = useState<string>('');
  const [completionPrompt, setCompletionPrompt] = useState<string | null>(null);
  const [editingThoughtId, setEditingThoughtId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [parkedThoughtId, setParkedThoughtId] = useState<string | null>(null);
  // Persist review dismissed state in localStorage
  const [reviewDismissed, setReviewDismissed] = useState(() => {
    const stored = localStorage.getItem('thouty-review-dismissed');
    return stored === 'true';
  });
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get recommendations from stored data (no API calls needed!)
  // Convert old types to new types: Learning, Insight, Reflection, Project -> Worth Sharing (if good) or nothing
  const getRecommendations = (thought: Thought): ExploreRecommendation[] => {
    // Use stored recommendations if available
    if (thought.exploreRecommendations && Array.isArray(thought.exploreRecommendations) && thought.exploreRecommendations.length > 0) {
      const recommendations = thought.exploreRecommendations as ExploreRecommendation[];
      // Convert old types to new types
      const converted = recommendations.map(rec => {
        const oldTypes = ['Reflection', 'Learning', 'Insight', 'Project'];
        if (oldTypes.includes(rec.type)) {
          // Only convert to "Worth Sharing" if confidence is high enough (>= 60)
          if (rec.confidence >= 60) {
            return {
              ...rec,
              type: 'Worth Sharing',
            };
          } else {
            // Return null to filter out
            return null;
          }
        }
        // Remove "Other" type
        if (rec.type === 'Other') {
          return null;
        }
        // Keep valid types: Worth Sharing, Action Item, Business Idea
        if (['Worth Sharing', 'Action Item', 'Business Idea'].includes(rec.type)) {
          return rec;
        }
        // Filter out any other unknown types
        return null;
      }).filter((rec): rec is ExploreRecommendation => rec !== null);
      
      // Return only the first recommendation (max 1)
      return converted.slice(0, 1);
    }
    return [];
  };

  // Save review dismissed state to localStorage
  const handleDismissReview = () => {
    setReviewDismissed(true);
    localStorage.setItem('thouty-review-dismissed', 'true');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedActionDropdown) {
        const target = event.target as Element;
        
        // Check if click is inside any dropdown menu (Review or regular)
        const isInsideDropdown = target.closest('.review-dropdown-menu') ||
                                 target.closest('.action-dropdown-container') ||
                                 target.closest('.review-dropdown-wrapper');
        
        if (!isInsideDropdown) {
          setExpandedActionDropdown(null);
        }
      }
    };

    if (expandedActionDropdown) {
      // Use a delay to allow button clicks to fire first
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 150);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [expandedActionDropdown]);


  // Get recent thoughts for Review section
  const recentThoughtsForReview = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return thoughts
      .filter(t => !t.isParked && new Date(t.createdAt) >= todayStart)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [thoughts]);

  // Filter thoughts
  const filteredThoughts = useMemo(() => {
    let filtered = thoughts;

    // View mode filter: All vs Review
    if (viewMode === 'review') {
      filtered = filtered.filter(thought => {
        // Must have a recommendation pill (Worth Sharing or Action Item)
        const recommendations = getRecommendations(thought);
        const hasRecommendation = recommendations.length > 0 && 
          (recommendations[0].type === 'Worth Sharing' || recommendations[0].type === 'Action Item');
        
        if (!hasRecommendation) return false;
        
        // Must NOT be in Share
        const potential = thought.potential || thought.bestPotential;
        if (potential === 'Share') return false;
        
        // Must NOT be in Do
        if (potential === 'Do') return false;
        
        // Must NOT be Parked
        if (thought.isParked) return false;
        
        return true;
      });
    }

    // Search filter - search in original text, summary, and tags (including parked)
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
      filtered = filtered.filter(thought => {
        const thoughtDate = new Date(thought.createdAt);
        const filterDate = activeFilters.date;
        
        if (filterDate === undefined || filterDate === 'All') {
          return true;
        }
        
        if (filterDate instanceof Date) {
          // Custom date selection
          const filterDateStart = new Date(filterDate);
          filterDateStart.setHours(0, 0, 0, 0);
          const filterDateEnd = new Date(filterDate);
          filterDateEnd.setHours(23, 59, 59, 999);
          return thoughtDate >= filterDateStart && thoughtDate <= filterDateEnd;
        }
        
        switch (filterDate) {
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

    // Hide parked thoughts from main view (unless searching or in review mode)
    if (!searchQuery.trim() && viewMode === 'all') {
      filtered = filtered.filter(thought => !thought.isParked);
    }

    // Sort thoughts (default to latest for both modes)
    const sorted = [...filtered];
    if (sortBy === 'potential') {
      // Sort by powerful score (highest first), then by recency
      return sorted.sort((a, b) => {
        const scoreA = calculatePowerfulScore(a, thoughts) || 0;
        const scoreB = calculatePowerfulScore(b, thoughts) || 0;
        if (Math.abs(scoreA - scoreB) > 10) {
          return scoreB - scoreA; // Sort by score if difference is significant
        }
        // Otherwise sort by recency
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Sort by latest (most recent first)
      return sorted.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  }, [thoughts, searchQuery, activeFilters, sortBy, viewMode]);

  const handleDateFilter = (date: DateFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      date: prev.date === date ? undefined : date,
    }));
    // Clear custom date if selecting a preset
    if (date !== 'All' && !(date instanceof Date)) {
      setCustomDate('');
    }
  };

  const handleCustomDateSelect = (dateString: string) => {
    if (dateString) {
      const selectedDate = new Date(dateString);
      setActiveFilters(prev => ({
        ...prev,
        date: selectedDate,
      }));
      setCustomDate(dateString);
    } else {
      setActiveFilters(prev => ({
        ...prev,
        date: 'All',
      }));
      setCustomDate('');
    }
    setExpandedFilterDropdown(null);
  };


  const handleSetPotential = async (thoughtId: string, potential: PotentialType) => {
    try {
      await setPotential(thoughtId, potential);
      setExpandedActionDropdown(null);
      // The store update will trigger a re-render automatically
      // Don't reload - just update the thought in place
    } catch (error) {
      console.error('[handleSetPotential] Error setting potential:', error);
      // On error, reload to get the correct state
      await loadThoughts();
    }
  };

  const getPotentialConfig = (potential: PotentialType | null | undefined) => {
    switch (potential) {
      case 'Share': return { label: 'Share', color: 'purple', icon: '💬' };
      case 'Do': return { label: 'Do', color: 'emerald', icon: '✓' };
      case 'Just a thought': return { label: 'Just a thought', color: 'slate', icon: '💭' };
      default: return { label: 'Select action...', color: 'slate', icon: '' };
    }
  };

  const getRecommendationConfig = (rec: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
      'Worth Sharing': {
        icon: <Sparkles className="w-3 h-3" />,
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
      },
      'Action Item': {
        icon: <Target className="w-3 h-3" />,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
      },
      'Business Idea': {
        icon: <Briefcase className="w-3 h-3" />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      },
    };
    return configs[rec] || {
      icon: <Lightbulb className="w-3 h-3" />,
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    };
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

  const handleParkThought = async (thoughtId: string) => {
    await parkThought(thoughtId);
    setParkedThoughtId(thoughtId);
    // Show feedback that thought was parked
    setTimeout(() => {
      setParkedThoughtId(null);
    }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-white">
      <Navigation
        currentView={currentView === 'thoughts' || currentView === 'home' ? 'thoughts' : currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar - Always at top */}
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

          {/* Filters and View Mode Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle: All | Review */}
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('review')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'review'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Review
              </button>
            </div>

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
                        key={String(date)}
                        onClick={() => {
                          handleDateFilter(date as DateFilter);
                          setExpandedFilterDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors rounded-lg flex items-center gap-2 ${
                          (activeFilters.date === date || (date === 'All' && !activeFilters.date)) && !(activeFilters.date instanceof Date)
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {date !== 'All' && <Calendar className="w-3 h-3" />}
                        {String(date)}
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
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Active Filters as Pills */}
          {activeFilters.date && activeFilters.date !== 'All' && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <button
                onClick={() => {
                  handleDateFilter('All');
                  setCustomDate('');
                }}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3 h-3" />
                <span>Date: {activeFilters.date instanceof Date 
                  ? activeFilters.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : activeFilters.date}</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Review Section */}
        {!reviewDismissed && recentThoughtsForReview.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-orange-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-slate-900">To Review</h2>
              </div>
              <button
                onClick={handleDismissReview}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors"
                title="Dismiss review"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentThoughtsForReview.map((thought) => {
                const currentPotential = thought.potential || thought.bestPotential;
                const isTodo = currentPotential === 'Do';
                const isCompleted = thought.todoData?.completed || false;
                
                const potentialConfig = {
                  'Share': { label: 'Share', color: 'purple', icon: '💬' },
                  'Do': { label: 'Do', color: 'emerald', icon: '✓' },
                  'Just a thought': { label: 'Just a thought', color: 'slate', icon: '💭' },
                };

                const availablePotentials: PotentialType[] = ['Share', 'Do', 'Just a thought'];

                const recommendations = getRecommendations(thought);

                return (
                  <div
                    key={thought.id}
                    data-thought-id={thought.id}
                    className="bg-white rounded-xl border-2 border-dashed border-amber-200/50 p-4 shadow-sm relative flex flex-col hover:shadow-md transition-shadow"
                  >
                    {/* Recommendation Pill - On the border line (starting from right) - Max 1 */}
                    {/* Show only for thoughts in To Review section */}
                    {recommendations.length > 0 && (
                      <div className="absolute -top-3 right-4 z-10">
                        {(() => {
                          const rec = recommendations[0]; // Only show the first (and only) recommendation
                          const config = getRecommendationConfig(rec.type);
                          return (
                            <div
                              className={`px-2.5 py-1 rounded-lg border-2 border-dashed ${config.borderColor} ${config.bgColor} ${config.color} text-xs font-medium flex items-center gap-1.5 bg-white shadow-sm`}
                            >
                              {config.icon}
                              <span>{rec.type}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Thought Text */}
                    <div className={`flex items-start gap-2 mb-3 flex-1 group relative w-full ${recommendations.length > 0 ? 'mt-2' : ''}`}>
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
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <div className="flex-1 relative min-w-0 w-full">
                        <p className={`text-slate-800 text-sm leading-relaxed pr-8 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {thought.originalText}
                        </p>
                        <button
                          onClick={() => handleStartEdit(thought.id)}
                          className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit thought"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* CTA Row */}
                    <div className="mt-auto pt-3 border-t border-amber-200/50 flex items-center justify-between gap-2 flex-wrap">
                      {/* Left: Date */}
                      <div className="flex items-center">
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(thought.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: new Date(thought.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </span>
                      </div>
                      {/* Right: Dropdown + Park Button */}
                      <div className="flex items-center justify-end gap-2">
                        <div 
                          className="relative review-dropdown-wrapper" 
                          ref={(el) => {
                            if (el) {
                              dropdownRefs.current.set(`review-${thought.id}`, el);
                            } else {
                              dropdownRefs.current.delete(`review-${thought.id}`);
                            }
                          }}
                        >
                          <button
                            onClick={(e) => {
                              if (thought.isParked) return; // Disable when parked
                              e.stopPropagation();
                              e.preventDefault();
                              const dropdownKey = `review-${thought.id}`;
                              if (expandedActionDropdown !== dropdownKey) {
                                setExpandedActionDropdown(dropdownKey);
                              } else {
                                setExpandedActionDropdown(null);
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={thought.isParked}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-1 ${
                              thought.isParked 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' :
                                currentPotential && potentialConfig[currentPotential]?.color === 'purple' ? 'bg-purple-100/70 text-purple-700 border-purple-300/60 hover:bg-purple-200/70' :
                                currentPotential && potentialConfig[currentPotential]?.color === 'emerald' ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300/60 hover:bg-emerald-200/70' :
                                'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            }`}
                            type="button"
                            title={thought.isParked ? 'Dropdown disabled for parked thoughts' : 'Select potential'}
                          >
                            {currentPotential && (
                              <>
                                <span>{potentialConfig[currentPotential]?.label}</span>
                                {thought.bestPotential === currentPotential && !thought.potential && (
                                  <span className="text-xs opacity-60">(AI)</span>
                                )}
                              </>
                            )}
                            {!currentPotential && (
                              <span>Select action...</span>
                            )}
                            {!thought.isParked && (
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === `review-${thought.id}` ? 'rotate-180' : ''}`} />
                            )}
                          </button>
                          {expandedActionDropdown === `review-${thought.id}` && !thought.isParked && (
                            <div 
                              className="absolute right-0 top-full mt-2 bg-white rounded-lg border border-purple-200 shadow-lg z-50 min-w-[140px] overflow-hidden review-dropdown-menu"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="p-1.5 space-y-0.5">
                                {availablePotentials.map((potential) => {
                                  const config = potentialConfig[potential];
                                  const hoverClass = config.color === 'purple' ? 'hover:bg-purple-50' : 
                                                    config.color === 'emerald' ? 'hover:bg-emerald-50' :
                                                    'hover:bg-slate-50';
                                  const textClass = config.color === 'purple' ? 'text-purple-700' : 
                                                  config.color === 'emerald' ? 'text-emerald-700' :
                                                  'text-slate-700';
                                  const isSelected = currentPotential !== null && currentPotential !== undefined && currentPotential === potential;
                                  const isAISuggestion = thought.bestPotential === potential && !thought.potential;
                                  return (
                                    <button
                                      key={potential}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        await handleSetPotential(thought.id, potential);
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors ${
                                        isSelected 
                                          ? 'bg-slate-100 text-slate-700 cursor-default' 
                                          : `${hoverClass} ${textClass} cursor-pointer`
                                      }`}
                                      type="button"
                                      disabled={isSelected}
                                    >
                                      <span>{config.label}</span>
                                      {isAISuggestion && (
                                        <span className="text-xs opacity-60 ml-auto">(AI)</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Park/Parked Toggle Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (thought.isParked) {
                              // Unpark: set potential to "Just a thought" and unpark
                              await setPotential(thought.id, 'Just a thought');
                              await unparkThought(thought.id);
                            } else {
                              // Park: just park it
                              await parkThought(thought.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg border border-dashed transition-colors flex items-center justify-center ${
                            thought.isParked
                              ? 'bg-amber-50 text-amber-700 border-amber-300/60 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-500 border-slate-300/60 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title={thought.isParked ? 'Click to revive (unpark) this thought' : 'Click to park this thought'}
                          type="button"
                        >
                          {thought.isParked ? (
                            <RefreshCw className="w-3.5 h-3.5" />
                          ) : (
                            <ParkingCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {filteredThoughts.map((thought) => {
              const currentPotential = thought.potential || thought.bestPotential;
              const isTodo = currentPotential === 'Do';
              const isCompleted = thought.todoData?.completed || false;
              
              const potentialConfig = {
                'Share': { label: 'Share', color: 'purple', icon: '💬' },
                'Do': { label: 'Do', color: 'emerald', icon: '✓' },
                'Just a thought': { label: 'Just a thought', color: 'slate', icon: '💭' },
              };

              // Available potentials - all thoughts can select any potential
              const availablePotentials: PotentialType[] = ['Share', 'Do', 'Just a thought'];
              const recommendations = getRecommendations(thought);

              return (
                <div
                  key={thought.id}
                  data-thought-id={thought.id}
                  className="bg-white rounded-xl border-2 border-dashed border-slate-200/50 p-4 shadow-sm relative flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Recommendation Pill - On the border line (starting from right) - Max 1 */}
                  {/* Show only for "Just a thought" thoughts */}
                  {recommendations.length > 0 && currentPotential === 'Just a thought' && (
                    <div className="absolute -top-3 right-4 z-10">
                      {(() => {
                        const rec = recommendations[0]; // Only show the first (and only) recommendation
                        const config = getRecommendationConfig(rec.type);
                        return (
                          <div
                            className={`px-2.5 py-1 rounded-lg border-2 border-dashed ${config.borderColor} ${config.bgColor} ${config.color} text-xs font-medium flex items-center gap-1.5 bg-white shadow-sm`}
                          >
                            {config.icon}
                            <span>{rec.type}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Share Journey Indicator - Badge at top */}
                  {currentPotential === 'Share' && !thought.isParked && (
                    <div className="absolute -top-3 left-4 z-10">
                      <div className="px-2.5 py-1 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-purple-700 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                        <Share2 className="w-3 h-3" />
                        <span>In Share Journey</span>
                      </div>
                    </div>
                  )}

                  {/* Thought Text */}
                  <div className={`flex items-start gap-2 mb-3 flex-1 group relative w-full ${(recommendations.length > 0 && currentPotential === 'Just a thought') || currentPotential === 'Share' ? 'mt-2' : ''}`}>
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
                      <div className="flex-1 relative group min-w-0">
                        <p className={`text-slate-800 text-sm leading-relaxed pr-8 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {thought.originalText}
                        </p>
                        <button
                          onClick={() => handleStartEdit(thought.id)}
                          className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit thought"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Simple CTA Row - Always show */}
                  <div className="mt-auto pt-3 border-t border-slate-200/50 flex items-center justify-between gap-2 flex-wrap">
                      {/* Left: Date */}
                      <div className="flex items-center">
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(thought.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: new Date(thought.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </span>
                      </div>

                      {/* Right: Park + Potential Dropdown + Navigation */}
                      {currentPotential && (
                        <div className="flex items-center gap-2 ml-auto">
                          {/* Park/Parked Toggle Button - Moved to left */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (thought.isParked) {
                                // Revive: unpark and set to Just a thought
                                await setPotential(thought.id, 'Just a thought');
                                await unparkThought(thought.id);
                              } else {
                                // Park: just park it
                                await parkThought(thought.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg border border-dashed transition-colors flex items-center justify-center ${
                              thought.isParked
                                ? 'bg-amber-50 text-amber-700 border-amber-300/60 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-500 border-slate-300/60 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                            title={thought.isParked ? 'Click to revive (unpark) this thought' : 'Click to park this thought'}
                            type="button"
                          >
                            {thought.isParked ? (
                              <RefreshCw className="w-3.5 h-3.5" />
                            ) : (
                              <ParkingCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          <div 
                            className="relative action-dropdown-container"
                            ref={(el) => {
                              if (el) {
                                dropdownRefs.current.set(`regular-${thought.id}`, el);
                              } else {
                                dropdownRefs.current.delete(`regular-${thought.id}`);
                              }
                            }}
                          >
                            <button
                              onClick={(e) => {
                                if (thought.isParked) return; // Disable when parked
                                e.stopPropagation();
                                e.preventDefault();
                                const dropdownKey = `regular-${thought.id}`;
                                // Close any other open dropdowns first
                                if (expandedActionDropdown !== dropdownKey) {
                                  setExpandedActionDropdown(dropdownKey);
                                } else {
                                  setExpandedActionDropdown(null);
                                }
                              }}
                              disabled={thought.isParked}
                              className={`px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-1 ${
                                thought.isParked
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' :
                                  currentPotential && potentialConfig[currentPotential]?.color === 'purple' ? 'bg-purple-100/70 text-purple-700 border-purple-300/60 hover:bg-purple-200/70' :
                                  currentPotential && potentialConfig[currentPotential]?.color === 'emerald' ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300/60 hover:bg-emerald-200/70' :
                                  'bg-slate-100/70 text-slate-700 border-slate-300/60 hover:bg-slate-200/70'
                              }`}
                              type="button"
                              title={thought.isParked ? 'Dropdown disabled for parked thoughts' : 'Select potential'}
                            >
                              {currentPotential && (
                                <>
                                  <span>{potentialConfig[currentPotential]?.label}</span>
                                  {thought.bestPotential === currentPotential && !thought.potential && (
                                    <span className="text-xs opacity-60">(AI)</span>
                                  )}
                                </>
                              )}
                              {!currentPotential && thought.isSpark && (
                                <>
                                  <span>Select Potential</span>
                                </>
                              )}
                              {!thought.isParked && (
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === `regular-${thought.id}` ? 'rotate-180' : ''}`} />
                              )}
                            </button>
                            
                            {expandedActionDropdown === `regular-${thought.id}` && !thought.isParked && (
                              <div 
                                className="absolute right-0 top-full mt-2 bg-white rounded-xl border-2 border-dashed border-slate-300/60 shadow-xl z-50 min-w-[140px] overflow-hidden"
                                ref={(el) => {
                                  if (el && expandedActionDropdown === `regular-${thought.id}`) {
                                    // Scroll into view when dropdown opens
                                    setTimeout(() => {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    }, 0);
                                  }
                                }}
                              >
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
                                    const isSelected = currentPotential !== null && currentPotential !== undefined && currentPotential === potential;
                                    return (
                                      <button
                                        key={potential}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleSetPotential(thought.id, potential);
                                          setExpandedActionDropdown(null);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors ${
                                          isSelected 
                                            ? 'bg-slate-100 text-slate-700 cursor-default' 
                                            : `${hoverClass} ${textClass} cursor-pointer`
                                        }`}
                                        type="button"
                                        disabled={isSelected}
                                      >
                                        <span>{config.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Navigation button for Share/Do */}
                          {(currentPotential === 'Share' || currentPotential === 'Do') && !thought.isParked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const targetView = currentPotential === 'Share' ? 'shareit' : 'todo';
                                // Push current state first, then navigate
                                window.history.pushState({ view: 'thoughts' }, '', '#thoughts');
                                window.history.pushState({ view: targetView, thoughtId: thought.id }, '', `#${targetView}`);
                                setCurrentView(targetView, thought.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg border border-dashed transition-colors flex items-center gap-1.5 ${
                                currentPotential === 'Share'
                                  ? 'bg-purple-100/70 text-purple-700 border-purple-300/60 hover:bg-purple-200/70'
                                  : 'bg-emerald-100/70 text-emerald-700 border-emerald-300/60 hover:bg-emerald-200/70'
                              }`}
                              title={`Open in ${currentPotential === 'Share' ? 'Share' : 'Do'} view`}
                              type="button"
                            >
                              <span className="text-xs font-medium">{currentPotential === 'Share' ? 'View in Share' : 'View in Do'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  
                  {/* CTAs for new thoughts - Show potential picker */}
                  {!currentPotential && (
                    <div className="mt-auto pt-3 border-t border-slate-200/50 flex items-center justify-end gap-2 flex-wrap">
                      {/* Potential picker - "+ Add" button */}
                      <div 
                        className="relative action-dropdown-container"
                        ref={(el) => {
                          if (el) {
                            dropdownRefs.current.set(`regular-${thought.id}`, el);
                          } else {
                            dropdownRefs.current.delete(`regular-${thought.id}`);
                          }
                        }}
                      >
                        <button
                          onClick={() => {
                            if (thought.isParked) return; // Disable when parked
                            const dropdownKey = `regular-${thought.id}`;
                            setExpandedActionDropdown(expandedActionDropdown === dropdownKey ? null : dropdownKey);
                          }}
                          disabled={thought.isParked}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-1 ${
                            thought.isParked
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              : 'bg-purple-50 text-purple-700 border-purple-300/60 hover:bg-purple-100'
                          }`}
                          title={thought.isParked ? 'Dropdown disabled for parked thoughts' : 'Add potential'}
                        >
                          <span>+ Add</span>
                          {!thought.isParked && (
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === `regular-${thought.id}` ? 'rotate-180' : ''}`} />
                          )}
                        </button>
                        
                        {expandedActionDropdown === `regular-${thought.id}` && !thought.isParked && (
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border-2 border-dashed border-purple-300/60 shadow-xl z-20 min-w-[140px] overflow-hidden">
                            <div className="p-1.5 space-y-0.5">
                              {availablePotentials.map((potential) => {
                                const config = potentialConfig[potential];
                                const hoverClass = config.color === 'purple' ? 'hover:bg-purple-50' : 
                                                  config.color === 'emerald' ? 'hover:bg-emerald-50' :
                                                  'hover:bg-slate-50';
                                const textClass = config.color === 'purple' ? 'text-purple-700' : 
                                                config.color === 'emerald' ? 'text-emerald-700' :
                                                'text-slate-700';
                                const isSelected = currentPotential !== null && currentPotential !== undefined && currentPotential === potential;
                                return (
                                  <button
                                    key={potential}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleSetPotential(thought.id, potential);
                                      setExpandedActionDropdown(null);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors ${
                                      isSelected 
                                        ? 'bg-slate-100 text-slate-700 cursor-default' 
                                        : `${hoverClass} ${textClass} cursor-pointer`
                                    }`}
                                    type="button"
                                    disabled={isSelected}
                                  >
                                    <span>{config.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Park/Parked Toggle Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (thought.isParked) {
                            // Unpark: set potential to "Just a thought" and unpark
                            await setPotential(thought.id, 'Just a thought');
                            await unparkThought(thought.id);
                          } else {
                            // Park: just park it
                            await parkThought(thought.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg border border-dashed transition-colors flex items-center justify-center ${
                          thought.isParked
                            ? 'bg-amber-50 text-amber-700 border-amber-300/60 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-500 border-slate-300/60 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title={thought.isParked ? 'Click to revive (unpark) this thought' : 'Click to park this thought'}
                        type="button"
                      >
                        {thought.isParked ? (
                          <RefreshCw className="w-3.5 h-3.5" />
                        ) : (
                          <ParkingCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
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
