# GenieNotes - Technical Architecture

This document provides comprehensive technical details about the architecture, data models, component structure, and implementation patterns in GenieNotes.

## 🏗️ **System Architecture Overview**

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input   │───▶│  AI Processing  │───▶│  Data Storage  │
│   (Capture)    │    │   & Parsing     │    │  (localStorage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer     │    │  State Mgmt     │    │  Persistence    │
│   (React)      │    │  (Zustand)      │    │  (Middleware)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**
- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Date Parsing**: chrono-node
- **Storage**: localStorage with Zustand persist
- **Deployment**: Render.com

## 📊 **Data Models**

### **Core Entry Interface**
```typescript
interface Entry {
  // Unique identifier
  id: string;
  
  // Content
  content: string;           // Clean, display-ready content
  rawContent: string;        // Original user input
  
  // Classification
  type: EntryType;          // task, idea, event, note, journal, etc.
  priority: Priority;        // low, medium, high, urgent
  status: TaskStatus;        // pending, in_progress, completed
  
  // Organization
  tags: string[];           // User-defined hashtags
  dueDate?: Date;           // Parsed due date
  pinnedForDate?: Date;     // Date when item is pinned
  targetWeek?: string;      // Target week for scheduling
  
  // Metadata
  location?: string;         // Parsed location
  confidence: number;        // AI classification confidence
  reasoning: string;         // AI reasoning for classification
  
  // Timestamps
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
  completedAt?: Date;        // Completion timestamp
}
```

### **Type Definitions**
```typescript
type EntryType = 
  | 'task' 
  | 'idea' 
  | 'event' 
  | 'note' 
  | 'journal' 
  | 'insight' 
  | 'reflection' 
  | 'reminder';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

type TaskStatus = 'pending' | 'in_progress' | 'completed';
```

### **Application State**
```typescript
interface AppState {
  currentView: 'capture' | 'home';
  searchQuery: string;
  activeFilters: {
    type: EntryType | 'all';
    status: TaskStatus | 'all';
    needsReview: boolean;
  };
}

interface UIState {
  editingEntry: Entry | null;
  insightsDrawerOpen: boolean;
  sidebarOpen: boolean;
  focusMode: boolean;
}
```

## 🔄 **State Management Architecture**

### **Zustand Store Structure**
```typescript
interface GenieNotesStore {
  // Core data
  entries: Entry[];
  appState: AppState;
  uiState: UIState;
  
  // Actions
  addEntry: (entry: Omit<Entry, "id" | "createdAt" | "updatedAt">) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  completeEntry: (id: string) => void;
  
  // Utility functions
  getFilteredEntries: () => Entry[];
  getEntriesNeedingReview: () => Entry[];
  getUrgentEntries: () => Entry[];
  getTopTags: () => { tag: string; count: number; }[];
}
```

### **Store Implementation**
```typescript
export const useGenieNotesStore = create<GenieNotesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],
      appState: {
        currentView: 'capture',
        searchQuery: '',
        activeFilters: {
          type: 'all',
          status: 'all',
          needsReview: false
        }
      },
      uiState: {
        editingEntry: null,
        insightsDrawerOpen: false,
        sidebarOpen: false,
        focusMode: false
      },
      
      // Actions implementation
      addEntry: (entryData) => set((state) => ({
        entries: [...state.entries, {
          ...entryData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      })),
      
      // ... other actions
    }),
    {
      name: 'genienotes-storage',
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects
        if (state?.entries) {
          state.entries = state.entries.map(entry => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
            dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined,
            pinnedForDate: entry.pinnedForDate ? new Date(entry.pinnedForDate) : undefined,
            completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined
          }));
        }
      }
    }
  )
);
```

## 🧩 **Component Architecture**

### **Component Hierarchy**
```
App
├── CaptureView
│   ├── InputForm
│   ├── PreviewCard
│   └── ConfirmationFeed
└── HomeView
    ├── TopBar
    │   ├── CaptureButton
    │   ├── SearchInput
    │   └── FilterControls
    ├── TabNavigation
    └── EntryList
        └── EntryCard
            ├── EntryHeader
            ├── EntryContent
            ├── EntryTags
            └── ActionButtons
                ├── PrimaryActions
                ├── TimePeriodDropdown
                └── DestructiveActions
```

### **Component Responsibilities**

#### **App Component**
- **Purpose**: Main application container
- **Responsibilities**: 
  - View routing
  - Global state provider
  - Layout management

#### **CaptureView Component**
- **Purpose**: Entry creation interface
- **Responsibilities**:
  - Text input handling
  - AI processing coordination
  - Entry validation
  - User feedback

#### **HomeView Component**
- **Purpose**: Main dashboard interface
- **Responsibilities**:
  - Entry display and organization
  - Filtering and search
  - Entry management operations
  - Tab navigation

#### **EntryCard Component**
- **Purpose**: Individual entry display
- **Responsibilities**:
  - Entry information display
  - Action button rendering
  - Edit modal management
  - Status updates

### **Component Communication Patterns**

#### **Props Down, Events Up**
- Parent components pass data via props
- Child components emit events for actions
- State changes flow through Zustand store

#### **Store Integration**
- Components subscribe to store slices
- Actions dispatched through store methods
- Local state minimized, global state preferred

## 🔧 **Data Processing Pipeline**

### **Entry Creation Flow**
```
1. User Input → Textarea
2. Text Processing → AI Classification
3. Date Parsing → chrono-node
4. Tag Extraction → Regex processing
5. Directive Parsing → Hashtag analysis
6. Entry Creation → Store update
7. UI Update → Component re-render
```

### **AI Classification Algorithm**
```typescript
function classifyEntry(content: string): ClassificationResult {
  const text = content.toLowerCase();
  
  // Priority-based classification
  if (text.includes('task') || text.includes('todo') || text.includes('due')) {
    return { type: 'task', confidence: 0.9 };
  }
  
  if (text.includes('idea') || text.includes('concept') || text.includes('brainstorm')) {
    return { type: 'idea', confidence: 0.8 };
  }
  
  if (text.includes('meeting') || text.includes('event') || text.includes('appointment')) {
    return { type: 'event', confidence: 0.85 };
  }
  
  // Default classification
  return { type: 'note', confidence: 0.6 };
}
```

### **Date Parsing Pipeline**
```typescript
function parseNaturalLanguageDates(text: string): DateParseResult {
  // Use chrono-node for natural language parsing
  const results = chrono.parse(text);
  
  if (results.length === 0) return {};
  
  const firstResult = results[0];
  let startDate = firstResult.start.date();
  
  // Validate and adjust dates
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Prevent past dates
  if (startDate.getFullYear() < currentYear) {
    startDate = new Date(currentYear, startDate.getMonth(), startDate.getDate());
  }
  
  if (startDate < now) return {};
  
  return {
    dueDate: startDate,
    confidence: firstResult.text.length / text.length
  };
}
```

## 📱 **Responsive Design Architecture**

### **Breakpoint System**
```typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

const responsiveClasses = {
  container: 'max-w-6xl mx-auto px-6',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  spacing: 'space-y-4 md:space-y-6 lg:space-y-8'
};
```

### **Mobile-First Approach**
- Base styles for mobile devices
- Progressive enhancement for larger screens
- Touch-friendly interaction patterns
- Optimized performance for mobile

## 🚀 **Performance Optimization**

### **React Optimization Techniques**
```typescript
// Component memoization
const EntryCard = React.memo(({ entry, index }: EntryCardProps) => {
  // Component implementation
});

// Efficient re-renders
const useFilteredEntries = () => {
  return useGenieNotesStore(state => 
    state.entries.filter(entry => 
      // Filter logic
    )
  );
};

// Optimized event handlers
const handleEdit = useCallback((entry: Entry) => {
  setEditingEntry(entry);
}, []);
```

### **Bundle Optimization**
- Tree shaking for unused code elimination
- Code splitting for lazy loading
- Asset optimization with Vite
- CSS purging with Tailwind

## 🔒 **Data Persistence**

### **localStorage Strategy**
```typescript
// Zustand persist configuration
persist(
  (set, get) => ({
    // Store implementation
  }),
  {
    name: 'genienotes-storage',
    version: 1,
    onRehydrateStorage: () => (state) => {
      // Date object conversion
      // Data validation
      // Migration handling
    }
  }
)
```

### **Data Migration**
```typescript
function migrateEntriesToCleanFormat(entries: Entry[]): Entry[] {
  return entries.map(entry => ({
    ...entry,
    // Ensure all required fields exist
    tags: entry.tags || [],
    confidence: entry.confidence || 0.8,
    reasoning: entry.reasoning || 'Auto-classified',
    
    // Clean up duplicate tags
    tags: [...new Set(entry.tags)],
    
    // Ensure proper date objects
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt)
  }));
}
```

## 🧪 **Testing Architecture**

### **Testing Strategy**
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: User workflows
- **Performance Tests**: Bundle size and runtime

### **Test Structure**
```
src/
├── components/
│   ├── __tests__/
│   │   ├── CaptureView.test.tsx
│   │   ├── HomeView.test.tsx
│   │   └── EntryCard.test.tsx
│   └── ...
├── store/
│   ├── __tests__/
│   │   └── index.test.ts
│   └── ...
└── utils/
    ├── __tests__/
    │   └── helpers.test.ts
    └── ...
```

## 🔄 **Development Workflow**

### **Git Strategy**
- **Branch Strategy**: Direct main branch development
- **Commit Convention**: Conventional Commits format
- **PR Process**: Code review and testing
- **Deployment**: Automatic on push to main

### **Code Quality**
- **TypeScript**: Strict mode enabled
- **ESLint**: Code style and quality rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
- **Bundle Analysis**: Webpack bundle analyzer
- **Runtime Performance**: React DevTools Profiler
- **User Metrics**: Core Web Vitals
- **Error Tracking**: Console error logging

### **User Analytics**
- **Feature Usage**: Track feature adoption
- **Performance Metrics**: Load times and interactions
- **Error Rates**: Application stability
- **User Behavior**: Navigation patterns

---

**This architecture document provides the technical foundation for understanding and maintaining GenieNotes. For implementation details, refer to the source code and component documentation.** 🎉
