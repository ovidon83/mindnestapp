import { Thought } from '../types';
import { fetchWithRetry } from './api-utils';

// Generate best action for a thought when spark is added
export async function generateBestAction(thought: Thought): Promise<'Share' | 'To-Do' | 'Conversation'> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (apiKey) {
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
              content: `Determine the single best action for this thought. Return ONLY a JSON object:
              {
                "bestAction": "Share" | "To-Do" | "Conversation"
              }
              
              Rules:
              - "Share" if it's an insight, learning, observation, or something worth sharing publicly
              - "To-Do" if it contains clear action items, tasks, or things that need to be done
              - "Conversation" if it's a question, discussion topic, or needs exploration/dialogue`
            },
            {
              role: 'user',
              content: thought.originalText
            }
          ],
          temperature: 0.3,
          max_tokens: 50
        })
      }, { maxRetries: 2, baseDelay: 1000 });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const bestActionMap: Record<string, 'Share' | 'To-Do' | 'Conversation'> = {
              'Share': 'Share',
              'To-Do': 'To-Do',
              'ToDo': 'To-Do',
              'Conversation': 'Conversation',
            };
            return bestActionMap[parsed.bestAction] || 'Share';
          }
        }
      }
    } catch (error) {
      console.error('Error generating best action:', error);
    }
  }
  
  // Fallback: use heuristics
  const lowerText = thought.originalText.toLowerCase();
  const hasActionWords = /\b(need to|should|must|do|create|build|make|call|meet|schedule|plan)\b/i.test(thought.originalText);
  const hasQuestion = /\?/.test(thought.originalText) || /\b(how|what|why|when|where|who)\b/i.test(thought.originalText);
  const hasInsight = /\b(learned|realized|discovered|insight|understand|think|believe)\b/i.test(thought.originalText);
  
  if (hasActionWords && !hasQuestion) {
    return 'To-Do';
  } else if (hasQuestion || /\b(discuss|talk|explore|wonder)\b/i.test(thought.originalText)) {
    return 'Conversation';
  } else {
    return 'Share'; // Default for insights
  }
}

