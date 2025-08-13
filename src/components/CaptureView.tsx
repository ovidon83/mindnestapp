import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles,
  CheckCircle,
  Clock,
  MapPin,
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
  const [editableEntry, setEditableEntry] = useState<Partial<Entry> | null>(null);
  
  const { addEntry, setCurrentView } = useGenieNotesStore();

  const parseInput = (text: string) => {
    // Enhanced AI parsing logic with better context understanding
    const lowerText = text.toLowerCase();
    
    // Extract tags first (words starting with #)
    const tags = text.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
    
    // Check for explicit hashtag indicators first (highest priority)
    if (tags.includes('idea') || tags.includes('concept') || tags.includes('innovation')) {
      return createEntry('idea', 'medium', tags, text);
    }
    if (tags.includes('task') || tags.includes('todo') || tags.includes('action')) {
      return createEntry('task', 'medium', tags, text);
    }
    if (tags.includes('insight') || tags.includes('learned') || tags.includes('discovery')) {
      return createEntry('insight', 'medium', tags, text);
    }
    if (tags.includes('reflection') || tags.includes('feel') || tags.includes('mood')) {
      return createEntry('reflection', 'medium', tags, text);
    }
    if (tags.includes('journal') || tags.includes('today') || tags.includes('day')) {
      return createEntry('journal', 'medium', tags, text);
    }
    if (tags.includes('reminder') || tags.includes('remember')) {
      return createEntry('reminder', 'medium', tags, text);
    }
    if (tags.includes('event') || tags.includes('meeting') || tags.includes('appointment')) {
      return createEntry('event', 'medium', tags, text);
    }
    
    // Determine type based on content analysis (more intelligent)
    let type: EntryType = 'note';
    let confidence = 0.7;
    let reasoning = '';
    
    // IDEA DETECTION - Look for concept/innovation language
    if (lowerText.includes('ai personal assistant') || lowerText.includes('could be') || 
        lowerText.includes('would be great') || lowerText.includes('imagine if') ||
        lowerText.includes('what if') || lowerText.includes('maybe we could') ||
        lowerText.includes('innovation') || lowerText.includes('concept') ||
        lowerText.includes('brainstorm') || lowerText.includes('possibility') ||
        lowerText.includes('potential') || lowerText.includes('opportunity') ||
        (lowerText.includes('idea') && !lowerText.includes('good idea')) ||
        (lowerText.includes('think') && lowerText.includes('about'))) {
      type = 'idea';
      confidence = 0.9;
      reasoning = 'Contains concept/innovation language and exploratory thinking';
    }
    // TASK DETECTION - Look for actionable language
    else if (lowerText.includes('need to') || lowerText.includes('must') || 
             lowerText.includes('have to') || lowerText.includes('should') ||
             lowerText.includes('finish') || lowerText.includes('complete') || 
             lowerText.includes('do') || lowerText.includes('work on') ||
             lowerText.includes('start') || lowerText.includes('prepare') ||
             lowerText.includes('email') || lowerText.includes('call') || 
             lowerText.includes('meet') || lowerText.includes('buy') || 
             lowerText.includes('get') || lowerText.includes('find') ||
             lowerText.includes('review') || lowerText.includes('check') || 
             lowerText.includes('update') || lowerText.includes('create') || 
             lowerText.includes('build') || lowerText.includes('design') ||
             lowerText.includes('write') || lowerText.includes('read') || 
             lowerText.includes('study') || lowerText.includes('organize') || 
             lowerText.includes('clean') || lowerText.includes('fix') ||
             lowerText.includes('solve') || lowerText.includes('plan') || 
             lowerText.includes('schedule') || lowerText.includes('asap') ||
             lowerText.includes('urgent') || lowerText.includes('deadline')) {
      type = 'task';
      confidence = 0.85;
      reasoning = 'Contains actionable language and specific actions to perform';
    }
    // EVENT DETECTION - Look for scheduling/meeting language
    else if (lowerText.includes('meeting') || lowerText.includes('event') || 
             lowerText.includes('appointment') || lowerText.includes('conference') ||
             lowerText.includes('party') || lowerText.includes('dinner') || 
             lowerText.includes('lunch') || lowerText.includes('interview') ||
             lowerText.includes('presentation') || lowerText.includes('workshop') || 
             lowerText.includes('class') || lowerText.includes('at ') ||
             lowerText.includes('on ') || lowerText.includes('tomorrow') ||
             lowerText.includes('next week') || lowerText.includes('this weekend')) {
      type = 'event';
      confidence = 0.8;
      reasoning = 'Contains scheduling language and time/date references';
    }
    // INSIGHT DETECTION - Look for learning/discovery language
    else if (lowerText.includes('insight') || lowerText.includes('learned') || 
             lowerText.includes('discovered') || lowerText.includes('realized') ||
             lowerText.includes('understood') || lowerText.includes('figured out') ||
             lowerText.includes('aha') || lowerText.includes('eureka') || 
             lowerText.includes('breakthrough') || lowerText.includes('key takeaway') ||
             lowerText.includes('lesson') || lowerText.includes('pattern') ||
             lowerText.includes('trend') || lowerText.includes('observation')) {
      type = 'insight';
      confidence = 0.85;
      reasoning = 'Contains learning/discovery language and realizations';
    }
    // REFLECTION DETECTION - Look for emotional/contemplative language
    else if (lowerText.includes('reflect') || lowerText.includes('feel') || 
             lowerText.includes('mood') || lowerText.includes('thought') ||
             lowerText.includes('wonder') || lowerText.includes('question') ||
             lowerText.includes('doubt') || lowerText.includes('hope') || 
             lowerText.includes('wish') || lowerText.includes('grateful') ||
             lowerText.includes('happy') || lowerText.includes('sad') || 
             lowerText.includes('excited') || lowerText.includes('worried') ||
             lowerText.includes('confused') || lowerText.includes('amazing') ||
             lowerText.includes('frustrated') || lowerText.includes('inspired')) {
      type = 'reflection';
      confidence = 0.8;
      reasoning = 'Contains emotional/contemplative language and personal feelings';
    }
    // JOURNAL DETECTION - Look for daily/recap language
    else if (lowerText.includes('journal') || lowerText.includes('today') || 
             lowerText.includes('day') || lowerText.includes('morning') ||
             lowerText.includes('evening') || lowerText.includes('weekend') ||
             lowerText.includes('yesterday') || lowerText.includes('this week') || 
             lowerText.includes('month') || lowerText.includes('recap') ||
             lowerText.includes('summary') || lowerText.includes('update')) {
      type = 'journal';
      confidence = 0.75;
      reasoning = 'Contains daily/recap language and time-based summaries';
    }
    // REMINDER DETECTION - Look for memory/alert language
    else if (lowerText.includes('remind') || lowerText.includes('remember') || 
             lowerText.includes('don\'t forget') || lowerText.includes('note to self') ||
             lowerText.includes('reminder') || lowerText.includes('alert') ||
             lowerText.includes('keep in mind') || lowerText.includes('mental note')) {
      type = 'reminder';
      confidence = 0.8;
      reasoning = 'Contains memory/alert language and self-reminders';
    }
    
    // Determine priority based on urgency indicators
    let priority: Priority = 'medium';
    if (lowerText.includes('urgent') || lowerText.includes('asap') || 
        lowerText.includes('emergency') || lowerText.includes('critical') || 
        lowerText.includes('immediate') || lowerText.includes('now') ||
        lowerText.includes('deadline') || lowerText.includes('due today')) {
      priority = 'urgent';
    } else if (lowerText.includes('important') || lowerText.includes('high') || 
               lowerText.includes('priority') || lowerText.includes('key') || 
               lowerText.includes('essential') || lowerText.includes('crucial') ||
               lowerText.includes('must') || lowerText.includes('need to')) {
      priority = 'high';
    } else if (lowerText.includes('low') || lowerText.includes('sometime') || 
               lowerText.includes('maybe') || lowerText.includes('optional') || 
               lowerText.includes('nice to have') || lowerText.includes('if time') ||
               lowerText.includes('could') || lowerText.includes('might')) {
      priority = 'low';
    }
    
    // Extract dates with improved patterns
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
          
          if (dateString.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = tomorrow;
          } else if (dateString.toLowerCase() === 'today') {
            dueDate = new Date();
          } else if (dateString.toLowerCase() === 'tonight') {
            const tonight = new Date();
            tonight.setHours(20, 0, 0, 0);
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
    console.log('Confidence:', confidence);
    console.log('Detected priority:', priority);
    console.log('Detected tags:', tags);
    console.log('Detected due date:', dueDate);
    console.log('Detected location:', location);
    console.log('Reasoning:', reasoning);
    
    return {
      type,
      priority,
      tags,
      dueDate,
      location,
      status: type === 'task' ? 'pending' as TaskStatus : 'pending' as TaskStatus,
      needsReview: false,
      confidence,
      reasoning: reasoning || `Classified as ${type} based on content analysis. Priority: ${priority}`,
      relatedIds: []
    };
  };

  const createEntry = (type: EntryType, priority: Priority, tags: string[], text: string) => {
    // Helper function to create entries with consistent structure
    
    // Extract dates and location
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
          
          if (dateString.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = tomorrow;
          } else if (dateString.toLowerCase() === 'today') {
            dueDate = new Date();
          } else if (dateString.toLowerCase() === 'tonight') {
            const tonight = new Date();
            tonight.setHours(20, 0, 0, 0);
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
    
    const locationMatch = text.match(/(?:at|in|@)\s+([A-Za-z\s]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    return {
      type,
      priority,
      tags,
      dueDate,
      location,
      status: type === 'task' ? 'pending' as TaskStatus : 'pending' as TaskStatus,
      needsReview: false,
      confidence: 0.95,
      reasoning: `Explicitly tagged as ${type} with #${type} hashtag`,
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
      setEditableEntry(parsed); // Allow editing of the parsed entry
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (editableEntry) {
      console.log('=== CaptureView: handleConfirm ===');
      console.log('About to add entry:', {
        content: inputText.trim(),
        type: editableEntry.type!,
        priority: editableEntry.priority!,
        tags: editableEntry.tags || [],
        dueDate: editableEntry.dueDate,
        location: editableEntry.location,
        status: editableEntry.status!,
        needsReview: editableEntry.needsReview!,
        confidence: editableEntry.confidence!,
        reasoning: editableEntry.reasoning!,
        relatedIds: editableEntry.relatedIds || []
      });
      
      addEntry({
        content: inputText.trim(),
        type: editableEntry.type!,
        priority: editableEntry.priority!,
        tags: editableEntry.tags || [],
        dueDate: editableEntry.dueDate,
        location: editableEntry.location,
        status: editableEntry.status!,
        needsReview: editableEntry.needsReview!,
        confidence: editableEntry.confidence!,
        reasoning: editableEntry.reasoning!,
        relatedIds: editableEntry.relatedIds || []
      });
      
      console.log('=== CaptureView: Entry added, about to navigate ===');
      
      setInputText('');
      setParsedEntry(null);
      setEditableEntry(null);
      setShowPreview(false);
      
      // Add a small delay to ensure the store update completes
      setTimeout(() => {
        console.log('=== CaptureView: Navigating to thoughts view ===');
        setCurrentView('thoughts');
      }, 100);
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

  if (showPreview && parsedEntry && editableEntry) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Analysis Complete
            </h1>
            <p className="text-gray-600">
              Here's how I categorized your thought. You can edit the details before saving.
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${getTypeColor(editableEntry.type!)}`}>
                  {getTypeIcon(editableEntry.type!)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{inputText}</h3>
                  
                  {/* Editable Type */}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type:</label>
                    <select
                      value={editableEntry.type}
                      onChange={(e) => setEditableEntry({...editableEntry, type: e.target.value as EntryType})}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="task">Task</option>
                      <option value="event">Event</option>
                      <option value="idea">Idea</option>
                      <option value="insight">Insight</option>
                      <option value="reflection">Reflection</option>
                      <option value="journal">Journal</option>
                      <option value="reminder">Reminder</option>
                      <option value="note">Note</option>
                    </select>
                  </div>
                  
                  {/* Editable Priority */}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority:</label>
                    <select
                      value={editableEntry.priority}
                      onChange={(e) => setEditableEntry({...editableEntry, priority: e.target.value as Priority})}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  
                  {/* Editable Tags */}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags:</label>
                    <input
                      type="text"
                      value={editableEntry.tags?.join(', ') || ''}
                      onChange={(e) => setEditableEntry({...editableEntry, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                      placeholder="Enter tags separated by commas"
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parsed Details */}
            <div className="space-y-3">
              {editableEntry.dueDate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Due: {editableEntry.dueDate.toLocaleDateString()}</span>
                </div>
              )}
              
              {editableEntry.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {editableEntry.location}</span>
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
              onClick={() => handleConfirm()}
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