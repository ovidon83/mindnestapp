# GenieNotes - Development Guide

This document provides comprehensive guidance for developers working on GenieNotes, including development workflow, coding standards, testing, and deployment procedures.

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Version 2.30.0 or higher
- **Code Editor**: VS Code recommended with extensions

### **Required VS Code Extensions**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### **Initial Setup**
```bash
# Clone the repository
git clone https://github.com/yourusername/genienotes.git
cd genienotes

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:5173
```

## 🏗️ **Project Structure**

### **Directory Layout**
```
GenieNotes/
├── docs/                    # Documentation
│   ├── README.md           # Documentation index
│   ├── FEATURES.md         # Feature documentation
│   ├── ARCHITECTURE.md     # Technical architecture
│   ├── UI-UX.md           # Design system
│   ├── DEVELOPMENT.md      # This file
│   ├── CHANGELOG.md       # Version history
│   └── ROADMAP.md         # Future plans
├── src/                    # Source code
│   ├── components/         # React components
│   ├── store/             # Zustand store
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types.ts           # TypeScript definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
└── README.md               # Project overview
```

### **Key Files**
- **`src/App.tsx`**: Main application component and routing
- **`src/store/index.ts`**: Zustand store configuration
- **`src/components/CaptureView.tsx`**: Entry creation interface
- **`src/components/HomeView.tsx`**: Main dashboard interface
- **`src/types.ts`**: TypeScript type definitions

## 🔧 **Development Workflow**

### **Git Strategy**
- **Branch Strategy**: Direct main branch development
- **Commit Convention**: Conventional Commits format
- **PR Process**: Code review and testing before merge
- **Deployment**: Automatic on push to main

### **Conventional Commits Format**
```bash
# Format: type(scope): description
git commit -m "feat(capture): add natural language date parsing"
git commit -m "fix(home): resolve drag and drop positioning issue"
git commit -m "docs(readme): update project description"
git commit -m "refactor(store): simplify entry management logic"
git commit -m "test(components): add unit tests for EntryCard"
```

### **Commit Types**
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### **Development Process**
1. **Plan**: Understand the requirement and plan implementation
2. **Code**: Implement the feature following coding standards
3. **Test**: Test locally and ensure functionality works
4. **Document**: Update relevant documentation
5. **Commit**: Use conventional commit format
6. **Push**: Push to main branch
7. **Verify**: Check deployment and functionality

## 📝 **Coding Standards**

### **TypeScript Standards**

#### **Type Definitions**
```typescript
// Use interfaces for object shapes
interface Entry {
  id: string;
  content: string;
  type: EntryType;
  createdAt: Date;
}

// Use types for unions and primitives
type EntryType = 'task' | 'idea' | 'event' | 'note';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Use enums sparingly, prefer union types
// ❌ Avoid
enum Status {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

// ✅ Prefer
type Status = 'pending' | 'completed';
```

#### **Function Definitions**
```typescript
// Use explicit return types for complex functions
function parseEntry(content: string): ParsedEntry {
  // Implementation
}

// Use arrow functions for components and callbacks
const EntryCard: React.FC<EntryCardProps> = ({ entry, onEdit }) => {
  // Component implementation
};

// Use async/await for promises
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}
```

#### **Error Handling**
```typescript
// Use try-catch for async operations
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error appropriately
  throw new Error('Operation failed');
}

// Use type guards for runtime type checking
function isEntry(obj: unknown): obj is Entry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    'type' in obj
  );
}
```

### **React Standards**

#### **Component Structure**
```typescript
// Use functional components with hooks
const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState(initialState);
  const { data, loading } = useCustomHook();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, []);
  
  // Computed values
  const computedValue = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // Render
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="my-component">
      {/* JSX content */}
    </div>
  );
};

// Export component
export default MyComponent;
```

#### **Props Interface**
```typescript
interface MyComponentProps {
  // Required props
  title: string;
  onAction: (id: string) => void;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  
  // Children
  children?: React.ReactNode;
}

// Use default props
const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction,
  variant = 'primary',
  disabled = false,
  children
}) => {
  // Component implementation
};
```

#### **State Management**
```typescript
// Use Zustand store for global state
const useStore = useGenieNotesStore();

// Use local state for component-specific state
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');

// Use refs for DOM access
const inputRef = useRef<HTMLInputElement>(null);

// Use callbacks for event handlers
const handleSubmit = useCallback((e: React.FormEvent) => {
  e.preventDefault();
  // Submit logic
}, []);
```

### **CSS/Tailwind Standards**

#### **Class Organization**
```tsx
// Group related classes logically
<div className={`
  // Layout
  flex items-center justify-between
  
  // Spacing
  p-4 space-x-3
  
  // Visual
  bg-white rounded-lg shadow-sm border border-gray-200
  
  // Interactive
  hover:shadow-md hover:border-gray-300
  
  // Transitions
  transition-all duration-200
  
  // Responsive
  md:p-6 lg:space-x-4
`}>
  {/* Content */}
</div>
```

#### **Responsive Design**
```tsx
// Mobile-first approach
<div className="
  // Base (mobile)
  grid grid-cols-1 gap-4 p-4
  
  // Tablet and up
  md:grid-cols-2 md:gap-6 md:p-6
  
  // Desktop and up
  lg:grid-cols-3 lg:gap-8 lg:p-8
">
  {/* Grid items */}
</div>
```

#### **Custom CSS**
```css
/* Use Tailwind utilities when possible */
/* Only add custom CSS for complex animations or specific needs */

@layer components {
  .custom-button {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg;
    @apply transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
}

@layer utilities {
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}
```

## 🧪 **Testing Strategy**

### **Testing Levels**
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions
- **E2E Tests**: User workflows
- **Performance Tests**: Bundle size and runtime

### **Testing Tools**
- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Playwright**: E2E testing (planned)

### **Test Structure**
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EntryCard from './EntryCard';

describe('EntryCard', () => {
  const mockEntry = {
    id: '1',
    content: 'Test entry',
    type: 'task' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('renders entry content', () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText('Test entry')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<EntryCard entry={mockEntry} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockEntry);
  });
});
```

### **Test Coverage Goals**
- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

## 🔍 **Code Quality**

### **Linting and Formatting**
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### **Pre-commit Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### **Code Review Checklist**
- [ ] Code follows TypeScript standards
- [ ] React best practices implemented
- [ ] Proper error handling
- [ ] Accessibility considerations
- [ ] Mobile responsiveness
- [ ] Performance optimizations
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.log statements in production code

## 🚀 **Build and Deployment**

### **Build Process**
```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Run Prettier
```

### **Build Configuration**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['zustand', 'chrono-node']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
```

### **Environment Variables**
```bash
# .env.local (not committed to git)
VITE_API_URL=https://api.example.com
VITE_APP_NAME=GenieNotes
VITE_DEBUG_MODE=true

# .env.example (committed to git)
VITE_API_URL=
VITE_APP_NAME=GenieNotes
VITE_DEBUG_MODE=false
```

### **Deployment**
- **Platform**: Render.com
- **Branch**: main
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Auto-deploy**: On push to main

## 📊 **Performance Optimization**

### **Bundle Optimization**
```typescript
// Code splitting
const LazyComponent = lazy(() => import('./LazyComponent'));

// Dynamic imports
const loadFeature = async () => {
  const { default: Feature } = await import('./Feature');
  return Feature;
};

// Tree shaking
import { useState, useEffect } from 'react'; // Only import what you need
```

### **React Optimization**
```typescript
// Memoization
const MemoizedComponent = React.memo(ExpensiveComponent);

// Callback optimization
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);

// Value optimization
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### **Image Optimization**
```typescript
// Use Next.js Image component for optimization
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 🔒 **Security Considerations**

### **Input Validation**
```typescript
// Validate all user inputs
function validateEntry(content: string): boolean {
  if (typeof content !== 'string') return false;
  if (content.length === 0) return false;
  if (content.length > 10000) return false;
  return true;
}

// Sanitize user content
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput);
```

### **Data Privacy**
- **Local Storage**: All data stored locally on user's device
- **No External APIs**: No data transmission to external services
- **User Control**: Users have full control over their data
- **Export/Import**: Planned features for data portability

### **Authentication**
- **Local Authentication**: No external authentication required
- **Data Isolation**: Each user's data is completely separate
- **No User Accounts**: Anonymous usage with local persistence

## 🐛 **Debugging and Troubleshooting**

### **Development Tools**
```typescript
// React DevTools
// Install browser extension for component inspection

// Zustand DevTools
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      // Store implementation
    }),
    { name: 'GenieNotes Store' }
  )
);

// Console logging
console.log('Debug info:', { data, state });
console.group('Component State');
console.log('Props:', props);
console.log('State:', state);
console.groupEnd();
```

### **Common Issues**

#### **TypeScript Errors**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Fix type issues
npm run type-check
```

#### **Build Errors**
```bash
# Clear build cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstall dependencies
npm ci
```

#### **Runtime Errors**
```typescript
// Add error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 📚 **Learning Resources**

### **Essential Documentation**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Documentation](https://vitejs.dev/)

### **Best Practices**
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://github.com/typescript-eslint/typescript-eslint)
- [CSS Best Practices](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### **Community Resources**
- [React Community](https://reactjs.org/community/support.html)
- [TypeScript Community](https://github.com/microsoft/TypeScript)
- [Tailwind CSS Community](https://tailwindcss.com/community)
- [Stack Overflow](https://stackoverflow.com/)

---

**This development guide provides comprehensive information for developers working on GenieNotes. Follow these standards to maintain code quality and consistency across the project.** 🎉
