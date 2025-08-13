import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
  Zap,
  Target,
  TrendingUp,
  CalendarDays,
  Calendar,
  Bell
} from 'lucide-react';
import { useGenieNotesStore } from '../store';
import { Entry, EntryType, Priority, TaskStatus } from '../types';

export const CaptureView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedEntry, setParsedEntry] = useState<Partial<Entry> | null>(null);
  
  const { addEntry, setCurrentView } = useGenieNotesStore();

  const parseInput = (text: string) => {
    // Simple AI parsing logic - in a real app this would be more sophisticated
    const lowerText = text.toLowerCase();
    
    // Determine type - improved logic with more patterns
    let type: EntryType = 'note';
    
    // Task detection - more comprehensive
    if (lowerText.includes('task') || lowerText.includes('todo') || lowerText.includes('need to') || 
        lowerText.includes('should') || lowerText.includes('must') || lowerText.includes('have to') ||
        lowerText.includes('finish') || lowerText.includes('complete') || lowerText.includes('do') ||
        lowerText.includes('work on') || lowerText.includes('start') || lowerText.includes('prepare') ||
        lowerText.includes('email') || lowerText.includes('call') || lowerText.includes('meet') ||
        lowerText.includes('buy') || lowerText.includes('get') || lowerText.includes('find') ||
        lowerText.includes('review') || lowerText.includes('check') || lowerText.includes('update') ||
        lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('design') ||
        lowerText.includes('write') || lowerText.includes('read') || lowerText.includes('study') ||
        lowerText.includes('organize') || lowerText.includes('clean') || lowerText.includes('fix') ||
        lowerText.includes('solve') || lowerText.includes('plan') || lowerText.includes('schedule')) {
      type = 'task';
    } 
    // Event detection
    else if (lowerText.includes('meeting') || lowerText.includes('event') || lowerText.includes('appointment') ||
             lowerText.includes('conference') || lowerText.includes('party') || lowerText.includes('dinner') ||
             lowerText.includes('lunch') || lowerText.includes('call') || lowerText.includes('interview') ||
             lowerText.includes('presentation') || lowerText.includes('workshop') || lowerText.includes('class')) {
      type = 'event';
    } 
    // Idea detection
    else if (lowerText.includes('idea') || lowerText.includes('think') || lowerText.includes('maybe') ||
             lowerText.includes('could') || lowerText.includes('might') || lowerText.includes('perhaps') ||
             lowerText.includes('concept') || lowerText.includes('brainstorm') || lowerText.includes('innovation')) {
      type = 'idea';
    } 
    // Insight detection
    else if (lowerText.includes('insight') || lowerText.includes('learned') || lowerText.includes('discovered') ||
             lowerText.includes('realized') || lowerText.includes('understood') || lowerText.includes('figured out') ||
             lowerText.includes('aha') || lowerText.includes('eureka') || lowerText.includes('breakthrough')) {
      type = 'insight';
    } 
    // Reflection detection
    else if (lowerText.includes('reflect') || lowerText.includes('feel') || lowerText.includes('mood') ||
             lowerText.includes('thought') || lowerText.includes('wonder') || lowerText.includes('question') ||
             lowerText.includes('doubt') || lowerText.includes('hope') || lowerText.includes('wish') ||
             lowerText.includes('grateful') || lowerText.includes('happy') || lowerText.includes('sad') ||
             lowerText.includes('excited') || lowerText.includes('worried') || lowerText.includes('confused')) {
      type = 'reflection';
    } 
    // Journal detection
    else if (lowerText.includes('journal') || lowerText.includes('today') || lowerText.includes('day') ||
             lowerText.includes('morning') || lowerText.includes('evening') || lowerText.includes('weekend') ||
             lowerText.includes('yesterday') || lowerText.includes('this week') || lowerText.includes('month')) {
      type = 'journal';
    } 
    // Reminder detection
    else if (lowerText.includes('remind') || lowerText.includes('remember') || lowerText.includes('don\'t forget') ||
             lowerText.includes('note to self') || lowerText.includes('reminder') || lowerText.includes('alert')) {
      type = 'reminder';
    }
    
    // Determine priority - improved logic
    let priority: Priority = 'medium';
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('emergency') ||
        lowerText.includes('critical') || lowerText.includes('immediate') || lowerText.includes('now')) {
      priority = 'urgent';
    } else if (lowerText.includes('important') || lowerText.includes('high') || lowerText.includes('priority') ||
               lowerText.includes('key') || lowerText.includes('essential') || lowerText.includes('crucial')) {
      priority = 'high';
    } else if (lowerText.includes('low') || lowerText.includes('sometime') || lowerText.includes('maybe') ||
               lowerText.includes('optional') || lowerText.includes('nice to have') || lowerText.includes('if time')) {
      priority = 'low';
    }
    
    // Extract tags (words starting with #)
    const tags = text.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
    
    // Extract dates - improved patterns
    const datePatterns = [
      /(?:due|by|on|at)\s+(\w+\s+\d+)/i,
      /(\d{1,2}\/\d{1,2})/,
      /(\w+\s+\d{1,2})/i,
      /(?:next|this)\s+(\w+)/i,
      /(?:in|after)\s+(\d+)\s+(?:days?|weeks?|months?)/i,
      /(?:tomorrow|today|tonight)/i
    ];
    
    let dueDate: Date | undefined;
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          let dateString = match[1] || match[0];
          
          // Handle relative dates
          if (dateString.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = tomorrow;
          } else if (dateString.toLowerCase() === 'today') {
            dueDate = new Date();
          } else if (dateString.toLowerCase() === 'tonight') {
            const tonight = new Date();
            tonight.setHours(20, 0, 0, 0); // 8 PM
            dueDate = tonight;
          } else {
            dueDate = new Date(dateString);
          }
          
          if (isNaN(dueDate.getTime())) dueDate = undefined;
        } catch {
          dueDate = undefined;
        }
        break;
      }
    }
    
    // Extract location
    const locationMatch = text.match(/(?:at|in|@)\s+([A-Za-z\s]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    // Debug logging
    console.log('=== AI Parsing Debug ===');
    console.log('Input:', text);
    console.log('Detected type:', type);
    console.log('Detected priority:', priority);
    console.log('Detected tags:', tags);
    console.log('Detected due date:', dueDate);
    console.log('Detected location:', location);
    
    return {
      type,
      priority,
      tags,
      dueDate,
      location,
      status: type === 'task' ? 'pending' as TaskStatus : 'pending' as TaskStatus,
      needsReview: false,
      confidence: 0.8,
      reasoning: `Classified as ${type} based on keywords and context. Priority: ${priority}`,
      relatedIds: []
    };
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const parsed = parseInput(inputText.trim());
      setParsedEntry(parsed);
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (parsedEntry) {
      addEntry({
        content: inputText.trim(),
        type: parsedEntry.type!,
        priority: parsedEntry.priority!,
        tags: parsedEntry.tags || [],
        dueDate: parsedEntry.dueDate,
        location: parsedEntry.location,
        status: parsedEntry.status!,
        needsReview: parsedEntry.needsReview!,
        confidence: parsedEntry.confidence!,
        reasoning: parsedEntry.reasoning!,
        relatedIds: parsedEntry.relatedIds || []
      });
      
      setInputText('');
      setParsedEntry(null);
      setShowPreview(false);
      setCurrentView('thoughts');
    }
  };

  const handleEdit = () => {
    setShowPreview(false);
    setParsedEntry(null);
  };

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'idea': return <Zap className="w-4 h-4" />;
      case 'insight': return <Target className="w-4 h-4" />;
      case 'reflection': return <TrendingUp className="w-4 h-4" />;
      case 'journal': return <CalendarDays className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'note': return <Brain className="w-4 h-4" />;
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
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'note': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (showPreview && parsedEntry) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Analysis Complete
            </h1>
            <p className="text-gray-600">
              Here's how I categorized your thought. Review and confirm below.
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${getTypeColor(parsedEntry.type!)}`}>
                  {getTypeIcon(parsedEntry.type!)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{inputText}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(parsedEntry.type!)}`}>
                      {parsedEntry.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(parsedEntry.priority!)}`}>
                      {parsedEntry.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parsed Details */}
            <div className="space-y-3">
              {parsedEntry.dueDate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Due: {parsedEntry.dueDate.toLocaleDateString()}</span>
                </div>
              )}
              
              {parsedEntry.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {parsedEntry.location}</span>
                </div>
              )}
              
              {parsedEntry.tags && parsedEntry.tags.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span>Tags: {parsedEntry.tags.map(tag => `#${tag}`).join(', ')}</span>
                </div>
              )}
            </div>

            {/* AI Reasoning */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI Reasoning:</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">{parsedEntry.reasoning}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Capture Your Thoughts
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Just type what's on your mind. AI will automatically categorize, tag, and organize everything.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-6">
            <label htmlFor="thought-input" className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              id="thought-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type anything: tasks, ideas, insights, reminders, journal entries..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSubmit();
                }
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze & Save</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Press ⌘+Enter to submit
          </p>
        </div>

        {/* Examples */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-3">Examples:</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">"Need to finish project by Friday #work"</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">"Great insight about user behavior"</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">"Meet Alex tomorrow at 3pm #meeting"</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">"Feeling productive today"</span>
          </div>
        </div>
      </div>
    </div>
  );
};