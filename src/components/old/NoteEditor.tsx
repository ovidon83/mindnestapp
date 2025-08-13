import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Grid, List, Edit3, Trash2, Bold, Italic, Underline, List as ListIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useMindnestStore } from '../store';

// Simple rich text editor component
const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Start writing...', className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (textareaRef.current) {
      // Force cursor to end of text
      const textarea = textareaRef.current;
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => document.execCommand('bold', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('italic', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('underline', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => document.execCommand('insertUnorderedList', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <ListIcon size={16} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => document.execCommand('justifyLeft', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyCenter', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyRight', false)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>
      
      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-4 min-h-[400px] focus:outline-none resize-none ${
          isFocused ? 'bg-white' : 'bg-gray-50'
        }`}
        style={{
          direction: 'ltr',
          textAlign: 'left',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: '1.6',
        }}
      />
    </div>
  );
};

export const NoteEditor: React.FC = () => {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  
  const { notes, addNote, updateNote, deleteNote } = useMindnestStore();
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Force text direction and cursor position
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.setAttribute('dir', 'ltr');
      editor.style.direction = 'ltr';
      editor.style.unicodeBidi = 'normal';
      editor.style.textAlign = 'left';
      
      // Force cursor to end of text
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [showEditor, selectedNote]);

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;

    const tags = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    addNote({
      title: newNoteTitle.trim(),
      content: newNoteContent,
      tags,
    });

    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
    setShowEditor(false);
  };

  const handleUpdateNote = (noteId: string, updates: any) => {
    updateNote(noteId, updates);
  };

  const selectedNoteData = selectedNote ? notes.find(n => n.id === selectedNote) : null;

  // Mobile Editor Modal
  if (showEditor || selectedNote) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => {
              setShowEditor(false);
              setSelectedNote(null);
              setNewNoteTitle('');
              setNewNoteContent('');
              setNewNoteTags('');
            }}
            onKeyPress={(e) => handleKeyPress(e, () => {
              setShowEditor(false);
              setSelectedNote(null);
              setNewNoteTitle('');
              setNewNoteContent('');
              setNewNoteTags('');
            })}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close editor"
          >
            <X size={20} />
          </button>
          
          <h2 className="font-medium text-gray-900">
            {selectedNote ? 'Edit Note' : 'New Note'}
          </h2>
          
          <button
            onClick={selectedNote ? () => {
              if (selectedNoteData) {
                handleUpdateNote(selectedNoteData.id, {
                  title: newNoteTitle || selectedNoteData.title,
                  content: newNoteContent || selectedNoteData.content,
                  tags: newNoteTags ? newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag) : selectedNoteData.tags
                });
              }
              setSelectedNote(null);
              setNewNoteTitle('');
              setNewNoteContent('');
              setNewNoteTags('');
            } : handleCreateNote}
            onKeyPress={(e) => handleKeyPress(e, selectedNote ? () => {
              if (selectedNoteData) {
                handleUpdateNote(selectedNoteData.id, {
                  title: newNoteTitle || selectedNoteData.title,
                  content: newNoteContent || selectedNoteData.content,
                  tags: newNoteTags ? newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag) : selectedNoteData.tags
                });
              }
              setSelectedNote(null);
              setNewNoteTitle('');
              setNewNoteContent('');
              setNewNoteTags('');
            } : handleCreateNote)}
            disabled={!newNoteTitle.trim() && !selectedNote}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label={selectedNote ? 'Update note' : 'Create note'}
          >
            {selectedNote ? 'Update' : 'Create'}
          </button>
        </div>

        {/* Mobile Editor Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            type="text"
            placeholder="Note title..."
            value={newNoteTitle || (selectedNoteData?.title || '')}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="w-full text-xl font-medium bg-transparent border-0 focus:outline-none placeholder-gray-500 p-2"
            aria-label="Note title"
          />
          
          <input
            type="text"
            placeholder="Tags (comma separated)..."
            value={newNoteTags || (selectedNoteData?.tags.join(', ') || '')}
            onChange={(e) => setNewNoteTags(e.target.value)}
            className="w-full text-sm bg-gray-50 border-0 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-500"
            aria-label="Note tags"
          />
          
          <div className="flex-1 min-h-[400px]">
            <RichTextEditor
              value={newNoteContent || (selectedNoteData?.content || '')}
              onChange={setNewNoteContent}
              placeholder="Start writing your note..."
              className="h-full bg-white rounded-lg border border-gray-200 focus:outline-none"
              aria-label="Note content"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Edit3 size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">Notes</h1>
              <p className="text-sm text-gray-600 mt-1">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowEditor(true)}
            onKeyPress={(e) => handleKeyPress(e, () => setShowEditor(true))}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[48px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Create new note"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        </div>

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white placeholder-gray-500 text-sm"
              aria-label="Search notes"
            />
          </div>
          
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              onKeyPress={(e) => handleKeyPress(e, () => setViewMode('grid'))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
              aria-label="Grid view"
            >
              <Grid size={16} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              onKeyPress={(e) => handleKeyPress(e, () => setViewMode('list'))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
              aria-label="List view"
            >
              <List size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Notes Display */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Edit3 size={24} className="text-gray-600 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto text-sm sm:text-base">
              {searchQuery 
                ? 'Try adjusting your search terms.'
                : 'Create your first note to get started with organizing your thoughts.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowEditor(true)}
                onKeyPress={(e) => handleKeyPress(e, () => setShowEditor(true))}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Create your first note"
              >
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note.id)}
                onKeyPress={(e) => handleKeyPress(e, () => setSelectedNote(note.id))}
                className={`bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                  viewMode === 'list' ? 'flex items-center gap-4' : ''
                }`}
                role="button"
                tabIndex={0}
                aria-label={`Note: ${note.title}`}
              >
                {viewMode === 'list' ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-lg truncate">{note.title}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2" 
                         dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-white text-gray-600 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        onKeyPress={(e) => {
                          e.stopPropagation();
                          handleKeyPress(e, () => deleteNote(note.id));
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                        aria-label="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-medium text-gray-900 text-lg leading-tight flex-1 pr-2">
                        {note.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        onKeyPress={(e) => {
                          e.stopPropagation();
                          handleKeyPress(e, () => deleteNote(note.id));
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                        aria-label="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div 
                      className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4"
                      dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' }}
                    />
                    
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-white text-gray-600 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 