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
  Sparkles,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import NavigationNew from './NavigationNew';
import { calculatePowerfulScore } from '../lib/calculate-powerful-score';

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

  // Calculate status for a thought
  const getThoughtStatus = (thought: Thought): { type: 'share' | 'todo' | 'idea' | 'shared' | 'done'; label: string; color: string } => {
    // Check if already shared
    if (thought.sharePosts?.shared?.linkedin || thought.sharePosts?.shared?.twitter || thought.sharePosts?.shared?.instagram) {
      return { type: 'shared', label: 'Shared', color: 'emerald' };
    }
    // Check if to-do is done
    if (thought.potential === 'Do' && thought.todoData?.completed) {
      return { type: 'done', label: 'Done', color: 'emerald' };
    }
    // Check potential
    if (thought.potential === 'Share') {
      return { type: 'share', label: thought.sharePosts ? 'Draft ready' : 'To share', color: 'violet' };
    }
    if (thought.potential === 'Do') {
      return { type: 'todo', label: 'To-do', color: 'amber' };
    }
    // Check AI recommendations for share potential
    const score = calculatePowerfulScore(thought, thoughts);
    if (score >= 60 || thought.bestPotential === 'Share') {
      return { type: 'share', label: 'High potential', color: 'violet' };
    }
    if (thought.bestPotential === 'Do') {
      return { type: 'todo', label: 'Could be to-do', color: 'amber' };
    }
    return { type: 'idea', label: 'Idea', color: 'slate' };
  };

  // Filter and sort thoughts
  const filteredThoughts = useMemo(() => {
    let result = [...thoughts];
    result = result.filter(t => showArchived ? t.isParked : !t.isParked);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.originalText.toLowerCase().includes(query) ||
        t.summary?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  const statusColors: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
    violet: { bg: 'bg-violet-50/50', border: 'border-violet-200', badge: 'bg-violet-100', badgeText: 'text-violet-700' },
    amber: { bg: 'bg-amber-50/50', border: 'border-amber-200', badge: 'bg-amber-100', badgeText: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' },
    slate: { bg: 'bg-white', border: 'border-slate-200', badge: 'bg-slate-100', badgeText: 'text-slate-600' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 text-sm">
          <span className="text-slate-500">
            {filteredThoughts.length} thoughts
          </span>
          
          <div className="flex items-center gap-3">
            {archivedCount > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  showArchived ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Archive className="w-4 h-4" />
                Archived
              </button>
            )}
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg transition-all"
            >
              <Clock className="w-4 h-4" />
              {sortBy === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* Thoughts Grid */}
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'No matches found' : showArchived ? 'No archived thoughts' : 'No thoughts yet'}
            </p>
            {!searchQuery && !showArchived && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                Capture your first thought
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThoughts.map((thought) => {
              const isEditing = editingId === thought.id;
              const status = getThoughtStatus(thought);
              const colors = statusColors[status.color];
              const isActionable = status.type === 'share' || status.type === 'todo';
              const hasAction = thought.potential === 'Share' || thought.potential === 'Do';

              return (
                <div
                  key={thought.id}
                  className={`group rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-md ${
                    thought.isParked ? 'opacity-60' : ''
                  }`}
                >
                  {isEditing ? (
                    <div className="p-4">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-3 bg-white rounded-lg border border-slate-200 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-3">
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                          Save
                        </button>
                        <button onClick={() => { setEditingId(null); setEditingText(''); }} className="px-4 py-2 text-slate-600 text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex flex-col h-full">
                      {/* Header with status and menu */}
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge} ${colors.badgeText}`}>
                          {status.type === 'share' && <Sparkles className="w-3 h-3 inline mr-1" />}
                          {status.type === 'todo' && <ListTodo className="w-3 h-3 inline mr-1" />}
                          {(status.type === 'shared' || status.type === 'done') && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {status.label}
                        </span>
                        
                        <div className="relative">
                          <button
                            onClick={() => setExpandedMenu(expandedMenu === thought.id ? null : thought.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {expandedMenu === thought.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                              <button onClick={() => handleEdit(thought)} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              {!thought.isParked ? (
                                <button onClick={() => handleArchive(thought.id)} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                  <Archive className="w-3.5 h-3.5" /> Archive
                                </button>
                              ) : (
                                <button onClick={() => handleUnarchive(thought.id)} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                              )}
                              <button onClick={() => handleDelete(thought.id)} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-slate-700 leading-relaxed flex-1 line-clamp-4">
                        {thought.originalText}
                      </p>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{formatDate(thought.createdAt)}</span>
                          
                          {/* CTA Button for actionable thoughts */}
                          {!thought.isParked && (
                            <>
                              {hasAction ? (
                                // Already assigned - show "Open" CTA
                                <button
                                  onClick={() => thought.potential === 'Share' ? handleShare(thought.id) : handleMakeTodo(thought.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    thought.potential === 'Share'
                                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                                      : 'bg-amber-500 text-white hover:bg-amber-600'
                                  }`}
                                >
                                  Open
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              ) : (
                                // Not assigned - show action buttons on hover
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleShare(thought.id)}
                                    className="p-1.5 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                                    title="Share"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMakeTodo(thought.id)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                    title="To-do"
                                  >
                                    <ListTodo className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {expandedMenu && <div className="fixed inset-0 z-10" onClick={() => setExpandedMenu(null)} />}
    </div>
  );
};

export default LibraryView;
