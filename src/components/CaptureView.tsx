import React, { useState } from 'react';
import { Brain, Send, Check, X, Edit2, Calendar, MapPin, Clock, Zap } from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { AIService } from '../services/ai';
import { Entry, EntryType, Priority } from '../types';

export const CaptureView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<Entry[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { addEntry, setCurrentView } = useGenieNotesStore();

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Use AI service to parse input
      const result = AIService.parseInput(inputText.trim());
      setParsedEntries(result.entries);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error parsing input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    // Add all parsed entries to store
    parsedEntries.forEach(entry => {
      addEntry(entry);
    });
    
    // Reset and navigate to Next Up
    setInputText('');
    setParsedEntries([]);
    setShowConfirmation(false);
    setCurrentView('nextup');
  };

  const handleUndo = () => {
    setParsedEntries([]);
    setShowConfirmation(false);
  };

  const handleEditEntry = (index: number) => {
    // Allow editing of individual entries before confirmation
    // This would open an edit modal in a real implementation
    console.log('Edit entry:', index);
  };

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <Check className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Zap className="w-4 h-4" />;
      case 'insight': return <Brain className="w-4 h-4" />;
      case 'reflection': return <Brain className="w-4 h-4" />;
      case 'journal': return <Clock className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'idea': return 'bg-purple-100 text-purple-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'reflection': return 'bg-indigo-100 text-indigo-800';
      case 'journal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Confirm Your Entries
            </h1>
            <p className="text-gray-600">
              AI has parsed your input into {parsedEntries.length} entry{parsedEntries.length !== 1 ? 's' : ''}. 
              Review and confirm below.
            </p>
          </div>

          {/* Confirmation Feed */}
          <div className="space-y-4 mb-8">
            {parsedEntries.map((entry, index) => (
              <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{entry.content}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                          {entry.priority}
                        </span>
                        <span className="capitalize">{entry.type}</span>
                        {entry.location && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>{entry.location}</span>
                          </>
                        )}
                        {entry.dueDate && (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{entry.dueDate instanceof Date ? entry.dueDate.toLocaleDateString() : new Date(entry.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditEntry(index)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit entry"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Auto-actions */}
                {entry.autoActions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Auto-generated Actions:</h4>
                    <div className="space-y-2">
                      {entry.autoActions.map(action => (
                        <div key={action.id} className="flex items-center space-x-2 text-sm">
                          <Check className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-800">{action.content}</span>
                          {action.dueDate && (
                            <span className="text-blue-600">
                              (due {action.dueDate instanceof Date ? action.dueDate.toLocaleDateString() : new Date(action.dueDate).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence indicator */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>AI Confidence: {Math.round(entry.confidence * 100)}%</span>
                    <span>Created {formatDate(entry.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleUndo}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 inline mr-2" />
              Undo & Edit
            </button>
            
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Check className="w-4 h-4 inline mr-2" />
              Confirm All ({parsedEntries.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Capture Your Thoughts
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell me what's on your mind. I'll automatically classify, parse dates, 
            and create the right entries for you.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="thought-input" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to capture?
            </label>
            <textarea
              id="thought-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Examples:&#10;• Meet Alex Thu 3pm about launch at WeWork&#10;• Email John about budget, finish Q3 report by Friday&#10;• Had a great idea for a new feature while walking&#10;• Feeling grateful for the team's support today"
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {inputText.length > 0 && (
                <span>
                  {inputText.length} characters • 
                  {inputText.split(/[.!?;,\n]/).filter(s => s.trim().length > 0).length} potential items
                </span>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Process & Classify
                </>
              )}
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Classification</h3>
            <p className="text-sm text-gray-600">
              Automatically detects tasks, events, ideas, insights, and more
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Date Parsing</h3>
            <p className="text-sm text-gray-600">
              Extracts dates, times, and locations from natural language
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Auto Actions</h3>
            <p className="text-sm text-gray-600">
              Generates prep tasks and reminders automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};