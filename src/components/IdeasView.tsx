import React, { useState } from 'react';
import { Lightbulb, Plus, Edit2, Trash2, Star, ArrowRight, Search, Filter, CheckCircle, Circle } from 'lucide-react';
import { useMindnestStore } from '../store';

type IdeaStatus = 'new' | 'developing' | 'implemented' | 'shelved';

export const IdeasView: React.FC = () => {
  const [newIdea, setNewIdea] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');

  const { thoughts, addThought, updateThought, deleteThought } = useMindnestStore();

  // Filter ideas
  const ideas = thoughts
    .filter(thought => thought.type === 'idea')
    .filter(idea => 
      idea.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === 'all' || idea.category === statusFilter)
    )
    .sort((a, b) => {
      const aDate = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const bDate = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return bDate.getTime() - aDate.getTime();
    });

  const statusOptions: { value: IdeaStatus, label: string, color: string }[] = [
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'developing', label: 'Developing', color: 'yellow' },
    { value: 'implemented', label: 'Implemented', color: 'green' },
    { value: 'shelved', label: 'Shelved', color: 'gray' },
  ];

  const handleAddIdea = () => {
    if (!newIdea.trim()) return;
    
    addThought({
      content: newIdea,
      type: 'idea',
      category: 'new',
      tags: []
    });
    
    setNewIdea('');
  };

  const handleEdit = (ideaId: string, content: string) => {
    setEditingId(ideaId);
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

  const handleDelete = (ideaId: string) => {
    deleteThought(ideaId);
  };

  const handleStatusChange = (ideaId: string, newStatus: IdeaStatus) => {
    updateThought(ideaId, { category: newStatus });
  };

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    if (!statusOption) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusOption.color}-100 text-${statusOption.color}-800`}>
        {statusOption.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Circle size={16} className="text-blue-600" />;
      case 'developing':
        return <Star size={16} className="text-yellow-600" />;
      case 'implemented':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'shelved':
        return <Circle size={16} className="text-gray-400" />;
      default:
        return <Circle size={16} className="text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Lightbulb className="text-yellow-600" size={36} />
            Ideas
          </h1>
          <p className="text-gray-600">
            Capture, develop, and track your brilliant ideas
          </p>
        </div>

        {/* Add New Idea */}
        <div className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900">New Idea</h2>
              <p className="text-sm text-gray-600">What's your next big idea?</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="Describe your idea..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddIdea();
                }
              }}
            />
            <button
              onClick={handleAddIdea}
              disabled={!newIdea.trim()}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Idea
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | 'all')}
            className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">All statuses</option>
            {statusOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Ideas Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {ideas.length === 0 ? (
            <div className="p-12 text-center">
              <Lightbulb size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No ideas yet</h3>
              <p className="text-gray-600">Add your first brilliant idea above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idea
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(idea.category)}
                          <select
                            value={idea.category}
                            onChange={(e) => handleStatusChange(idea.id, e.target.value as IdeaStatus)}
                            className="text-sm border-none bg-transparent focus:ring-2 focus:ring-yellow-500 rounded"
                          >
                            {statusOptions.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === idea.id ? (
                          <div className="space-y-2">
                            <input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit();
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
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
                          <div className="max-w-md">
                            <p className="text-gray-900 font-medium">{idea.content}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(idea.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(idea.id, idea.content)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(idea.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusOptions.map(({ value, label, color }) => {
            const count = ideas.filter(idea => idea.category === value).length;
            return (
              <div key={value} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                    {getStatusIcon(value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};