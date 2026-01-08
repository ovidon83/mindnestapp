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
  MoreVertical,
  Trash2,
  ListTodo,
  Clock,
  X
} from 'lucide-react';
import NavigationNew from './NavigationNew';

type SortOption = 'newest' | 'oldest';

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
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Filter and sort thoughts
  const filteredThoughts = useMemo(() => {
    let result = [...thoughts];

    // Filter by archived status
    result = result.filter(t => showArchived ? t.isParked : !t.isParked);

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
  }, [thoughts, searchQuery, sortBy, showArchived]);

  const archivedCount = useMemo(() => thoughts.filter(t => t.isParked).length, [thoughts]);

  const handleEdit = (thought: Thought) => {
    setEditingId(thought.id);
    setEditingText(thought.originalText);
    setExpandedMenu(null);
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

  const handleShare = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (thought && thought.potential !== 'Share') {
      await setPotential(thoughtId, 'Share');
    }
    setCurrentView('studio', thoughtId);
  };

  const handleMakeTodo = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (thought && thought.potential !== 'Do') {
      await setPotential(thoughtId, 'Do');
    }
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
    if (window.confirm('Delete this thought?')) {
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <NavigationNew
        currentView="library"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search your thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {filteredThoughts.length} {filteredThoughts.length === 1 ? 'thought' : 'thoughts'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {archivedCount > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  showArchived 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archived ({archivedCount})
              </button>
            )}
            
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              {sortBy === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* Thoughts List */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {searchQuery ? (
                <Search className="w-7 h-7 text-slate-400" />
              ) : (
                <Edit2 className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchQuery ? 'No matches' : showArchived ? 'No archived thoughts' : 'No thoughts yet'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {searchQuery ? 'Try different keywords' : 'Capture your first thought to get started'}
            </p>
            {!searchQuery && !showArchived && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                New Thought
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThoughts.map((thought) => {
              const isEditing = editingId === thought.id;
              const isTodo = thought.potential === 'Do';
              const isShare = thought.potential === 'Share';

              return (
                <div
                  key={thought.id}
                  className={`group bg-white rounded-xl border transition-all ${
                    thought.isParked 
                      ? 'border-slate-200 bg-slate-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {isEditing ? (
                    <div className="p-4">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex gap-4">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${
                          thought.isParked ? 'text-slate-500' : 'text-slate-700'
                        }`}>
                          {thought.originalText}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-slate-400">
                            {formatDate(thought.createdAt)}
                          </span>
                          {isTodo && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                              To-do
                            </span>
                          )}
                          {isShare && thought.sharePosts && (
                            <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                              {thought.sharePosts.shared?.linkedin || thought.sharePosts.shared?.twitter || thought.sharePosts.shared?.instagram 
                                ? 'Shared' 
                                : 'Draft ready'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!thought.isParked && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleShare(thought.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Share
                          </button>
                          <button
                            onClick={() => handleMakeTodo(thought.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <ListTodo className="w-3.5 h-3.5" />
                            To-do
                          </button>
                        </div>
                      )}

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setExpandedMenu(expandedMenu === thought.id ? null : thought.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {expandedMenu === thought.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <button
                              onClick={() => handleEdit(thought)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {!thought.isParked ? (
                              <button
                                onClick={() => handleArchive(thought.id)}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                Archive
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnarchive(thought.id)}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restore
                              </button>
                            )}
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleDelete(thought.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
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
