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
import * as chrono from 'chrono-node';

export const CaptureView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedEntry, setParsedEntry] = useState<Partial<Entry> | null>(null);
  const [editableEntry, setEditableEntry] = useState<Partial<Entry> | null>(null);
  
  const { addEntry, setCurrentView } = useGenieNotesStore();

  // Directive parser - maps hashtags to structured fields
  const parseDirectives = (text: string) => {
    const directives: {
      pinnedForDate?: Date;
      dueDate?: Date;
      targetWeek?: string;
      priority?: Priority;
      type?: EntryType;
    } = {};
    
    const lowerText = text.toLowerCase();
    
    // Check for "today" mentioned in content (not just hashtags)
    if (lowerText.includes('today') && !lowerText.includes('#today')) {
      directives.pinnedForDate = new Date();
    }
    
    const directivePatterns = [
      // Date directives
      { pattern: /#today\b/i, action: () => { directives.pinnedForDate = new Date(); } },
      { pattern: /#tomorrow\b/i, action: () => { 
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        directives.dueDate = tomorrow;
      }},
      { pattern: /#thisweek\b/i, action: () => { directives.targetWeek = 'currentWeek'; } },
      { pattern: /#week\b/i, action: () => { directives.targetWeek = 'currentWeek'; } },
      { pattern: /#nextweek\b/i, action: () => { directives.targetWeek = 'nextWeek'; } },
      
      // Priority directives
      { pattern: /#urgent\b/i, action: () => { directives.priority = 'urgent'; } },
      { pattern: /#high\b/i, action: () => { directives.priority = 'high'; } },
      { pattern: /#medium\b/i, action: () => { directives.priority = 'medium'; } },
      { pattern: /#low\b/i, action: () => { directives.priority = 'low'; } },
      
      // Type directives
      { pattern: /#journal\b/i, action: () => { directives.type = 'journal'; } },
      { pattern: /#task\b/i, action: () => { directives.type = 'task'; } },
      { pattern: /#idea\b/i, action: () => { directives.type = 'idea'; } },
      { pattern: /#insight\b/i, action: () => { directives.type = 'insight'; } },
      { pattern: /#reflection\b/i, action: () => { directives.type = 'reflection'; } },
      { pattern: /#event\b/i, action: () => { directives.type = 'event'; } },
      { pattern: /#reminder\b/i, action: () => { directives.type = 'reminder'; } },
      { pattern: /#note\b/i, action: () => { directives.type = 'note'; } },
    ];

    // Apply all directive patterns
    directivePatterns.forEach(({ pattern, action }) => {
      if (pattern.test(text)) {
        action();
      }
    });

    return directives;
  };

  // Extract user tags (non-directive hashtags)
  const extractUserTags = (text: string) => {
    const directiveTags = [
      'today', 'tomorrow', 'thisweek', 'week', 'nextweek',
      'urgent', 'high', 'medium', 'low',
      'journal', 'task', 'idea', 'insight', 'reflection', 'event', 'reminder', 'note'
    ];
    
    const hashtags = text.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
    return hashtags.filter(tag => !directiveTags.includes(tag.toLowerCase()));
  };

  // Clean content by removing directive hashtags and normalizing
  const cleanContent = (text: string) => {
    let cleaned = text;
    
    // Remove directive hashtags
    const directivePatterns = [
      /#today\b/gi, /#tomorrow\b/gi, /#thisweek\b/gi, /#week\b/gi, /#nextweek\b/gi,
      /#urgent\b/gi, /#high\b/gi, /#medium\b/gi, /#low\b/gi,
      /#journal\b/gi, /#task\b/gi, /#idea\b/gi, /#insight\b/gi, 
      /#reflection\b/gi, /#event\b/gi, /#reminder\b/gi, /#note\b/gi
    ];
    
    directivePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up the text
    cleaned = cleaned
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/\s*[,\s]*$/g, '') // Remove trailing commas and spaces
      .replace(/^\s*[,\s]*/g, '') // Remove leading commas and spaces
      .trim();
    
    return cleaned;
  };

  // Parse natural language dates using chrono-node
  const parseNaturalLanguageDates = (text: string) => {
    const results = chrono.parse(text);
    if (results.length === 0) return {};
    
    const firstResult = results[0];
    const startDate = firstResult.start.date();
    
    // If it's a time expression, set as due date
    if (firstResult.start.isCertain('hour')) {
      return { dueDate: startDate };
    }
    
    // If it's just a date, set as pinned date
    return { pinnedForDate: startDate };
  };

  // Set default times for date expressions
  const setDefaultTimes = (directives: any, chronoResults: any) => {
    const defaults: any = {};
    
    // If we have a pinned date but no specific time, set default 9 AM
    if (directives.pinnedForDate && !chronoResults.dueDate) {
      const defaultTime = new Date(directives.pinnedForDate);
      defaultTime.setHours(9, 0, 0, 0);
      defaults.dueDate = defaultTime;
    }
    
    // If we have "next week" directive, set to Monday 9 AM
    if (directives.targetWeek === 'nextWeek' && !chronoResults.dueDate) {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
      nextMonday.setHours(9, 0, 0, 0);
      defaults.dueDate = nextMonday;
    }
    
    return defaults;
  };

  const parseInput = (text: string) => {
    console.log('=== Enhanced AI Parsing Debug ===');
    console.log('Original input:', text);
    
    // Store original text
    const rawContent = text;
    
    // Parse directives first
    const directives = parseDirectives(text);
    console.log('Directives parsed:', directives);
    
    // Parse natural language dates with chrono
    const chronoResults = parseNaturalLanguageDates(text);
    console.log('Chrono results:', chronoResults);
    
    // Set default times where appropriate
    const defaultTimes = setDefaultTimes(directives, chronoResults);
    console.log('Default times set:', defaultTimes);
    
    // Extract user tags (non-directive)
    const userTags = extractUserTags(text);
    console.log('User tags extracted:', userTags);
    
    // Clean content for display
    const cleanDisplayContent = cleanContent(text);
    console.log('Cleaned content:', cleanDisplayContent);
    
    // Determine final values (chrono results override directives)
    const finalDueDate = chronoResults.dueDate || directives.dueDate || defaultTimes.dueDate;
    let finalPinnedDate = directives.pinnedForDate || chronoResults.pinnedForDate;
    const finalPriority = directives.priority || 'medium';
    let finalType = directives.type;
    const finalTargetWeek = directives.targetWeek;
    
    // Enhanced type detection if no directive specified
    if (!finalType) {
      const lowerText = text.toLowerCase();
      
      // TASK DETECTION - Look for actionable language
      if (lowerText.includes('finish') || lowerText.includes('complete') || 
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
          lowerText.includes('urgent') || lowerText.includes('deadline') ||
          lowerText.includes('need to') || lowerText.includes('must') ||
          lowerText.includes('have to') || lowerText.includes('should')) {
        finalType = 'task';
      }
      // IDEA DETECTION - Look for concept/innovation language
      else if (lowerText.includes('could be') || lowerText.includes('would be great') || 
               lowerText.includes('imagine if') || lowerText.includes('what if') ||
               lowerText.includes('maybe we could') || lowerText.includes('innovation') || 
               lowerText.includes('concept') || lowerText.includes('brainstorm') ||
               lowerText.includes('possibility') || lowerText.includes('potential') ||
               lowerText.includes('opportunity') || lowerText.includes('think about')) {
        finalType = 'idea';
      }
      // EVENT DETECTION - Look for scheduling/meeting language
      else if (lowerText.includes('meeting') || lowerText.includes('event') || 
               lowerText.includes('appointment') || lowerText.includes('conference') ||
               lowerText.includes('party') || lowerText.includes('dinner') || 
               lowerText.includes('lunch') || lowerText.includes('interview') ||
               lowerText.includes('presentation') || lowerText.includes('workshop') || 
               lowerText.includes('class')) {
        finalType = 'event';
      }
      // Default to note if no clear type detected
      else {
        finalType = 'note';
      }
    }
    
    // Enhanced urgency detection - check for time-sensitive words in content
    let enhancedPriority = finalPriority;
    const lowerText = text.toLowerCase();
    if (lowerText.includes('today') || lowerText.includes('now') || 
        lowerText.includes('asap') || lowerText.includes('urgent') ||
        lowerText.includes('immediate') || lowerText.includes('deadline')) {
      enhancedPriority = 'urgent';
    } else if (lowerText.includes('tomorrow') || lowerText.includes('soon') ||
               lowerText.includes('quick') || lowerText.includes('fast')) {
      enhancedPriority = 'high';
    }
    
    // Determine if entry should be pinned to today
    const shouldPinToToday = finalPinnedDate || 
      (finalDueDate && finalDueDate.toDateString() === new Date().toDateString()) ||
      finalTargetWeek === 'currentWeek' ||
      lowerText.includes('today'); // Auto-pin if "today" mentioned
    
    // If "today" is mentioned, automatically pin to today
    if (lowerText.includes('today') && !finalPinnedDate) {
      finalPinnedDate = new Date();
    }
    
    console.log('Final parsed values:', {
      dueDate: finalDueDate,
      pinnedForDate: finalPinnedDate,
      targetWeek: finalTargetWeek,
      priority: enhancedPriority,
      type: finalType,
      shouldPinToToday
    });
    
    return {
      content: cleanDisplayContent,
      rawContent,
      type: finalType,
      priority: enhancedPriority,
      tags: userTags,
      dueDate: finalDueDate,
      pinnedForDate: finalPinnedDate,
      targetWeek: finalTargetWeek,
      status: finalType === 'task' ? 'pending' as TaskStatus : 'pending' as TaskStatus,
      needsReview: false,
      confidence: 0.95,
      reasoning: `Parsed with enhanced AI: Type=${finalType}, Priority=${enhancedPriority}, Due=${finalDueDate}, Pinned=${finalPinnedDate}`,
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
        content: editableEntry.content!,
        rawContent: editableEntry.rawContent!,
        type: editableEntry.type!,
        priority: editableEntry.priority!,
        tags: editableEntry.tags || [],
        dueDate: editableEntry.dueDate,
        pinnedForDate: editableEntry.pinnedForDate,
        targetWeek: editableEntry.targetWeek,
        status: editableEntry.status!,
        needsReview: editableEntry.needsReview!,
        confidence: editableEntry.confidence!,
        reasoning: editableEntry.reasoning!,
        relatedIds: editableEntry.relatedIds || []
      });
      
      addEntry({
        content: editableEntry.content!,
        rawContent: editableEntry.rawContent!,
        type: editableEntry.type!,
        priority: editableEntry.priority!,
        tags: editableEntry.tags || [],
        dueDate: editableEntry.dueDate,
        pinnedForDate: editableEntry.pinnedForDate,
        targetWeek: editableEntry.targetWeek,
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

              {/* Due Date */}
              {editableEntry.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Due Date: {editableEntry.dueDate.toLocaleDateString()}</span>
                </div>
              )}

              {/* Pinned Date */}
              {editableEntry.pinnedForDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Pinned to: {editableEntry.pinnedForDate.toLocaleDateString()}</span>
                </div>
              )}

              {/* Target Week */}
              {editableEntry.targetWeek && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4" />
                  <span>Target: {editableEntry.targetWeek === 'currentWeek' ? 'This Week' : 'Next Week'}</span>
                </div>
              )}
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