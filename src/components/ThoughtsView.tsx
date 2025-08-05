import React, { useState } from 'react';
import { MessageCircle, Plus, Edit2, Trash2, Search, Tag, Calendar, Brain } from 'lucide-react';
import { useMindnestStore } from '../store';

export const ThoughtsView: React.FC = () => {
  const [newThought, setNewThought] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { thoughts, addThought, updateThought, deleteThought } = useMindnestStore();

  // Filter random thoughts
  const randomThoughts = thoughts
    .filter(thought => thought.type === 'random')
    .filter(thought => 
      thought.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aDate = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const bDate = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return bDate.getTime() - aDate.getTime();
    });

  const handleAddThought = () => {
    if (!newThought.trim()) return;
    
    addThought({
      content: newThought,
      type: 'random',
      category: 'thought',
      tags: []
    });
    
    setNewThought('');
  };

  const handleEdit = (thoughtId: string, content: string) => {
    setEditingId(thoughtId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateThought(editingId, { content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (thoughtId: string) => {
    deleteThought(thoughtId);
  };

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const getRandomColor = () => {
    const colors = [
      'bg-purple-100 border-purple-200',
      'bg-blue-100 border-blue-200',
      'bg-green-100 border-green-200',
      'bg-yellow-100 border-yellow-200',
      'bg-pink-100 border-pink-200',
      'bg-indigo-100 border-indigo-200',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <MessageCircle className="text-indigo-600" size={36} />
            Thoughts
          </h1>
          <p className="text-gray-600 font-medium">
            Random musings, fleeting thoughts, and mental notes
          </p>
        </div>

        {/* Add New Thought */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900">Quick Thought</h2>
              <p className="text-sm text-gray-600">What's crossing your mind?</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="Just a random thought..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddThought();
                }
              }}
            />
            <button
              onClick={handleAddThought}
              disabled={!newThought.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Capture
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search thoughts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Thoughts Grid */}
        <div className="space-y-4">
          {randomThoughts.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <Brain size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No thoughts captured yet</h3>
              <p className="text-gray-600">Start capturing your random thoughts above!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {randomThoughts.map((thought, index) => (
                <div
                  key={thought.id}
                  className={`p-4 rounded-xl border-2 hover:shadow-lg transition-all group ${
                    index % 6 === 0 ? 'bg-purple-50 border-purple-200' :
                    index % 6 === 1 ? 'bg-blue-50 border-blue-200' :
                    index % 6 === 2 ? 'bg-green-50 border-green-200' :
                    index % 6 === 3 ? 'bg-yellow-50 border-yellow-200' :
                    index % 6 === 4 ? 'bg-pink-50 border-pink-200' :
                    'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  {editingId === thought.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <MessageCircle size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(thought.id, thought.content)}
                            className="p-1 text-gray-400 hover:bg-white/50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(thought.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-800 text-sm leading-relaxed mb-3">
                        {thought.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(thought.timestamp)}
                        </span>
                        {thought.tags && thought.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag size={12} />
                            <span>{thought.tags.length} tag{thought.tags.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {randomThoughts.length > 0 && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Thinking Patterns</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{randomThoughts.length}</p>
                <p className="text-sm text-gray-600">Total Thoughts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {randomThoughts.filter(t => {
                    const date = t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp);
                    return date.toDateString() === new Date().toDateString();
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">
                  {randomThoughts.filter(t => {
                    const date = t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(randomThoughts.reduce((acc, t) => acc + t.content.length, 0) / randomThoughts.length) || 0}
                </p>
                <p className="text-sm text-gray-600">Avg Length</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};