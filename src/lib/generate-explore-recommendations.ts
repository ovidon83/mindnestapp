import { Thought } from '../types';
import { fetchWithRetry } from './api-utils';

export interface ExploreRecommendation {
  type: string;
  explanation: string;
  value: string; // What value the AI sees in this thought
  confidence: number; // 0-100
}

// Generate AI-powered recommendations for Explore view
export async function generateExploreRecommendations(thought: Thought): Promise<ExploreRecommendation[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback to heuristic-based recommendations
    return getHeuristicRecommendations(thought);
  }

  try {
    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze this thought and identify its potential value and what actions it could lead to. Be specific about what makes it valuable.

Return ONLY a JSON object with a SINGLE recommendation, or null if no recommendation:
{
  "type": "Worth Sharing" | "Action Item" | "Business Idea" | null,
  "explanation": "Very short explanation (max 8 words) of why this recommendation applies",
  "value": "Specific value the AI sees in this thought - what makes it special, actionable, or worth exploring (1-2 sentences)",
  "confidence": number (0-100, how confident the AI is in this recommendation)
}

Rules:
- "Worth Sharing": If it contains insights, learnings, opinions, or perspectives that could help or resonate with others. This includes reflections, learnings, insights, and other valuable thoughts that are worth sharing.
- "Action Item": If it contains clear, actionable tasks or next steps that need to be done
- "Business Idea": If it suggests a product, service, market opportunity, or entrepreneurial concept
- null: If the thought doesn't clearly fit any of the above categories (simple notes, basic observations without clear value)

IMPORTANT: 
- Return ONLY ONE recommendation - the most relevant one. Choose the type that best fits the thought.
- Learning, Insight, Reflection, Project thoughts should be "Worth Sharing" if they have good value, otherwise return null (no recommendation).
- Only return a recommendation if confidence >= 50. If confidence is below 50, return null.
- Be honest - if the thought is just a simple note without clear value, return null.`
          },
          {
            role: 'user',
            content: `Thought: "${thought.originalText}"\n\nCreated: ${new Date(thought.createdAt).toLocaleDateString()}\n${thought.summary ? `Summary: ${thought.summary}` : ''}\n${thought.tags.length > 0 ? `Tags: ${thought.tags.join(', ')}` : ''}`
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      })
    }, { maxRetries: 2, baseDelay: 1000 });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();
        if (content) {
          // Try to find JSON object (single recommendation)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Check if it's null (no recommendation)
            if (parsed === null) {
              return [];
            }
            // Check if it's a valid recommendation object
            if (parsed && typeof parsed === 'object' && parsed.type && parsed.confidence >= 50) {
              // Map old types to new types - Learning, Insight, Reflection, Project become "Worth Sharing" if good, otherwise null
              const typeMap: Record<string, string | null> = {
                'Worth Sharing': 'Worth Sharing',
                'Action Item': 'Action Item',
                'Business Idea': 'Business Idea',
                'Reflection': parsed.confidence >= 60 ? 'Worth Sharing' : null, // Only if good enough
                'Project': parsed.confidence >= 60 ? 'Worth Sharing' : null,
                'Learning': parsed.confidence >= 60 ? 'Worth Sharing' : null,
                'Insight': parsed.confidence >= 60 ? 'Worth Sharing' : null,
                'Other': null, // Never show "Other"
              };
              const mappedType = typeMap[parsed.type];
              // Only return if we have a valid type
              if (mappedType) {
                return [{
                  type: mappedType,
                  explanation: parsed.explanation || '',
                  value: parsed.value || '',
                  confidence: parsed.confidence || 50,
                }];
              }
            }
          }
        }
      }
  } catch (error) {
    console.error('Error generating explore recommendations:', error);
  }

  // Fallback to heuristic-based recommendations
  return getHeuristicRecommendations(thought);
}

// Fallback heuristic-based recommendations - returns max 1 recommendation
function getHeuristicRecommendations(thought: Thought): ExploreRecommendation[] {
  const text = thought.originalText.toLowerCase();
  
  // Priority order: Action Item > Business Idea > Worth Sharing > Other
  
  // Action Item (highest priority)
  if (
    /\b(need to|should|must|do|create|build|make|call|meet|schedule|plan|task|action)\b/i.test(thought.originalText) ||
    thought.bestPotential === 'Do' ||
    thought.potential === 'Do'
  ) {
    return [{
      type: 'Action Item',
      explanation: 'Contains clear, actionable tasks to complete',
      value: 'Identifies specific actions or next steps that need to be taken.',
      confidence: 75
    }];
  }
  
  // Business Idea
  if (
    /\b(business|startup|product|service|market|customer|revenue|profit|company|venture|idea|opportunity)\b/i.test(thought.originalText) ||
    thought.tags.includes('business')
  ) {
    return [{
      type: 'Business Idea',
      explanation: 'Suggests a product or business opportunity',
      value: 'Identifies a potential product, service, or market opportunity worth exploring.',
      confidence: 65
    }];
  }
  
  // Worth Sharing
  if (
    /\b(learned|realized|discovered|insight|think|believe|opinion|should know|worth|valuable)\b/i.test(thought.originalText) ||
    thought.bestPotential === 'Share' ||
    (thought.powerfulScore || 0) >= 60
  ) {
    return [{
      type: 'Worth Sharing',
      explanation: 'Contains valuable insights others could benefit from',
      value: 'This thought shares learnings or perspectives that could resonate with and help others.',
      confidence: 70
    }];
  }
  
  // Learning, Insight, Reflection, Project - only if good enough to be "Worth Sharing"
  const hasLearning = /\b(learned|learning|understand|insight|lesson|takeaway|realized|discovered)\b/i.test(thought.originalText);
  const hasReflection = /\b(why|how|what if|wonder|reflect|think about|consider|question|meaning|purpose)\b/i.test(thought.originalText) || /\?/.test(thought.originalText);
  const hasProject = /\b(project|build|create|develop|design|launch|start|begin|work on)\b/i.test(thought.originalText);
  
  // Only return "Worth Sharing" if it's good enough (high powerful score or clear value)
  if ((hasLearning || hasReflection || hasProject) && (thought.powerfulScore || 0) >= 60) {
    return [{
      type: 'Worth Sharing',
      explanation: 'Contains valuable insights worth sharing',
      value: 'This thought has valuable insights, learnings, or perspectives that could help others.',
      confidence: 65
    }];
  }
  
  // No recommendation if nothing matches
  return [];
}

