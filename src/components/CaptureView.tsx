import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Sparkles,
  Mic,
  MicOff,
  Lightbulb,
  Target
} from 'lucide-react';
import { useAllyMindStore } from '../store';
import { Entry, EntryType, Priority, TaskStatus } from '../types';
import * as chrono from 'chrono-node';

export const CaptureView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice capture states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs for voice recording
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { addEntry, setCurrentView } = useAllyMindStore();

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
        directives.priority = 'urgent';
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
    // Extract hashtags from the text
    const hashtagPattern = /#\w+/g;
    const hashtags = text.match(hashtagPattern)?.map(tag => tag.slice(1)) || [];
    
    // Filter out directive tags, keep only user-defined tags
    const directiveTags = [
      'today', 'tomorrow', 'thisweek', 'week', 'nextweek',
      'urgent', 'high', 'medium', 'low',
      'journal', 'task', 'idea', 'insight', 'reflection', 'event', 'reminder', 'note'
    ];
    
    const userTags = hashtags.filter(tag => {
      const isDirective = directiveTags.some(directive => 
        directive.toLowerCase() === tag.toLowerCase()
      );
      return !isDirective;
    });
    
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
      startDate = new Date(currentYear, startDate.getMonth(), startDate.getDate());
    }
    
    // Validate: Don't set dates in the past
    if (startDate < now) {
      return {};
    }
    
    // If it's a time expression, set as due date
    if (firstResult.start.isCertain('hour')) {
      return { dueDate: startDate };
    }
    
    // If it's just a date, set as pinned date
    return { pinnedForDate: startDate };
  };

  const parseInput = (text: string) => {
    
    // Store original text
    const rawContent = text;
    
    // Parse directives first
    const directives = parseDirectives(text);
    
    // Parse natural language dates with chrono
    const chronoResults = parseNaturalLanguageDates(text);
    
    // Extract user tags from original text (excluding directive tags)
    const userTags = extractUserTags(text);
    
    // Clean content for display (remove ALL hashtags)
    const cleanDisplayContent = cleanContent(text);
    
    // Determine final values (chrono results override directives)
    let finalDueDate = chronoResults.dueDate || directives.dueDate;
    let finalPinnedDate = chronoResults.pinnedForDate || directives.pinnedForDate;
    let finalTargetWeek = directives.targetWeek;
    let enhancedPriority = directives.priority || 'medium';
    let finalType = directives.type || 'note';
    
    // If no specific date is set but content suggests urgency, pin to today
    if (!finalPinnedDate && !finalDueDate && enhancedPriority === 'urgent') {
      finalPinnedDate = new Date();
    }
    
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
    const lowerText = text.toLowerCase();
    if (lowerText.includes('today') || lowerText.includes('now') || 
        lowerText.includes('asap') || lowerText.includes('urgent') ||
        lowerText.includes('immediate') || lowerText.includes('deadline')) {
      enhancedPriority = 'urgent';
    } else if (lowerText.includes('tomorrow') || lowerText.includes('soon') ||
               lowerText.includes('quick') || lowerText.includes('fast')) {
      enhancedPriority = 'high';
    }
    
    // If "today" is mentioned, automatically pin to today
    if (lowerText.includes('today') && !finalPinnedDate) {
      finalPinnedDate = new Date();
    }
    
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
        // Multiple entries detected - save all automatically
        multipleEntries.forEach(entry => {
          if (entry.content && entry.content.trim()) {
            const fullEntry: Entry = {
              ...entry,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
              status: entry.type === 'task' ? 'pending' : 'pending',
              confidence: 0.95,
              reasoning: `Auto-processed: Type=${entry.type}, Priority=${entry.priority}`,
              needsReview: false,
              relatedIds: []
            } as Entry;
            addEntry(fullEntry);
          }
        });
        
        // Show success message and redirect
        setInputText('');
        setTranscript('');
        setCurrentView('home');
      } else {
        // Single entry - save automatically
        const parsed = parseInput(inputText);
        const fullEntry: Entry = {
          ...parsed,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: parsed.type === 'task' ? 'pending' : 'pending',
          confidence: 0.95,
          reasoning: `Auto-processed: Type=${parsed.type}, Priority=${parsed.priority}`,
          needsReview: false,
          relatedIds: []
        } as Entry;
        addEntry(fullEntry);
        
        // Show success message and redirect
        setInputText('');
        setTranscript('');
        setCurrentView('home');
      }
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AllyMind
            </h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Because your thoughts deserve intelligent organization
          </h2>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-12 shadow-xl">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Capture & Organize
            </h3>
            <p className="text-gray-600">
              Type or speak naturally. AllyMind understands and organizes everything.
            </p>
          </div>

          {/* Input Area */}
          <div className="mb-8">
            <textarea
              id="thought-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share your thoughts, tasks, ideas, or reflections... For example: 'Need to finish project by Friday, also call John about the meeting, and I had an idea for a new app feature'"
              className="w-full h-32 px-6 py-4 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 text-lg leading-relaxed transition-colors"
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
                  <span>Capture & Organize</span>
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
          <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:border-blue-500/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Intelligent Capture</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Automatically detect and separate multiple thoughts from a single input. 
              No more manual categorization or organization needed.
            </p>
          </div>

          {/* Smart Assistant */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:border-purple-500/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Smart Understanding</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              AI automatically detects deadlines, urgency levels, and context. 
              "Meeting with John tomorrow at 3pm" becomes a scheduled task.
            </p>
          </div>

          {/* Insight Engine */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:border-green-500/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Pattern Recognition</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Discover insights about your thinking patterns and behaviors. 
              "You've mentioned stress 3x this week; time for reflection?"
            </p>
          </div>

          {/* Unified Flow */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:border-pink-500/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Unified Workspace</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Keep all your thoughts, tasks, and insights in one intelligent workspace. 
              No more scattered notes across multiple apps and devices.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
            <div className="text-gray-700">
              <p className="font-medium mb-3 text-gray-900">💡 Pro Tips:</p>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Voice Input:</strong> Click the microphone and speak naturally - AllyMind understands context</li>
                <li>• <strong>Natural Language:</strong> Use phrases like "tomorrow 3pm", "urgent", or "Friday deadline"</li>
                <li>• <strong>Multiple Thoughts:</strong> Separate ideas with commas or "and" - AI automatically splits them</li>
                <li>• <strong>Smart Detection:</strong> AllyMind automatically categorizes tasks, ideas, and insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};