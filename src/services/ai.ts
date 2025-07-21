import { AIResponse, ThoughtAnalysis, JournalReflection, TagSuggestion, BacklogGeneration } from '../types';
import { MultiTopicResult } from '../store';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

class AIService {
  private static async callOpenAI(prompt: string, systemPrompt?: string): Promise<any> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.');
    }
    
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
          max_tokens: 1500,
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
      const systemPrompt = `You are a personal coach (spiritual/mental/life coach) helping the user grow. Analyze the user's thought, speak directly to them with warmth and encouragement, and provide a JSON response with the following structure:
{
  "category": "idea|memory|goal|reflection|question|insight",
  "insight": "personal, coach-like analysis of the thought, with encouragement and clarity",
  "nextSteps": ["actionable next step 1", "actionable next step 2"],
  "relatedThoughts": ["related thought 1", "related thought 2", "related thought 3"]
}
Always suggest next steps that can be converted to tasks, projects, or ideas. Use a direct, supportive tone.`;

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
      const systemPrompt = `You are a personal coach (spiritual/mental/life coach) helping the user reflect and grow. Read the user's journal entry, speak directly to them with warmth and encouragement, and provide a JSON response with the following structure:
{
  "reflection": "personal, coach-like analysis of the day's entry, with encouragement and clarity",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"]
}
Always suggest actionable next steps that can be converted to tasks, goals, or journal prompts. Use a direct, supportive tone.`;

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
      const systemPrompt = `You are an AI assistant that analyzes and categorizes personal thoughts. Analyze the given thought and return a JSON response with the following structure:
{
  "category": "task|emotion|idea|reminder|reflection",
  "label": "work|personal|health|family|finance|creative|learning",
  "priority": "low|medium|high",
  "dueDate": "YYYY-MM-DD" (if applicable, null otherwise),
  "linkedThoughts": ["related thought 1", "related thought 2"],
  "insights": "brief AI insight about this thought",
  "mood": "great|good|okay|bad|terrible" (if emotional content),
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- "task": actionable items, to-dos, appointments
- "emotion": feelings, moods, emotional states
- "idea": creative thoughts, concepts, possibilities
- "reminder": things to remember, follow-ups
- "reflection": self-reflection, insights, observations

Priority levels:
- "high": urgent, time-sensitive, important
- "medium": moderate importance, can wait
- "low": nice to have, no rush

Only include dueDate if there's a clear deadline or time sensitivity.`;

      const prompt = `Please categorize and analyze this thought: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error categorizing thought:', error);
      return { success: false, error: 'Failed to categorize thought' };
    }
  }

  static async analyzeMultipleTopics(content: string): Promise<MultiTopicResult> {
    try {
      const systemPrompt = `You are an AI assistant that analyzes text and extracts multiple types of content. Return a JSON object with the following structure:

{
  "tasks": [
    {
      "content": "task description",
      "priority": "low|medium|high",
      "dueDate": "YYYY-MM-DD (if mentioned)",
      "tags": ["tag1", "tag2"],
      "timeEstimate": "estimated time",
      "energyLevel": "low|medium|high"
    }
  ],
  "notes": [
    {
      "title": "note title",
      "content": "note content",
      "tags": ["tag1", "tag2"]
    }
  ],
  "ideas": [
    {
      "title": "idea title",
      "description": "description",
      "category": "app|business|feature|product|service|other",
      "status": "concept",
      "potential": "low|medium|high",
      "tags": ["tag1", "tag2"],
      "marketSize": "market size description",
      "targetAudience": "target audience description"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "description",
      "status": "idea",
      "tags": ["tag1", "tag2"],
      "timeline": "estimated timeline",
      "resources": ["resource1", "resource2"]
    }
  ],
  "journalEntries": [
    {
      "content": "journal content",
      "mood": "great|good|okay|bad|terrible",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Extract all relevant content types from the text. Be thorough and creative in identifying different types of content.`;

      const prompt = `Please analyze this text and extract all relevant content: "${content}"`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return parsed;
    } catch (error) {
      console.error('Error analyzing multiple topics:', error);
      return {
        tasks: [],
        notes: [],
        ideas: [],
        projects: [],
        journalEntries: []
      };
    }
  }

  static async generateTodayView(thoughts: any[], todos: any[], ideas: any[], projects: any[]): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an AI assistant that creates a personalized "Today" view. Analyze the user's thoughts, tasks, ideas, and projects to suggest what should be focused on today. Return a JSON response with the following structure:

{
  "focusAreas": [
    {
      "title": "focus area title",
      "description": "why this matters today",
      "priority": "low|medium|high",
      "items": ["item1", "item2"],
      "estimatedTime": "time estimate"
    }
  ],
  "suggestedTasks": [
    {
      "content": "task description",
      "priority": "low|medium|high",
      "reason": "why this should be done today",
      "energyLevel": "low|medium|high"
    }
  ],
  "insights": [
    "insight about patterns or opportunities"
  ],
  "mood": "great|good|okay|bad|terrible",
  "energyLevel": "low|medium|high",
  "recommendations": [
    "personalized recommendation"
  ]
}

Consider:
- Urgent tasks and deadlines
- Energy levels and mood patterns
- Progress on ongoing projects
- New ideas that need attention
- Personal well-being and balance`;

      const context = `
Thoughts: ${thoughts.map(t => t.content).join(', ')}
Tasks: ${todos.map(t => t.content).join(', ')}
Ideas: ${ideas.map(i => i.title).join(', ')}
Projects: ${projects.map(p => p.name).join(', ')}
      `;

      const prompt = `Please create a personalized Today view based on this context: ${context}`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error generating today view:', error);
      return { success: false, error: 'Failed to generate today view' };
    }
  }

  static async enhanceThoughtWithContext(thought: any, allThoughts: any[]): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an AI assistant that enhances thoughts with context and connections. Analyze a thought in relation to other thoughts and return enhanced insights. Return a JSON response with the following structure:

{
  "enhancedThought": {
    "connections": ["related thought 1", "related thought 2"],
    "patterns": ["pattern 1", "pattern 2"],
    "insights": ["insight 1", "insight 2"],
    "suggestedActions": ["action 1", "action 2"],
    "priority": "low|medium|high",
    "category": "refined category"
  },
  "recommendations": [
    "recommendation based on patterns"
  ]
}`;

      const context = `
Current thought: ${thought.content}
Other thoughts: ${allThoughts.filter(t => t.id !== thought.id).map(t => t.content).join(', ')}
      `;

      const prompt = `Please enhance this thought with context: ${context}`;
      
      const result = await this.callOpenAI(prompt, systemPrompt);
      const parsed = JSON.parse(result);
      
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Error enhancing thought with context:', error);
      return { success: false, error: 'Failed to enhance thought' };
    }
  }
}

export { AIService }; 