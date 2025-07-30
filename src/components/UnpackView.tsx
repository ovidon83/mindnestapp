import React, { useState } from 'react';
import { Brain, Sparkles, Check, X, Edit2, Plus } from 'lucide-react';
import { useADHDStore } from '../store/adhd-store';
import { ParsedItem } from '../types';

export const UnpackView: React.FC = () => {
  const [brainDumpText, setBrainDumpText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const { processBrainDump, confirmParsedItems } = useADHDStore();
  
  const handleBrainDump = () => {
    if (!brainDumpText.trim()) return;
    
    setIsProcessing(true);
    // Simulate processing delay for better UX
    setTimeout(() => {
      const items = processBrainDump(brainDumpText);
      setParsedItems(items);
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
    confirmParsedItems(validItems);
    setBrainDumpText('');
    setParsedItems([]);
  };
  
  const handleReset = () => {
    setBrainDumpText('');
    setParsedItems([]);
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '✅';
      case 'idea': return '💡';
      case 'journal': return '📓';
      default: return '💭';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-green-50 border-green-200 text-green-700';
      case 'idea': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'journal': return 'bg-purple-50 border-purple-200 text-purple-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Brain className="text-purple-600" size={36} />
            Unpack Your Mind
          </h1>
          <p className="text-gray-600 font-medium">
            Type anything on your mind — we'll sort it for you
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
              placeholder={`Type anything on your mind — we'll sort it for you.

You can write in paragraphs or separate lines:

"I need to call the dentist and buy groceries. Also had this idea for an app that helps people organize their thoughts. Feeling a bit overwhelmed with work today but excited about the new project. Don't forget to email Sarah about the meeting #urgent"

Or line by line:
- Call dentist
- Buy groceries  
- Email Sarah #urgent
- App idea: thought organization tool`}
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
                            
                            {item.tags.length > 0 && (
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