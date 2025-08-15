# Note Capture Feature

**Component:** `src/components/CaptureView.tsx`  
**Purpose:** AI-powered thought capture and categorization

## Overview
The Note Capture feature is the heart of GenieNotes, allowing users to quickly capture thoughts, ideas, tasks, and insights with intelligent AI parsing and categorization.

## Key Features

### 🧠 AI-Powered Parsing
- **Natural Language Processing:** Understands context from plain text
- **Smart Type Detection:** Automatically categorizes entries as tasks, ideas, events, etc.
- **Priority Recognition:** Identifies urgency from language patterns
- **Date Parsing:** Extracts dates from natural language (e.g., "tomorrow", "next week")

### 🏷️ Directive System
Users can use hashtags to guide the AI:

#### Type Directives
- `#task` - Actionable items to complete
- `#idea` - Creative concepts and possibilities  
- `#insight` - Key learnings and realizations
- `#reflection` - Personal thoughts and feelings
- `#journal` - Daily entries and experiences
- `#event` - Scheduled activities and meetings
- `#reminder` - Time-sensitive notifications
- `#note` - General information and observations

#### Time Directives
- `#today` - Pin to current date
- `#tomorrow` - Set due date to tomorrow
- `#thisweek` - Target current week
- `#nextweek` - Target next week

#### Priority Directives
- `#urgent` - Highest priority
- `#high` - High priority
- `#medium` - Medium priority (default)
- `#low` - Low priority

### 🔍 Smart Content Analysis
The AI analyzes content for:
- **Actionable Language:** Words like "finish", "complete", "work on"
- **Time Sensitivity:** "ASAP", "deadline", "urgent"
- **Context Clues:** Meeting, appointment, conference indicators

### ✏️ Preview & Edit
- **AI Preview:** Shows parsed results before saving
- **Editable Fields:** Modify type, priority, tags, and dates
- **Confirmation:** Review and confirm before adding to system

## User Experience

### Input Flow
1. **Type Naturally:** Write thoughts in plain English
2. **AI Analysis:** System processes and categorizes automatically
3. **Preview Results:** Review AI's understanding
4. **Edit if Needed:** Adjust any parsed fields
5. **Save & Organize:** Entry is added to the system

### Pro Tips
- Use hashtags for quick categorization
- Include dates naturally ("meeting tomorrow at 3pm")
- Add urgency words for priority setting
- Mention locations for context

## Technical Implementation

### Core Functions
- `parseDirectives()` - Extracts hashtag directives
- `parseNaturalLanguageDates()` - Uses chrono-node for date parsing
- `extractUserTags()` - Separates user tags from directive tags
- `cleanContent()` - Removes hashtags for clean display

### Dependencies
- **chrono-node:** Natural language date parsing
- **lucide-react:** Icon components
- **Zustand:** State management

### State Management
- Input text and processing state
- Parsed entry preview
- Editable entry modifications

## Related Components
- **HomeView:** Displays captured entries in organized views
- **ThoughtsView:** Shows all entries with filtering and search
- **Store:** Manages entry data and operations

## Future Enhancements
- Voice input support
- Image/attachment capture
- Template system for common entry types
- Integration with calendar systems
