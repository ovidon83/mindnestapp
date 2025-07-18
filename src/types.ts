export interface Thought {
  id: string;
  content: string;
  timestamp: Date;
  type: 'random' | 'journal' | 'note' | 'todo' | 'project';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface JournalEntry {
  id: string;
  content: string;
  date: Date;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  tags?: string[];
  aiReflection?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  backlinks: string[]; // IDs of notes that link to this one
}

export interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  parentId?: string; // For nested todos
  children: TodoItem[];
  createdAt: Date;
  completedAt?: Date;
  tags?: string[];
  notes?: string;
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
  status: 'idea' | 'planning' | 'in-progress' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  backlog: TodoItem[];
  notes: Note[];
  tags: string[];
  aiGenerated?: boolean;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type AppSection = 'dashboard' | 'thoughts' | 'journal' | 'todos' | 'ideas' | 'canvas';

export interface AppState {
  currentSection: AppSection;
  focusMode: boolean;
  searchQuery: string;
  selectedProjectId?: string;
}

export interface UIState {
  sidebarOpen: boolean;
  showAIModal: boolean;
  showSearchModal: boolean;
  theme: 'light' | 'dark';
}

// AI Response Interfaces
export interface ThoughtAnalysis {
  category: string;
  insight: string;
  relatedThoughts: string[];
}

export interface JournalReflection {
  reflection: string;
  patterns: string[];
  suggestions: string[];
}

export interface TagSuggestion {
  tags: string[];
}

export interface BacklogGeneration {
  todos: Array<{
    content: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }>;
} 