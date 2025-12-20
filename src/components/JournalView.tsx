import React, { useState } from 'react';
import { useGenieNotesStore } from '../store';
import { Entry } from '../types';
import { BookOpen, Trash2, BarChart3, X, Clock, Edit2, Save, Search } from 'lucide-react';
import Analytics from './Analytics';

const JournalView: React.FC = () => {
  const { entries, setCurrentView, deleteEntry, updateEntry, user, signOut, currentView } = useGenieNotesStore();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter to only show journal entries
  const journals = entries.filter(e => e.type === 'journal');
  
  // Apply search filter
  const filteredJournals = searchQuery === '' 
    ? journals 
    : journals.filter(entry => 
        entry.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleEdit = (journal: Entry) => {
    setEditingId(journal.id);
    setEditText(journal.originalText);
  };

  const handleSave = async (id: string) => {
    await updateEntry(id, { originalText: editText });
    setEditingId(null);
    setEditText('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      await deleteEntry(id);
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-1">Journal</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[44px] flex-shrink-0"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Analytics entries={journals} type="journal" />
        </div>
      )}

      {/* Content */}
      <div className="w-full px-4 sm:px-8 py-4 sm:py-6">
        {filteredJournals.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? 'No entries match your search' : 'No journal entries yet'}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 px-4">
              {searchQuery ? 'Try a different search term' : 'Start your first journal entry'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCurrentView('capture')}
                className="px-6 py-3 text-sm sm:text-base bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium min-h-[44px]"
              >
                New Journal Entry
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredJournals.map((journal) => (
              <div
                key={journal.id}
                className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Journal
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(journal.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === journal.id ? (
                      <>
                        <button
                          onClick={() => handleSave(journal.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(journal)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(journal.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {editingId === journal.id ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 sm:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[200px] text-sm sm:text-base"
                    placeholder="Write your journal entry..."
                  />
                ) : (
                  <div className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {journal.originalText}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalView;

