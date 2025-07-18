import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Thought {
  id: string;
  content: string;
  timestamp: Date;
  type: 'random' | 'journal' | 'note' | 'todo' | 'project' | 'idea';
  tags?: string[];
  metadata?: Record<string, any>;
  aiEnhanced?: boolean;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  potential?: 'low' | 'medium' | 'high';
  status?: string;
}

export interface RandomThought {
  id: string;
  content: string;
  createdAt: Date;
  category?: string;
  aiInsight?: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  date: Date;
  aiReflection?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId?: string;
  createdAt: Date;
  children: TodoItem[];
  tags?: string[];
  notes?: string;
  parentId?: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: 'app' | 'business' | 'feature' | 'product' | 'service' | 'other';
  status: 'concept' | 'researching' | 'validating' | 'planning' | 'building' | 'launched' | 'paused';
  potential: 'low' | 'medium' | 'high';
  marketSize?: string;
  targetAudience?: string;
  revenueModel?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  aiGenerated?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline?: Date;
  status: 'idea' | 'planning' | 'in-progress' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  todos: TodoItem[];
  tags?: string[];
}

export interface MultiTopicResult {
  tasks: Array<Omit<TodoItem, 'id' | 'createdAt' | 'children' | 'parentId'>>;
  notes: Array<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>;
  ideas: Array<Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>>;
  projects: Array<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'todos'>>;
  journalEntries: Array<Omit<JournalEntry, 'id' | 'date'>>;
}

interface MindnestStore {
  // Unified Thoughts
  thoughts: Thought[];
  addThought: (thought: Omit<Thought, 'id' | 'timestamp'>) => void;
  updateThought: (id: string, updates: Partial<Thought>) => void;
  deleteThought: (id: string) => void;
  
  // Random Thoughts
  randomThoughts: RandomThought[];
  addRandomThought: (thought: Omit<RandomThought, 'id' | 'createdAt'>) => void;
  deleteRandomThought: (id: string) => void;
  
  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Todos
  todos: TodoItem[];
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'children' | 'parentId'>) => void;
  addSubTodo: (parentId: string, todo: Omit<TodoItem, 'id' | 'createdAt' | 'children' | 'parentId'>) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  
  // Ideas
  ideas: Idea[];
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'todos'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Multi-topic creation
  createMultipleItems: (result: MultiTopicResult) => void;
}

export const useMindnestStore = create<MindnestStore>()(
  persist(
    (set, _get) => ({
      // Unified Thoughts
      thoughts: [],
      addThought: (thought) => set((state) => ({
        thoughts: [
          {
            ...thought,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
          ...state.thoughts,
        ],
      })),
      updateThought: (id, updates) => set((state) => ({
        thoughts: state.thoughts.map((thought) =>
          thought.id === id ? { ...thought, ...updates } : thought
        ),
      })),
      deleteThought: (id) => set((state) => ({
        thoughts: state.thoughts.filter((thought) => thought.id !== id),
      })),
      
      // Random Thoughts
      randomThoughts: [],
      addRandomThought: (thought) => set((state) => ({
        randomThoughts: [
          {
            ...thought,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          },
          ...state.randomThoughts,
        ],
      })),
      deleteRandomThought: (id) => set((state) => ({
        randomThoughts: state.randomThoughts.filter((thought) => thought.id !== id),
      })),
      
      // Journal
      journalEntries: [],
      addJournalEntry: (entry) => set((state) => ({
        journalEntries: [
          {
            ...entry,
            id: crypto.randomUUID(),
            date: new Date(),
          },
          ...state.journalEntries,
        ],
      })),
      updateJournalEntry: (id, updates) => set((state) => ({
        journalEntries: state.journalEntries.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry
        ),
      })),
      deleteJournalEntry: (id) => set((state) => ({
        journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
      })),
      
      // Notes
      notes: [],
      addNote: (note) => set((state) => ({
        notes: [
          {
            ...note,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...state.notes,
        ],
      })),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        ),
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      })),
      
      // Todos
      todos: [],
      addTodo: (todo) => set((state) => ({
        todos: [
          {
            ...todo,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            children: [],
          },
          ...state.todos,
        ],
      })),
      addSubTodo: (parentId, todo) => set((state) => ({
        todos: state.todos.map((t) =>
          t.id === parentId
            ? {
                ...t,
                children: [
                  ...t.children,
                  {
                    ...todo,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    children: [],
                    parentId,
                  },
                ],
              }
            : t
        ),
      })),
      toggleTodo: (id) => set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      })),
      updateTodo: (id, updates) => set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updates } : todo
        ),
      })),
      deleteTodo: (id) => set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      })),
      
      // Ideas
      ideas: [],
      addIdea: (idea) => set((state) => ({
        ideas: [
          {
            ...idea,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...state.ideas,
        ],
      })),
      updateIdea: (id, updates) => set((state) => ({
        ideas: state.ideas.map((idea) =>
          idea.id === id ? { ...idea, ...updates, updatedAt: new Date() } : idea
        ),
      })),
      deleteIdea: (id) => set((state) => ({
        ideas: state.ideas.filter((idea) => idea.id !== id),
      })),
      
      // Projects
      projects: [],
      addProject: (project) => set((state) => ({
        projects: [
          {
            ...project,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            todos: [],
          },
          ...state.projects,
        ],
      })),
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
        ),
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
      })),
      
      // Multi-topic creation
      createMultipleItems: (result) => set((state) => ({
        todos: [
          ...state.todos,
          ...result.tasks.map(task => ({
            ...task,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            children: [],
          }))
        ],
        notes: [
          ...state.notes,
          ...result.notes.map(note => ({
            ...note,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        ],
        ideas: [
          ...state.ideas,
          ...result.ideas.map(idea => ({
            ...idea,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        ],
        projects: [
          ...state.projects,
          ...result.projects.map(project => ({
            ...project,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            todos: [],
          }))
        ],
        journalEntries: [
          ...state.journalEntries,
          ...result.journalEntries.map(entry => ({
            ...entry,
            id: crypto.randomUUID(),
            date: new Date(),
          }))
        ],
      })),
    }),
    {
      name: "mindnest-storage",
      partialize: (state) => ({
        thoughts: state.thoughts,
        randomThoughts: state.randomThoughts,
        journalEntries: state.journalEntries,
        notes: state.notes,
        todos: state.todos,
        ideas: state.ideas,
        projects: state.projects,
      }),
    }
  )
); 