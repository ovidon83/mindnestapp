import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought, PotentialType } from '../types';
import { Compass, Sparkles, Search, Calendar, X, ParkingCircle, ChevronDown, Edit2, Save, ArrowRight, RotateCcw, RefreshCw, Lightbulb, TrendingUp, Zap, CheckCircle2, Circle, Briefcase, Target, BookOpen } from 'lucide-react';
import Navigation from './Navigation';
import { calculatePowerfulScore } from '../lib/calculate-powerful-score';
import { ExploreRecommendation } from '../lib/generate-explore-recommendations';

const ExploreView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    updateThought,
    setPotential,
    parkThought,
    unparkThought,
    updateTodoData,
    backfillRecommendations,
  } = useGenieNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedActionDropdown, setExpandedActionDropdown] = useState<string | null>(null);
  const [editingThoughtId, setEditingThoughtId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ current: number; total: number } | null>(null);
  const [sortBy, setSortBy] = useState<'potential' | 'latest'>('potential');

  // Calculate powerful scores for all thoughts
  const thoughtsWithScores = useMemo(() => {
    return thoughts.map(thought => ({
      ...thought,
      powerfulScore: calculatePowerfulScore(thought, thoughts),
    }));
  }, [thoughts]);

  // Filter for Explore: powerful thoughts, parked thoughts, or "Just a thought" with high potential
  const exploreThoughts = useMemo(() => {
    return thoughtsWithScores.filter(thought => {
      const potential = thought.potential || thought.bestPotential;
      const isJustAThought = potential === 'Just a thought';
      const isParked = thought.isParked;
      const hasHighScore = (thought.powerfulScore || 0) >= 50; // Threshold for "powerful"
      
      // Include if:
      // 1. Parked thoughts (can be revived)
      // 2. "Just a thought" with high powerful score
      // 3. Any thought with high powerful score that's not already Share or Do
      return (isParked || (isJustAThought && hasHighScore) || (hasHighScore && potential !== 'Share' && potential !== 'Do'));
    });
  }, [thoughtsWithScores]);

  // Sort by potential (powerful score) or latest
  const sortedExploreThoughts = useMemo(() => {
    const sorted = [...exploreThoughts];
    if (sortBy === 'potential') {
      // Sort by powerful score (highest first), then by recency
      return sorted.sort((a, b) => {
        const scoreA = a.powerfulScore || 0;
        const scoreB = b.powerfulScore || 0;
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
  }, [exploreThoughts, sortBy]);

  // Filter by search
  const filteredThoughts = useMemo(() => {
    if (!searchQuery.trim()) return sortedExploreThoughts;
    
    const query = searchQuery.toLowerCase();
    return sortedExploreThoughts.filter(thought =>
      thought.originalText.toLowerCase().includes(query) ||
      thought.summary.toLowerCase().includes(query) ||
      thought.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [sortedExploreThoughts, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedActionDropdown) {
        const target = event.target as Element;
        const isInsideDropdown = target.closest('.action-dropdown-container') ||
                                 target.closest('.action-dropdown-menu');
        if (!isInsideDropdown) {
          setExpandedActionDropdown(null);
        }
      }
    };

    if (expandedActionDropdown) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 150);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [expandedActionDropdown]);

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

  const handleSetPotential = async (thoughtId: string, potential: PotentialType) => {
    try {
      await setPotential(thoughtId, potential);
      setExpandedActionDropdown(null);
    } catch (error) {
      console.error('Error setting potential:', error);
    }
  };

  const handleToggleTodoComplete = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;

    const newCompleted = !thought.todoData?.completed;
    await updateTodoData(thoughtId, { 
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : undefined,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'from-purple-500 to-pink-500';
    if (score >= 50) return 'from-blue-500 to-purple-500';
    return 'from-slate-400 to-slate-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High Potential';
    if (score >= 50) return 'Good Potential';
    return 'Explore';
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading thoughts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-white">
      <Navigation
        currentView="explore"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sort Toggle and Generate Recommendations Button */}
        <div className="mb-6 flex items-center justify-between">
          {/* Sort Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setSortBy('potential')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'potential'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Potential
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'latest'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Latest
            </button>
          </div>

          {/* Generate Recommendations Button */}
          {thoughts.length > 0 && (
            <button
              onClick={async () => {
                setIsBackfilling(true);
                setBackfillProgress({ current: 0, total: thoughts.length });
                try {
                  const result = await backfillRecommendations((current, total) => {
                    setBackfillProgress({ current, total });
                  });
                  alert(`Backfill complete! ${result.success} thoughts processed, ${result.failed} failed.`);
                } catch (error: any) {
                  console.error('Backfill error:', error);
                  alert(`Error: ${error?.message || 'Failed to backfill recommendations'}`);
                } finally {
                  setIsBackfilling(false);
                  setBackfillProgress(null);
                }
              }}
              disabled={isBackfilling}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isBackfilling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {backfillProgress ? `${backfillProgress.current}/${backfillProgress.total}` : 'Processing...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Recommendations</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Thoughts Grid */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-purple-200">
            <Compass className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No suggestions yet</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery
                ? 'No thoughts match your search.'
                : 'AI will suggest powerful thoughts as you capture more ideas.'}
            </p>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Capture a Thought
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThoughts.map((thought) => {
              const currentPotential = thought.potential || thought.bestPotential;
              const isTodo = currentPotential === 'Do';
              const isCompleted = thought.todoData?.completed || false;
              const score = thought.powerfulScore || 0;
              
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
                  className="bg-white rounded-xl border-2 border-dashed border-purple-200/50 p-4 shadow-sm relative flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Recommendation Pill - On the border line (starting from right) - Max 1 */}
                  {recommendations.length > 0 && (
                    <div className="absolute -top-3 right-4 z-10">
                      {(() => {
                        const rec = recommendations[0]; // Only show the first (and only) recommendation
                        const config = getRecommendationConfig(rec.type);
                        return (
                          <div className="group relative">
                            <div
                              className={`px-2.5 py-1 rounded-lg border-2 border-dashed ${config.borderColor} ${config.bgColor} ${config.color} text-xs font-medium flex items-center gap-1.5 bg-white shadow-sm cursor-help`}
                            >
                              {config.icon}
                              <span>{rec.type}</span>
                            </div>
                            {/* Enhanced tooltip on hover with value explanation */}
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-20 max-w-xs">
                              <div className="font-semibold mb-1">{rec.explanation}</div>
                              <div className="text-slate-300 leading-relaxed">{rec.value}</div>
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                            </div>
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
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    {editingThoughtId === thought.id ? (
                      <div className="flex-1 flex flex-col gap-2 w-full">
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
                      <div className="flex-1 relative min-w-0">
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

                  {/* Parked Badge */}
                  {thought.isParked && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-dashed border-amber-200">
                        <ParkingCircle className="w-3 h-3" />
                        Parked - Ready to Revive
                      </span>
                    </div>
                  )}

                  {/* CTA Row */}
                  <div className="mt-auto pt-3 border-t border-purple-200/50 flex items-center justify-between gap-2 flex-wrap">
                    {/* Left: Date */}
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200/50">
                        {new Date(thought.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: new Date(thought.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                    </div>

                    {/* Right: Actions */}
                    {currentPotential && (
                      <div className="flex items-center gap-2 ml-auto">
                        <div 
                          className="relative action-dropdown-container"
                          ref={(el) => {
                            if (el) {
                              dropdownRefs.current.set(thought.id, el);
                            } else {
                              dropdownRefs.current.delete(thought.id);
                            }
                          }}
                        >
                          <button
                            onClick={(e) => {
                              if (thought.isParked) return;
                              e.stopPropagation();
                              e.preventDefault();
                              const dropdownKey = thought.id;
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
                                <span>{potentialConfig[currentPotential]?.icon}</span>
                                <span>{potentialConfig[currentPotential]?.label}</span>
                                {thought.bestPotential === currentPotential && !thought.potential && (
                                  <span className="text-xs opacity-60">(AI)</span>
                                )}
                              </>
                            )}
                            {!thought.isParked && (
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === thought.id ? 'rotate-180' : ''}`} />
                            )}
                          </button>
                          {expandedActionDropdown === thought.id && !thought.isParked && (
                            <div 
                              className="absolute right-0 top-full mt-2 bg-white rounded-xl border-2 border-dashed border-slate-300/60 shadow-xl z-50 min-w-[140px] overflow-hidden action-dropdown-menu"
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
                                      <span>{config.icon}</span>
                                      <span>{config.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {(currentPotential === 'Share' || currentPotential === 'Do') && !thought.isParked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const targetView = currentPotential === 'Share' ? 'shareit' : 'todo';
                              window.history.pushState({ view: 'explore' }, '', '#explore');
                              window.history.pushState({ view: targetView, thoughtId: thought.id }, '', `#${targetView}`);
                              setCurrentView(targetView, thought.id);
                            }}
                            className={`p-1.5 rounded-lg border border-dashed transition-colors ${
                              currentPotential === 'Share'
                                ? 'bg-purple-100/70 text-purple-700 border-purple-300/60 hover:bg-purple-200/70'
                                : 'bg-emerald-100/70 text-emerald-700 border-emerald-300/60 hover:bg-emerald-200/70'
                            }`}
                            title={`Open in ${currentPotential === 'Share' ? 'Share' : 'Do'} view`}
                            type="button"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Park/Revive Toggle */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (thought.isParked) {
                              await setPotential(thought.id, 'Just a thought');
                              await unparkThought(thought.id);
                            } else {
                              await parkThought(thought.id);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-1 ${
                            thought.isParked
                              ? 'bg-amber-50 text-amber-700 border-amber-300/60 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-500 border-slate-300/60 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title={thought.isParked ? 'Click to revive (unpark) this thought' : 'Click to park this thought'}
                          type="button"
                        >
                          {thought.isParked ? (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              <span>Revive</span>
                            </>
                          ) : (
                            <>
                              <ParkingCircle className="w-3 h-3" />
                              <span>Park</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* No potential - show add button */}
                    {!currentPotential && (
                      <div className="flex items-center gap-2 ml-auto">
                        <div 
                          className="relative action-dropdown-container"
                          ref={(el) => {
                            if (el) {
                              dropdownRefs.current.set(thought.id, el);
                            } else {
                              dropdownRefs.current.delete(thought.id);
                            }
                          }}
                        >
                          <button
                            onClick={() => {
                              if (thought.isParked) return;
                              const dropdownKey = thought.id;
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
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedActionDropdown === thought.id ? 'rotate-180' : ''}`} />
                            )}
                          </button>
                          {expandedActionDropdown === thought.id && !thought.isParked && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border-2 border-dashed border-purple-300/60 shadow-xl z-20 min-w-[140px] overflow-hidden action-dropdown-menu"
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
                                  return (
                                    <button
                                      key={potential}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleSetPotential(thought.id, potential);
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors ${hoverClass} ${textClass} cursor-pointer`}
                                      type="button"
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

                        {/* Park/Revive Toggle */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (thought.isParked) {
                              await setPotential(thought.id, 'Just a thought');
                              await unparkThought(thought.id);
                            } else {
                              await parkThought(thought.id);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-1 ${
                            thought.isParked
                              ? 'bg-amber-50 text-amber-700 border-amber-300/60 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-500 border-slate-300/60 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title={thought.isParked ? 'Click to revive (unpark) this thought' : 'Click to park this thought'}
                          type="button"
                        >
                          {thought.isParked ? (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              <span>Revive</span>
                            </>
                          ) : (
                            <>
                              <ParkingCircle className="w-3 h-3" />
                              <span>Park</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreView;
