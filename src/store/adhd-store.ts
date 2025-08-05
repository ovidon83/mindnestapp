import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, Entry, ParsedItem } from "../types";

interface ADHDStore {
  // Core data
  tasks: Task[];
  entries: Entry[];
  
  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  snoozeTask: (id: string, minutes?: number) => void;
  startTask: (id: string) => void;
  
  // Entry management
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => Entry;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  
  // Brain dump processing
  processBrainDump: (text: string) => ParsedItem[];
  confirmParsedItems: (items: ParsedItem[]) => void;
  
  // Computed getters
  getTodayTasks: () => Task[];
  getNowTask: () => Task | null;
  getLaterTasks: () => Task[];
  getActiveTasks: () => Task[];
  getAllEntries: () => Entry[];
}

// Enhanced brain dump parsing logic that handles paragraphs and multiple items
const parseText = (text: string): ParsedItem[] => {
  const items: ParsedItem[] = [];
  let itemIndex = 0;
  
  // First, try to split by clear delimiters
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length > 1) {
    // Multiple lines - treat each as separate item
    lines.forEach(line => {
      const item = parseSingleItem(line.trim(), itemIndex++);
      if (item.content) {
        items.push(item);
      }
    });
  } else {
    // Single block of text - try to extract multiple items
    const textBlock = text.trim();
    
    // Look for sentence boundaries that might indicate separate items
    const sentences = textBlock.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length > 1) {
      // Multiple sentences - analyze each
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 10) { // Only process substantial sentences
          const item = parseSingleItem(trimmed, itemIndex++);
          if (item.content) {
            items.push(item);
          }
        }
      });
    } else {
      // Single sentence/thought
      const item = parseSingleItem(textBlock, itemIndex++);
      if (item.content) {
        items.push(item);
      }
    }
  }
  
  return items.length > 0 ? items : [parseSingleItem(text.trim(), 0)];
};

const parseSingleItem = (text: string, index: number): ParsedItem => {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      id: `temp-${index}`,
      content: '',
      type: 'thought',
      tags: [],
      confidence: 0
    };
  }
  
  // Extract tags
  const tagMatches = trimmed.match(/#(\w+)/g) || [];
  const tags = tagMatches.map(tag => tag.slice(1));
  const contentWithoutTags = trimmed.replace(/#\w+/g, '').trim();
  
  // Classification logic
  let type: 'task' | 'idea' | 'thought' | 'journal' = 'thought';
  let confidence = 0.6;
  
  const lowerContent = contentWithoutTags.toLowerCase();
  
  // Detect tasks - enhanced patterns
  const taskIndicators = [
    'need to', 'must', 'should', 'don\'t forget', 'remember to',
    'have to', 'got to', 'buy', 'call', 'email', 'schedule',
    'book', 'pay', 'submit', 'finish', 'complete', 'review',
    'pick up', 'drop off', 'sign up', 'cancel', 'order',
    'make appointment', 'follow up', 'check on', 'respond to'
  ];
  
  const startsWithVerb = /^(call|email|buy|pay|book|schedule|finish|complete|review|submit|send|update|create|delete|install|setup|configure|test|fix|debug|deploy|pick|drop|sign|cancel|order|make|follow|check|respond)/i.test(trimmed);
  const hasTaskStructure = /^(i need to|i should|i have to|i must|todo:)/i.test(trimmed);
  
  if (taskIndicators.some(indicator => lowerContent.includes(indicator)) || startsWithVerb || hasTaskStructure) {
    type = 'task';
    confidence = 0.8;
  }
  
  // Detect ideas - enhanced patterns
  const ideaIndicators = [
    'idea:', 'would be cool if', 'what if', 'maybe we could', 'idea for',
    'thinking about', 'concept:', 'feature idea', 'product idea',
    'business idea', 'app idea', 'website idea', 'innovation',
    'brainstorming', 'creative idea'
  ];
  
  if (ideaIndicators.some(indicator => lowerContent.includes(indicator))) {
    type = 'idea';
    confidence = 0.85;
  }
  
  // Detect journal entries (emotional content) - enhanced patterns
  const emotionalWords = [
    'feel', 'feeling', 'overwhelmed', 'excited', 'worried', 'anxious',
    'happy', 'sad', 'frustrated', 'stressed', 'tired', 'energized',
    'can\'t', 'struggling', 'amazing', 'terrible', 'love', 'hate',
    'emotional', 'mood', 'today i', 'yesterday i', 'grateful',
    'annoyed', 'confused', 'disappointed', 'proud', 'embarrassed',
    'nervous', 'confident', 'insecure', 'motivated', 'demotivated'
  ];
  
  const hasPersonalTone = /^(i feel|i am|i was|today i|yesterday i|i\'m|i can\'t|i don\'t|i think i)/i.test(trimmed);
  
  if (emotionalWords.some(word => lowerContent.includes(word)) || hasPersonalTone) {
    type = 'journal';
    confidence = 0.75;
  }
  
  return {
    id: `temp-${index}`,
    content: contentWithoutTags,
    type,
    tags,
    confidence
  };
};

export const useADHDStore = create<ADHDStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      entries: [],
      
      // Task management
      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        
        set((state) => ({
          tasks: [task, ...state.tasks],
        }));
        
        return task;
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      
      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completedAt: new Date() } : task
          ),
        }));
      },
      
      snoozeTask: (id, minutes = 60) => {
        const snoozeUntil = new Date();
        snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, snoozedUntil: snoozeUntil } : task
          ),
        }));
      },
      
      startTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, startedAt: new Date() } : task
          ),
        }));
      },
      
      // Entry management
      addEntry: (entryData) => {
        const entry: Entry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        
        set((state) => ({
          entries: [entry, ...state.entries],
        }));
        
        return entry;
      },
      
      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }));
      },
      
      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },
      
      // Brain dump processing
      processBrainDump: (text) => {
        return parseText(text);
      },
      
      confirmParsedItems: (items) => {
        const { addTask, addEntry } = get();
        
        items.forEach(item => {
          if (item.type === 'task') {
            addTask({
              content: item.content,
              tags: item.tags || [],
            });
          } else {
            addEntry({
              content: item.content,
              type: item.type as 'idea' | 'thought' | 'journal',
              tags: item.tags || [],
            });
          }
        });
      },
      
      // Computed getters
      getTodayTasks: () => {
        const { tasks } = get();
        const today = new Date().toDateString();
        
        return tasks.filter(task => {
          if (task.completedAt) return false;
          if (task.snoozedUntil && task.snoozedUntil > new Date()) return false;
          
          return (
            task.tags.includes('today') ||
            task.tags.includes('must_today') ||
            task.tags.includes('urgent') ||
            (task.createdAt.toDateString() === today && !task.tags.includes('later'))
          );
        });
      },
      
      getNowTask: () => {
        const { tasks } = get();
        const activeTasks = tasks.filter(task => {
          if (task.completedAt) return false;
          if (task.snoozedUntil && task.snoozedUntil > new Date()) return false;
          return true;
        });
        
        // Priority order for "now" task
        const nowTask = activeTasks.find(task => task.tags.includes('now')) ||
                       activeTasks.find(task => task.tags.includes('must_today')) ||
                       activeTasks.find(task => task.tags.includes('low_energy')) ||
                       activeTasks[0];
        
        return nowTask || null;
      },
      
      getLaterTasks: () => {
        const { tasks } = get();
        const today = new Date().toDateString();
        
        return tasks.filter(task => {
          if (task.completedAt) return false;
          if (task.snoozedUntil && task.snoozedUntil > new Date()) return false;
          
          // Exclude today tasks
          const isToday = task.tags.includes('today') ||
                         task.tags.includes('must_today') ||
                         task.tags.includes('urgent') ||
                         (task.createdAt.toDateString() === today && !task.tags.includes('later'));
          
          return !isToday;
        });
      },
      
      getActiveTasks: () => {
        const { tasks } = get();
        return tasks.filter(task => {
          if (task.completedAt) return false;
          if (task.snoozedUntil && task.snoozedUntil > new Date()) return false;
          return true;
        });
      },
      
      getAllEntries: () => {
        const { entries } = get();
        return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
    }),
    {
      name: "adhd-mindnest-v2",
      version: 1,
      // Ensure data survives app updates
      partialize: (state) => ({
        tasks: state.tasks,
        entries: state.entries,
      }),
      // Handle data migration from old versions
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from old store structure if needed
          return {
            tasks: persistedState.todos?.map((todo: any) => ({
              id: todo.id,
              content: todo.content,
              tags: todo.tags || [],
              createdAt: new Date(todo.createdAt),
              completedAt: todo.completed ? new Date() : undefined,
            })) || [],
            entries: [],
          };
        }
        return persistedState;
      },
    }
  )
);