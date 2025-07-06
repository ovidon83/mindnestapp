import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Edit3, Trash2, FolderPlus, Target, FileText, Sparkles, X, Zap } from 'lucide-react';
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

  const handleAddTag = () => {
    if (editForm.newTag.trim() && !editForm.tags.includes(editForm.newTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
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

  const sortedIdeas = [...ideas].sort((a, b) => {
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
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
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
            >
              <option value="potential">Sort by: Potential</option>
              <option value="updated">Sort by: Updated</option>
              <option value="category">Sort by: Category</option>
            </select>
            
            <button
              onClick={() => setShowNewIdeaForm(true)}
              className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium min-h-[48px] touch-manipulation"
            >
              <Plus size={16} />
              New Idea
            </button>
          </div>
        </div>

        {/* Ideas Grid */}
        {sortedIdeas.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap size={24} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No ideas yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Capture your creative ideas and turn them into actionable projects.
            </p>
            <button
              onClick={() => setShowNewIdeaForm(true)}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Add Your First Idea
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                {editingIdea === idea.id ? (
                  <div className="space-y-4">
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 font-medium text-lg"
                      placeholder="Idea title..."
                    />
                    
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none h-24"
                      placeholder="Describe your idea..."
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={editForm.potential}
                        onChange={(e) => setEditForm(prev => ({ ...prev, potential: e.target.value }))}
                        className="p-2 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                      >
                        <option value="low">Low Potential</option>
                        <option value="medium">Medium Potential</option>
                        <option value="high">High Potential</option>
                      </select>
                      
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                        className="p-2 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                      >
                        <option value="app">App</option>
                        <option value="business">Business</option>
                        <option value="feature">Feature</option>
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {editForm.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-white text-gray-700 rounded-full text-xs flex items-center gap-1">
                            {tag}
                            <button 
                              onClick={() => handleRemoveTag(tag)} 
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={editForm.newTag}
                          onChange={(e) => setEditForm(prev => ({ ...prev, newTag: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="Add tag..."
                          className="flex-1 p-2 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                        />
                        <button 
                          onClick={handleAddTag} 
                          className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleSaveEdit} 
                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button 
                        onClick={handleCancelEdit} 
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-900 text-lg leading-tight flex-1 pr-2">
                        {idea.title}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(idea)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteIdea(idea.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {idea.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${potentialColors[idea.potential]}`}>
                        {idea.potential}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[idea.category]}`}>
                        {idea.category}
                      </span>
                    </div>
                    
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {idea.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-white text-gray-600 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                        {idea.tags.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{idea.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        {format(typeof idea.updatedAt === 'string' ? new Date(Date.parse(idea.updatedAt)) : idea.updatedAt, 'MMM d')}
                      </span>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEnhanceIdea(idea.id, idea.description)}
                          disabled={isProcessing}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                          title="Enhance with AI"
                        >
                          <Sparkles size={14} />
                        </button>
                        <button
                          onClick={() => handleConvertToProject(idea)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Convert to Project"
                        >
                          <FolderPlus size={14} />
                        </button>
                        <button
                          onClick={() => handleConvertToTasks(idea)}
                          className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Convert to Tasks"
                        >
                          <Target size={14} />
                        </button>
                        <button
                          onClick={() => handleConvertToNote(idea)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Convert to Note"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Idea Modal */}
        {showNewIdeaForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Create New Idea</h3>
                  <button
                    onClick={() => setShowNewIdeaForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                />
                
                <textarea
                  value={newIdeaDescription}
                  onChange={(e) => setNewIdeaDescription(e.target.value)}
                  placeholder="Describe your idea..."
                  className="w-full h-32 p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 resize-none"
                />
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewIdeaForm(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIdea}
                  disabled={!newIdeaTitle.trim() || !newIdeaDescription.trim()}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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