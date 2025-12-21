import React, { useState } from 'react';
import { useGenieNotesStore } from '../store';
import { Entry, Category, EntryType } from '../types';
import { generateNextStep } from '../lib/ai';
import { Plus, Trash2, Sparkles, Filter, X, ChevronDown, BookOpen, Lightbulb, Search, Clock } from 'lucide-react';
import UserAvatar from './UserAvatar';

type DateFilter = 'all' | '30days' | '60days' | '90days' | 'custom';

const HomeView: React.FC = () => {
  const { entries, setCurrentView, deleteEntry, updateEntry, loading, user, signOut } = useGenieNotesStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedEntryType, setSelectedEntryType] = useState<'all' | 'thought' | 'journal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Helper to format category display name
  const getCategoryDisplayName = (category: Category | 'all') => {
    if (category === 'all') return 'All Categories';
    if (category === 'todo') return 'To-Do';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Filter by date range
  const getDateFilterRange = (filter: DateFilter) => {
    const now = new Date();
    switch (filter) {
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '60days':
        return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return null;
    }
  };

  // Search through ALL entries (not filtered by date)
  const searchMatches = searchQuery === '' ? entries : entries.filter(entry => 
    entry.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter entries by category, type, and date (but search is already applied above)
  const filteredEntries = (searchQuery ? searchMatches : entries).filter(entry => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesEntryType = selectedEntryType === 'all' || entry.entryType === selectedEntryType;
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const cutoffDate = getDateFilterRange(dateFilter);
      if (cutoffDate && new Date(entry.createdAt) < cutoffDate) {
        return false;
      }
    }
    
    return matchesCategory && matchesEntryType;
  });

  // Sort entries by date (newest first)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50/30 via-blue-50/20 to-pink-50/20 relative overflow-hidden">
      {/* Playful background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl -z-10"></div>
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-yellow-200/50 shadow-sm">
        <div className="w-full px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-3xl">💭</span>
                My thoughts space
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('posts')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-yellow-50 border border-transparent hover:border-yellow-200"
              >
                Posts
              </button>
              <button
                onClick={() => setCurrentView('capture')}
                className="px-4 py-2 text-sm font-medium bg-white/80 text-slate-700 border-2 border-yellow-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50/80 transition-all shadow-sm backdrop-blur-sm"
              >
                New Thought
              </button>
              {/* User Avatar - Inline with header */}
              {user && (
                <div className="ml-2">
                  <UserAvatar user={user} onLogout={signOut} />
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters - Inline */}
          <div className="flex items-center gap-3">
            {/* Search - Smaller */}
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowTypeDropdown(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 min-w-[140px] justify-between"
              >
                <span className="text-slate-700">
                  {getCategoryDisplayName(selectedCategory)}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showCategoryDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-30 min-w-[140px] py-1">
                    {(['all', 'todo', 'insight', 'idea'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                          selectedCategory === cat ? 'bg-slate-50 font-medium' : ''
                        }`}
                      >
                        {cat === 'all' ? 'All Categories' : cat === 'todo' ? 'To-Do' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Entry Type Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowCategoryDropdown(false);
                  setShowDateDropdown(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 min-w-[120px] justify-between"
              >
                <span className="text-slate-700 flex items-center gap-1.5">
                  {selectedEntryType === 'all' ? 'All Types' : selectedEntryType === 'thought' ? (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      <span>Thought</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Journal</span>
                    </>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTypeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowTypeDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-30 min-w-[120px] py-1">
                    {(['all', 'thought', 'journal'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedEntryType(type);
                          setShowTypeDropdown(false);
                        }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center gap-2 ${
                            selectedEntryType === type ? 'bg-slate-50 font-medium' : ''
                          }`}
                      >
                        {type === 'all' ? 'All Types' : type === 'thought' ? (
                          <>
                            <Lightbulb className="w-4 h-4" />
                            <span>Thought</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4" />
                            <span>Journal</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDateDropdown(!showDateDropdown);
                  setShowCategoryDropdown(false);
                  setShowTypeDropdown(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 min-w-[100px] justify-between"
              >
                <span className="text-slate-700">
                  {dateFilter === 'all' ? 'All time' : dateFilter === '30days' ? 'Last 30 days' : dateFilter === '60days' ? 'Last 60 days' : 'Last 90 days'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDateDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowDateDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-30 min-w-[140px] py-1">
                    {(['all', '30days', '60days', '90days'] as DateFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setDateFilter(filter);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                          dateFilter === filter ? 'bg-slate-50 font-medium' : ''
                        }`}
                      >
                        {filter === 'all' ? 'All time' : filter === '30days' ? 'Last 30 days' : filter === '60days' ? 'Last 60 days' : 'Last 90 days'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="w-full px-8 py-8">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-6 text-slate-400">
              <Sparkles className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery || selectedCategory !== 'all' || selectedEntryType !== 'all' 
                ? 'No entries found' 
                : 'No entries yet'}
            </h3>
            <p className="text-base text-slate-600 mb-8">
              {searchQuery || selectedCategory !== 'all' || selectedEntryType !== 'all'
                ? 'Try adjusting your filters'
                : selectedEntryType === 'journal'
                ? 'Start by adding your first journal entry'
                : 'Start by capturing your first thought'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-6 py-3 text-base font-medium bg-white/80 text-slate-700 border-2 border-yellow-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50/80 transition-all shadow-sm backdrop-blur-sm"
              >
                {selectedEntryType === 'journal' ? 'Add Journal Entry' : 'Capture Your First Thought'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedEntries.map((entry) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                onDelete={deleteEntry}
                onUpdateCategory={async (id, category, originalText) => {
                  const updates: Partial<Entry> = { category };
                  
                  if (category === 'todo') {
                    const entry = entries.find(e => e.id === id);
                    updates.nextStep = await generateNextStep(originalText, entry?.summary);
                  } else {
                    updates.nextStep = undefined;
                  }
                  
                  await updateEntry(id, updates);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface EntryCardProps {
  entry: Entry;
  onDelete: (id: string) => Promise<void>;
  onUpdateCategory: (id: string, category: Category, originalText: string) => Promise<void>;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onUpdateCategory }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getCategoryBadge = (category: Category) => {
    switch (category) {
      case 'todo': return 'bg-emerald-100 text-emerald-700';
      case 'insight': return 'bg-indigo-100 text-indigo-700';
      case 'idea': return 'bg-orange-100 text-orange-700';
    }
  };

  const getCategoryTextColor = (category: Category) => {
    switch (category) {
      case 'todo': return 'text-emerald-600';
      case 'insight': return 'text-indigo-600';
      case 'idea': return 'text-orange-600';
    }
  };

  const getTypeBadge = (entryType: EntryType) => {
    switch (entryType) {
      case 'thought': return 'bg-cyan-100 text-cyan-700';
      case 'journal': return 'bg-amber-100 text-amber-700';
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setIsDeleting(true);
      try {
        await onDelete(entry.id);
      } catch (error) {
        console.error('Error deleting entry:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <>
      <div className="group bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-lg transition-all h-full flex flex-col">
        <div className="p-4 flex-1 flex flex-col">
          {/* Title and Delete */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
              {entry.entryType === 'journal' 
                ? entry.originalText.split('\n')[0] || 'Journal Entry'
                : entry.originalText.length > 60 
                  ? entry.originalText.substring(0, 60) + '...'
                  : entry.originalText}
            </h3>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-500 flex-shrink-0"
              title="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {/* Entry Type Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeBadge(entry.entryType)}`}>
              {entry.entryType === 'journal' ? (
                <>
                  <BookOpen className="w-3 h-3" />
                  Journal
                </>
              ) : (
                <>
                  <Lightbulb className="w-3 h-3" />
                  Thought
                </>
              )}
            </span>
            
            {/* Category Badge */}
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              disabled={isChangingCategory}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getCategoryBadge(entry.category)} hover:opacity-90 transition-opacity relative`}
            >
              {entry.category === 'todo' ? 'To-Do' : entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                {showCategoryDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-30 min-w-[120px] py-1">
                      {(['todo', 'insight', 'idea'] as Category[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (cat === entry.category) {
                              setShowCategoryDropdown(false);
                              return;
                            }
                            setIsChangingCategory(true);
                            try {
                              await onUpdateCategory(entry.id, cat, entry.originalText);
                            } catch (error) {
                              console.error('Error updating category:', error);
                            } finally {
                              setIsChangingCategory(false);
                              setShowCategoryDropdown(false);
                            }
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                            entry.category === cat ? 'font-medium bg-slate-50' : ''
                          } ${getCategoryTextColor(cat)}`}
                        >
                          {cat === 'todo' ? 'To-Do' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </button>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
              <Clock className="w-3 h-3" />
              {formatDate(entry.createdAt)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 mb-3">
            {entry.entryType === 'journal' ? (
              <div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                  {entry.originalText.split('\n').slice(1).join('\n') || entry.originalText}
                </div>
                {(entry.originalText.split('\n').length > 4 || entry.originalText.length > 150) && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Show more
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 mb-2">
                  {entry.originalText}
                </p>
                {entry.category === 'todo' && entry.nextStep && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-700">
                    <span className="font-medium">Next:</span> {entry.nextStep}
                  </div>
                )}
                {entry.originalText.length > 150 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Show more
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-slate-100">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs text-slate-600 bg-slate-50 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Entry Modal */}
      {showModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {entry.entryType === 'journal' ? (
                    <span className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                      <BookOpen className="w-4 h-4" />
                      Journal
                    </span>
                  ) : (
                    <span className={`text-sm inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getCategoryBadge(entry.category)}`}>
                      {entry.category === 'todo' ? 'To-Do' : entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap mb-4">
                  {entry.originalText}
                </div>
                
                {entry.category === 'todo' && entry.nextStep && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="text-sm font-medium text-emerald-900 mb-1">Next Step</div>
                    <div className="text-sm text-emerald-700">→ {entry.nextStep}</div>
                  </div>
                )}

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-sm text-slate-600 bg-slate-50 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default HomeView;
