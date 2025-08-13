import * as chrono from 'chrono-node';
import { 
  Priority, 
  ClassificationResult, 
  DateParseResult, 
  LocationParseResult,
  ParsedInput,
  Entry,
  AutoAction
} from '../types';

export class AIService {
  // AI Classification (stub implementation)
  static classifyInput(content: string): ClassificationResult {
    const lowerContent = content.toLowerCase();
    
    // Task patterns
    if (this.matchesTaskPatterns(lowerContent)) {
      return {
        type: 'task',
        confidence: 0.9,
        reasoning: 'Contains action verbs and task indicators',
        suggestedTags: this.extractTags(content),
        suggestedPriority: this.determinePriority(lowerContent)
      };
    }
    
    // Event patterns
    if (this.matchesEventPatterns(lowerContent)) {
      return {
        type: 'event',
        confidence: 0.85,
        reasoning: 'Contains time/date references and meeting indicators',
        suggestedTags: this.extractTags(content),
        suggestedPriority: this.determinePriority(lowerContent)
      };
    }
    
    // Idea patterns
    if (this.matchesIdeaPatterns(lowerContent)) {
      return {
        type: 'idea',
        confidence: 0.8,
        reasoning: 'Contains creative or conceptual language',
        suggestedTags: this.extractTags(content),
        suggestedPriority: 'medium'
      };
    }
    
    // Insight patterns
    if (this.matchesInsightPatterns(lowerContent)) {
      return {
        type: 'insight',
        confidence: 0.75,
        reasoning: 'Contains observational or analytical language',
        suggestedTags: this.extractTags(content),
        suggestedPriority: 'medium'
      };
    }
    
    // Reflection patterns
    if (this.matchesReflectionPatterns(lowerContent)) {
      return {
        type: 'reflection',
        confidence: 0.8,
        reasoning: 'Contains personal or introspective language',
        suggestedTags: this.extractTags(content),
        suggestedPriority: 'low'
      };
    }
    
    // Journal patterns
    if (this.matchesJournalPatterns(lowerContent)) {
      return {
        type: 'journal',
        confidence: 0.85,
        reasoning: 'Contains daily activity or personal narrative',
        suggestedTags: this.extractTags(content),
        suggestedPriority: 'low'
      };
    }
    
    // Default to insight
    return {
      type: 'insight',
      confidence: 0.6,
      reasoning: 'General observation or note',
      suggestedTags: this.extractTags(content),
      suggestedPriority: 'medium'
    };
  }

  // Date parsing using chrono-node
  static parseDates(content: string): DateParseResult[] {
    const results = chrono.parse(content);
    return results.map(result => ({
      date: result.start.date(),
      confidence: result.start.isCertain('day') ? 0.9 : 0.7,
      type: result.start.isCertain('day') ? 'exact' : 'relative',
      context: result.text
    }));
  }

  // Location detection
  static parseLocation(content: string): LocationParseResult | null {
    const locationPatterns = [
      /(?:at|in|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /@\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /(?:WeWork|Starbucks|Office|Home|Gym|Restaurant|Cafe)/gi
    ];
    
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return {
          location: match[1] || match[0],
          confidence: 0.8,
          type: 'exact'
        };
      }
    }
    
    return null;
  }

  // Parse input and generate entries
  static parseInput(content: string): ParsedInput {
    const classification = this.classifyInput(content);
    
    // Split content if it contains multiple items
    const items = this.splitMultipleItems(content);
    
    const entries: Entry[] = items.map((item, index) => {
      const itemClassification = this.classifyInput(item);
      const itemDates = this.parseDates(item);
      const itemLocation = this.parseLocation(item);
      
      const entry: Entry = {
        id: `entry_${Date.now()}_${index}`,
        content: item.trim(),
        type: itemClassification.type,
        createdAt: new Date(),
        updatedAt: new Date(),
        confidence: itemClassification.confidence,
        tags: itemClassification.suggestedTags,
        priority: itemClassification.suggestedPriority,
        status: 'pending',
        autoActions: [],
        relatedIds: [],
        notes: ''
      };
      
      // Handle dates based on type
      if (itemClassification.type === 'task' && itemDates.length > 0) {
        entry.dueDate = itemDates[0].date;
      } else if (itemClassification.type === 'event' && itemDates.length > 0) {
        entry.startDate = itemDates[0].date;
        // Set end date to 1 hour after start if not specified
        const endDate = new Date(itemDates[0].date);
        endDate.setHours(endDate.getHours() + 1);
        entry.endDate = endDate;
        
        // Generate prep task for events
        const prepTask: AutoAction = {
          id: `prep_${entry.id}`,
          type: 'prep_task',
          content: `Prepare for: ${item.trim()}`,
          dueDate: new Date(itemDates[0].date.getTime() - 24 * 60 * 60 * 1000), // Day before
          completed: false
        };
        entry.autoActions.push(prepTask);
      }
      
      // Handle location
      if (itemLocation) {
        entry.location = itemLocation.location;
      }
      
      return entry;
    });
    
    return {
      entries,
      confidence: classification.confidence,
      suggestions: this.generateSuggestions(entries)
    };
  }

  // Split content into multiple items
  private static splitMultipleItems(content: string): string[] {
    const separators = [/\n+/, /;/, /, and/, /, then/, /\.\s+(?=[A-Z])/];
    
    for (const separator of separators) {
      const parts = content.split(separator);
      if (parts.length > 1 && parts.every(part => part.trim().length > 3)) {
        return parts.map(part => part.trim()).filter(part => part.length > 0);
      }
    }
    
    return [content];
  }

  // Pattern matching methods
  private static matchesTaskPatterns(content: string): boolean {
    const taskPatterns = [
      /^(?:todo|task|do|fix|complete|finish|implement|add|create|update|delete|remove|build|setup|install|configure|test|debug|review|check|verify|schedule|book|call|email|send|buy|order|pay|submit|apply|sign|register|cancel|remind|follow up)/,
      /(?:need to|should|must|have to|got to|gotta)/,
      /(?:deadline|due|urgent|asap|priority)/
    ];
    
    return taskPatterns.some(pattern => pattern.test(content));
  }

  private static matchesEventPatterns(content: string): boolean {
    const eventPatterns = [
      /(?:meet|meeting|appointment|call|lunch|dinner|coffee|drinks|party|event|conference|workshop|session)/,
      /(?:tomorrow|today|next week|this week|morning|afternoon|evening|night)/,
      /(?:at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/,
      /(?:on \w+)/,
      /(?:with|@)/
    ];
    
    return eventPatterns.some(pattern => pattern.test(content));
  }

  private static matchesIdeaPatterns(content: string): boolean {
    const ideaPatterns = [
      /^(?:idea|what if|maybe|could|might|potentially|brainstorm|concept|innovation|solution|approach|strategy|feature|improvement)/,
      /(?:💡|idea:|maybe we could|what about|consider|think about)/
    ];
    
    return ideaPatterns.some(pattern => pattern.test(content));
  }

  private static matchesInsightPatterns(content: string): boolean {
    const insightPatterns = [
      /(?:noticed|observed|realized|discovered|learned|found|figured out|understood)/,
      /(?:pattern|trend|insight|observation|discovery|learning)/
    ];
    
    return insightPatterns.some(pattern => pattern.test(content));
  }

  private static matchesReflectionPatterns(content: string): boolean {
    const reflectionPatterns = [
      /(?:feeling|felt|thinking about|reflecting on|grateful for|struggling with|working on)/,
      /(?:happy|sad|excited|frustrated|anxious|stressed|proud|disappointed|grateful|worried|confused|tired|energized)/
    ];
    
    return reflectionPatterns.some(pattern => pattern.test(content));
  }

  private static matchesJournalPatterns(content: string): boolean {
    const journalPatterns = [
      /(?:today|yesterday|this morning|this week|lately|currently|morning routine|evening routine)/,
      /(?:woke up|went to|had|ate|drank|exercised|worked|studied|read|watched|listened to)/
    ];
    
    return journalPatterns.some(pattern => pattern.test(content));
  }

  // Extract tags from content
  private static extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtags = content.match(/#\w+/g);
    if (hashtags) {
      tags.push(...hashtags.map(tag => tag.slice(1)));
    }
    
    // Extract priority indicators
    if (content.toLowerCase().includes('urgent') || content.toLowerCase().includes('asap')) {
      tags.push('priority');
    }
    
    if (content.toLowerCase().includes('goal') || content.toLowerCase().includes('objective')) {
      tags.push('goal');
    }
    
    return tags;
  }

  // Determine priority based on content
  private static determinePriority(content: string): Priority {
    if (content.includes('urgent') || content.includes('asap') || content.includes('emergency')) {
      return 'urgent';
    }
    if (content.includes('important') || content.includes('deadline') || content.includes('due')) {
      return 'high';
    }
    if (content.includes('priority') || content.includes('focus')) {
      return 'medium';
    }
    return 'low';
  }

  // Generate suggestions based on entries
  private static generateSuggestions(entries: Entry[]): string[] {
    const suggestions: string[] = [];
    
    entries.forEach(entry => {
      if (entry.type === 'event' && entry.startDate) {
        suggestions.push(`Set reminder for ${entry.content} 15 minutes before`);
      }
      
      if (entry.type === 'task' && entry.priority === 'high') {
        suggestions.push(`Block time in calendar for ${entry.content}`);
      }
      
      if (entry.tags.includes('goal')) {
        suggestions.push(`Break down ${entry.content} into smaller tasks`);
      }
    });
    
    return suggestions;
  }
} 