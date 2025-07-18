import React, { useState } from 'react';
import {
  Brain,
  Lightbulb,
  CheckCircle,
  FileText,
  BookOpen,
  Target,
  Loader2,
  Sparkles,
  Zap,
  Calendar,
  Star,
  ArrowRight,
  X,
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

interface CategorizationResult {
  category: string;
  confidence: number;
  extractedData: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    location?: string;
    tags?: string[];
    mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    category?: string;
    potential?: 'low' | 'medium' | 'high';
    status?: string;
    suggestedActions?: string[];
    relatedResources?: string[];
    timeEstimate?: string;
    energyLevel?: 'low' | 'medium' | 'high';
    context?: string;
    metadata?: {
      marketSize?: string;
      targetAudience?: string;
      revenueModel?: string;
    };
  };
}

export const RandomThoughtInput: React.FC = () => {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [categorizationResult, setCategorizationResult] = useState<CategorizationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { 
    addThought, 
    addRandomThought, 
    addTodo, 
    addIdea, 
    addNote, 
    addJournalEntry, 
    addProject 
  } = useMindnestStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isProcessing) return;

    setIsProcessing(true);
    setCategorizationResult(null);
    setShowPreview(false);

    try {
      // Use AI to categorize and enhance the thought
      const result = await AIService.categorizeThought(content);
      
      if (result.success && result.data) {
        const categorization = result.data as CategorizationResult;
        setCategorizationResult(categorization);
        setShowPreview(true);
      } else {
        // Fallback: add as random thought
        addRandomThought({ content: content.trim() });
        setContent('');
      }
    } catch (error) {
      console.error('Error categorizing thought:', error);
      // Fallback: add as random thought
      addRandomThought({ content: content.trim() });
      setContent('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCategorization = () => {
    if (!categorizationResult) return;

    const { category, extractedData } = categorizationResult;
    const enhancedContent = extractedData.description || content;

    // Add to unified thoughts
    addThought({
      content: enhancedContent,
      type: category as any,
      tags: extractedData.tags || [],
      metadata: extractedData,
      aiEnhanced: true,
      category: extractedData.category,
      priority: extractedData.priority,
      dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : undefined,
      mood: extractedData.mood,
      potential: extractedData.potential,
      status: extractedData.status,
    });

    // Route to appropriate section based on category
    switch (category) {
      case 'task':
        addTodo({
          content: extractedData.title || enhancedContent,
          completed: false,
          priority: extractedData.priority || 'medium',
          dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : undefined,
          tags: extractedData.tags || [],
          notes: extractedData.context,
        });
        break;
      
      case 'idea':
        addIdea({
          title: extractedData.title || 'New Idea',
          description: enhancedContent,
          category: (extractedData.category as any) || 'other',
          status: 'concept',
          potential: extractedData.potential || 'medium',
          tags: extractedData.tags || [],
          marketSize: extractedData.metadata?.marketSize,
          targetAudience: extractedData.metadata?.targetAudience,
          revenueModel: extractedData.metadata?.revenueModel,
        });
        break;
      
      case 'note':
        addNote({
          title: extractedData.title || 'New Note',
          content: enhancedContent,
          tags: extractedData.tags || [],
        });
        break;
      
      case 'journal':
        addJournalEntry({
          content: enhancedContent,
          mood: extractedData.mood || 'okay',
        });
        break;
      
      case 'project':
        addProject({
          name: extractedData.title || 'New Project',
          description: enhancedContent,
          status: 'idea',
          tags: extractedData.tags || [],
        });
        break;
      
      default:
        // Add as random thought if category is not recognized
        addRandomThought({ 
          content: enhancedContent,
          category: category,
          aiInsight: extractedData.context,
        });
    }

    setContent('');
    setCategorizationResult(null);
    setShowPreview(false);
  };

  const handleSkipCategorization = () => {
    addRandomThought({ content: content.trim() });
    setContent('');
    setCategorizationResult(null);
    setShowPreview(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task': return <CheckCircle size={20} className="text-green-600" />;
      case 'idea': return <Lightbulb size={20} className="text-yellow-600" />;
      case 'note': return <FileText size={20} className="text-blue-600" />;
      case 'journal': return <BookOpen size={20} className="text-purple-600" />;
      case 'project': return <Target size={20} className="text-indigo-600" />;
      default: return <Brain size={20} className="text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'task': return 'bg-green-50 border-green-200';
      case 'idea': return 'bg-yellow-50 border-yellow-200';
      case 'note': return 'bg-blue-50 border-blue-200';
      case 'journal': return 'bg-purple-50 border-purple-200';
      case 'project': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-gray-900">Capture Your Thoughts</h2>
            <p className="text-sm text-gray-600">AI will automatically categorize and enhance your thoughts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share any thought, task, idea, or reflection..."
              className="w-full h-32 p-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white placeholder-gray-500 resize-none text-lg"
              disabled={isProcessing}
            />
            <div className="absolute bottom-3 right-3">
              {isProcessing ? (
                <Loader2 size={20} className="text-gray-400 animate-spin" />
              ) : (
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Process thought with AI"
                >
                  <Sparkles size={16} />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* AI Categorization Preview */}
        {showPreview && categorizationResult && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  {getCategoryIcon(categorizationResult.category)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    AI Categorization: {categorizationResult.category.charAt(0).toUpperCase() + categorizationResult.category.slice(1)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Confidence: {Math.round(categorizationResult.confidence * 100)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>

            <div className={`p-4 rounded-lg border ${getCategoryColor(categorizationResult.category)}`}>
              <div className="space-y-3">
                {categorizationResult.extractedData.title && (
                  <div>
                    <h4 className="font-medium text-gray-900">Title</h4>
                    <p className="text-sm text-gray-700">{categorizationResult.extractedData.title}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900">Enhanced Content</h4>
                  <p className="text-sm text-gray-700">{categorizationResult.extractedData.description || content}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categorizationResult.extractedData.priority && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(categorizationResult.extractedData.priority)}`}>
                      {categorizationResult.extractedData.priority} priority
                    </span>
                  )}
                  
                  {categorizationResult.extractedData.dueDate && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Calendar size={12} />
                      Due {new Date(categorizationResult.extractedData.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  
                  {categorizationResult.extractedData.energyLevel && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Zap size={12} />
                      {categorizationResult.extractedData.energyLevel} energy
                    </span>
                  )}
                  
                  {categorizationResult.extractedData.potential && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star size={12} />
                      {categorizationResult.extractedData.potential} potential
                    </span>
                  )}
                </div>

                {categorizationResult.extractedData.tags && categorizationResult.extractedData.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggested Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {categorizationResult.extractedData.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {categorizationResult.extractedData.suggestedActions && categorizationResult.extractedData.suggestedActions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggested Actions</h4>
                    <ul className="space-y-1">
                      {categorizationResult.extractedData.suggestedActions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                          <ArrowRight size={12} className="text-gray-500" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirmCategorization}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Confirm & Save
              </button>
              <button
                onClick={handleSkipCategorization}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg"
              >
                Save as Random Thought
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setContent(prev => prev + '\n\n💡 Idea: ')}
              className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
            >
              <Lightbulb size={16} className="text-yellow-600 mb-1" />
              <span className="text-xs font-medium text-gray-900">New Idea</span>
            </button>
            
            <button
              onClick={() => setContent(prev => prev + '\n\n✅ Task: ')}
              className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <CheckCircle size={16} className="text-green-600 mb-1" />
              <span className="text-xs font-medium text-gray-900">Add Task</span>
            </button>
            
            <button
              onClick={() => setContent(prev => prev + '\n\n📝 Note: ')}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <FileText size={16} className="text-blue-600 mb-1" />
              <span className="text-xs font-medium text-gray-900">Quick Note</span>
            </button>
            
            <button
              onClick={() => setContent(prev => prev + '\n\n🎯 Project: ')}
              className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
            >
              <Target size={16} className="text-indigo-600 mb-1" />
              <span className="text-xs font-medium text-gray-900">New Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 