import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entry, TimeBucket, Priority, HomeViewPreferences, GroupingMode, AppView, SubTask } from '../types';

interface AllyMindStore {
  entries: Entry[];
  homeViewPrefs: HomeViewPreferences;
  currentView: AppView;
  
  // Entry management
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'timeBucket'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  toggleEntryComplete: (id: string) => void;
  toggleEntryPin: (id: string) => void;
  
  // Enhanced entry management
  editEntryTitle: (id: string, newTitle: string) => void;
  editEntryBody: (id: string, newBody: string) => void;
  addSubTask: (entryId: string, subTaskTitle: string) => void;
  toggleSubTask: (entryId: string, subTaskId: string) => void;
  
  // AI Processing
  processInputWithAI: (rawInput: string) => Entry[];
  splitInputIntoEntries: (rawInput: string) => Omit<Entry, 'id' | 'createdAt' | 'timeBucket'>[];
  enhanceEntryWithAI: (entryData: Omit<Entry, 'id' | 'createdAt' | 'timeBucket'>) => Entry;
  classifyEntry: (text: string) => { type: 'task' | 'thought', confidence: number };
  extractTimeInfo: (text: string) => { dueAt?: Date };
  determinePriority: (text: string, type: 'task' | 'thought') => Priority;
  generateAINote: (text: string, type: 'task' | 'thought') => string;
  generateSubTasks: (text: string) => SubTask[];
  
  // Planning & Organization
  updatePlanningSessions: (newEntries: Entry[]) => void;
  getDailyTop3: () => Entry[];
  getWeeklyReview: () => { critical: Entry[], postponed: Entry[], forgotten: Entry[] };
  reorderEntries: (entryIds: string[]) => void;
  
  // Bulk operations
  bulkComplete: (ids: string[]) => void;
  bulkDelete: (ids: string[]) => void;
  bulkDefer: (ids: string[], timeBucket: TimeBucket) => void;
  bulkAddTags: (ids: string[], tags: string[]) => void;
  
  // App state
  setCurrentView: (view: AppView) => void;
  
  // Preferences
  updateHomeViewPrefs: (updates: Partial<HomeViewPreferences>) => void;
  setGrouping: (grouping: GroupingMode) => void;
  setFilters: (filters: Partial<HomeViewPreferences['filters']>) => void;
  setSort: (sort: Partial<HomeViewPreferences['sort']>) => void;
  toggleGroupCollapsed: (groupId: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Computed values
  getFilteredEntries: () => Entry[];
  getGroupedEntries: () => Record<string, Entry[]>;
  getTimeBucketFromDate: (date?: Date) => TimeBucket;
}

const defaultHomeViewPrefs: HomeViewPreferences = {
  grouping: 'time',
  filters: {
    types: ['task', 'thought'],
    timeBuckets: ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday', 'none'],
    status: 'both',
    pinnedOnly: false,
  },
  sort: {
    primary: 'timeBucket',
    secondary: 'priority',
  },
  collapsedGroups: {},
  searchQuery: '',
};

export const useAllyMindStore = create<AllyMindStore>()(
  persist(
    (set, get) => ({
      entries: [
        {
          id: '1',
          type: 'task',
          title: 'Design new landing page',
          body: 'Create a modern, responsive landing page for our product',
          tags: ['design', 'frontend', 'priority'],
          createdAt: new Date(),
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          timeBucket: 'tomorrow',
          priority: 'high',
          completed: false,
          pinned: true,
          note: 'Based on your previous design work, consider using a hero section with clear value proposition, social proof section, and strong CTA buttons. Your users respond well to gradient backgrounds and interactive elements.',
          subTasks: [
            { id: '1a', title: 'Wireframe layout', completed: false, createdAt: new Date() },
            { id: '1b', title: 'Design hero section', completed: false, createdAt: new Date() },
            { id: '1c', title: 'Create mobile mockups', completed: false, createdAt: new Date() }
          ],
          progress: 0
        },
        {
          id: '2',
          type: 'task',
          title: 'Review quarterly reports',
          body: 'Analyze Q3 performance metrics and prepare presentation',
          tags: ['analysis', 'business', 'presentation'],
          createdAt: new Date(),
          dueAt: new Date(),
          timeBucket: 'today',
          priority: 'medium',
          completed: false,
          pinned: false,
          note: 'Focus on key performance indicators that show growth trends. Consider creating visual charts for better stakeholder understanding. Your previous presentations were well-received when you included actionable insights.',
          subTasks: [
            { id: '2a', title: 'Gather data from all departments', completed: false, createdAt: new Date() },
            { id: '2b', title: 'Create performance charts', completed: false, createdAt: new Date() },
            { id: '2c', title: 'Write executive summary', completed: false, createdAt: new Date() }
          ],
          progress: 0
        },
        {
          id: '3',
          type: 'thought',
          title: 'User experience insights',
          body: 'Reflect on recent user feedback and identify improvement opportunities',
          tags: ['ux', 'insights', 'improvement'],
          createdAt: new Date(),
          timeBucket: 'none',
          priority: 'low',
          completed: false,
          pinned: false,
          note: 'Your user research has shown that customers value simplicity and speed. Consider A/B testing different navigation patterns and measuring completion rates.'
        }
      ],
      homeViewPrefs: defaultHomeViewPrefs,
      currentView: 'capture' as AppView,
      


      // AI Processing Functions
      processInputWithAI: (rawInput: string) => {
        const entries = get().splitInputIntoEntries(rawInput);
        const processedEntries = entries.map(entry => get().enhanceEntryWithAI(entry));
        
        // Add all processed entries
        set((state) => ({
          entries: [...state.entries, ...processedEntries],
        }));
        
        // Trigger planning session updates
        get().updatePlanningSessions(processedEntries);
        
        return processedEntries;
      },

      splitInputIntoEntries: (rawInput: string): Omit<Entry, 'id' | 'createdAt' | 'timeBucket'>[] => {
        // Enhanced splitting with intelligent detection
        const separators = [
          /\.\s+/g,           // Period + space
          /!\s+/g,            // Exclamation + space
          /\?\s+/g,           // Question + space
          /;\s+/g,            // Semicolon + space
          /\n\s*\n/g,         // Double line breaks
          /\s+and\s+/gi,      // "and" between items
          /\s+then\s+/gi,     // "then" between items
          /\s+also\s+/gi,     // "also" between items
          /\s+next\s+/gi,     // "next" between items
          /\s+finally\s+/gi,  // "finally" between items
        ];

        let splitInput = rawInput;
        separators.forEach(separator => {
          splitInput = splitInput.replace(separator, '|||SPLIT|||');
        });

        let rawEntries = splitInput.split('|||SPLIT|||').filter(entry => entry.trim().length > 0);
        
        // Further split if entries are still too long or contain multiple thoughts
        const finalEntries: string[] = [];
        for (const entry of rawEntries) {
          const trimmed = entry.trim();
          if (trimmed.length > 200) {
            // Split long entries by sentence boundaries
            const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
            finalEntries.push(...sentences.map(s => s.trim()).filter(s => s.length > 10));
          } else {
            finalEntries.push(trimmed);
          }
        }
        
        return finalEntries.map(entry => ({
          type: 'thought' as const, // Will be classified by AI
          title: entry.trim(),
          body: entry.trim(),
          tags: [],
          dueAt: undefined,
          priority: undefined,
          completed: false,
          pinned: false,
          aiConfidence: undefined,
          note: undefined,
          subTasks: undefined,
          progress: undefined,
        }));
      },

      enhanceEntryWithAI: (entryData: Omit<Entry, 'id' | 'createdAt' | 'timeBucket'>): Entry => {
        const now = new Date();
        
        // 1. Classify as Task or Thought
        const classification = get().classifyEntry(entryData.title + ' ' + entryData.body);
        
        // 2. Extract time and reminders
        const timeInfo = get().extractTimeInfo(entryData.title + ' ' + entryData.body);
        
        // 3. Determine priority
        const priority = get().determinePriority(entryData.title + ' ' + entryData.body, classification.type);
        
        // 4. Generate AI insights
        const aiNote = get().generateAINote(entryData.title + ' ' + entryData.body, classification.type);
        
        // 5. Determine time bucket
        const timeBucket = get().getTimeBucketFromDate(timeInfo.dueAt);
        
        // 6. Generate sub-tasks for complex tasks
        const subTasks = classification.type === 'task' ? get().generateSubTasks(entryData.title + ' ' + entryData.body) : undefined;
        
        const newEntry: Entry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: now,
          type: classification.type,
          timeBucket,
          dueAt: timeInfo.dueAt,
          priority,
          note: aiNote,
          subTasks,
          progress: subTasks ? 0 : undefined,
          aiConfidence: classification.confidence,
        };
        
        return newEntry;
      },

      classifyEntry: (text: string): { type: 'task' | 'thought', confidence: number } => {
        const taskKeywords = [
          'need to', 'have to', 'must', 'should', 'will', 'going to', 'plan to', 'want to',
          'finish', 'complete', 'start', 'create', 'build', 'design', 'write', 'call', 'email',
          'meet', 'schedule', 'book', 'buy', 'order', 'submit', 'review', 'approve', 'send',
          'deadline', 'due', 'urgent', 'important', 'priority', 'reminder', 'todo', 'task'
        ];
        
        const thoughtKeywords = [
          'idea', 'thought', 'think', 'believe', 'feel', 'wonder', 'consider', 'reflect',
          'learned', 'discovered', 'realized', 'noticed', 'remember', 'dream', 'wish',
          'maybe', 'perhaps', 'could', 'might', 'interesting', 'curious', 'insight'
        ];
        
        const lowerText = text.toLowerCase();
        let taskScore = 0;
        let thoughtScore = 0;
        
        taskKeywords.forEach(keyword => {
          if (lowerText.includes(keyword)) taskScore += 1;
        });
        
        thoughtKeywords.forEach(keyword => {
          if (lowerText.includes(keyword)) thoughtScore += 1;
        });
        
        // Check for action-oriented language
        if (lowerText.includes('by') || lowerText.includes('until') || lowerText.includes('before')) {
          taskScore += 2;
        }
        
        if (lowerText.includes('?') || lowerText.includes('why') || lowerText.includes('how')) {
          thoughtScore += 2;
        }
        
        const totalScore = taskScore + thoughtScore;
        const confidence = totalScore > 0 ? Math.max(taskScore, thoughtScore) / totalScore : 0.5;
        
        return {
          type: taskScore >= thoughtScore ? 'task' : 'thought',
          confidence: Math.min(confidence + 0.3, 1.0) // Boost confidence
        };
      },

      extractTimeInfo: (text: string): { dueAt?: Date } => {
        const lowerText = text.toLowerCase();
        const now = new Date();
        
        try {
          // Natural language time parsing
          if (lowerText.includes('tomorrow')) {
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            return { dueAt: tomorrow };
          }
          
          if (lowerText.includes('next week')) {
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return { dueAt: nextWeek };
          }
          
          if (lowerText.includes('this week')) {
            const thisWeek = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            return { dueAt: thisWeek };
          }
          
          if (lowerText.includes('asap') || lowerText.includes('urgent')) {
            return { dueAt: now };
          }
          
          if (lowerText.includes('later') || lowerText.includes('someday')) {
            const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return { dueAt: later };
          }
          
          // Extract specific times (e.g., "3pm", "9am")
          const timeMatch = text.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
          if (timeMatch) {
            const hour = parseInt(timeMatch[1]);
            const isPM = timeMatch[2].toLowerCase() === 'pm';
            const adjustedHour = isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;
            
            const dueDate = new Date(now);
            dueDate.setHours(adjustedHour, 0, 0, 0);
            
            // If time has passed today, set for tomorrow
            if (dueDate <= now) {
              dueDate.setTime(dueDate.getTime() + 24 * 60 * 60 * 1000);
            }
            
            return { dueAt: dueDate };
          }
          
          return { dueAt: undefined };
        } catch (error) {
          console.warn('Error parsing time from text:', text, error);
          return { dueAt: undefined };
        }
      },

      determinePriority: (text: string, type: 'task' | 'thought'): Priority => {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('emergency')) {
          return 'urgent';
        }
        
        if (lowerText.includes('important') || lowerText.includes('critical') || lowerText.includes('deadline')) {
          return 'high';
        }
        
        if (lowerText.includes('priority') || lowerText.includes('focus') || lowerText.includes('key')) {
          return 'medium';
        }
        
        return type === 'task' ? 'medium' : 'low';
      },

      generateAINote: (text: string, type: 'task' | 'thought'): string => {
        const lowerText = text.toLowerCase();
        
        if (type === 'task') {
          // Generate specific insights based on task content
          if (lowerText.includes('design') || lowerText.includes('create')) {
            return `🎨 Design Task: Start with research and inspiration gathering. Consider user needs and create multiple iterations. Don't forget to get feedback early and often.`;
          } else if (lowerText.includes('write') || lowerText.includes('content')) {
            return `✍️ Writing Task: Begin with an outline or mind map. Consider your audience and key messages. Break into smaller writing sessions for better focus.`;
          } else if (lowerText.includes('meet') || lowerText.includes('call')) {
            return `📞 Communication Task: Prepare agenda and key points beforehand. Set clear objectives and follow up with action items.`;
          } else if (lowerText.includes('learn') || lowerText.includes('study')) {
            return `📚 Learning Task: Use spaced repetition techniques. Practice actively rather than just reading. Consider finding a study partner or mentor.`;
          } else if (lowerText.includes('organize') || lowerText.includes('clean')) {
            return `🧹 Organization Task: Start with the most visible areas first. Use the "touch once" rule - don't just move things around.`;
          } else {
            return `✅ Actionable Task: Break this down into smaller, specific steps. Set a realistic deadline and consider what resources you'll need.`;
          }
        } else {
          // Generate insights for thoughts/reflections
          if (lowerText.includes('idea') || lowerText.includes('concept')) {
            return `💡 Great idea! Consider how this connects to your existing projects. Maybe it's time to start a new project or pivot an existing one?`;
          } else if (lowerText.includes('problem') || lowerText.includes('issue')) {
            return `🔍 Problem Analysis: What's the root cause? Who else might be experiencing this? Consider multiple perspectives and potential solutions.`;
          } else if (lowerText.includes('goal') || lowerText.includes('vision')) {
            return `🎯 Goal Setting: Make this SMART (Specific, Measurable, Achievable, Relevant, Time-bound). What's the first step toward this vision?`;
          } else {
            return `🤔 Interesting reflection! Consider how this insight might apply to other areas of your life or work. Worth exploring further.`;
          }
        }
      },

      generateSubTasks: (text: string): SubTask[] => {
        const subTasks = [];
        const now = new Date();
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('design') || lowerText.includes('create')) {
          subTasks.push(
            { id: crypto.randomUUID(), title: 'Research and gather inspiration', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Create initial mockups', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Get feedback and iterate', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Finalize design', completed: false, createdAt: now }
          );
        } else if (lowerText.includes('write') || lowerText.includes('content')) {
          subTasks.push(
            { id: crypto.randomUUID(), title: 'Research and outline main points', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Write first draft', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Review and edit', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Get feedback and finalize', completed: false, createdAt: now }
          );
        } else if (lowerText.includes('meet') || lowerText.includes('call')) {
          subTasks.push(
            { id: crypto.randomUUID(), title: 'Prepare agenda and key points', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Schedule meeting', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Conduct meeting', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Follow up with action items', completed: false, createdAt: now }
          );
        } else if (lowerText.includes('learn') || lowerText.includes('study')) {
          subTasks.push(
            { id: crypto.randomUUID(), title: 'Set learning objectives', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Gather learning resources', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Practice and apply knowledge', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Review and reinforce', completed: false, createdAt: now }
          );
        } else if (lowerText.includes('organize') || lowerText.includes('clean')) {
          subTasks.push(
            { id: crypto.randomUUID(), title: 'Assess current state', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Create organization system', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Implement organization', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Maintain and improve', completed: false, createdAt: now }
          );
        } else {
          subTasks.push(
            { id: crypto.randomUUID(), title: 'Plan approach and timeline', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Execute main work', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Review and refine', completed: false, createdAt: now },
            { id: crypto.randomUUID(), title: 'Complete and document', completed: false, createdAt: now }
          );
        }
        
        return subTasks;
      },

      // Planning & Organization Functions
      updatePlanningSessions: (newEntries: Entry[]) => {
        // This will be called when new entries are added to update planning sessions
        // For now, just log - we'll implement full planning logic
        console.log('Planning sessions updated with:', newEntries);
      },

      getDailyTop3: () => {
        const { entries } = get();
        const todayEntries = entries.filter(entry => 
          entry.timeBucket === 'today' && 
          entry.type === 'task' && 
          !entry.completed
        );
        
        // Sort by priority and return top 3
        return todayEntries
          .sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority || 'low'] || 1;
            const bPriority = priorityOrder[b.priority || 'low'] || 1;
            return bPriority - aPriority;
          })
          .slice(0, 3);
      },

      getWeeklyReview: () => {
        const { entries } = get();
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const critical = entries.filter(entry => 
          entry.priority === 'urgent' && 
          entry.timeBucket === 'overdue'
        );
        
        const postponed = entries.filter(entry => 
          entry.dueAt && 
          entry.dueAt < oneWeekAgo && 
          !entry.completed
        );
        
        const forgotten = entries.filter(entry => 
          entry.createdAt < oneWeekAgo && 
          !entry.completed && 
          entry.timeBucket === 'someday'
        );
        
        return { critical, postponed, forgotten };
      },

      reorderEntries: (entryIds: string[]) => {
        set((state) => {
          const reorderedEntries = entryIds.map(id => 
            state.entries.find(entry => entry.id === id)
          ).filter(Boolean) as Entry[];
          
          const remainingEntries = state.entries.filter(entry => 
            !entryIds.includes(entry.id)
          );
          
          return {
            entries: [...reorderedEntries, ...remainingEntries]
          };
        });
      },

      addEntry: (entryData) => {
        const now = new Date();
        const timeBucket = get().getTimeBucketFromDate(entryData.dueAt);
        
        const newEntry: Entry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: now,
          timeBucket,
          completed: false,
          pinned: false,
        };
        
        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id) {
              const updatedEntry = { ...entry, ...updates };
              // Recalculate timeBucket if dueAt changed
              if (updates.dueAt !== undefined) {
                updatedEntry.timeBucket = get().getTimeBucketFromDate(updates.dueAt);
              }
              return updatedEntry;
            }
            return entry;
          }),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      // Enhanced entry management
      editEntryTitle: (id: string, newTitle: string) => {
        set((state) => ({
          entries: state.entries.map((entry) => 
            entry.id === id ? { ...entry, title: newTitle } : entry
          ),
        }));
      },

      editEntryBody: (id: string, newBody: string) => {
        set((state) => ({
          entries: state.entries.map((entry) => 
            entry.id === id ? { ...entry, body: newBody } : entry
          ),
        }));
      },

      addSubTask: (entryId: string, subTaskTitle: string) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === entryId) {
              const newSubTask: SubTask = {
                id: crypto.randomUUID(),
                title: subTaskTitle,
                completed: false,
                createdAt: new Date()
              };
              const updatedSubTasks = [...(entry.subTasks || []), newSubTask];
              return { ...entry, subTasks: updatedSubTasks };
            }
            return entry;
          }),
        }));
      },

      toggleSubTask: (entryId: string, subTaskId: string) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === entryId && entry.subTasks) {
              const updatedSubTasks = entry.subTasks.map(subTask => 
                subTask.id === subTaskId 
                  ? { ...subTask, completed: !subTask.completed }
                  : subTask
              );
              
              // Calculate progress
              const completedCount = updatedSubTasks.filter(st => st.completed).length;
              const progress = Math.round((completedCount / updatedSubTasks.length) * 100);
              
              return { ...entry, subTasks: updatedSubTasks, progress };
            }
            return entry;
          }),
        }));
      },

      toggleEntryComplete: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id && entry.type === 'task') {
              return { ...entry, completed: !entry.completed };
            }
            return entry;
          }),
        }));
      },

      toggleEntryPin: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id) {
              return { ...entry, pinned: !entry.pinned };
            }
            return entry;
          }),
        }));
      },

      bulkComplete: (ids) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (ids.includes(entry.id) && entry.type === 'task') {
              return { ...entry, completed: true };
            }
            return entry;
          }),
        }));
      },

      bulkDelete: (ids) => {
        set((state) => ({
          entries: state.entries.filter((entry) => !ids.includes(entry.id)),
        }));
      },

      bulkDefer: (ids, timeBucket) => {
        const now = new Date();
        let dueAt: Date | undefined;
        
        switch (timeBucket) {
          case 'tomorrow':
            dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'this_week':
            dueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'next_week':
            dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case 'later':
            dueAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dueAt = undefined;
        }
        
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (ids.includes(entry.id)) {
              return { 
                ...entry, 
                dueAt,
                timeBucket: get().getTimeBucketFromDate(dueAt),
              };
            }
            return entry;
          }),
        }));
      },

      bulkAddTags: (ids, tags) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (ids.includes(entry.id)) {
              const newTags = [...new Set([...entry.tags, ...tags])];
              return { ...entry, tags: newTags };
            }
            return entry;
          }),
        }));
      },

      updateHomeViewPrefs: (updates) => {
        set((state) => ({
          homeViewPrefs: { ...state.homeViewPrefs, ...updates },
        }));
      },

      setGrouping: (grouping) => {
        set((state) => ({
          homeViewPrefs: { ...state.homeViewPrefs, grouping },
        }));
      },

      setFilters: (filters) => {
        set((state) => ({
          homeViewPrefs: { 
            ...state.homeViewPrefs, 
            filters: { ...state.homeViewPrefs.filters, ...filters },
          },
        }));
      },

      setSort: (sort) => {
        set((state) => ({
          homeViewPrefs: { 
            ...state.homeViewPrefs, 
            sort: { ...state.homeViewPrefs.sort, ...sort },
          },
        }));
      },

      toggleGroupCollapsed: (groupId) => {
        set((state) => ({
          homeViewPrefs: {
            ...state.homeViewPrefs,
            collapsedGroups: {
              ...state.homeViewPrefs.collapsedGroups,
              [groupId]: !state.homeViewPrefs.collapsedGroups[groupId],
            },
          },
        }));
      },

      setSearchQuery: (query) => {
        set((state) => ({
          homeViewPrefs: { ...state.homeViewPrefs, searchQuery: query },
        }));
      },

      setCurrentView: (view) => {
        set(() => ({
          currentView: view,
        }));
      },

      getFilteredEntries: () => {
        const { entries } = get();
        
        // TEMPORARY: Show ALL entries until we fix the filtering
        if (entries.length > 0) {
          console.log('SHOWING ALL ENTRIES - FILTERING DISABLED');
          return entries;
        }
        
        return [];
      },

      getGroupedEntries: () => {
        const { getFilteredEntries, homeViewPrefs } = get();
        const filteredEntries = getFilteredEntries();
        const { grouping, sort } = homeViewPrefs;
        
        // Sort entries
        const sortedEntries = [...filteredEntries].sort((a, b) => {
          try {
            // Primary sort
            if (sort.primary === 'timeBucket') {
              const timeOrder = ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday', 'none'];
              const aOrder = timeOrder.indexOf(a.timeBucket);
              const bOrder = timeOrder.indexOf(b.timeBucket);
              if (aOrder !== bOrder) return aOrder - bOrder;
            } else if (sort.primary === 'priority') {
              const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
              const aPriority = a.priority ? priorityOrder[a.priority] : 4;
              const bPriority = b.priority ? priorityOrder[b.priority] : 4;
              if (aPriority !== bPriority) return aPriority - bPriority;
            } else if (sort.primary === 'dueAt') {
              if (a.dueAt && b.dueAt) {
                try {
                  const aTime = a.dueAt instanceof Date ? a.dueAt.getTime() : new Date(a.dueAt).getTime();
                  const bTime = b.dueAt instanceof Date ? b.dueAt.getTime() : new Date(b.dueAt).getTime();
                  if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                    return aTime - bTime;
                  }
                } catch (error) {
                  console.error('Error comparing dueAt dates:', error);
                }
              }
            } else if (sort.primary === 'createdAt') {
              try {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                  return bTime - aTime;
                }
              } catch (error) {
                console.error('Error comparing createdAt dates:', error);
              }
            }
            
            // Secondary sort
            if (sort.secondary === 'priority') {
              const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
              const aPriority = a.priority ? priorityOrder[a.priority] : 4;
              const bPriority = b.priority ? priorityOrder[b.priority] : 4;
              if (aPriority !== bPriority) return aPriority - bPriority;
            } else if (sort.secondary === 'dueAt') {
              if (a.dueAt && b.dueAt) {
                try {
                  const aTime = a.dueAt instanceof Date ? a.dueAt.getTime() : new Date(a.dueAt).getTime();
                  const bTime = b.dueAt instanceof Date ? b.dueAt.getTime() : new Date(b.dueAt).getTime();
                  if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                    return aTime - bTime;
                  }
                } catch (error) {
                  console.error('Error comparing dueAt dates in secondary sort:', error);
                }
              }
            } else if (sort.secondary === 'createdAt') {
              try {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                  return bTime - aTime;
                }
              } catch (error) {
                console.error('Error comparing createdAt dates in secondary sort:', error);
              }
            }
            
                      // Final sort: pinned first, then by creation date
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
          try {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            if (!isNaN(aTime) && !isNaN(bTime)) {
              return bTime - aTime;
            }
          } catch (error) {
            console.error('Error comparing createdAt dates in final sort:', error);
          }
          return 0;
          } catch (error) {
            console.error('Error sorting entries:', error);
            return 0; // Keep original order if sorting fails
          }
        });
        
        // Group entries
        if (grouping === 'none') {
          return { 'All Entries': sortedEntries };
        }
        
        if (grouping === 'time') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            try {
              // Handle old entries that might not have timeBucket
              let group = entry.timeBucket;
              if (!group) {
                const oldEntry = entry as any;
                if (oldEntry.dueDate) {
                  try {
                    const dueDate = new Date(oldEntry.dueDate);
                    if (!isNaN(dueDate.getTime())) {
                      group = get().getTimeBucketFromDate(dueDate);
                    } else {
                      group = 'none';
                    }
                  } catch {
                    group = 'none';
                  }
                } else if (oldEntry.pinnedForDate) {
                  try {
                    const pinnedDate = new Date(oldEntry.pinnedForDate);
                    if (!isNaN(pinnedDate.getTime())) {
                      group = get().getTimeBucketFromDate(pinnedDate);
                    } else {
                      group = 'none';
                    }
                  } catch {
                    group = 'none';
                  }
                } else {
                  group = 'none';
                }
              }
              if (!groups[group]) groups[group] = [];
              groups[group].push(entry);
            } catch (error) {
              console.error('Error grouping entry by time:', entry, error);
              // Put problematic entries in 'none' group
              if (!groups['none']) groups['none'] = [];
              groups['none'].push(entry);
            }
          });
          return groups;
        }
        
        if (grouping === 'type') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            // Handle old entry types - convert to simplified types
            let group = entry.type;
            if (['idea', 'insight', 'reflection', 'journal', 'reminder', 'note', 'event'].includes(group)) {
              group = 'thought';
            }
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        if (grouping === 'time_type') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            const group = `${entry.timeBucket} ▸ ${entry.type}`;
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        if (grouping === 'type_time') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            const group = `${entry.type} ▸ ${entry.timeBucket}`;
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        return { 'All Entries': sortedEntries };
      },

      getTimeBucketFromDate: (date?: Date): TimeBucket => {
        if (!date) return 'none';
        
        try {
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.warn('Invalid date provided to getTimeBucketFromDate:', date);
            return 'none';
          }
          
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          const endOfNextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
          
          const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          
          if (dueDate < today) return 'overdue';
          if (dueDate.getTime() === today.getTime()) return 'today';
          if (dueDate.getTime() === tomorrow.getTime()) return 'tomorrow';
          if (dueDate <= endOfWeek) return 'this_week';
          if (dueDate <= endOfNextWeek) return 'next_week';
          if (dueDate.getTime() < today.getTime() + 30 * 24 * 60 * 60 * 1000) return 'later';
          return 'someday';
        } catch (error) {
          console.warn('Error in getTimeBucketFromDate:', error);
          return 'none';
        }
      },
    }),
    {
      name: 'allymind-storage',
      partialize: (state) => ({
        entries: state.entries,
        homeViewPrefs: state.homeViewPrefs,
      }),
    }
  )
); 