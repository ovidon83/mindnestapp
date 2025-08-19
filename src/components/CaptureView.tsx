import React, { useState, useRef, useEffect } from 'react';
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
  Mic,
  MicOff
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
  
  // Voice capture states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs for voice recording
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { addEntry, setCurrentView } = useGenieNotesStore();

  // Cleanup effects for voice recording
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Real-time speech recognition using Web Speech API
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
      setInputText(fullTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (event.error === 'no-speech') {
        alert('No speech detected. Please try speaking again.');
      } else if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript.trim());
        setInputText(finalTranscript.trim());
      }
    };
    
    recognition.start();
  };



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
          // For deadline phrases, ensure the date is in the future
          const parsedDateObj = parsedDate.start.date();
          const now = new Date();
          
          if (parsedDateObj < now) {
            // If parsed date is in the past, try to get next occurrence
            if (parsedDate.start.isCertain('weekday')) {
              // It's a weekday reference, get next occurrence
              const weekday = parsedDateObj.getDay();
              const nextOccurrence = getNextWeekday(weekday);
              directives.dueDate = nextOccurrence;
            } else {
              // For other past dates, set to today + 1 day
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              directives.dueDate = tomorrow;
            }
          } else {
            directives.dueDate = parsedDateObj;
          }
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
    
    // Handle relative weekday references
    if (lowerText.includes('friday') || lowerText.includes('fri')) {
      const friday = getNextWeekday(5); // 5 = Friday
      friday.setHours(17, 0, 0, 0); // 5 PM
      return friday;
    }
    
    if (lowerText.includes('monday') || lowerText.includes('mon')) {
      const monday = getNextWeekday(1); // 1 = Monday
      monday.setHours(9, 0, 0, 0); // 9 AM
      return monday;
    }
    
    if (lowerText.includes('tuesday') || lowerText.includes('tue')) {
      const tuesday = getNextWeekday(2); // 2 = Tuesday
      tuesday.setHours(9, 0, 0, 0); // 9 AM
      return tuesday;
    }
    
    if (lowerText.includes('wednesday') || lowerText.includes('wed')) {
      const wednesday = getNextWeekday(3); // 3 = Wednesday
      wednesday.setHours(9, 0, 0, 0); // 9 AM
      return wednesday;
    }
    
    if (lowerText.includes('thursday') || lowerText.includes('thu')) {
      const thursday = getNextWeekday(4); // 4 = Thursday
      thursday.setHours(9, 0, 0, 0); // 9 AM
      return thursday;
    }
    
    if (lowerText.includes('saturday') || lowerText.includes('sat')) {
      const saturday = getNextWeekday(6); // 6 = Saturday
      saturday.setHours(10, 0, 0, 0); // 10 AM
      return saturday;
    }
    
    if (lowerText.includes('sunday') || lowerText.includes('sun')) {
      const sunday = getNextWeekday(0); // 0 = Sunday
      sunday.setHours(10, 0, 0, 0); // 10 AM
      return sunday;
    }
    
    return null;
  };

  // Helper function to get the next occurrence of a weekday
  const getNextWeekday = (targetDay: number): Date => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    let daysUntilTarget = targetDay - currentDay;
    
    // If target day is today or in the past, get next week's occurrence
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
  };

  // Enhanced Multi-Thought Recognition
  const splitIntoMultipleEntries = (text: string): Partial<Entry>[] => {
    const entries: Partial<Entry>[] = [];
    
    // Advanced splitting patterns for better thought recognition
    const splitPatterns = [
      // Natural speech patterns
      /\s+(?:and|also|plus|additionally|furthermore|moreover|besides|in addition|as well as)\s+/i,
      // Punctuation-based splits
      /[.!?]\s+(?=[A-Z])/g,  // Sentence endings followed by capital
      /\n\s*\n/,              // Double line breaks
      /;\s+/,                 // Semicolons
      /,\s+(?=(?:and|or|but)\s)/i, // Commas before conjunctions
      // Thought transition words
      /\s+(?:meanwhile|however|therefore|consequently|thus|hence|so|then)\s+/i,
      // Action-based splits
      /\s+(?:next|after that|then|subsequently|following that)\s+/i,
      // Time-based splits
      /\s+(?:later|afterwards|meanwhile|during|while)\s+/i,
      // Context shifts
      /\s+(?:speaking of|on another note|by the way|incidentally)\s+/i,
    ];
    
    let segments: string[] = [text];
    
    // First, try advanced pattern matching
    for (const pattern of splitPatterns) {
      const newSegments = segments[0].split(pattern);
      if (newSegments.length > 1) {
        segments = newSegments.filter(segment => segment.trim().length > 0);
        break;
      }
    }
    
    // If no advanced patterns worked, try comma-based splitting
    if (segments.length === 1) {
      const commaSegments = text.split(/,\s+/);
      if (commaSegments.length > 1) {
        const validSegments = commaSegments.filter(segment => {
          const trimmed = segment.trim();
          return trimmed.length > 8 && // Must be substantial
                 !trimmed.toLowerCase().startsWith('and') &&
                 !trimmed.toLowerCase().startsWith('or') &&
                 !trimmed.toLowerCase().startsWith('but') &&
                 !trimmed.toLowerCase().startsWith('also') &&
                 !trimmed.toLowerCase().startsWith('plus');
        });
        
        if (validSegments.length > 1) {
          segments = validSegments;
        }
      }
    }
    
    // If still no splits, try action verb detection
    if (segments.length === 1) {
      const actionVerbs = [
        'finish', 'complete', 'start', 'work on', 'prepare', 'email', 'call',
        'meet', 'buy', 'get', 'find', 'review', 'check', 'update', 'create',
        'build', 'design', 'write', 'read', 'study', 'organize', 'clean',
        'fix', 'solve', 'plan', 'schedule', 'remember', 'think about',
        'need to', 'want to', 'should', 'must', 'have to', 'going to'
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
          
          if (firstPart.length > 12 && secondPart.length > 12) {
            segments = [firstPart, secondPart];
          }
        }
      }
    }
    
    // Create entries for each segment with enhanced parsing
    segments.forEach((segment) => {
      const trimmedSegment = segment.trim();
      if (trimmedSegment.length > 0) {
        const entry = parseInput(trimmedSegment);
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
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Intelligence Complete
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Here's how I've organized and enhanced your thought. Review and save.
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-6 sm:p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${getTypeColor(editableEntry.type!)} shadow-sm`}>
                  {getTypeIcon(editableEntry.type!)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-4 leading-relaxed">{inputText}</h3>
                  
                  {/* AI Intelligence Summary */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-semibold text-blue-200">AI Intelligence Applied</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-300">Type: <strong className="text-white">{editableEntry.type}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-300">Priority: <strong className="text-white">{editableEntry.priority}</strong></span>
                      </div>
                      {editableEntry.dueDate && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-300">Due: <strong className="text-white">{editableEntry.dueDate.toLocaleDateString()}</strong></span>
                        </div>
                      )}
                      {editableEntry.tags && editableEntry.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          <span className="text-pink-300">Tags: <strong className="text-white">{editableEntry.tags.join(', ')}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Editable Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Editable Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Type:</label>
                      <select
                        value={editableEntry.type}
                        onChange={(e) => setEditableEntry({...editableEntry, type: e.target.value as EntryType})}
                        className="w-full px-4 py-3 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-700 text-white hover:bg-gray-600 transition-colors"
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
                      <label className="block text-sm font-medium text-gray-200 mb-2">Priority:</label>
                      <select
                        value={editableEntry.priority}
                        onChange={(e) => setEditableEntry({...editableEntry, priority: e.target.value as Priority})}
                        className="w-full px-4 py-3 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-700 text-white hover:bg-gray-600 transition-colors"
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
                    <label className="block text-sm font-medium text-gray-200 mb-2">Tags:</label>
                    <input
                      type="text"
                      value={editableEntry.tags?.join(', ') || ''}
                      onChange={(e) => setEditableEntry({...editableEntry, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-4 py-3 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Parsed Details */}
              {(editableEntry.dueDate || editableEntry.location || editableEntry.pinnedForDate) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-700 rounded-2xl border border-gray-600">
                  {editableEntry.dueDate && (
                    <div className="flex items-center gap-3 text-gray-200">
                      <Clock className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Due Date</p>
                        <p className="text-sm text-gray-300">{editableEntry.dueDate.toLocaleDateString()}</p>
                        {editableEntry.dueDate.toLocaleTimeString && (
                          <p className="text-xs text-gray-400">{editableEntry.dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {editableEntry.pinnedForDate && !editableEntry.dueDate && (
                    <div className="flex items-center gap-3 text-gray-200">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Pinned for Date</p>
                        <p className="text-sm text-gray-300">{editableEntry.pinnedForDate.toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">Reference date (not a deadline)</p>
                      </div>
                    </div>
                  )}
                  
                  {editableEntry.location && (
                    <div className="flex items-center gap-3 text-gray-200">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Location</p>
                        <p className="text-sm text-gray-300">{editableEntry.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Deadline Status */}
              {editableEntry.dueDate && (
                <div className="mb-6 p-4 bg-orange-900/20 border border-orange-500/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-orange-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-200">Deadline Detected</p>
                      <p className="text-sm text-orange-300">
                        This entry will be treated as a deadline and may show as "Overdue" if not completed on time.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-orange-300">
                      <input
                        type="checkbox"
                        checked={editableEntry.isDeadline !== false}
                        onChange={(e) => setEditableEntry({...editableEntry, isDeadline: e.target.checked})}
                        className="h-4 w-4 text-orange-400 rounded border-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
                      />
                      Treat as deadline
                    </label>
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-200 mb-2">Due Date:</label>
                <input
                  type="datetime-local"
                  value={editableEntry.dueDate ? editableEntry.dueDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditableEntry({...editableEntry, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                  className="w-full px-4 py-3 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-200 mb-2">Location:</label>
                <input
                  type="text"
                  value={editableEntry.location || ''}
                  onChange={(e) => setEditableEntry({...editableEntry, location: e.target.value})}
                  placeholder="Enter location (optional)"
                  className="w-full px-4 py-3 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-600 text-gray-200 rounded-2xl hover:bg-gray-500 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl hover:from-green-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
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
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Multiple Entries Detected!
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              I found {multipleEntries.length} separate thoughts in your input. Each will be saved as a separate entry.
            </p>
          </div>

          {/* Multiple Entries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {editableMultipleEntries.map((entry, index) => (
              <div key={index} className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-6">
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
                          className="w-full px-3 py-2 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
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
                          className="w-full px-3 py-2 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
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
                          className="w-full px-3 py-2 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Detected Details */}
                    {(entry.dueDate || entry.pinnedForDate) && (
                      <div className="mt-4 p-3 bg-gray-700 rounded-2xl border border-gray-600">
                        {entry.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                            <Clock className="w-4 h-4 text-green-400" />
                            <span>Due: {entry.dueDate.toLocaleDateString()}</span>
                          </div>
                        )}
                        {entry.pinnedForDate && !entry.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-200">
                            <Calendar className="w-4 h-4 text-blue-400" />
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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6 shadow-2xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            GenieNotes
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform your thoughts into organized, actionable intelligence. 
            One place for everything that matters.
          </p>
        </div>

        {/* Core Input Section */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-3">
              What's on your mind?
            </h2>
            <p className="text-gray-300">
              Speak or type naturally. AI will organize and enhance everything.
            </p>
          </div>

          {/* Input Area */}
          <div className="mb-8">
            <textarea
              id="thought-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share your thoughts, tasks, ideas, or reflections... For example: 'Need to finish project by Friday, also call John about the meeting, and I had an idea for a new app feature'"
              className="w-full h-32 px-6 py-4 bg-gray-700 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-white placeholder-gray-400 text-lg leading-relaxed transition-colors"
              disabled={isProcessing}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Voice Button */}
            <button
              onClick={startSpeechRecognition}
              disabled={isRecording || isProcessing}
              className={`relative group transition-all duration-300 ${
                isRecording ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              <div className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 animate-pulse' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-pink-500/25'
              }`}>
                {isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </div>
              {/* Glow effect */}
              {!isRecording && (
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              )}
            </button>

            {/* Main Action Button */}
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg hover:from-pink-700 hover:to-purple-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  <span>Process</span>
                </div>
              )}
            </button>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-pink-900/20 rounded-full border border-pink-500/30">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                <span className="text-pink-300 font-medium">
                  Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Release to stop recording</p>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-6 p-4 bg-gray-700 rounded-2xl border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-200">Voice Input:</p>
                <button
                  onClick={() => {
                    setTranscript('');
                    setInputText('');
                  }}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              <p className="text-gray-300 italic leading-relaxed">"{transcript}"</p>
            </div>
          )}
        </div>

        {/* Core Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Thought Capture */}
          <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 hover:border-pink-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Thought Capture</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Automatically split your thoughts into actionable tasks, ideas, and reflections. 
              No more manual categorization.
            </p>
          </div>

          {/* Smart Assistant */}
          <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Smart Assistant</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              AI adds due dates, urgency levels, and smart nudges. 
              "Hey, you said you'd email John today!"
            </p>
          </div>

          {/* Insight Engine */}
          <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 hover:border-green-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Insight Engine</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Discover patterns in your thoughts and behaviors. 
              "You've mentioned stress 3x this week; want to reflect?"
            </p>
          </div>

          {/* Unified Flow */}
          <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 hover:border-pink-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Unified Flow</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Keep all thoughts and tasks in one place. 
              No more scattered notes across multiple apps.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-pink-400 mt-1 flex-shrink-0" />
            <div className="text-gray-300">
              <p className="font-medium mb-3 text-white">💡 Quick Tips:</p>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Voice Input:</strong> Click the microphone and speak naturally</li>
                <li>• <strong>Natural Language:</strong> "tomorrow 3pm", "urgent", "Friday deadline"</li>
                <li>• <strong>Multiple Thoughts:</strong> Separate with commas or "and" - AI will split them</li>
                <li>• <strong>Smart Detection:</strong> AI automatically detects tasks, ideas, and insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};