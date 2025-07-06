import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: (import.meta as any).env?.VITE_OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true
});

export interface TaskSuggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
  category: string;
}

export interface JournalPrompt {
  question: string;
  category: 'reflection' | 'goals' | 'gratitude' | 'creativity';
}

export interface QuoteOfTheDay {
  text: string;
  author: string;
  category: string;
}

export interface ProductivityInsight {
  insight: string;
  recommendation: string;
  category: 'time-management' | 'focus' | 'habits' | 'balance';
}

export class AIService {
  // Generate daily quote
  static async generateQuoteOfTheDay(): Promise<QuoteOfTheDay> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a wise mentor. Generate an inspiring, meaningful quote for someone starting their day. Return only a JSON object with 'text', 'author', and 'category' fields. Make the author real or use 'Anonymous'. Categories: 'motivation', 'wisdom', 'creativity', 'success', 'mindfulness'."
          },
          {
            role: "user",
            content: "Generate an inspiring quote for today."
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error generating quote:', error);
    }

    // Fallback quote
    return {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "motivation"
    };
  }

  // Extract tasks from text
  static async extractTasksFromText(text: string): Promise<TaskSuggestion[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract actionable tasks from the given text. Return a JSON array of objects with 'title', 'priority' (high/medium/low), 'estimatedTime' (in minutes), and 'category' fields. Focus on clear, actionable items."
          },
          {
            role: "user",
            content: `Extract tasks from this text: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error extracting tasks:', error);
    }

    return [];
  }

  // Generate journal prompts
  static async generateJournalPrompt(): Promise<JournalPrompt> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate a thoughtful journaling prompt. Return a JSON object with 'question' and 'category' fields. Categories: 'reflection', 'goals', 'gratitude', 'creativity'. Make prompts deep and meaningful."
          },
          {
            role: "user",
            content: "Generate a meaningful journal prompt for today."
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
    }

    // Fallback prompt
    return {
      question: "What are three things you're grateful for today, and how did they make you feel?",
      category: "gratitude"
    };
  }

  // Analyze productivity and provide insights
  static async analyzeProductivity(data: {
    tasksCompleted: number;
    timeSpent: number;
    appProgress: number;
    journalEntries: number;
  }): Promise<ProductivityInsight> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze productivity data and provide insights. Return a JSON object with 'insight' and 'recommendation' fields, and 'category' (time-management/focus/habits/balance). Be encouraging and actionable."
          },
          {
            role: "user",
            content: `Analyze this productivity data: ${JSON.stringify(data)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error analyzing productivity:', error);
    }

    // Fallback insight
    return {
      insight: "You're making progress! Every small step counts towards your goals.",
      recommendation: "Consider breaking larger tasks into smaller, manageable chunks.",
      category: "habits"
    };
  }

  // Improve writing (for notes/journal)
  static async improveWriting(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Improve the given text by making it clearer, more engaging, and well-structured. Maintain the original meaning and tone. Return only the improved text."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('Error improving writing:', error);
      return text;
    }
  }

  // Generate task suggestions based on context
  static async suggestTasks(context: string): Promise<TaskSuggestion[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Based on the context, suggest 3-5 relevant tasks. Return a JSON array with 'title', 'priority', 'estimatedTime', and 'category' fields. Be practical and actionable."
          },
          {
            role: "user",
            content: `Context: ${context}`
          }
        ],
        temperature: 0.6,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error suggesting tasks:', error);
    }

    return [];
  }
} 