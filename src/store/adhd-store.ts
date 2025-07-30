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
}

// Brain dump parsing logic
const parseLine = (line: string, index: number): ParsedItem => {
  const trimmed = line.trim();
  if (!trimmed) {
    return {
      id: `temp-${index}`,
      content: trimmed,
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
  
  // Detect tasks
  const taskIndicators = [
    'need to', 'must', 'should', 'don\'t forget', 'remember to',
    'have to', 'got to', 'buy', 'call', 'email', 'schedule',
    'book', 'pay', 'submit', 'finish', 'complete', 'review'
  ];
  
  const startsWithVerb = /^(call|email|buy|pay|book|schedule|finish|complete|review|submit|send|update|create|delete|install|setup|configure|test|fix|debug|deploy)/i.test(trimmed);
  
  if (taskIndicators.some(indicator => lowerContent.includes(indicator)) || startsWithVerb) {
    type = 'task';
    confidence = 0.8;
  }
  
  // Detect ideas
  if (lowerContent.includes('idea:') || 
      lowerContent.includes('would be cool if') ||
      lowerContent.includes('what if') ||
      lowerContent.includes('maybe we could') ||
      lowerContent.includes('idea for')) {
    type = 'idea';
    confidence = 0.85;
  }
  
  // Detect journal entries (emotional content)
  const emotionalWords = [
    'feel', 'feeling', 'overwhelmed', 'excited', 'worried', 'anxious',
    'happy', 'sad', 'frustrated', 'stressed', 'tired', 'energized',
    'can\'t', 'struggling', 'amazing', 'terrible', 'love', 'hate'
  ];
  
  if (emotionalWords.some(word => lowerContent.includes(word))) {
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
        const lines = text.split('\n').filter(line => line.trim());
        return lines.map((line, index) => parseLine(line, index));
      },
      
      confirmParsedItems: (items) => {
        const { addTask, addEntry } = get();
        
        items.forEach(item => {
          if (item.type === 'task') {
            addTask({
              content: item.content,
              tags: item.tags,
            });
          } else {
            addEntry({
              content: item.content,
              type: item.type as 'idea' | 'thought' | 'journal',
              tags: item.tags,
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