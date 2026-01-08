import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought } from '../types';
import { 
  Search, 
  Send, 
  Edit2, 
  Save, 
  Archive,
  RotateCcw,
  MoreHorizontal,
  Trash2,
  CheckSquare,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import NavigationNew from './NavigationNew';

type SortOption = 'newest' | 'oldest';
type FilterOption = 'all' | 'archived';

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
  } = useGenieNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Filter and sort thoughts
  const filteredThoughts = useMemo(() => {
    let result = [...thoughts];

    // Apply filter
    if (filterBy === 'archived') {
      result = result.filter(t => t.isParked);
    } else {
      result = result.filter(t => !t.isParked);
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
    if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [thoughts, searchQuery, sortBy, filterBy]);

  // Stats
  const stats = useMemo(() => {
    const total = thoughts.filter(t => !t.isParked).length;
    const archived = thoughts.filter(t => t.isParked).length;
    return { total, archived };
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

  const handleGoToShare = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    // Mark as Share if not already
    if (thought && thought.potential !== 'Share') {
      await setPotential(thoughtId, 'Share');
    }
    // Navigate with the thought ID
    setCurrentView('studio', thoughtId);
  };

  const handleGoToAct = (thoughtId: string) => {
    setCurrentView('act', thoughtId);
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
    if (window.confirm('Are you sure you want to delete this thought?')) {
      await deleteThought(thoughtId);
      setExpandedMenu(null);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Search & Controls - minimal row */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterBy(filterBy === 'all' ? 'archived' : 'all')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterBy === 'archived' 
                ? 'bg-slate-200 text-slate-900' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archived</span>
            {stats.archived > 0 && (
              <span className="text-xs bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded-full">
                {stats.archived}
              </span>
            )}
          </button>

          {/* Sort toggle */}
          <button
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>

        {/* Results count */}
        <div className="text-sm text-slate-500 mb-4">
          {filteredThoughts.length} {filteredThoughts.length === 1 ? 'thought' : 'thoughts'}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Thoughts Grid */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">
              {searchQuery ? 'No thoughts match your search' : filterBy === 'archived' ? 'No archived thoughts' : 'No thoughts yet'}
            </p>
            {!searchQuery && filterBy === 'all' && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                Capture your first thought
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredThoughts.map((thought) => {
              const isEditing = editingId === thought.id;
              const isTodo = thought.potential === 'Do';
              const isShareable = thought.potential === 'Share' || thought.bestPotential === 'Share';

              return (
                <div
                  key={thought.id}
                  className={`group bg-white rounded-xl border transition-all duration-200 ${
                    thought.isParked 
                      ? 'border-slate-200 opacity-60' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    {/* Content */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          rows={4}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
                          >
                            <Save className="w-3 h-3" />
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
                      <>
                        <p className={`text-sm leading-relaxed line-clamp-4 mb-3 ${
                          thought.isParked ? 'text-slate-500' : 'text-slate-800'
                        }`}>
                          {thought.originalText}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-400">
                            {formatDate(thought.createdAt)}
                          </span>

                          <div className="flex items-center gap-0.5">
                            {/* Quick actions based on thought type */}
                            {!thought.isParked && (
                              <>
                                {isTodo ? (
                                  <button
                                    onClick={() => handleGoToAct(thought.id)}
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Open in Act"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleGoToShare(thought.id)}
                                    className="p-1.5 text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                                    title="Share this thought"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(thought)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* More menu */}
                            <div className="relative">
                              <button
                                onClick={() => setExpandedMenu(expandedMenu === thought.id ? null : thought.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {expandedMenu === thought.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                  {!thought.isParked ? (
                                    <button
                                      onClick={() => handleArchive(thought.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Archive className="w-4 h-4" />
                                      Archive
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUnarchive(thought.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      Restore
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(thought.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {expandedMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setExpandedMenu(null)}
        />
      )}
    </div>
  );
};

export default LibraryView;
