# AllyMind - Your AI-Powered Thought Companion

Transform scattered thoughts into organized insights with AllyMind's intelligent capture and organization system.

## 🚀 What is AllyMind?

AllyMind is an intelligent thought management application that automatically captures, categorizes, and organizes your ideas, tasks, and reflections using AI-powered understanding. No more manual categorization or scattered notes across multiple apps.

## ✨ Key Features

### 🧠 Intelligent Capture
- **Multi-thought Detection**: Automatically split multiple thoughts from a single input
- **Voice & Text Input**: Speak naturally or type - AllyMind understands both
- **Smart Categorization**: AI automatically detects tasks, ideas, insights, and reflections

### 🤖 Smart Understanding
- **Natural Language Processing**: "Meeting with John tomorrow at 3pm" becomes a scheduled task
- **Automatic Deadlines**: AI detects urgency levels and sets appropriate due dates
- **Context Awareness**: Understands relationships between thoughts and tasks

### 📊 Pattern Recognition
- **Behavioral Insights**: Discover patterns in your thinking and behaviors
- **Smart Nudges**: Get contextual reminders and suggestions
- **Progress Tracking**: Monitor your thought patterns and productivity

### 🎯 Unified Workspace
- **Single Source of Truth**: Keep everything in one intelligent workspace
- **Cross-Platform**: Access your thoughts from anywhere
- **Smart Organization**: AI-powered sorting and categorization

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI Processing**: Natural language processing with chrono-node
- **Voice Recognition**: Web Speech API
- **Storage**: Local storage with persistence

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/allymind.git
cd allymind
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
npm run preview
```

## 💡 Usage Examples

### Voice Input
Click the microphone and speak naturally:
- "I need to finish the project by Friday"
- "Meeting with Sarah tomorrow at 2pm"
- "Great idea for a new app feature"

### Text Input
Type naturally with context:
- "Buy groceries, call mom, review quarterly report"
- "Feeling overwhelmed with work lately"
- "Deadline: submit proposal by end of week"

### Smart Detection
AllyMind automatically:
- Splits multiple thoughts into separate entries
- Detects deadlines and urgency levels
- Categorizes content by type (task, idea, insight, etc.)
- Suggests appropriate tags and priorities

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── CaptureView.tsx # Main landing page and input
│   ├── HomeView.tsx    # Dashboard and organization
│   └── ThoughtsView.tsx# Thought management
├── store/              # Zustand state management
├── types.ts            # TypeScript type definitions
└── main.tsx           # Application entry point
```

### Key Components

- **CaptureView**: Main landing page with voice/text input and AI processing
- **HomeView**: Dashboard with smart categorization and insights
- **ThoughtsView**: Detailed thought management and editing

### State Management
The app uses Zustand for state management with persistence to localStorage, ensuring your thoughts are saved locally and securely.

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern React patterns and best practices
- Powered by AI and natural language processing
- Designed for productivity and mental clarity

---

**AllyMind** - Because your thoughts deserve intelligent organization. 