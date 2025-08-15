# GenieNotes - UI/UX Design System

This document provides comprehensive details about the user interface design, user experience flows, visual components, and design principles in GenieNotes.

## 🎨 **Design Philosophy**

### **Core Principles**
- **Minimalism**: Clean, uncluttered interfaces that focus on content
- **Clarity**: Clear visual hierarchy and intuitive navigation
- **Efficiency**: Fast, streamlined workflows for productivity
- **Accessibility**: Inclusive design for all users
- **Mobile-First**: Optimized for mobile devices with progressive enhancement

### **Design Goals**
- **Reduce Cognitive Load**: Minimize distractions and mental effort
- **Enhance Productivity**: Streamline common tasks and workflows
- **Foster Focus**: Create environments conducive to deep work
- **Build Trust**: Reliable, predictable interface behavior

## 🎯 **Visual Design System**

### **Color Palette**

#### **Primary Colors**
```css
/* Primary Blue - Main actions, links, highlights */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Success Green - Completed items, positive actions */
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-500: #10b981;
--success-600: #059669;
--success-700: #047857;

/* Warning Orange - Urgent items, attention needed */
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b;
--warning-600: #d97706;
--warning-700: #b45309;

/* Error Red - Overdue items, destructive actions */
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444;
--error-600: #dc2626;
--error-700: #b91c1c;
```

#### **Neutral Colors**
```css
/* Gray scale for text, borders, backgrounds */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

### **Typography System**

#### **Font Family**
- **Primary**: Inter - Modern, highly legible sans-serif
- **Monospace**: JetBrains Mono - For code and technical content
- **Fallback**: System fonts for optimal performance

#### **Font Weights**
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### **Font Sizes**
```css
--text-xs: 0.75rem;    /* 12px - Captions, labels */
--text-sm: 0.875rem;   /* 14px - Small text, secondary info */
--text-base: 1rem;     /* 16px - Body text, default */
--text-lg: 1.125rem;   /* 18px - Large body text */
--text-xl: 1.25rem;    /* 20px - Subheadings */
--text-2xl: 1.5rem;    /* 24px - Section headings */
--text-3xl: 1.875rem;  /* 30px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Hero titles */
```

#### **Line Heights**
```css
--leading-tight: 1.25;    /* Headings, titles */
--leading-snug: 1.375;    /* Subheadings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.625; /* Large text blocks */
```

### **Spacing System**

#### **Base Unit**
- **4px** as the fundamental spacing unit
- Consistent scaling across all components

#### **Spacing Scale**
```css
--space-1: 0.25rem;   /* 4px - Minimal spacing */
--space-2: 0.5rem;    /* 8px - Tight spacing */
--space-3: 0.75rem;   /* 12px - Compact spacing */
--space-4: 1rem;      /* 16px - Standard spacing */
--space-5: 1.25rem;   /* 20px - Comfortable spacing */
--space-6: 1.5rem;    /* 24px - Section spacing */
--space-8: 2rem;      /* 32px - Large spacing */
--space-10: 2.5rem;   /* 40px - Extra large spacing */
--space-12: 3rem;     /* 48px - Hero spacing */
--space-16: 4rem;     /* 64px - Page spacing */
```

### **Border Radius System**
```css
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.375rem;  /* 6px - Standard elements */
--radius-lg: 0.5rem;    /* 8px - Large elements */
--radius-xl: 0.75rem;   /* 12px - Cards, containers */
--radius-2xl: 1rem;     /* 16px - Large containers */
--radius-full: 9999px;  /* Full - Pills, avatars */
```

### **Shadow System**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

## 🧩 **Component Library**

### **Button Components**

#### **Primary Button**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Primary Action
</button>
```

#### **Secondary Button**
```tsx
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
  Secondary Action
</button>
```

#### **Danger Button**
```tsx
<button className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Destructive Action
</button>
```

#### **Ghost Button**
```tsx
<button className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
  Ghost Action
</button>
```

### **Form Components**

#### **Text Input**
```tsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
  placeholder="Enter text..."
/>
```

#### **Textarea**
```tsx
<textarea 
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
  rows={4}
  placeholder="Enter longer text..."
/>
```

#### **Select Dropdown**
```tsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white">
  <option value="">Select an option</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

#### **Checkbox**
```tsx
<input 
  type="checkbox"
  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 transition-colors duration-200"
/>
```

### **Card Components**

#### **Basic Card**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here...</p>
</div>
```

#### **Interactive Card**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Card</h3>
  <p className="text-gray-600">Hover to see effects...</p>
</div>
```

#### **Status Card**
```tsx
<div className="bg-white rounded-xl shadow-sm border-l-4 border-l-blue-500 p-6">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-gray-900">Status Card</h3>
    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
      Active
    </span>
  </div>
</div>
```

### **Badge Components**

#### **Type Badge**
```tsx
<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
  Task
</span>
```

#### **Priority Badge**
```tsx
<span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
  Urgent
</span>
```

#### **Status Badge**
```tsx
<span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
  Completed
</span>
```

## 📱 **Responsive Design Patterns**

### **Breakpoint System**
```css
/* Mobile First Approach */
/* Base styles for mobile (320px+) */

/* Tablet and up */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop and up */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large desktop and up */
@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

### **Container Patterns**
```tsx
// Responsive container
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
  {/* Grid items */}
</div>

// Responsive spacing
<div className="space-y-4 md:space-y-6 lg:space-y-8">
  {/* Content with responsive spacing */}
</div>
```

### **Mobile-First Components**

#### **Mobile Navigation**
```tsx
// Mobile hamburger menu
<button className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100">
  <Menu className="w-6 h-6" />
</button>

// Desktop navigation
<nav className="hidden md:flex space-x-8">
  {/* Navigation items */}
</nav>
```

#### **Touch-Friendly Elements**
```tsx
// Minimum 44px touch target
<button className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center">
  <Icon className="w-5 h-5" />
</button>

// Touch-friendly spacing
<div className="space-y-3 touch:space-y-4">
  {/* Touch-optimized spacing */}
</div>
```

## 🔄 **User Experience Flows**

### **1. Entry Capture Flow**

#### **Step 1: Input**
- Large, prominent textarea
- Auto-expanding height
- Real-time character count
- Placeholder text guidance

#### **Step 2: Processing**
- Visual feedback during analysis
- Progress indicators
- Clear status messages

#### **Step 3: Confirmation**
- Preview of parsed entry
- Editable fields before saving
- Clear save button
- Success confirmation

### **2. Entry Management Flow**

#### **Viewing Entries**
- Tabbed organization by time period
- Clear visual hierarchy
- Consistent card layout
- Quick action buttons

#### **Editing Entries**
- Inline edit modal
- Form validation
- Auto-save options
- Clear save/cancel actions

#### **Organizing Entries**
- Drag and drop reordering
- Quick move actions
- Batch operations
- Status updates

### **3. Search and Discovery Flow**

#### **Search Experience**
- Prominent search bar
- Real-time results
- Search suggestions
- Clear search history

#### **Filtering Experience**
- Intuitive filter controls
- Visual filter indicators
- Clear active filters
- Easy filter removal

## 🎭 **Interactive States**

### **Hover States**
```css
/* Button hover */
.hover\:bg-blue-700:hover {
  background-color: rgb(29 78 216);
}

/* Card hover */
.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Link hover */
.hover\:text-blue-600:hover {
  color: rgb(37 99 235);
}
```

### **Focus States**
```css
/* Input focus */
.focus\:ring-2:focus {
  box-shadow: 0 0 0 2px rgb(59 130 246);
}

/* Button focus */
.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
```

### **Active States**
```css
/* Button active */
.active\:bg-blue-800:active {
  background-color: rgb(30 64 175);
}

/* Card active */
.active\:scale-95:active {
  transform: scale(0.95);
}
```

### **Loading States**
```tsx
// Loading spinner
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>

// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

## ♿ **Accessibility Features**

### **Semantic HTML**
```tsx
// Proper heading hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

// Semantic landmarks
<main>Main content</main>
<nav>Navigation</nav>
<aside>Sidebar content</aside>
```

### **ARIA Labels**
```tsx
// Button with aria-label
<button 
  aria-label="Edit entry"
  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
>
  <Edit className="w-4 h-4" />
</button>

// Form with aria-describedby
<input 
  aria-describedby="email-help"
  type="email"
  className="..."
/>
<div id="email-help" className="text-sm text-gray-500">
  Enter your email address
</div>
```

### **Keyboard Navigation**
```tsx
// Focusable elements
<button 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</button>

// Skip links
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
>
  Skip to main content
</a>
```

### **Color Contrast**
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio
- **Focus indicators**: High contrast for visibility

## 📊 **Data Visualization**

### **Progress Indicators**
```tsx
// Progress bar
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  ></div>
</div>

// Circular progress
<div className="relative w-16 h-16">
  <svg className="w-16 h-16 transform -rotate-90">
    <circle
      cx="32"
      cy="32"
      r="28"
      stroke="currentColor"
      strokeWidth="4"
      fill="transparent"
      className="text-gray-200"
    />
    <circle
      cx="32"
      cy="32"
      r="28"
      stroke="currentColor"
      strokeWidth="4"
      fill="transparent"
      className="text-blue-600"
      strokeDasharray={`${2 * Math.PI * 28}`}
      strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
    />
  </svg>
  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
    {progress}%
  </span>
</div>
```

### **Status Indicators**
```tsx
// Status dot
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  <span className="text-sm text-gray-600">Active</span>
</div>

// Status icon
<div className="flex items-center space-x-2">
  <CheckCircle className="w-5 h-5 text-green-500" />
  <span className="text-sm text-gray-600">Completed</span>
</div>
```

## 🎨 **Animation and Transitions**

### **Micro-Interactions**
```css
/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

.transition-transform {
  transition: transform 0.2s ease-in-out;
}
```

### **Hover Animations**
```css
/* Scale on hover */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

/* Lift on hover */
.hover\:-translate-y-1:hover {
  transform: translateY(-4px);
}

/* Rotate on hover */
.hover\:rotate-12:hover {
  transform: rotate(12deg);
}
```

### **Loading Animations**
```css
/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spin animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

## 🔧 **Implementation Guidelines**

### **CSS Organization**
```css
/* Component-specific styles */
.entry-card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.entry-card:hover {
  @apply shadow-md border-gray-300;
}

/* Utility-first approach */
.primary-button {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200;
}
```

### **Component Props**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick
}) => {
  // Component implementation
};
```

### **Theme Integration**
```tsx
// Theme context
const ThemeContext = createContext<Theme>('light');

// Theme provider
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme hook
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

**This UI/UX document provides comprehensive design guidance for maintaining consistency and quality in GenieNotes. For implementation details, refer to the component source code and Tailwind CSS documentation.** 🎉
