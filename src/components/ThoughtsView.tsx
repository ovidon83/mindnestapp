import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Plus,
  Zap,
  Coffee,
  Battery,
  Target,
  Lightbulb,
  Heart,
  Calendar,
  Trash2,
  RotateCcw,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  Hash,
  Circle,
  CheckCircle2,
  Clock,
  Palette,
  Grid3x3,
  List,
  Eye,
  EyeOff
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

// Energy level configurations
const ENERGY_LEVELS = {
  high: { 
    icon: Zap, 
    color: 'from-red-500 to-orange-500', 
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    label: 'High Energy',
    description: 'When you\'re feeling energized and focused'
  },
  medium: { 
    icon: Battery, 
    color: 'from-yellow-500 to-amber-500', 
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-700',
    label: 'Medium Energy',
    description: 'Regular focus, steady progress'
  },
  low: { 
    icon: Coffee, 
    color: 'from-green-500 to-emerald-500', 
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
    label: 'Low Energy',
    description: 'Easy wins, gentle activities'
  }
};

// Thought categories with visual cues
const THOUGHT_CATEGORIES = {
  task: { icon: Target, color: 'bg-blue-100 text-blue-700', emoji: '🎯' },
  idea: { icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700', emoji: '💡' },
  feeling: { icon: Heart, color: 'bg-pink-100 text-pink-700', emoji: '💭' },
  memory: { icon: Brain, color: 'bg-purple-100 text-purple-700', emoji: '🧠' },
  future: { icon: Calendar, color: 'bg-indigo-100 text-indigo-700', emoji: '🔮' },
  random: { icon: Circle, color: 'bg-gray-100 text-gray-700', emoji: '✨' }
};

// View modes
type ViewMode = 'clusters' | 'energy' | 'timeline';

export const ThoughtsView: React.FC = () => {
  const [currentThought, setCurrentThought] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('clusters');
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { 
    thoughts, 
    addThought, 
    updateThought, 
    deleteThought,
    randomThoughts,
    addRandomThought 
  } = useMindnestStore();

  // Auto-focus on input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Combine all thoughts for processing
  const allThoughts = [
    ...thoughts.map(t => ({ 
      ...t, 
      source: 'thoughts',
      energyLevel: (t.metadata?.energyLevel || 'medium') as 'high' | 'medium' | 'low',
      completed: t.metadata?.completed || false,
      aiEnhanced: t.aiEnhanced || false,
      category: t.category || t.type
    })),
    ...randomThoughts.map(t => ({ 
      ...t, 
      source: 'random',
      type: 'random' as const,
      timestamp: t.createdAt,
      category: t.category || 'random',
      energyLevel: 'medium' as const,
      completed: false,
      tags: t.tags || [],
      aiEnhanced: false
    }))
  ];

  // Filter thoughts
  const filteredThoughts = allThoughts.filter(thought => {
    if (!showCompleted && thought.completed) return false;
    if (selectedEnergy && thought.energyLevel !== selectedEnergy) return false;
    if (selectedCategory && thought.category !== selectedCategory) return false;
    if (searchQuery && !thought.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group thoughts by category for cluster view
  const thoughtClusters = Object.entries(THOUGHT_CATEGORIES).map(([key, config]) => ({
    key,
    ...config,
    thoughts: filteredThoughts.filter(t => (t.category || t.type) === key)
  })).filter(cluster => cluster.thoughts.length > 0);

  // Group thoughts by energy for energy view
  const energyGroups = Object.entries(ENERGY_LEVELS).map(([key, config]) => ({
    key,
    ...config,
    thoughts: filteredThoughts.filter(t => t.energyLevel === key)
  })).filter(group => group.thoughts.length > 0);

  // Sort thoughts by timestamp for timeline view
  const timelineThoughts = [...filteredThoughts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleQuickCapture = async () => {
    if (!currentThought.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Extract tags from thought
      const tags = (currentThought.match(/#(\w+)/g) || []).map(tag => tag.slice(1));
      const cleanThought = currentThought.replace(/#\w+/g, '').trim();

      // Quick capture - add immediately to random thoughts for instant feedback
      const quickThought = {
        content: cleanThought,
        category: 'random',
        tags
      };
      addRandomThought(quickThought);
      setCurrentThought('');

      // Then enhance with AI in background
      try {
        const result = await AIService.categorizeThought(cleanThought);
        if (result.success && result.data) {
          const { category, extractedData } = result.data;
          
          // Create enhanced thought
          const enhancedThought = {
            content: extractedData.description || cleanThought,
            type: category as any,
            tags: [...tags, ...(extractedData.tags || [])],
            category: extractedData.category || category,
            energyLevel: extractedData.energyLevel || 'medium',
            priority: extractedData.priority,
            mood: extractedData.mood,
            metadata: extractedData,
            aiEnhanced: true
          };
          
          addThought(enhancedThought);
        }
      } catch (error) {
        console.error('AI enhancement failed:', error);
        // Quick capture already succeeded, so this is fine
      }
    } catch (error) {
      console.error('Quick capture failed:', error);
    } finally {
      setIsProcessing(false);
      // Refocus input for continuous capture
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickCapture();
    }
  };

  const toggleThoughtComplete = (thought: any) => {
    if (thought.source === 'thoughts') {
      updateThought(thought.id, { 
        metadata: { 
          ...thought.metadata, 
          completed: !thought.completed 
        } 
      });
    }
    // Random thoughts don't have completion state
  };

  const formatTimeAgo = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const ThoughtCard = ({ thought, compact = false }: { thought: any; compact?: boolean }) => {
    const categoryKey = (thought.category || thought.type) as keyof typeof THOUGHT_CATEGORIES;
    const energyKey = (thought.energyLevel || 'medium') as keyof typeof ENERGY_LEVELS;
    
    const categoryConfig = THOUGHT_CATEGORIES[categoryKey] || THOUGHT_CATEGORIES.random;
    const energyConfig = ENERGY_LEVELS[energyKey];
    const IconComponent = categoryConfig.icon;
    const EnergyIcon = energyConfig.icon;

    return (
      <div className={`group bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 ${
        compact ? 'p-3' : 'p-4'
      } hover:shadow-md`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryConfig.emoji}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.color}`}>
              {thought.category || thought.type}
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${energyConfig.bgColor} ${energyConfig.textColor}`}>
              <EnergyIcon size={12} />
              <span>{energyConfig.label.split(' ')[0]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {thought.source === 'thoughts' && (
              <button
                onClick={() => toggleThoughtComplete(thought)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {thought.completed ? (
                  <CheckCircle2 size={16} className="text-green-600" />
                ) : (
                  <Circle size={16} className="text-gray-400" />
                )}
              </button>
            )}
            <button
              onClick={() => deleteThought(thought.id)}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <p className={`text-gray-800 mb-3 ${thought.completed ? 'line-through opacity-60' : ''} ${
          compact ? 'text-sm' : ''
        }`}>
          {thought.content}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>{formatTimeAgo(thought.timestamp)}</span>
            {thought.aiEnhanced && (
              <div className="flex items-center gap-1 text-purple-600">
                <Sparkles size={12} />
                <span>AI Enhanced</span>
              </div>
            )}
          </div>
          {thought.tags && thought.tags.length > 0 && (
            <div className="flex gap-1">
              {thought.tags.slice(0, 3).map((tag: string, index: number) => (
                <span key={index} className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  #{tag}
                </span>
              ))}
              {thought.tags.length > 3 && (
                <span className="text-gray-400">+{thought.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Brain className="text-purple-600" size={36} />
            Brain Dump
          </h1>
          <p className="text-gray-600 font-medium">Capture everything. Organize effortlessly. Feel relief.</p>
        </div>

        {/* Quick Capture */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900">Quick Brain Dump</h2>
              <p className="text-sm text-gray-600">Just type and press Enter. Everything else happens automatically.</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={inputRef}
              value={currentThought}
              onChange={(e) => setCurrentThought(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What's swirling in your mind? Tasks, ideas, feelings, random thoughts... just dump it all here. Use #tags if you want."
              className="w-full h-24 p-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white placeholder-gray-500 resize-none text-lg"
              disabled={isProcessing}
            />
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleQuickCapture}
                disabled={!currentThought.trim() || isProcessing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Capture</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Energy Selection */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600">Current energy:</span>
            {Object.entries(ENERGY_LEVELS).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedEnergy(selectedEnergy === key ? null : key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedEnergy === key
                      ? `${config.bgColor} ${config.textColor} border`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent size={14} />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">View:</span>
              {[
                { key: 'clusters', label: 'Categories', icon: Grid3x3 },
                { key: 'energy', label: 'Energy Levels', icon: Zap },
                { key: 'timeline', label: 'Timeline', icon: List }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === key
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search thoughts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-sm"
                />
              </div>
              
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  showCompleted
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>Completed</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{allThoughts.length}</p>
              <p className="text-xs text-gray-600">Total Thoughts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {allThoughts.filter(t => t.completed).length}
              </p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {thoughtClusters.length}
              </p>
              <p className="text-xs text-gray-600">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {allThoughts.filter(t => t.aiEnhanced).length}
              </p>
              <p className="text-xs text-gray-600">AI Enhanced</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Clusters View */}
          {viewMode === 'clusters' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {thoughtClusters.map((cluster) => (
                <div
                  key={cluster.key}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{cluster.emoji}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {cluster.key}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {cluster.thoughts.length} thought{cluster.thoughts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cluster.thoughts.map((thought) => (
                      <ThoughtCard key={thought.id} thought={thought} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Energy View */}
          {viewMode === 'energy' && (
            <div className="space-y-6">
              {energyGroups.map((group) => {
                const IconComponent = group.icon;
                return (
                  <div
                    key={group.key}
                    className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border p-6 ${group.bgColor}`}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${group.color} rounded-xl flex items-center justify-center`}>
                        <IconComponent size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${group.textColor}`}>
                          {group.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {group.description} • {group.thoughts.length} thought{group.thoughts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.thoughts.map((thought) => (
                        <ThoughtCard key={thought.id} thought={thought} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <List size={24} className="text-gray-600" />
                Thought Timeline
              </h3>
              
              <div className="space-y-4">
                {timelineThoughts.map((thought) => (
                  <ThoughtCard key={thought.id} thought={thought} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredThoughts.length === 0 && (
            <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
              <Brain size={64} className="mx-auto text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-800 mb-3">Your mind is clear!</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedEnergy || selectedCategory
                  ? 'No thoughts match your current filters. Try adjusting them above.'
                  : 'Start by dumping your thoughts in the quick capture area above. Everything will be organized automatically.'}
              </p>
              {(searchQuery || selectedEnergy || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedEnergy(null);
                    setSelectedCategory(null);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={16} />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 