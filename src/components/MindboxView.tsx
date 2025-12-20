import React, { useState, useMemo, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType } from '../types';
import { Search, Clock, CheckSquare, Lightbulb, BookOpen, Share2, Check, Trash2, Filter, ChevronDown } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { generatePostForEntry } from '../lib/posts';

// Basic semantic query expansion (can be enhanced with AI/embeddings)
const expandQuerySemantically = (query: string): string[] => {
  const expansions: Record<string, string[]> = {
    'speed': ['velocity', 'fast', 'quick', 'rapid', 'rush', 'hurry'],
    'rush': ['speed', 'hurry', 'fast', 'quick', 'haste'],
    'quality': ['excellence', 'standard', 'value', 'worth'],
    'startup': ['business', 'company', 'venture', 'enterprise'],
    'product': ['service', 'offering', 'solution'],
    'team': ['group', 'squad', 'crew', 'collective'],
    'coach': ['trainer', 'mentor', 'guide', 'instructor'],
    'player': ['athlete', 'competitor', 'participant'],
  };
  
  const keywords = [query];
  for (const [key, values] of Object.entries(expansions)) {
    if (query.includes(key)) {
      keywords.push(...values);
    }
  }
  
  return [...new Set(keywords)];
};

const MindboxView: React.FC = () => {
  const { entries, setCurrentView, updateEntry, deleteEntry, user, signOut } = useGenieNotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [semanticMatches, setSemanticMatches] = useState<Set<string>>(new Set());
  const [addedToShareIt, setAddedToShareIt] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<EntryType | 'all'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | 'week' | 'month' | '30days' | '90days'>('30days');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Current date/time for filtering and formatting
  const now = new Date();

  // Date filtering logic
  const getDateFiltered = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (selectedDateRange === 'all') return entries;
    if (selectedDateRange === 'today') {
      return entries.filter(entry => entry.createdAt >= today);
    }
    if (selectedDateRange === 'week') {
      return entries.filter(entry => entry.createdAt >= weekAgo);
    }
    if (selectedDateRange === 'month') {
      return entries.filter(entry => entry.createdAt >= monthAgo);
    }
    if (selectedDateRange === '30days') {
      return entries.filter(entry => entry.createdAt >= monthAgo);
    }
    if (selectedDateRange === '90days') {
      return entries.filter(entry => entry.createdAt >= ninetyDaysAgo);
    }
    return entries;
  }, [entries, selectedDateRange]);

  // Type filtering
  const filteredByType = useMemo(() => {
    if (selectedType === 'all') return getDateFiltered;
    return getDateFiltered.filter(entry => entry.type === selectedType);
  }, [getDateFiltered, selectedType]);

  // Hybrid search: text-based + semantic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByType;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Text-based search (exact matches)
    const textMatches = filteredByType.filter(entry => 
      entry.originalText.toLowerCase().includes(query) ||
      entry.summary.toLowerCase().includes(query) ||
      (entry.aiHint && entry.aiHint.toLowerCase().includes(query))
    );
    
    // If we have good text matches, return them (not semantic)
    if (textMatches.length > 0) {
      return textMatches;
    }
    
    // Otherwise, try semantic search (basic keyword expansion for now)
    // This can be enhanced with embeddings/OpenAI later
    const semanticKeywords = expandQuerySemantically(query);
    const semanticResults = filteredByType.filter(entry => {
      const text = (entry.originalText + ' ' + entry.summary).toLowerCase();
      return semanticKeywords.some(keyword => text.includes(keyword));
    });
    
    return semanticResults;
  }, [filteredByType, searchQuery]);
  
  // Calculate semantic matches separately to avoid re-render loop
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSemanticMatches(new Set());
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Check if we have text matches first
    const hasTextMatches = filteredByType.some(entry => 
      entry.originalText.toLowerCase().includes(query) ||
      entry.summary.toLowerCase().includes(query) ||
      (entry.aiHint && entry.aiHint.toLowerCase().includes(query))
    );
    
    if (hasTextMatches) {
      setSemanticMatches(new Set());
      return;
    }
    
    // Otherwise, calculate semantic matches
    const semanticKeywords = expandQuerySemantically(query);
    const semanticResults = filteredByType.filter(entry => {
      const text = (entry.originalText + ' ' + entry.summary).toLowerCase();
      return semanticKeywords.some(keyword => text.includes(keyword));
    });
    
    const semanticIds = new Set(semanticResults.map(e => e.id));
    setSemanticMatches(semanticIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filteredByType.length]);

  // Sort by recency (newest first)
  const sortedEntries = useMemo(() => {
    return [...searchResults].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [searchResults]);

  // Get effective badge type (user override or AI classification)
  const getBadgeType = (entry: Entry): EntryType => {
    return entry.badgeOverride || entry.type;
  };

  // Get badge display info
  const getBadgeInfo = (type: EntryType) => {
    switch (type) {
      case 'todo':
        return { label: 'To-Do', icon: CheckSquare, color: 'emerald' };
      case 'insight':
        return { label: 'Insight', icon: Lightbulb, color: 'indigo' };
      case 'journal':
        return { label: 'Journal', icon: BookOpen, color: 'amber' };
    }
  };

  // Get opacity based on age
  const getOpacity = (entry: Entry): string => {
    const daysAgo = Math.floor((now.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'opacity-100';
    if (daysAgo <= 7) return 'opacity-90';
    if (daysAgo <= 30) return 'opacity-75';
    return 'opacity-60';
  };

  // Format date
  const formatDate = (date: Date) => {
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo <= 7) return `${daysAgo} days ago`;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Handle badge change - update both badgeOverride and type so the change is permanent
  const handleBadgeChange = async (entryId: string, newType: EntryType) => {
    await updateEntry(entryId, { 
      badgeOverride: newType,  // Store the override
      type: newType             // Also update the actual type so it's permanently changed
    });
    setEditingBadgeId(null);
  };

  const badgeTypes: EntryType[] = ['todo', 'insight', 'journal'];

  // Close badge selector and filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close badge selector
      if (editingBadgeId && !target.closest('.badge-selector')) {
        setEditingBadgeId(null);
      }
      
      // Close filter dropdowns (check if click is outside both dropdowns and their buttons)
      if (showTypeFilter || showDateFilter) {
        const isClickInsideTypeFilter = target.closest('[data-type-filter]');
        const isClickInsideDateFilter = target.closest('[data-date-filter]');
        if (!isClickInsideTypeFilter && !isClickInsideDateFilter) {
          setShowTypeFilter(false);
          setShowDateFilter(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingBadgeId, showTypeFilter, showDateFilter]);

  return (
    <div className="min-h-screen bg-white">
      {/* Search and Filters Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search - Simplified */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all min-h-[36px] placeholder:text-slate-400 text-slate-900"
            />
          </div>
          
          {/* Type Filter */}
          <div className="relative" data-type-filter>
            <button
              onClick={() => {
                setShowTypeFilter(!showTypeFilter);
                setShowDateFilter(false);
              }}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <Filter className="w-4 h-4" />
              <span>{selectedType === 'all' ? 'All Types' : selectedType === 'todo' ? 'To-Do' : selectedType === 'insight' ? 'Insight' : 'Journal'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTypeFilter && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                {(['all', 'todo', 'insight', 'journal'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setShowTypeFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedType === type ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-700'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type === 'todo' ? 'To-Do' : type === 'insight' ? 'Insight' : 'Journal'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="relative" data-date-filter>
            <button
              onClick={() => {
                setShowDateFilter(!showDateFilter);
                setShowTypeFilter(false);
              }}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <Clock className="w-4 h-4" />
              <span>
                {selectedDateRange === 'all' ? 'All time' :
                 selectedDateRange === 'today' ? 'Today' :
                 selectedDateRange === 'week' ? 'This week' :
                 selectedDateRange === 'month' ? 'This month' :
                 selectedDateRange === '30days' ? 'Last 30 days' : 'Last 90 days'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showDateFilter && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                {(['all', 'today', 'week', 'month', '30days', '90days'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setSelectedDateRange(range);
                      setShowDateFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedDateRange === range ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-700'
                    }`}
                  >
                    {range === 'all' ? 'All time' :
                     range === 'today' ? 'Today' :
                     range === 'week' ? 'This week' :
                     range === 'month' ? 'This month' :
                     range === '30days' ? 'Last 30 days' : 'Last 90 days'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thoughts List */}
      <div className="w-full px-4 sm:px-8 py-6">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No thoughts match your search' : 'No thoughts yet'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6 px-4 max-w-md mx-auto">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Capture your first thought to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[36px]"
              >
                Capture Thought
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEntries.map((entry) => {
              const badgeType = getBadgeType(entry);
              const badgeInfo = getBadgeInfo(badgeType);
              const BadgeIcon = badgeInfo.icon;
              const opacity = getOpacity(entry);

              return (
                <div
                  key={entry.id}
                  className={`bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 ${opacity} relative flex flex-col h-full`}
                >
                  {/* Badges Row - Type badge + Shareability indicator */}
                  <div className="flex-shrink-0 flex items-center gap-2 mb-4">
                    {/* Type Badge - Clickable to change */}
                    <div className="badge-selector">
                      {editingBadgeId === entry.id ? (
                        <div className="absolute z-20 flex flex-col gap-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2">
                          {badgeTypes.map((type) => {
                            const info = getBadgeInfo(type);
                            const Icon = info.icon;
                            return (
                              <button
                                key={type}
                                onClick={() => handleBadgeChange(entry.id, type)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
                                  badgeType === type
                                    ? info.color === 'emerald'
                                      ? 'bg-emerald-600 text-white'
                                      : info.color === 'indigo'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-amber-600 text-white'
                                    : info.color === 'emerald'
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : info.color === 'indigo'
                                    ? 'text-indigo-600 hover:bg-indigo-50'
                                    : 'text-amber-600 hover:bg-amber-50'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                {info.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingBadgeId(entry.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors duration-200 ${
                            badgeInfo.color === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700'
                              : badgeInfo.color === 'indigo'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badgeInfo.label}
                        </button>
                      )}
                    </div>
                    
                    {/* Shareability Badge - Shows if postingScore >= 50 */}
                    {entry.postingScore !== undefined && entry.postingScore >= 50 && !entry.inShareIt && (
                      <div className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                        <Share2 className="w-3 h-3" />
                        <span>Worth sharing</span>
                        <span className="text-purple-500">({entry.postingScore})</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 mb-4">
                    {/* Original thought text */}
                    <div className="text-sm text-slate-900 mb-2 leading-relaxed">
                      {entry.originalText}
                    </div>

                    {/* AI hint - subtle, secondary */}
                    {entry.aiHint && (
                      <div className="text-xs text-slate-500 italic mt-1.5">
                        {entry.aiHint}
                      </div>
                    )}
                  </div>

                  {/* Date and Actions - Fixed at bottom */}
                  <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.createdAt)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      {!entry.inShareIt ? (
                        addedToShareIt === entry.id ? (
                          <div className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 flex-1 justify-center">
                            <Check className="w-4 h-4" />
                            <span>Added to Share it</span>
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                setAddedToShareIt(entry.id);
                                await updateEntry(entry.id, { inShareIt: true });
                                // Don't auto-generate - let user do it in ShareIt view
                                setTimeout(() => setAddedToShareIt(null), 3000);
                              } catch (error: any) {
                                console.error('Error adding to Share it:', error);
                                setAddedToShareIt(null);
                                alert('Error adding to Share it. Please try again.');
                              }
                            }}
                            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 flex-1 justify-center shadow-sm ${
                              entry.postingScore !== undefined && entry.postingScore >= 50
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
                            }`}
                            title="Add to Share it"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Add to Share it</span>
                          </button>
                        )
                      ) : (
                        <div className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 flex-1 justify-center">
                          <Share2 className="w-4 h-4" />
                          <span>In Share it</span>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this entry?')) {
                            try {
                              await deleteEntry(entry.id);
                            } catch (error) {
                              console.error('Error deleting entry:', error);
                              alert('Error deleting entry. Please try again.');
                            }
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export default MindboxView;

