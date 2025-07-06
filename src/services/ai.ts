import { AIResponse, ThoughtAnalysis, JournalReflection, TagSuggestion, BacklogGeneration } from '../types';
import { MultiTopicResult } from '../store';

const OPENAI_API_KEY = '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';

class AIService {
  private static async callOpenAI(prompt: string, systemPrompt?: string): Promise<any> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  static async sortThought(content: string): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an AI assistant that categorizes thoughts into different types. Analyze the given thought and return a JSON response with the following structure:
{
  "type": "todo|project|journal|note",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

      const prompt = `Please categorize this thought: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error sorting thought:', error);
      return { success: false, error: 'Failed to analyze thought' };
    }
  }

  static async analyzeThought(content: string): Promise<AIResponse<ThoughtAnalysis>> {
    try {
      const systemPrompt = `You are an AI assistant that analyzes personal thoughts and provides insights. Return a JSON response with the following structure:
{
  "category": "idea|memory|goal|reflection|question|insight",
  "insight": "detailed analysis of the thought",
  "relatedThoughts": ["related thought 1", "related thought 2", "related thought 3"]
}`;

      const prompt = `Please analyze this thought and provide insights: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error analyzing thought:', error);
      return { success: false, error: 'Failed to analyze thought' };
    }
  }

  static async reflectOnDay(content: string): Promise<AIResponse<JournalReflection>> {
    try {
      const systemPrompt = `You are an AI assistant that provides thoughtful reflections on journal entries. Return a JSON response with the following structure:
{
  "reflection": "thoughtful analysis of the day's entry",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

      const prompt = `Please reflect on this journal entry: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error reflecting on day:', error);
      return { success: false, error: 'Failed to reflect on day' };
    }
  }

  static async suggestTags(content: string): Promise<AIResponse<TagSuggestion>> {
    try {
      const systemPrompt = `You are an AI assistant that suggests relevant tags for content. Return a JSON response with the following structure:
{
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Suggest 3-5 relevant tags that would help categorize and find this content later.`;

      const prompt = `Please suggest tags for this content: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return { success: false, error: 'Failed to suggest tags' };
    }
  }

  static async generateBacklog(): Promise<AIResponse<BacklogGeneration>> {
    try {
      const systemPrompt = `You are an AI assistant that generates a personal productivity backlog. Return a JSON response with the following structure:
{
  "todos": [
    {
      "content": "task description",
      "priority": "low|medium|high"
    }
  ]
}

Generate 5-8 realistic personal productivity tasks that someone might want to accomplish. Mix different priority levels.`;

      const prompt = `Please generate a personal productivity backlog with various tasks.`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error generating backlog:', error);
      return { success: false, error: 'Failed to generate backlog' };
    }
  }

  static async generateProjectBacklog(idea: string): Promise<AIResponse<BacklogGeneration>> {
    try {
      const systemPrompt = `You are an AI assistant that generates project tasks based on an idea. Return a JSON response with the following structure:
{
  "todos": [
    {
      "content": "task description",
      "priority": "low|medium|high"
    }
  ]
}

Generate 6-10 realistic project tasks that would help bring this idea to life. Include research, planning, and execution tasks.`;

      const prompt = `Please generate project tasks for this idea: "${idea}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error generating project backlog:', error);
      return { success: false, error: 'Failed to generate project backlog' };
    }
  }

  static async enhanceIdea(description: string): Promise<AIResponse> {
    try {
      const systemPrompt = `You are a business strategy expert. Analyze the given idea and enhance it with market insights. Return a JSON response with the following structure:
{
  "category": "app|business|feature|product|service|other",
  "potential": "low|medium|high",
  "marketSize": "brief description of market size",
  "targetAudience": "description of target audience",
  "revenueModel": "suggested revenue model",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const prompt = `Please analyze and enhance this idea: "${description}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error enhancing idea:', error);
      return { success: false, error: 'Failed to enhance idea' };
    }
  }

  static async categorizeThought(content: string): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an AI assistant that categorizes thoughts and automatically routes them to the appropriate section. Analyze the given thought and return a JSON response with the following structure:
{
  "category": "idea|task|note|journal|random_thought",
  "confidence": 0.0-1.0,
  "extractedData": {
    "title": "extracted title if applicable",
    "description": "enhanced description",
    "priority": "low|medium|high (for tasks)",
    "dueDate": "YYYY-MM-DD (for tasks, if mentioned)",
    "location": "location if mentioned (for tasks)",
    "links": ["relevant links or resources"],
    "suggestedActions": ["action 1", "action 2"]
  }
}

For tasks, extract important details like location, due dates, and suggest helpful resources like Google Maps, calendar links, etc.
For ideas, extract business potential and market insights.
For journal entries, focus on emotional and personal reflection.
For notes, organize information clearly.
For random thoughts, preserve the original thought with minimal processing.`;

      const prompt = `Please categorize and enhance this thought: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error categorizing thought:', error);
      return { success: false, error: 'Failed to categorize thought' };
    }
  }

  static async analyzeMultipleTopics(content: string): Promise<MultiTopicResult> {
    const prompt = `Analyze the following text and extract any tasks, notes, ideas, projects, or journal entries. 
    Return a JSON object with the following structure:
    {
      "tasks": [{"content": "task description", "priority": "low|medium|high", "tags": ["tag1"]}],
      "notes": [{"title": "note title", "content": "note content", "tags": ["tag1"]}],
      "ideas": [{"title": "idea title", "description": "description", "category": "app|business|feature|product|service|other", "status": "concept", "potential": "low|medium|high", "tags": ["tag1"]}],
      "projects": [{"name": "project name", "description": "description", "status": "idea", "tags": ["tag1"]}],
      "journalEntries": [{"content": "journal content", "mood": "great|good|okay|bad|terrible"}]
    }
    
    Guidelines:
    - Extract actionable items as tasks
    - Extract informational content as notes
    - Extract creative concepts as ideas
    - Extract multi-step goals as projects
    - Extract personal reflections as journal entries
    - Only include items that are clearly identifiable
    - Use relevant tags for categorization
    - Return empty arrays for categories not found
    
    Text to analyze: "${content}"`;

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const result = await response.json();
      
      // Parse the AI response and ensure it matches our expected structure
      const parsed = JSON.parse(result.content);
      
      return {
        tasks: parsed.tasks || [],
        notes: parsed.notes || [],
        ideas: parsed.ideas || [],
        projects: parsed.projects || [],
        journalEntries: parsed.journalEntries || [],
      };
    } catch (error) {
      console.error('Error analyzing multiple topics:', error);
      
      // Fallback: create a simple note if AI analysis fails
      return {
        tasks: [],
        notes: [{
          title: 'Captured Thought',
          content: content,
          tags: ['unprocessed'],
        }],
        ideas: [],
        projects: [],
        journalEntries: [],
      };
    }
  }
}

export { AIService }; 