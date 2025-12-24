import React, { useState } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought, Potential } from '../types';
import { Sparkles, Plus, Edit2, Trash2, X } from 'lucide-react';
import UserAvatar from './UserAvatar';

type Filter = 'all' | 'sparks' | 'potential';

const ThoughtsView: React.FC = () => {
  const { 
    thoughts, 
    loading, 
    user, 
    signOut, 
    setCurrentView, 
    updateThought, 
    deleteThought, 
    addSpark, 
    removeSpark,
    addPotential,
    removePotential,
    createAction,
  } = useGenieNotesStore();
  
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAddPotential, setShowAddPotential] = useState<string | null>(null);
  const [newPotentialType, setNewPotentialType] = useState<Potential['type']>('Post');
  const [newPotentialTitle, setNewPotentialTitle] = useState('');

  // Filter thoughts
  const filteredThoughts = thoughts.filter(thought => {
    if (filter === 'sparks') return thought.isSpark;
    if (filter === 'potential') return thought.isSpark && thought.potentials.length > 0;
    return true;
  });

  const handleEdit = (thought: Thought) => {
    setEditingId(thought.id);
    setEditText(thought.originalText);
  };

  const handleSaveEdit = async (id: string) => {
    await updateThought(id, { originalText: editText });
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleAddPotential = async (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (thought && thought.isSpark && thought.potentials.length < 3) {
      await addPotential(thoughtId, {
        id: crypto.randomUUID(),
        type: newPotentialType,
        title: newPotentialTitle || newPotentialType,
        createdAt: new Date(),
      });
      setShowAddPotential(null);
      setNewPotentialTitle('');
      setNewPotentialType('Post');
    }
  };

  const handleCreateAction = async (thoughtId: string, potential: Potential) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (thought) {
      await createAction(
        thoughtId,
        potential.type === 'Post' ? 'post' : 
        potential.type === 'Email' ? 'email' :
        potential.type === 'Conversation' ? 'conversation' :
        potential.type === 'Explore Further' ? 'exploration' :
        potential.type === 'Article' ? 'article' : 'project',
        potential.title,
        potential.draft || ''
      );
      setCurrentView('actions');
    }
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Thoughts</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('capture')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Thought</span>
              </button>
              <UserAvatar user={user} onLogout={signOut} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('sparks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'sparks'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Sparks
            </button>
            <button
              onClick={() => setFilter('potential')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'potential'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Potential
            </button>
          </div>
        </div>
      </div>

      {/* Thoughts List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">
              {filter === 'all' 
                ? "No thoughts yet. Capture your first thought!"
                : filter === 'sparks'
                ? "No sparks yet. Thoughts marked as significant will appear here."
                : "No thoughts with potential yet."}
            </p>
            <button
              onClick={() => setCurrentView('capture')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Capture a Thought
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredThoughts.map((thought) => (
              <div
                key={thought.id}
                className="bg-white rounded-lg border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors"
              >
                {/* Thought Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {editingId === thought.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(thought.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-900 text-lg leading-relaxed mb-2">
                          {thought.originalText}
                        </p>
                        <p className="text-sm text-slate-500">{thought.summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!editingId && (
                      <>
                        <button
                          onClick={() => handleEdit(thought)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteThought(thought.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Spark Toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => thought.isSpark ? removeSpark(thought.id) : addSpark(thought.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      thought.isSpark
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {thought.isSpark ? 'Spark' : 'Add Spark'}
                  </button>
                  {thought.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {thought.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Potentials (only if Spark) */}
                {thought.isSpark && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700">Potential</h3>
                      {thought.potentials.length < 3 && (
                        <button
                          onClick={() => setShowAddPotential(thought.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    
                    {showAddPotential === thought.id && (
                      <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                        <div className="space-y-2">
                          <select
                            value={newPotentialType}
                            onChange={(e) => setNewPotentialType(e.target.value as Potential['type'])}
                            className="w-full p-2 border border-slate-300 rounded-lg"
                          >
                            <option value="Post">Post</option>
                            <option value="Conversation">Conversation</option>
                            <option value="Explore Further">Explore Further</option>
                            <option value="Email">Email</option>
                            <option value="Article">Article</option>
                            <option value="Project">Project</option>
                          </select>
                          <input
                            type="text"
                            value={newPotentialTitle}
                            onChange={(e) => setNewPotentialTitle(e.target.value)}
                            placeholder="Title (optional)"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddPotential(thought.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setShowAddPotential(null);
                                setNewPotentialTitle('');
                              }}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {thought.potentials.map((potential) => (
                        <div
                          key={potential.id}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{potential.title}</p>
                            {potential.description && (
                              <p className="text-sm text-slate-600">{potential.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCreateAction(thought.id, potential)}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                            >
                              Act
                            </button>
                            <button
                              onClick={() => removePotential(thought.id, potential.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default ThoughtsView;

