import { Thought, PotentialType } from '../types';
import { fetchWithRetry } from './api-utils';

// Generate best potential for a thought when spark is added
export async function generateBestPotential(thought: Thought): Promise<PotentialType> {
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
              content: `Determine the single best potential for this thought. Return ONLY a JSON object:
              {
                "bestPotential": "Share" | "To-Do" | "Insight"
              }
              
              Rules:
              - "Share" if it's an insight, learning, observation, or something worth sharing publicly on social media
              - "To-Do" if it contains clear action items, tasks, or things that need to be done
              - "Insight" if it's a reflection, question, discussion topic, or needs exploration/dialogue (can be short-form or long-form like a journal entry)`
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
            const bestPotentialMap: Record<string, PotentialType> = {
              'Share': 'Share',
              'To-Do': 'Do',
              'ToDo': 'Do',
              'Insight': 'Just a thought',
              'Conversation': 'Just a thought',
            };
            return bestPotentialMap[parsed.bestPotential] || 'Share';
          }
        }
      }
    } catch (error) {
      console.error('Error generating best potential:', error);
    }
  }
  
  // Fallback: use heuristics
  const lowerText = thought.originalText.toLowerCase();
  const hasActionWords = /\b(need to|should|must|do|create|build|make|call|meet|schedule|plan)\b/i.test(thought.originalText);
  const hasQuestion = /\?/.test(thought.originalText) || /\b(how|what|why|when|where|who)\b/i.test(thought.originalText);
  const hasInsight = /\b(learned|realized|discovered|insight|understand|think|believe|wonder|reflect)\b/i.test(thought.originalText);
  
  if (hasActionWords && !hasQuestion) {
    return 'Do';
  } else if (hasQuestion || /\b(discuss|talk|explore|wonder|reflect|journal)\b/i.test(thought.originalText)) {
    return 'Just a thought';
  } else {
    return 'Share'; // Default for insights worth sharing
  }
}

