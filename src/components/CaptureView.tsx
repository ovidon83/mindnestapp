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
  Lightbulb
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
  const [multipleEntries, setMultipleEntries] = useState<Partial<Entry>[]>([]);
  const [editableMultipleEntries, setEditableMultipleEntries] = useState<Partial<Entry>[]>([]);
  
  const { addEntry, setCurrentView } = useGenieNotesStore();

  // Directive parser - maps hashtags to structured fields
  const parseDirectives = (text: string) => {
    const directives: {
      pinnedForDate?: Date;
      dueDate?: Date;
      targetWeek?: string;
      priority?: Priority;
      type?: EntryType;
      isDeadline?: boolean;
    } = {};
    
    const lowerText = text.toLowerCase();
    
    // Check for urgency indicators first
    const urgencyDueDate = getUrgencyDueDate(text);
    if (urgencyDueDate) {
      directives.dueDate = urgencyDueDate;
      directives.isDeadline = true;
      // Set priority to high for urgent tasks
      if (lowerText.includes('asap') || lowerText.includes('urgent') || lowerText.includes('immediately')) {
        directives.priority = 'high';
      }
    }
    
    // Natural language date detection using chrono-node (only if no urgency detected)
    if (!urgencyDueDate) {
      const chronoResults = chrono.parse(text, new Date());
      
      if (chronoResults.length > 0) {
        const parsedDate = chronoResults[0];
        
        // Determine if this should be a deadline or just a pinned date
        const isDeadline = isDeadlinePhrase(text);
        
        if (isDeadline) {
          directives.dueDate = parsedDate.start.date();
          directives.isDeadline = true;
        } else {
          // If not a deadline phrase, pin it to that date for reference
          directives.pinnedForDate = parsedDate.start.date();
          directives.isDeadline = false;
        }
      }
    }
    
    // Check for "today" mentioned in content (not just hashtags)
    if (lowerText.includes('today') && !lowerText.includes('#today')) {
      directives.pinnedForDate = new Date();
    }
    
    // Check for hashtag directives
    if (text.includes('#today')) {
      directives.pinnedForDate = new Date();
    }
    if (text.includes('#tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      directives.dueDate = tomorrow;
      directives.isDeadline = true;
    }
    if (text.includes('#thisweek') || text.includes('#week')) {
      directives.targetWeek = 'currentWeek';
    }
    if (text.includes('#nextweek')) {
      directives.targetWeek = 'nextWeek';
    }
    if (text.includes('#urgent')) {
      directives.priority = 'urgent';
    }
    if (text.includes('#high')) {
      directives.priority = 'high';
    }
    if (text.includes('#medium')) {
      directives.priority = 'medium';
    }
    if (text.includes('#low')) {
      directives.priority = 'low';
    }
    if (text.includes('#journal')) {
      directives.type = 'journal';
    }
    if (text.includes('#task')) {
      directives.type = 'task';
    }
    if (text.includes('#idea')) {
      directives.type = 'idea';
    }
    if (text.includes('#insight')) {
      directives.type = 'insight';
    }
    if (text.includes('#reflection')) {
      directives.type = 'reflection';
    }
    if (text.includes('#event')) {
      directives.type = 'event';
    }
    if (text.includes('#reminder')) {
      directives.type = 'reminder';
    }
    if (text.includes('#note')) {
      directives.type = 'note';
    }

    return directives;
  };

  // Helper function to determine if text contains deadline phrases
  const isDeadlinePhrase = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const deadlinePhrases = [
      'due', 'deadline', 'by', 'before', 'until', 'must', 'need to', 'have to',
      'should', 'will', 'going to', 'plan to', 'intend to', 'aim to', 'target',
      'finish', 'complete', 'submit', 'deliver', 'hand in', 'turn in',
      'asap', 'as soon as possible', 'urgent', 'immediately', 'right away',
      'now', 'today', 'tonight', 'this evening', 'this afternoon'
    ];
    
    return deadlinePhrases.some(phrase => lowerText.includes(phrase));
  };

  // Helper function to get urgency-based due date
  const getUrgencyDueDate = (text: string): Date | null => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('asap') || lowerText.includes('as soon as possible') || 
        lowerText.includes('urgent') || lowerText.includes('immediately') ||
        lowerText.includes('right away') || lowerText.includes('now')) {
      // Set to today at 5 PM (end of workday)
      const today = new Date();
      today.setHours(17, 0, 0, 0);
      return today;
    }
    
    if (lowerText.includes('today') || lowerText.includes('tonight') || 
        lowerText.includes('this evening') || lowerText.includes('this afternoon')) {
      // Set to today at 5 PM
      const today = new Date();
      today.setHours(17, 0, 0, 0);
      return today;
    }
    
    if (lowerText.includes('tomorrow')) {
      // Set to tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }
    
    return null;
  };

  // Function to split text into multiple entries
  const splitIntoMultipleEntries = (text: string): Partial<Entry>[] => {
    const entries: Partial<Entry>[] = [];
    
    // Split by common separators
    const splitPatterns = [
      /\n\s*\n/,           // Double line breaks
      /\.\s+(?=[A-Z])/,    // Period followed by capital letter (new sentence)
      /;\s+/,               // Semicolon
      /,\s+(?=and\s)/,     // Comma followed by "and"
      /(?<=\.)\s+(?=Also)/, // "Also" at start of sentence
      /(?<=\.)\s+(?=Plus)/, // "Plus" at start of sentence
      /(?<=\.)\s+(?=Additionally)/, // "Additionally" at start of sentence
      /(?<=\.)\s+(?=Furthermore)/,  // "Furthermore" at start of sentence
      /(?<=\.)\s+(?=Moreover)/,     // "Moreover" at start of sentence
    ];
    
    // Try different splitting strategies
    let segments: string[] = [text];
    
    // First, try to split by commas (most common separator)
    const commaSegments = text.split(/,\s+/);
    if (commaSegments.length > 1) {
      // Check if comma segments look like separate thoughts
      const validSegments = commaSegments.filter(segment => {
        const trimmed = segment.trim();
        return trimmed.length > 5 && // Must be substantial
               !trimmed.toLowerCase().startsWith('and') && // Not just "and..."
               !trimmed.toLowerCase().startsWith('or') &&  // Not just "or..."
               !trimmed.toLowerCase().startsWith('but');  // Not just "but..."
      });
      
      if (validSegments.length > 1) {
        segments = validSegments;
      }
    }
    
    // If comma splitting didn't work, try other patterns
    if (segments.length === 1) {
      for (const pattern of splitPatterns) {
        const newSegments = segments[0].split(pattern);
        if (newSegments.length > 1) {
          segments = newSegments.filter(segment => segment.trim().length > 0);
          break;
        }
      }
    }
    
    // If still no splits, try to split by action verbs
    if (segments.length === 1) {
      const actionVerbs = [
        'finish', 'complete', 'start', 'work on', 'prepare', 'email', 'call',
        'meet', 'buy', 'get', 'find', 'review', 'check', 'update', 'create',
        'build', 'design', 'write', 'read', 'study', 'organize', 'clean',
        'fix', 'solve', 'plan', 'schedule', 'remember', 'think about'
      ];
      
      const lowerText = text.toLowerCase();
      const foundVerbs = actionVerbs.filter(verb => lowerText.includes(verb));
      
      if (foundVerbs.length > 1) {
        // Split by the first action verb found
        const firstVerb = foundVerbs[0];
        const verbIndex = lowerText.indexOf(firstVerb);
        if (verbIndex > 0) {
          const firstPart = text.substring(0, verbIndex).trim();
          const secondPart = text.substring(verbIndex).trim();
          
          if (firstPart.length > 10 && secondPart.length > 10) {
            segments = [firstPart, secondPart];
          }
        }
      }
    }
    
    // Create entries for each segment
    segments.forEach((segment) => {
      const trimmedSegment = segment.trim();
      if (trimmedSegment.length > 0) {
        const entry = parseInput(trimmedSegment);
        // Don't set id here - it will be generated when saved
        entries.push(entry);
      }
    });
    
    return entries;
  };

  // Extract user hashtags, excluding directive hashtags to avoid duplication
  const extractUserTags = (text: string) => {
    const directiveTags = [
      'today', 'tomorrow', 'thisweek', 'week', 'nextweek',
      'urgent', 'high', 'medium', 'low',
      'journal', 'task', 'idea', 'insight', 'reflection', 'event', 'reminder', 'note'
    ];
    
    const hashtags = text.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
    console.log('All hashtags found:', hashtags);
    
    // Filter out directive tags (case-insensitive)
    const userTags = hashtags.filter(tag => {
      const isDirective = directiveTags.some(directive => 
        directive.toLowerCase() === tag.toLowerCase()
      );
      if (isDirective) {
        console.log(`Filtering out directive tag: ${tag}`);
      }
      return !isDirective;
    });
    
    console.log('Final user tags (after filtering directives):', userTags);
    return userTags;
  };

  // Clean content by removing ALL hashtags and normalizing
  const cleanContent = (text: string) => {
    let cleaned = text;
    
    // Remove ALL hashtags (both directive and user tags)
    const allHashtagPattern = /#\w+/g;
    cleaned = cleaned.replace(allHashtagPattern, '');
    
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
    let startDate = firstResult.start.date();
    
    // Fix: Ensure dates like "10/18" default to current year, not 2001
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // If the parsed date is in the past (like 2001), assume it's meant for current year
    if (startDate.getFullYear() < currentYear) {
      console.log(`Date ${startDate.toDateString()} is in the past, adjusting to current year ${currentYear}`);
      startDate = new Date(currentYear, startDate.getMonth(), startDate.getDate());
    }
    
    // Validate: Don't set dates in the past
    if (startDate < now) {
      console.log(`Adjusted date ${startDate.toDateString()} is still in the past, skipping date parsing`);
      return {};
    }
    
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
    
    // Extract user tags from original text (excluding directive tags)
    const userTags = extractUserTags(text);
    console.log('User tags extracted (excluding directives):', userTags);
    
    // Clean content for display (remove ALL hashtags)
    const cleanDisplayContent = cleanContent(text);
    console.log('Cleaned content (all hashtags removed):', cleanDisplayContent);
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    
    try {
      // Check if input contains multiple thoughts/entries
      const multipleEntries = splitIntoMultipleEntries(inputText);
      
      if (multipleEntries.length > 1) {
        // Multiple entries detected - show multi-entry preview
        setMultipleEntries(multipleEntries);
        setEditableMultipleEntries([...multipleEntries]);
        setShowPreview(true);
      } else {
        // Single entry - use existing single entry flow
        const parsed = parseInput(inputText);
        setParsedEntry(parsed);
        setEditableEntry(parsed);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEntry = () => {
    if (editableEntry) {
      addEntry(editableEntry as Entry);
      setCurrentView('home');
    }
  };

  const handleSaveMultipleEntries = () => {
    editableMultipleEntries.forEach(entry => {
      if (entry.content && entry.content.trim()) {
        addEntry(entry as Entry);
      }
    });
    setCurrentView('home');
  };

  const handleCancel = () => {
    setShowPreview(false);
    setParsedEntry(null);
    setEditableEntry(null);
    setMultipleEntries([]);
    setEditableMultipleEntries([]);
    setInputText('');
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
              {(editableEntry.dueDate || editableEntry.location || editableEntry.pinnedForDate) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  {editableEntry.dueDate && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-sm text-gray-600">{editableEntry.dueDate.toLocaleDateString()}</p>
                        {editableEntry.dueDate.toLocaleTimeString && (
                          <p className="text-xs text-gray-500">{editableEntry.dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {editableEntry.pinnedForDate && !editableEntry.dueDate && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Pinned for Date</p>
                        <p className="text-sm text-gray-600">{editableEntry.pinnedForDate.toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Reference date (not a deadline)</p>
                      </div>
                    </div>
                  )}
                  
                  {editableEntry.location && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-gray-600">{editableEntry.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Deadline Status */}
              {editableEntry.dueDate && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">Deadline Detected</p>
                      <p className="text-sm text-orange-700">
                        This entry will be treated as a deadline and may show as "Overdue" if not completed on time.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-orange-700">
                      <input
                        type="checkbox"
                        checked={editableEntry.isDeadline !== false}
                        onChange={(e) => setEditableEntry({...editableEntry, isDeadline: e.target.checked})}
                        className="h-4 w-4 text-orange-600 rounded border-orange-300 focus:ring-orange-500"
                      />
                      Treat as deadline
                    </label>
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date:</label>
                <input
                  type="datetime-local"
                  value={editableEntry.dueDate ? editableEntry.dueDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditableEntry({...editableEntry, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location:</label>
                <input
                  type="text"
                  value={editableEntry.location || ''}
                  onChange={(e) => setEditableEntry({...editableEntry, location: e.target.value})}
                  placeholder="Enter location (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-entry preview
  if (showPreview && multipleEntries.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Multiple Entries Detected!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I found {multipleEntries.length} separate thoughts in your input. Each will be saved as a separate entry.
            </p>
          </div>

          {/* Multiple Entries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {editableMultipleEntries.map((entry, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${getTypeColor(entry.type!)} shadow-sm`}>
                    {getTypeIcon(entry.type!)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-relaxed">
                      {entry.content}
                    </h3>
                    
                    {/* Editable Fields */}
                    <div className="space-y-3">
                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type:</label>
                        <select
                          value={entry.type}
                          onChange={(e) => {
                            const newEntries = [...editableMultipleEntries];
                            newEntries[index] = {...newEntries[index], type: e.target.value as EntryType};
                            setEditableMultipleEntries(newEntries);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      
                      {/* Priority */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority:</label>
                        <select
                          value={entry.priority}
                          onChange={(e) => {
                            const newEntries = [...editableMultipleEntries];
                            newEntries[index] = {...newEntries[index], priority: e.target.value as Priority};
                            setEditableMultipleEntries(newEntries);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags:</label>
                        <input
                          type="text"
                          value={entry.tags?.join(', ') || ''}
                          onChange={(e) => {
                            const newEntries = [...editableMultipleEntries];
                            newEntries[index] = {...newEntries[index], tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)};
                            setEditableMultipleEntries(newEntries);
                          }}
                          placeholder="Enter tags separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Detected Details */}
                    {(entry.dueDate || entry.pinnedForDate) && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        {entry.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span>Due: {entry.dueDate.toLocaleDateString()}</span>
                          </div>
                        )}
                        {entry.pinnedForDate && !entry.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Pinned: {entry.pinnedForDate.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMultipleEntries}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Save All Entries ({editableMultipleEntries.length})
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