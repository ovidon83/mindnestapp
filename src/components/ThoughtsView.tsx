import React, { useState } from 'react';
import { 
  Brain, 
  Calendar, 
  Inbox, 
  Lightbulb, 
  Heart, 
  Search, 
  Clock,
  Target,
  CheckCircle,
  Sparkles,
  Bell
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

type ViewType = 'today' | 'inbox' | 'ideas' | 'feelings';

interface ProcessedThought {
  id: string;
  originalContent: string;
  category: 'task' | 'emotion' | 'idea' | 'reminder' | 'reflection';
  label: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  linkedThoughts: string[];
  status: 'new' | 'reviewed' | 'acted' | 'archived';
  createdAt: Date;
  aiInsights?: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  tags: string[];
}

export const ThoughtsView: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [newThought, setNewThought] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNudges, setShowNudges] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [aiNextSteps, setAiNextSteps] = useState<string[]>([]);
  const [lastProcessedThought, setLastProcessedThought] = useState<string>('');
  
  const { thoughts, addThought, updateThought, deleteThought } = useMindnestStore();

  // Convert thoughts from store to ProcessedThought format for display
  const processedThoughts: ProcessedThought[] = thoughts
    .filter(thought => thought.type === 'random')
    .map(thought => ({
      id: thought.id,
      originalContent: thought.content,
      category: thought.metadata?.category || 'reflection',
      label: thought.metadata?.label || 'personal',
      priority: thought.metadata?.priority || 'medium',
      dueDate: thought.metadata?.dueDate ? new Date(thought.metadata.dueDate) : undefined,
      linkedThoughts: thought.metadata?.linkedThoughts || [],
      status: thought.metadata?.status || 'new',
      createdAt: thought.timestamp,
      aiInsights: thought.metadata?.aiInsights,
      mood: thought.metadata?.mood,
      tags: thought.tags || [],
    }));

  // Process thoughts with AI categorization
  const processThought = async (content: string) => {
    if (!content.trim()) return;
    setIsProcessing(true);
    setLastProcessedThought(content);
    setAiNextSteps([]);
    try {
      // Use AI to categorize and enhance the thought
      const result = await AIService.analyzeThought(content);
      if (result.success && result.data) {
        setAiAvailable(true);
        const aiData = result.data as any;
        setAiNextSteps(Array.isArray(aiData.nextSteps) ? aiData.nextSteps : []);
        // Add to main store with all the categorization data
        addThought({
          content,
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
      } else {
        // AI service failed, use fallback
        setAiAvailable(false);
        setAiNextSteps([]);
        const fallbackThought = createFallbackThought(content);
        addThought({
          content,
          type: 'random',
          tags: fallbackThought.tags,
          metadata: {
            category: fallbackThought.category,
            label: fallbackThought.label,
            priority: fallbackThought.priority,
            dueDate: fallbackThought.dueDate,
            linkedThoughts: fallbackThought.linkedThoughts,
            status: fallbackThought.status,
            aiInsights: fallbackThought.aiInsights,
            mood: fallbackThought.mood,
          },
        });
      }
    } catch (error) {
      console.error('Error processing thought:', error);
      setAiAvailable(false);
      setAiNextSteps([]);
      const fallbackThought = createFallbackThought(content);
      addThought({
        content,
        type: 'random',
        tags: fallbackThought.tags,
        metadata: {
          category: fallbackThought.category,
          label: fallbackThought.label,
          priority: fallbackThought.priority,
          dueDate: fallbackThought.dueDate,
          linkedThoughts: fallbackThought.linkedThoughts,
          status: fallbackThought.status,
          aiInsights: fallbackThought.aiInsights,
          mood: fallbackThought.mood,
        },
      });
    } finally {
      setIsProcessing(false);
      setNewThought('');
    }
  };

  // Update thought status
  const updateThoughtStatus = (thoughtId: string, status: 'new' | 'reviewed' | 'acted' | 'archived') => {
    updateThought(thoughtId, {
      metadata: {
        status,
      },
    });
  };

  // Simple fallback categorization when AI is not available
  const createFallbackThought = (content: string): ProcessedThought => {
    const lowerContent = content.toLowerCase();
    
    // Simple keyword-based categorization
    let category: 'task' | 'emotion' | 'idea' | 'reminder' | 'reflection' = 'reflection';
    let label = 'personal';
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible' | undefined;
    let tags: string[] = [];
    let insights = '';

    // Detect emotions
    if (lowerContent.includes('feel') || lowerContent.includes('feeling') || 
        lowerContent.includes('sad') || lowerContent.includes('happy') || 
        lowerContent.includes('angry') || lowerContent.includes('excited') ||
        lowerContent.includes('off') || lowerContent.includes('good') || 
        lowerContent.includes('bad') || lowerContent.includes('terrible')) {
      category = 'emotion';
      label = 'personal';
      
      if (lowerContent.includes('off') || lowerContent.includes('bad') || lowerContent.includes('terrible')) {
        mood = 'bad';
        insights = 'This seems like a challenging emotional state. Consider what might be contributing to this feeling.';
      } else if (lowerContent.includes('good') || lowerContent.includes('happy') || lowerContent.includes('excited')) {
        mood = 'good';
        insights = 'Positive emotions detected! This could be a good moment for reflection or action.';
      } else {
        mood = 'okay';
        insights = 'Emotional state noted. Regular check-ins can help track patterns over time.';
      }
    }
    // Detect tasks
    else if (lowerContent.includes('should') || lowerContent.includes('need to') || 
             lowerContent.includes('have to') || lowerContent.includes('must') ||
             lowerContent.includes('remember') || lowerContent.includes('don\'t forget')) {
      category = 'task';
      label = 'personal';
      priority = 'medium';
      insights = 'This appears to be an actionable item. Consider setting a specific timeline or reminder.';
    }
    // Detect ideas
    else if (lowerContent.includes('what if') || lowerContent.includes('maybe') || 
             lowerContent.includes('could') || lowerContent.includes('would be cool') ||
             lowerContent.includes('idea') || lowerContent.includes('think')) {
      category = 'idea';
      label = 'creative';
      insights = 'Creative thought captured! This could be worth exploring further when you have time.';
    }
    // Detect reminders
    else if (lowerContent.includes('remind') || lowerContent.includes('call') || 
             lowerContent.includes('email') || lowerContent.includes('meeting') ||
             lowerContent.includes('appointment')) {
      category = 'reminder';
      label = 'work';
      priority = 'high';
      insights = 'This looks like something you\'ll want to follow up on. Consider adding it to your calendar.';
    }

    // Extract simple tags
    const words = content.split(' ').filter(word => word.length > 3);
    tags = words.slice(0, 3).map(word => word.toLowerCase().replace(/[^a-z]/g, ''));

    return {
      id: crypto.randomUUID(),
      originalContent: content,
      category,
      label,
      priority,
      linkedThoughts: [],
      status: 'new',
      createdAt: new Date(),
      aiInsights: insights,
      mood,
      tags,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processThought(newThought);
  };

  // Filter thoughts based on current view
  const getFilteredThoughts = () => {
    let filtered = processedThoughts;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(thought => 
        thought.originalContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thought.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply view-specific filters
    switch (currentView) {
      case 'today':
        return filtered.filter(thought =>
          thought.status === 'new' ||
          (thought.dueDate && new Date(thought.dueDate).toDateString() === new Date().toDateString()) ||
          thought.priority === 'high' ||
          thought.tags.some(tag => ['today', 'urgent'].includes(tag.toLowerCase()))
        ).sort((a, b) => {
          // Group actionable (task, reminder) first, then by priority
          const aAction = a.category === 'task' || a.category === 'reminder';
          const bAction = b.category === 'task' || b.category === 'reminder';
          if (aAction !== bAction) return aAction ? -1 : 1;
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
        });
      case 'inbox':
        return filtered.filter(thought => thought.status === 'new');
      case 'ideas':
        return filtered.filter(thought => thought.category === 'idea');
      case 'feelings':
        return filtered.filter(thought => thought.category === 'emotion' || thought.mood);
      default:
        return filtered;
    }
  };

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case 'today': return <Calendar size={20} />;
      case 'inbox': return <Inbox size={20} />;
      case 'ideas': return <Lightbulb size={20} />;
      case 'feelings': return <Heart size={20} />;
    }
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case 'today': return 'Today';
      case 'inbox': return 'Inbox';
      case 'ideas': return 'Ideas';
      case 'feelings': return 'Feelings';
    }
  };

  const getViewDescription = (view: ViewType) => {
    switch (view) {
      case 'today': return 'What matters now';
      case 'inbox': return 'New thoughts waiting for review';
      case 'ideas': return 'Creative & strategic thoughts';
      case 'feelings': return 'Moods, patterns & insights';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'task': return 'bg-blue-100 text-blue-700';
      case 'emotion': return 'bg-purple-100 text-purple-700';
      case 'idea': return 'bg-yellow-100 text-yellow-700';
      case 'reminder': return 'bg-green-100 text-green-700';
      case 'reflection': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredThoughts = getFilteredThoughts();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thoughts</h1>
        <p className="text-gray-600">Your AI-powered thought processing system</p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="thought" className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              id="thought"
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="Type anything... 'I should get my car oil changed.' 'I feel off today.' 'Remember to email Sarah about the logo.'"
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isProcessing}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Sparkles size={16} />
              <span>
                {aiAvailable 
                  ? 'AI will categorize and organize automatically' 
                  : 'Using smart categorization (AI not available)'
                }
              </span>
            </div>
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
                  <span>Process Thought</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* View Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['today', 'inbox', 'ideas', 'feelings'] as ViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === view
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {getViewIcon(view)}
            <span>{getViewTitle(view)}</span>
          </button>
        ))}
      </div>

      {/* View Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{getViewTitle(currentView)}</h2>
          <p className="text-gray-600">{getViewDescription(currentView)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search thoughts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Nudges Section */}
      {showNudges && filteredThoughts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Bell size={20} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Gentle Nudges</h3>
              <div className="space-y-2 text-sm text-blue-800">
                {filteredThoughts.filter(t => t.status === 'new').length > 0 && (
                  <p>• You have {filteredThoughts.filter(t => t.status === 'new').length} new thoughts to review</p>
                )}
                {filteredThoughts.filter(t => t.category === 'idea').length > 3 && (
                  <p>• You have several ideas that might connect together</p>
                )}
                {filteredThoughts.filter(t => t.category === 'emotion').length > 2 && (
                  <p>• Consider reviewing your recent emotional patterns</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowNudges(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* After processing a new thought, show AI next steps if available */}
      {aiNextSteps.length > 0 && lastProcessedThought && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Sparkles size={20} className="text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-1">Coach's Suggestions for Your Thought</h3>
              <p className="text-green-800 mb-2">Here are some next steps you can take based on your thought:</p>
              <div className="flex flex-wrap gap-2">
                {aiNextSteps.map((step, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 border border-blue-200 transition"
                    onClick={() => {/* TODO: implement add to tasks/projects/ideas */}}
                  >
                    + {step}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thoughts List */}
      <div className="space-y-4">
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-12">
            <Brain size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No thoughts yet</h3>
            <p className="text-gray-600">Start by adding a thought above</p>
          </div>
        ) : (
          filteredThoughts.map((thought) => (
            <div
              key={thought.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(thought.category)}`}>
                      {thought.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(thought.priority)}`}>
                      {thought.priority}
                    </span>
                    {thought.dueDate && (
                      <span className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{new Date(thought.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-900 mb-3">{thought.originalContent}</p>
                  
                  {thought.aiInsights && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-start space-x-2">
                        <Sparkles size={16} className="text-blue-600 mt-0.5" />
                        <p className="text-sm text-gray-700">{thought.aiInsights}</p>
                      </div>
                    </div>
                  )}
                  
                  {thought.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {thought.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(thought.createdAt).toLocaleString()}</span>
                    <div className="flex items-center space-x-2">
                      {thought.linkedThoughts.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Target size={12} />
                          <span>{thought.linkedThoughts.length} linked</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                                      <button
                      onClick={() => {
                        updateThoughtStatus(thought.id, 'reviewed');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Mark as reviewed"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => {
                        deleteThought(thought.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete thought"
                    >
                      ×
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 