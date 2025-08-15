# GenieNotes - Features & Functionality

## Overview
GenieNotes is an AI-powered thought capture and organization system that helps users quickly capture, categorize, and manage their thoughts, ideas, and tasks using natural language processing and intelligent categorization.

## 🚀 Core Features

### 1. [Note Capture](./features/note-capture.md)
**Component:** `CaptureView.tsx`  
AI-powered thought capture with intelligent parsing, directive-based categorization, and natural language date understanding.

**Key Capabilities:**
- Natural language input processing
- Hashtag directive system (#task, #idea, #urgent, etc.)
- Automatic date parsing ("tomorrow", "next week")
- Smart type detection and priority assignment
- Preview and edit before saving

### 2. [Thought Management](./features/thought-management.md)
**Component:** `ThoughtsView.tsx`  
Comprehensive thought organization with advanced search, filtering, and a review system for entries needing attention.

**Key Capabilities:**
- Full-text search across all entries
- Type, status, and priority filtering
- Smart review system with categorized triggers
- Tag management and analytics
- Quick actions (complete, edit, delete)

### 3. [Home Dashboard](./features/home-dashboard.md)
**Component:** `HomeView.tsx`  
Time-based organization and daily workflow management with flexible time period management.

**Key Capabilities:**
- Time-based organization (overdue, today, this week, upcoming, completed)
- Smart prioritization and sorting
- Flexible time period shifting
- Batch operations and multi-select
- Inline editing and quick actions

## 🏗️ Technical Architecture

### [Store API](./api/store.md)
**File:** `src/store/index.ts`  
Zustand-based state management with local storage persistence, entry operations, and review system.

### [Types & Interfaces](./api/types.md)
**File:** `src/types.ts`  
TypeScript type definitions ensuring type safety across the entire application.

## 🧩 Component Documentation

### [CaptureView Component](./components/CaptureView.md)
**File:** `src/components/CaptureView.tsx`  
Detailed component documentation including props, state, functions, and implementation details.

### [ThoughtsView Component](./components/ThoughtsView.md)
**File:** `src/components/ThoughtsView.tsx`  
Component documentation covering search, filtering, and review system implementation.

### [HomeView Component](./components/HomeView.md)
**File:** `src/components/HomeView.tsx`  
Documentation for the time-based dashboard and workflow management interface.

## 🔧 Technical Features

### AI-Powered Parsing
- **Natural Language Processing:** Understands context from plain text
- **Smart Type Detection:** Automatically categorizes entries
- **Priority Recognition:** Identifies urgency from language patterns
- **Date Parsing:** Extracts dates from natural language

### Directive System
Users can guide the AI using hashtags:
- **Type:** `#task`, `#idea`, `#insight`, `#reflection`, `#journal`, `#event`, `#reminder`, `#note`
- **Time:** `#today`, `#tomorrow`, `#thisweek`, `#nextweek`
- **Priority:** `#urgent`, `#high`, `#medium`, `#low`

### Review System
- **Smart Detection:** Identifies entries needing attention
- **Categorized Triggers:** Unclear outcomes, overdue items, low confidence
- **Workflow Management:** Review, action, and resolution tracking

### Data Organization
- **Time-Based Views:** Overdue, today, this week, upcoming, completed
- **Priority Sorting:** Urgent items first, then by creation date
- **Flexible Management:** Move items between time periods
- **Tag System:** User-defined categorization

## 📱 User Experience

### Mobile-First Design
- Responsive layout for all screen sizes
- Touch-friendly interactions
- Optimized for mobile workflows

### Accessibility
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility

### Performance
- Efficient filtering and search
- Lazy loading and rendering
- Optimized state management
- Local storage persistence

## 🔮 Future Enhancements

### Planned Features
- Voice input support
- Image/attachment capture
- Calendar integration
- Time tracking
- Progress analytics
- Goal setting and tracking
- Team collaboration
- Mobile app optimization

### Technical Improvements
- Cloud synchronization
- Offline support
- Data export/import
- Advanced analytics
- API integrations
- Performance monitoring

## 📚 Documentation Structure

This documentation is organized to be **code-connected** and **feature-focused**:

```
docs/
├── features/           # Feature documentation mapped to components
│   ├── note-capture.md
│   ├── thought-management.md
│   └── home-dashboard.md
├── components/         # Detailed component documentation
│   ├── CaptureView.md
│   ├── ThoughtsView.md
│   └── HomeView.md
├── api/               # API and type documentation
│   ├── store.md
│   └── types.md
└── FEATURES.md        # This overview file
```

Each feature document maps directly to actual components and includes:
- **Component mapping** to source code
- **Technical implementation** details
- **User experience** workflows
- **Code examples** and functions
- **Related components** and dependencies

## 🚀 Getting Started

1. **Capture Thoughts:** Use the capture view to quickly add thoughts
2. **Organize Workflow:** Use the home dashboard for daily management
3. **Search & Review:** Use thoughts view for comprehensive organization
4. **Use Directives:** Leverage hashtags for quick categorization

## 💡 Best Practices

- **Use Natural Language:** Write thoughts as you think them
- **Leverage Directives:** Use hashtags to guide AI categorization
- **Regular Review:** Check the review section for items needing attention
- **Tag Consistently:** Use tags for personal organization
- **Time Management:** Use time-based views for workflow organization
