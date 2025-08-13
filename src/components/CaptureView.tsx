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
  Bell,
  Lightbulb,
  Edit3
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
        console.log('=== CaptureView: Navigating to home view ===');
        setCurrentView('home');
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              AI Analysis Complete
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Here's how I categorized your thought. You can edit the details before saving.
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-xl ${getTypeColor(editableEntry.type!)} shadow-sm`}>
                  {getTypeIcon(editableEntry.type!)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 leading-relaxed">{inputText}</h3>
                  
                  {/* Editable Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Editable Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type:</label>
                      <select
                        value={editableEntry.type}
                        onChange={(e) => setEditableEntry({...editableEntry, type: e.target.value as EntryType})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority:</label>
                      <select
                        value={editableEntry.priority}
                        onChange={(e) => setEditableEntry({...editableEntry, priority: e.target.value as Priority})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Editable Tags */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags:</label>
                    <input
                      type="text"
                      value={editableEntry.tags?.join(', ') || ''}
                      onChange={(e) => setEditableEntry({...editableEntry, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Parsed Details */}
              {(editableEntry.dueDate || editableEntry.location) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  {editableEntry.dueDate && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-sm text-gray-600">{editableEntry.dueDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {editableEntry.location && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-gray-600">{editableEntry.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Reasoning */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">AI Reasoning</span>
                </div>
                <p className="text-green-700 leading-relaxed">{parsedEntry.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleEdit}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-center gap-2">
                <Edit3 className="w-5 h-5" />
                <span>Edit Input</span>
              </div>
            </button>
            <button
              onClick={() => handleConfirm()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-teal-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Confirm & Save</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Capture Your Thoughts
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let AI help you organize and categorize your ideas, tasks, and insights. 
            Just type naturally and we'll figure out the rest.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="thought-input" className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              id="thought-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your thought here... For example: 'Need to finish project by Friday #task' or 'AI Personal Assistant for parents #idea'"
              className="w-full h-32 sm:h-40 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
              disabled={isProcessing}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Categorize</span>
                </div>
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Pro Tips:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Use hashtags like <code className="bg-blue-200 px-1 rounded">#idea</code>, <code className="bg-blue-200 px-1 rounded">#task</code>, <code className="bg-blue-200 px-1 rounded">#insight</code></li>
                  <li>• Include dates like "tomorrow", "next week", "Friday"</li>
                  <li>• Add urgency words like "urgent", "ASAP", "important"</li>
                  <li>• Mention locations with "at", "in", or "@"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};