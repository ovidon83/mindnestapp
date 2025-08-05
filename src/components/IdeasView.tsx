import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Edit3, Trash2, FolderPlus, Target, FileText, Sparkles, X, Zap, Clock, MoreHorizontal } from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

const potentialColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-green-100 text-green-700',
};

const categoryColors = {
  app: 'bg-blue-100 text-blue-700',
  business: 'bg-purple-100 text-purple-700',
  feature: 'bg-green-100 text-green-700',
  product: 'bg-orange-100 text-orange-700',
  service: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

export const IdeasView: React.FC = () => {
  const [editingIdea, setEditingIdea] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDescription, setNewIdeaDescription] = useState('');
  const [sortBy, setSortBy] = useState<'potential' | 'updated' | 'category'>('potential');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPotential, setFilterPotential] = useState<string>('all');
  
  const { ideas, addIdea, updateIdea, deleteIdea, addProject, addTodo, addNote } = useMindnestStore();

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    potential: '',
    tags: [] as string[],
    newTag: '',
  });

  const handleStartEdit = (idea: any) => {
    setEditingIdea(idea.id);
    setEditForm({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      potential: idea.potential,
      tags: idea.tags || [],
      newTag: '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingIdea) return;
    updateIdea(editingIdea, {
      title: editForm.title,
      description: editForm.description,
      category: editForm.category as any,
      potential: editForm.potential as any,
      tags: editForm.tags,
    });
    setEditingIdea(null);
  };

  const handleCancelEdit = () => {
    setEditingIdea(null);
  };

  const handleConvertToProject = (idea: any) => {
    addProject({
      name: idea.title,
      description: idea.description,
      status: 'idea',
      tags: idea.tags || [],
    });
    deleteIdea(idea.id);
  };

  const handleConvertToTasks = (idea: any) => {
    const tasks = [
      `Research market for: ${idea.title}`,
      `Create prototype for: ${idea.title}`,
      `Validate idea: ${idea.title}`,
    ];
    
    tasks.forEach(task => {
      addTodo({
        content: task,
        completed: false,
        priority: 'medium',
        status: 'To Do',
        tags: idea.tags || [],
      });
    });
    deleteIdea(idea.id);
  };

  const handleConvertToNote = (idea: any) => {
    addNote({
      title: idea.title,
      content: idea.description,
      tags: idea.tags || [],
    });
    deleteIdea(idea.id);
  };

  const handleCreateIdea = () => {
    if (!newIdeaTitle.trim() || !newIdeaDescription.trim()) return;

    addIdea({
      title: newIdeaTitle.trim(),
      description: newIdeaDescription.trim(),
      category: 'other',
      status: 'concept',
      potential: 'medium',
      tags: [],
    });

    setNewIdeaTitle('');
    setNewIdeaDescription('');
    setShowNewIdeaForm(false);
  };

  const handleEnhanceIdea = async (ideaId: string, description: string) => {
    setIsProcessing(true);
    
    try {
      const response = await AIService.enhanceIdea(description);
      if (response.success && response.data) {
        updateIdea(ideaId, {
          description: response.data.enhancedDescription || description,
          tags: response.data.suggestedTags || [],
        });
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter and sort ideas
  const filteredIdeas = ideas.filter(idea => {
    if (filterCategory !== 'all' && idea.category !== filterCategory) return false;
    if (filterPotential !== 'all' && idea.potential !== filterPotential) return false;
    return true;
  });

  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    switch (sortBy) {
      case 'potential':
        const potentialOrder = { high: 3, medium: 2, low: 1 };
        return potentialOrder[b.potential] - potentialOrder[a.potential];
      case 'updated':
        const aDate = typeof a.updatedAt === 'string' ? new Date(Date.parse(a.updatedAt)) : a.updatedAt;
        const bDate = typeof b.updatedAt === 'string' ? new Date(Date.parse(b.updatedAt)) : b.updatedAt;
        return bDate.getTime() - aDate.getTime();
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-full flex items-center justify-center">
              <Zap size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">Ideas & Inspiration</h1>
              <p className="text-sm text-gray-600 mt-1">
                {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewIdeaForm(true)}
            onKeyPress={(e) => handleKeyPress(e, () => setShowNewIdeaForm(true))}
            className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium min-h-[48px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
            aria-label="Create new idea"
          >
            <Plus size={16} />
            New Idea
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-wrap gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                <option value="app">App</option>
                <option value="business">Business</option>
                <option value="feature">Feature</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={filterPotential}
                onChange={(e) => setFilterPotential(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                aria-label="Filter by potential"
              >
                <option value="all">All Potential</option>
                <option value="high">High Potential</option>
                <option value="medium">Medium Potential</option>
                <option value="low">Low Potential</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                aria-label="Sort by"
              >
                <option value="potential">Sort by Potential</option>
                <option value="updated">Sort by Updated</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ideas Table */}
        {ideas.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap size={24} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No ideas yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Capture your creative thoughts and turn them into actionable projects.
            </p>
            <button
              onClick={() => setShowNewIdeaForm(true)}
              onKeyPress={(e) => handleKeyPress(e, () => setShowNewIdeaForm(true))}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Create your first idea"
            >
              Create Idea
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idea
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Potential
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedIdeas.map((idea) => (
                    <tr key={idea.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {editingIdea === idea.id ? (
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full text-lg font-light text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 mb-2"
                              placeholder="Idea title..."
                              aria-label="Idea title"
                            />
                            <textarea
                              value={editForm.description}
                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              placeholder="Describe your idea..."
                              className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm resize-none"
                              rows={3}
                              aria-label="Idea description"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                                aria-label="Save changes"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                                aria-label="Cancel editing"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-xs">{idea.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs" dangerouslySetInnerHTML={{ __html: idea.description }} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[idea.category] || categoryColors.other}`}>
                          {idea.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${potentialColors[idea.potential]}`}>
                          {idea.potential}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(idea.updatedAt), 'MMM d')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(idea)}
                            onKeyPress={(e) => handleKeyPress(e, () => handleStartEdit(idea))}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                            aria-label="Edit idea"
                          >
                            <Edit3 size={14} />
                          </button>
                          
                          <div className="relative group">
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                              aria-label="More actions"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleConvertToProject(idea)}
                                  onKeyPress={(e) => handleKeyPress(e, () => handleConvertToProject(idea))}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  aria-label="Convert to project"
                                >
                                  <FolderPlus size={14} />
                                  Convert to Project
                                </button>
                                <button
                                  onClick={() => handleConvertToTasks(idea)}
                                  onKeyPress={(e) => handleKeyPress(e, () => handleConvertToTasks(idea))}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  aria-label="Convert to tasks"
                                >
                                  <Target size={14} />
                                  Convert to Tasks
                                </button>
                                <button
                                  onClick={() => handleConvertToNote(idea)}
                                  onKeyPress={(e) => handleKeyPress(e, () => handleConvertToNote(idea))}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  aria-label="Convert to note"
                                >
                                  <FileText size={14} />
                                  Convert to Note
                                </button>
                                <button
                                  onClick={() => handleEnhanceIdea(idea.id, idea.description)}
                                  onKeyPress={(e) => handleKeyPress(e, () => handleEnhanceIdea(idea.id, idea.description))}
                                  disabled={isProcessing}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                                  aria-label="Enhance with AI"
                                >
                                  <Sparkles size={14} />
                                  {isProcessing ? 'Enhancing...' : 'Enhance with AI'}
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => deleteIdea(idea.id)}
                                  onKeyPress={(e) => handleKeyPress(e, () => deleteIdea(idea.id))}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  aria-label="Delete idea"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Idea Modal */}
        {showNewIdeaForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-idea-title"
          >
            <div className="bg-white rounded-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 id="new-idea-title" className="text-lg font-medium text-gray-900">Create New Idea</h3>
                  <button
                    onClick={() => setShowNewIdeaForm(false)}
                    onKeyPress={(e) => handleKeyPress(e, () => setShowNewIdeaForm(false))}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <input
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="Idea title..."
                  className="w-full p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 text-lg"
                  aria-label="Idea title"
                />
                
                <textarea
                  value={newIdeaDescription}
                  onChange={(e) => setNewIdeaDescription(e.target.value)}
                  placeholder="Describe your idea..."
                  className="w-full h-32 p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 resize-none"
                  aria-label="Idea description"
                />
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewIdeaForm(false)}
                  onKeyPress={(e) => handleKeyPress(e, () => setShowNewIdeaForm(false))}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                  aria-label="Cancel creating idea"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIdea}
                  onKeyPress={(e) => handleKeyPress(e, handleCreateIdea)}
                  disabled={!newIdeaTitle.trim() || !newIdeaDescription.trim()}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Create idea"
                >
                  Create Idea
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 