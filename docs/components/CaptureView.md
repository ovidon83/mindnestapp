# CaptureView Component

**File:** `src/components/CaptureView.tsx`  
**Purpose:** AI-powered thought capture and categorization interface

## Component Overview
CaptureView is the primary entry point for users to capture thoughts, ideas, and tasks. It features intelligent AI parsing, directive-based categorization, and a preview/edit workflow.

## Props
This component has no external props - it's a self-contained view component.

## State Management
```typescript
const [inputText, setInputText] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const [parsedEntry, setParsedEntry] = useState<Partial<Entry> | null>(null);
const [editableEntry, setEditableEntry] = useState<Partial<Entry> | null>(null);
```

## Key Functions

### parseDirectives(text: string)
Extracts hashtag directives from user input to guide AI categorization.

**Directives Supported:**
- **Type:** `#task`, `#idea`, `#insight`, `#reflection`, `#journal`, `#event`, `#reminder`, `#note`
- **Time:** `#today`, `#tomorrow`, `#thisweek`, `#nextweek`
- **Priority:** `#urgent`, `#high`, `#medium`, `#low`

### parseNaturalLanguageDates(text: string)
Uses chrono-node to extract dates from natural language.

**Examples:**
- "meeting tomorrow at 3pm" → Sets due date to tomorrow 3pm
- "project due Friday" → Sets due date to Friday
- "next week" → Sets target week

### extractUserTags(text: string)
Separates user-defined tags from directive hashtags.

**Logic:**
- Filters out directive hashtags
- Preserves user categorization tags
- Returns clean tag array for storage

### parseInput(text: string)
Main parsing function that orchestrates the entire AI analysis workflow.

**Process:**
1. Parse directives
2. Extract natural language dates
3. Set default times
4. Extract user tags
5. Clean content
6. Determine final values
7. Return structured entry data

## UI States

### Input State
- Clean input form with placeholder text
- Processing indicator during AI analysis
- Pro tips section with usage examples

### Preview State
- AI analysis results display
- Editable fields for user modification
- Confirmation and edit options

## Dependencies
- **lucide-react:** Icon components (Brain, Sparkles, CheckCircle, etc.)
- **chrono-node:** Natural language date parsing
- **Zustand store:** State management and entry storage

## User Flow
1. User types thought in textarea
2. Clicks "Analyze & Categorize" button
3. AI processes input and shows preview
4. User can edit parsed results
5. User confirms and saves entry
6. Redirects to home view

## Error Handling
- Input validation for empty text
- Graceful fallbacks for parsing errors
- User-friendly error messages

## Accessibility Features
- Proper form labels and IDs
- ARIA descriptions for complex interactions
- Keyboard navigation support
- Screen reader friendly content

## Performance Considerations
- Debounced input processing
- Efficient regex operations
- Minimal re-renders during typing
- Optimized date parsing

## Related Files
- **Types:** `src/types.ts` - Entry, EntryType, Priority interfaces
- **Store:** `src/store/index.ts` - addEntry function
- **App:** `src/App.tsx` - View routing
