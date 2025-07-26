import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Inbox,
  Lightbulb,
  Heart,
  Target,
  Calendar,
  Tag
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

type ViewType = 'all' | 'today' | 'inbox' | 'ideas' | 'tasks' | 'emotions';



export const ThoughtsTab: React.FC = () => {
  const [newThought, setNewThought] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showInput, setShowInput] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [aiNextSteps, setAiNextSteps] = useState<string[]>([]);
  const [editingThought, setEditingThought] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { thoughts, addThought, updateThought, deleteThought } = useMindnestStore();

  // Clear confirmation after 3 seconds
  useEffect(() => {
    if (confirmation) {
      const timer = setTimeout(() => setConfirmation(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThought.trim() || isProcessing) return;

    setIsProcessing(true);
    setConfirmation('');
    setAiNextSteps([]);

    try {
      const result = await AIService.analyzeThought(newThought);
      if (result.success && result.data) {
        const aiData = result.data as any;
        setAiNextSteps(Array.isArray(aiData.nextSteps) ? aiData.nextSteps : []);
        
        addThought({
          content: newThought,
          type: 'random',
          tags: aiData.tags || [],
          metadata: {
            category: aiData.category || 'idea',
            label: aiData.label || 'personal',
            priority: aiData.priority || 'medium',
            dueDate: aiData.dueDate ? new Date(aiData.dueDate) : undefined,
            linkedThoughts: aiData.linkedThoughts || [],
            status: 'new',
            aiInsights: aiData.insight,
            mood: aiData.mood,
          },
        });
        
        setConfirmation('Thought captured and analyzed!');
        setNewThought('');
        setShowInput(false);
      }
    } catch (error) {
      console.error('AI processing failed:', error);
      // Fallback: add thought without AI
      addThought({
        content: newThought,
        type: 'random',
        tags: [],
        metadata: {
          category: 'idea',
          priority: 'medium',
          status: 'new',
        },
      });
      setConfirmation('Thought captured! (AI unavailable)');
      setNewThought('');
      setShowInput(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (thoughtId: string, content: string) => {
    setEditingThought(thoughtId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (editingThought && editContent.trim()) {
      updateThought(editingThought, { content: editContent.trim() });
      setEditingThought(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingThought(null);
    setEditContent('');
  };

  const getFilteredThoughts = () => {
    let filtered = thoughts;

    // Filter by view
    switch (currentView) {
      case 'today':
        const today = new Date().toDateString();
        filtered = thoughts.filter(t => {
          const due = t.metadata?.dueDate ? new Date(t.metadata.dueDate).toDateString() : null;
          return (
            t.metadata?.status === 'new' ||
            due === today ||
            t.metadata?.priority === 'high' ||
            (t.tags && t.tags.some((tag: string) => ['today', 'urgent'].includes(tag.toLowerCase())))
          );
        });
        break;
      case 'inbox':
        filtered = thoughts.filter(t => t.metadata?.status === 'new');
        break;
      case 'ideas':
        filtered = thoughts.filter(t => t.metadata?.category === 'idea');
        break;
      case 'tasks':
        filtered = thoughts.filter(t => t.metadata?.category === 'task');
        break;
      case 'emotions':
        filtered = thoughts.filter(t => t.metadata?.category === 'emotion');
        break;
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.metadata?.priority === filterPriority);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case 'all': return <Target size={16} />;
      case 'today': return <Calendar size={16} />;
      case 'inbox': return <Inbox size={16} />;
      case 'ideas': return <Lightbulb size={16} />;
      case 'tasks': return <CheckCircle size={16} />;
      case 'emotions': return <Heart size={16} />;
    }
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case 'all': return 'All Thoughts';
      case 'today': return 'Today';
      case 'inbox': return 'Inbox';
      case 'ideas': return 'Ideas';
      case 'tasks': return 'Tasks';
      case 'emotions': return 'Emotions';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'task': return 'text-blue-600 bg-blue-50';
      case 'idea': return 'text-purple-600 bg-purple-50';
      case 'emotion': return 'text-pink-600 bg-pink-50';
      case 'reminder': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredThoughts = getFilteredThoughts();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thoughts</h1>
        <p className="text-gray-600">Capture, organize, and act on your thoughts with AI assistance</p>
      </div>

      {/* Thought Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center justify-center space-x-2 py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 transition-colors"
          >
            <Plus size={20} />
            <span className="font-medium">What's on your mind?</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="Type anything that comes to mind..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isProcessing}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Sparkles size={16} />
                <span>AI will categorize and suggest next steps</span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInput(false);
                    setNewThought('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newThought.trim() || isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      <span>Add Thought</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {confirmation && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{confirmation}</p>
          </div>
        )}

        {aiNextSteps.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles size={16} className="text-blue-600" />
              <span className="font-medium text-blue-900">AI Suggestions</span>
            </div>
            <ul className="space-y-1">
              {aiNextSteps.map((step, index) => (
                <li key={index} className="text-blue-800 text-sm flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* View Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'today', 'inbox', 'ideas', 'tasks', 'emotions'] as ViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === view
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {getViewIcon(view)}
            <span>{getViewTitle(view)}</span>
          </button>
        ))}
      </div>

      {/* Thoughts List */}
      <div className="space-y-4">
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-12">
            <Brain size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No thoughts found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or add a new thought</p>
          </div>
        ) : (
          filteredThoughts.map((thought) => (
            <div
              key={thought.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {editingThought === thought.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-gray-900 leading-relaxed">{thought.content}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(thought.id, thought.content)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteThought(thought.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {thought.metadata?.category && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(thought.metadata.category)}`}>
                          {thought.metadata.category}
                        </span>
                      )}
                      {thought.metadata?.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(thought.metadata.priority)}`}>
                          {thought.metadata.priority}
                        </span>
                      )}
                                             {thought.tags && thought.tags.length > 0 && (
                         <div className="flex items-center space-x-1">
                           <Tag size={12} className="text-gray-400" />
                           <span className="text-xs text-gray-500">
                             {thought.tags.slice(0, 2).join(', ')}
                             {thought.tags.length > 2 && ` +${thought.tags.length - 2}`}
                           </span>
                         </div>
                       )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{new Date(thought.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {thought.metadata?.aiInsights && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Sparkles size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-900">AI Insight</span>
                      </div>
                      <p className="text-sm text-blue-800">{thought.metadata.aiInsights}</p>
                    </div>
                  )}

                  {thought.metadata?.nextSteps && thought.metadata.nextSteps.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target size={14} className="text-green-600" />
                        <span className="text-xs font-medium text-green-900">Next Steps</span>
                      </div>
                                             <ul className="space-y-1">
                         {thought.metadata.nextSteps.map((step: string, index: number) => (
                           <li key={index} className="text-sm text-green-800 flex items-start space-x-2">
                             <span className="text-green-600 mt-1">•</span>
                             <span>{step}</span>
                           </li>
                         ))}
                       </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 