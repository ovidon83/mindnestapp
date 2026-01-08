import React, { useState, useMemo, useRef } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought, PotentialType } from '../types';
import { 
  Search, 
  Sparkles, 
  Send, 
  Calendar, 
  ChevronDown, 
  Edit2, 
  Save, 
  X,
  Archive,
  RotateCcw,
  Filter,
  Clock,
  TrendingUp,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import NavigationNew from './NavigationNew';
import { calculatePowerfulScore } from '../lib/calculate-powerful-score';

type SortOption = 'newest' | 'oldest' | 'potential';
type FilterOption = 'all' | 'share-ready' | 'archived';

const LibraryView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    updateThought,
    parkThought,
    unparkThought,
    deleteThought,
    setPotential,
    loadThoughts,
  } = useGenieNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Calculate sharing potential score for a thought
  const getSharingPotential = (thought: Thought): 'high' | 'medium' | 'low' | null => {
    // If already marked for sharing, show it
    if (thought.potential === 'Share') return 'high';
    
    // Check AI recommendations
    if (thought.exploreRecommendations?.some(r => r.type === 'Worth Sharing' && r.confidence >= 70)) {
      return 'high';
    }
    if (thought.exploreRecommendations?.some(r => r.type === 'Worth Sharing' && r.confidence >= 50)) {
      return 'medium';
    }
    
    // Check AI best potential
    if (thought.bestPotential === 'Share') return 'medium';
    
    // Check powerful score
    const score = calculatePowerfulScore(thought, thoughts);
    if (score >= 70) return 'medium';
    if (score >= 50) return 'low';
    
    return null;
  };

  // Filter and sort thoughts
  const filteredThoughts = useMemo(() => {
    let result = [...thoughts];

    // Apply filter
    switch (filterBy) {
      case 'share-ready':
        result = result.filter(t => {
          const potential = getSharingPotential(t);
          return potential === 'high' || potential === 'medium';
        });
        break;
      case 'archived':
        result = result.filter(t => t.isParked);
        break;
      case 'all':
      default:
        result = result.filter(t => !t.isParked);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.originalText.toLowerCase().includes(query) ||
        t.summary?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'potential':
        result.sort((a, b) => {
          const scoreA = calculatePowerfulScore(a, thoughts) || 0;
          const scoreB = calculatePowerfulScore(b, thoughts) || 0;
          return scoreB - scoreA;
        });
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [thoughts, searchQuery, sortBy, filterBy]);

  // Stats
  const stats = useMemo(() => {
    const total = thoughts.filter(t => !t.isParked).length;
    const shareReady = thoughts.filter(t => {
      if (t.isParked) return false;
      const potential = getSharingPotential(t);
      return potential === 'high' || potential === 'medium';
    }).length;
    const archived = thoughts.filter(t => t.isParked).length;
    return { total, shareReady, archived };
  }, [thoughts]);

  const handleEdit = (thought: Thought) => {
    setEditingId(thought.id);
    setEditingText(thought.originalText);
  };

  const handleSaveEdit = async () => {
    if (editingId && editingText.trim()) {
      await updateThought(editingId, { originalText: editingText.trim() });
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleMarkForSharing = async (thoughtId: string) => {
    await setPotential(thoughtId, 'Share');
    setExpandedMenu(null);
  };

  const handleArchive = async (thoughtId: string) => {
    await parkThought(thoughtId);
    setExpandedMenu(null);
  };

  const handleUnarchive = async (thoughtId: string) => {
    await unparkThought(thoughtId);
    setExpandedMenu(null);
  };

  const handleDelete = async (thoughtId: string) => {
    if (window.confirm('Are you sure you want to delete this thought? This cannot be undone.')) {
      await deleteThought(thoughtId);
      setExpandedMenu(null);
    }
  };

  const handleGoToStudio = (thoughtId: string) => {
    setCurrentView('studio', thoughtId);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your thoughts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationNew
        currentView="library"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Thoughts</h1>
          <p className="text-slate-600">
            {stats.total} thoughts • {stats.shareReady} ready to share
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search your thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowSortMenu(false);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterBy !== 'all' 
                    ? 'bg-violet-100 text-violet-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {filterBy === 'all' ? 'All' : filterBy === 'share-ready' ? 'Share Ready' : 'Archived'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                  <button
                    onClick={() => { setFilterBy('all'); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${filterBy === 'all' ? 'text-violet-700 bg-violet-50' : 'text-slate-700'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    All Thoughts ({stats.total})
                  </button>
                  <button
                    onClick={() => { setFilterBy('share-ready'); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${filterBy === 'share-ready' ? 'text-violet-700 bg-violet-50' : 'text-slate-700'}`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Share Ready ({stats.shareReady})
                  </button>
                  <button
                    onClick={() => { setFilterBy('archived'); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${filterBy === 'archived' ? 'text-violet-700 bg-violet-50' : 'text-slate-700'}`}
                  >
                    <Archive className="w-4 h-4 text-slate-400" />
                    Archived ({stats.archived})
                  </button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSortMenu(!showSortMenu);
                  setShowFilterMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
              >
                {sortBy === 'newest' ? <Clock className="w-4 h-4" /> : 
                 sortBy === 'oldest' ? <Calendar className="w-4 h-4" /> :
                 <TrendingUp className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Potential'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                  <button
                    onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${sortBy === 'newest' ? 'text-violet-700 bg-violet-50' : 'text-slate-700'}`}
                  >
                    <Clock className="w-4 h-4" />
                    Newest First
                  </button>
                  <button
                    onClick={() => { setSortBy('oldest'); setShowSortMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${sortBy === 'oldest' ? 'text-violet-700 bg-violet-50' : 'text-slate-700'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    Oldest First
                  </button>
                  <button
                    onClick={() => { setSortBy('potential'); setShowSortMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${sortBy === 'potential' ? 'text-violet-700 bg-violet-50' : 'text-slate-700'}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    By Potential
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thoughts List */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No thoughts found' : filterBy === 'archived' ? 'No archived thoughts' : 'No thoughts yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery ? 'Try a different search term' : 'Capture your first thought to get started'}
            </p>
            {!searchQuery && filterBy === 'all' && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Capture a Thought
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThoughts.map((thought) => {
              const sharingPotential = getSharingPotential(thought);
              const isEditing = editingId === thought.id;
              const hasSharePosts = !!thought.sharePosts;
              const isShared = thought.sharePosts?.shared?.linkedin || 
                              thought.sharePosts?.shared?.twitter || 
                              thought.sharePosts?.shared?.instagram;

              return (
                <div
                  key={thought.id}
                  className={`group bg-white rounded-2xl border transition-all duration-200 ${
                    thought.isParked 
                      ? 'border-slate-200/60 opacity-75' 
                      : sharingPotential === 'high'
                        ? 'border-amber-200/60 hover:border-amber-300 hover:shadow-md'
                        : 'border-slate-200/60 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Sharing Potential Badge */}
                  {sharingPotential && !thought.isParked && (
                    <div className="px-5 pt-4 pb-0">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        sharingPotential === 'high' 
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60' 
                          : sharingPotential === 'medium'
                            ? 'bg-violet-50 text-violet-700 border border-violet-200/60'
                            : 'bg-slate-50 text-slate-600 border border-slate-200/60'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {sharingPotential === 'high' ? 'High Sharing Potential' : 
                         sharingPotential === 'medium' ? 'Good for Sharing' : 'May be worth sharing'}
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Content */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          rows={4}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-slate-800 text-sm leading-relaxed ${thought.isParked ? 'text-slate-500' : ''}`}>
                        {thought.originalText}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {formatDate(thought.createdAt)}
                        </span>
                        {hasSharePosts && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isShared 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isShared ? 'Shared' : 'Draft Ready'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Quick action: Go to Studio (if Share potential) */}
                        {(thought.potential === 'Share' || sharingPotential) && !thought.isParked && (
                          <button
                            onClick={() => {
                              if (thought.potential !== 'Share') {
                                handleMarkForSharing(thought.id);
                              }
                              handleGoToStudio(thought.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-200 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {hasSharePosts ? 'Open in Studio' : 'Create Drafts'}
                          </button>
                        )}

                        {/* Edit button */}
                        <button
                          onClick={() => handleEdit(thought)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit thought"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* More menu */}
                        <div className="relative">
                          <button
                            onClick={() => setExpandedMenu(expandedMenu === thought.id ? null : thought.id)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {expandedMenu === thought.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                              {!thought.isParked ? (
                                <>
                                  {thought.potential !== 'Share' && (
                                    <button
                                      onClick={() => handleMarkForSharing(thought.id)}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                    >
                                      <Sparkles className="w-4 h-4" />
                                      Mark for Sharing
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleArchive(thought.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archive
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUnarchive(thought.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Restore
                                </button>
                              )}
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => handleDelete(thought.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside handler for menus */}
      {(showSortMenu || showFilterMenu || expandedMenu) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowSortMenu(false);
            setShowFilterMenu(false);
            setExpandedMenu(null);
          }}
        />
      )}
    </div>
  );
};

export default LibraryView;
