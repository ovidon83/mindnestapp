import React, { useState } from 'react';
import { Brain, Sparkles, Check, X, Edit2, Plus, Lightbulb, Target, Zap, Clock } from 'lucide-react';
import { useMindnestStore } from '../store';
import { ParsedItem } from '../types';

export const CaptureView: React.FC = () => {
  const [brainDumpText, setBrainDumpText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const { addTodo, addThought } = useMindnestStore();
  
  const handleBrainDump = () => {
    if (!brainDumpText.trim()) return;
    
    setIsProcessing(true);
    
    // Smart parsing for multiple formats
    let items: string[] = [];
    
    // First, try splitting by line breaks
    if (brainDumpText.includes('\n')) {
      items = brainDumpText.split(/\n+/).filter(line => line.trim());
    }
    // Then try comma separation for paragraph format
    else if (brainDumpText.includes(',')) {
      items = brainDumpText.split(/,(?=\s*[A-Z]|\s*\d|\s*[-•*])/).filter(item => item.trim());
    }
    // Try bullet points or numbered lists
    else if (brainDumpText.match(/[-•*]\s|^\d+\.\s/m)) {
      items = brainDumpText.split(/(?=[-•*]\s|\d+\.\s)/).filter(item => item.trim());
    }
    // Try period separation for sentences (but be careful with abbreviations)
    else if (brainDumpText.includes('.') && brainDumpText.split('.').length > 2) {
      items = brainDumpText.split(/\.\s+(?=[A-Z])/).map(item => item.endsWith('.') ? item : item + '.').filter(item => item.trim());
    }
    // Fallback: try comma separation without strict formatting
    else if (brainDumpText.includes(',')) {
      items = brainDumpText.split(',').filter(item => item.trim());
    }
    // Last resort: treat as single item
    else {
      items = [brainDumpText.trim()];
    }
    
    const parsedItems: ParsedItem[] = items.map(itemText => {
      const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const content = itemText.trim()
        .replace(/^[-•*]\s*/, '') // Remove bullet points
        .replace(/^\d+\.\s*/, '') // Remove numbers
        .replace(/^,\s*/, '') // Remove leading commas
        .trim();
      
      // Smart categorization based on content patterns
      let type: 'task' | 'idea' | 'thought' | 'journal' = 'thought';
      let urgency: string[] = [];
      
      // Task patterns
      if (content.match(/^(todo|task|do|fix|complete|finish|implement|add|create|update|delete|remove|build|setup|install|configure|test|debug|review|check|verify|schedule|book|call|email|send|buy|order|pay|submit|apply|sign|register|cancel|remind|follow up)/i) ||
          content.includes('need to') || content.includes('should') || content.includes('must') ||
          content.includes('deadline') || content.includes('due') || content.includes('urgent') ||
          content.match(/\b(by|before|until|today|tomorrow|this week|next week|asap|urgent|priority)\b/i)) {
        type = 'task';
        
        // Determine urgency
        if (content.match(/\b(urgent|asap|critical|emergency|now|today|deadline)\b/i)) {
          urgency.push('urgent');
        }
        if (content.match(/\b(today|this morning|this afternoon|tonight)\b/i)) {
          urgency.push('today');
        }
        if (content.match(/\b(this week|by friday|before weekend)\b/i)) {
          urgency.push('this_week');
        }
      }
      // Idea patterns
      else if (content.match(/^(idea|what if|maybe|could|might|potentially|brainstorm|concept|innovation|solution|approach|strategy|feature|improvement)/i) ||
               content.includes('💡') || content.includes('idea:') || content.includes('maybe we could')) {
        type = 'idea';
      }
      // Journal patterns  
      else if (content.match(/^(feeling|felt|today|yesterday|this morning|this week|lately|currently|thinking about|reflecting on|grateful for|struggling with|learned|realized|noticed)/i) ||
               content.includes('feel') || content.includes('emotion') || content.includes('mood') ||
               content.match(/\b(happy|sad|excited|frustrated|anxious|stressed|proud|disappointed|grateful|worried|confused|tired|energized)\b/i)) {
        type = 'journal';
      }
      
      return {
        id,
        content,
        type,
        urgency: urgency.join(','),
        tags: [],
        confidence: 0.8 // Default confidence
      };
    });
    
    setTimeout(() => {
      setParsedItems(parsedItems);
      setIsProcessing(false);
    }, 500);
  };
  
  const handleEditItem = (item: ParsedItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };
  
  const handleSaveEdit = (id: string) => {
    setParsedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, content: editContent } : item
      )
    );
    setEditingId(null);
    setEditContent('');
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };
  
  const handleRemoveItem = (id: string) => {
    setParsedItems(items => items.filter(item => item.id !== id));
  };
  
  const handleChangeType = (id: string, newType: 'task' | 'idea' | 'thought' | 'journal') => {
    setParsedItems(items =>
      items.map(item =>
        item.id === id ? { ...item, type: newType } : item
      )
    );
  };
  
  const handleConfirm = () => {
    const validItems = parsedItems.filter(item => item.content.trim());
    
    // Create items in the appropriate stores
    validItems.forEach(item => {
      if (item.type === 'task') {
        const tags = [];
        if (item.urgency?.includes('urgent')) tags.push('urgent');
        if (item.urgency?.includes('today')) tags.push('today');
        if (item.urgency?.includes('this_week')) tags.push('this_week');
        
        const status = item.urgency?.includes('urgent') ? 'In Progress' as const : 'To Do' as const;
        
        addTodo({
          content: item.content,
          priority: item.urgency?.includes('urgent') ? 'high' : 'medium',
          status,
          completed: false,
          tags
        });
      } else {
        addThought({
          content: item.content,
          type: item.type === 'thought' ? 'random' : item.type as 'idea' | 'journal',
          category: item.type,
          tags: []
        });
      }
    });
    
    setBrainDumpText('');
    setParsedItems([]);
  };
  
  const handleReset = () => {
    setBrainDumpText('');
    setParsedItems([]);
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <Target size={16} className="text-blue-600" />;
      case 'idea': return <Lightbulb size={16} className="text-yellow-600" />;
      case 'journal': return <Edit2 size={16} className="text-purple-600" />;
      default: return <Brain size={16} className="text-gray-600" />;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-50 border-blue-200';
      case 'idea': return 'bg-yellow-50 border-yellow-200';
      case 'journal': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  const getUrgencyBadge = (urgency: string) => {
    if (!urgency) return null;
    
    if (urgency.includes('urgent')) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><Zap size={12} className="mr-1" />Urgent</span>;
    }
    if (urgency.includes('today')) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><Clock size={12} className="mr-1" />Today</span>;
    }
    if (urgency.includes('this_week')) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">This Week</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Brain className="text-purple-600" size={36} />
            Capture
          </h1>
          <p className="text-gray-600 font-medium">
            Quick capture anything on your mind — we'll organize it instantly
          </p>
        </div>

        {/* Brain Dump Input */}
        {parsedItems.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900">Brain Dump</h2>
                <p className="text-sm text-gray-600">
                  Just start typing. One thought per line works best.
                </p>
              </div>
            </div>
            
            <textarea
              value={brainDumpText}
              onChange={(e) => setBrainDumpText(e.target.value)}
              placeholder={`Dump everything here - any format works...

Examples:
• Line by line:
  Buy groceries today
  Call mom tomorrow
  
• Comma separated:
  Get internet, Review project, Finish MVP, Build plan
  
• Bullet points:
  - Fix bugs
  - Write docs  
  - Deploy app
  
• Mixed format - we'll figure it out!`}
              className="w-full h-64 p-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white placeholder-gray-500 resize-none text-lg"
              disabled={isProcessing}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles size={16} />
                <span>AI will automatically categorize your thoughts</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={!brainDumpText.trim() || isProcessing}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleBrainDump}
                  disabled={!brainDumpText.trim() || isProcessing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      <span>Unpack</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Parsed Items Preview */}
        {parsedItems.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-900">
                    Unpacked {parsedItems.length} items
                  </h2>
                  <p className="text-sm text-gray-600">
                    Review and edit before confirming
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check size={16} />
                  Confirm All
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {parsedItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border-2 p-4 transition-all ${getTypeColor(item.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(item.type)}</span>
                      
                      <div className="flex-1">
                        {editingId === item.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
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
                            <p className="text-gray-800 font-medium mb-2">
                              {item.content}
                            </p>
                            
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap mb-2">
                                {item.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-white/60 text-gray-600 rounded text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {item.urgency && (
                              <div className="mb-2">
                                {getUrgencyBadge(item.urgency)}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Type:</span>
                              <select
                                value={item.type}
                                onChange={(e) => handleChangeType(item.id, e.target.value as any)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="task">✅ Task</option>
                                <option value="idea">💡 Idea</option>
                                <option value="thought">💭 Thought</option>
                                <option value="journal">📓 Journal</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Tips */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>For better task detection:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Start with action words: "Call", "Buy", "Email"</li>
                <li>• Use phrases: "Need to", "Don't forget"</li>
              </ul>
            </div>
            <div>
              <strong>Smart tagging:</strong>
              <ul className="mt-1 space-y-1">
                <li>• #low_energy for quick wins</li>
                <li>• #today or #urgent for priorities</li>
                <li>• #project_name for organization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};