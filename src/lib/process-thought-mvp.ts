import { Thought, Potential, PotentialType } from '../types';
import { fetchWithRetry } from './api-utils';

// Process a raw thought and detect if it's a Spark, suggest Potentials
export async function processThoughtMVP(
  rawInput: string
): Promise<Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Try OpenAI API first if available
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
              content: `Analyze the thought and determine if it's a Spark (significant: recurring, clear problem, strong opinion, or clarity). 
              If it's a Spark, suggest 2-3 Potentials (Post, Conversation, Explore Further, Email, Article, Project).
              Return ONLY a JSON object:
              {
                "isSpark": boolean (true if recurring, clear problem, strong opinion, or clarity),
                "summary": "one short sentence summarizing the thought",
                "tags": ["work" | "soccer" | "family" | "spirituality" | "business" | "tech" | "health" | "other"],
                "potentials": [
                  {
                    "type": "Post" | "Conversation" | "Explore Further" | "Email" | "Article" | "Project",
                    "title": "short title for this potential",
                    "description": "brief description (optional)"
                  }
                ] // Max 2-3 potentials, only if isSpark is true
              }
              
              Spark indicators:
              - Recurring: mentions patterns, habits, "always", "often", "every time"
              - Clear problem: identifies a specific issue or challenge
              - Strong opinion: clear stance or conviction
              - Clarity: well-formed insight or realization
              
              Only suggest Potentials if isSpark is true. Limit to 2-3 most relevant.`
            },
            {
              role: 'user',
              content: rawInput
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      }, { maxRetries: 2, baseDelay: 1000 });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Process potentials - limit to 2-3
            const potentials: Potential[] = (parsed.potentials || [])
              .slice(0, 3)
              .map((p: any) => ({
                id: crypto.randomUUID(),
                type: (p.type as PotentialType) || 'Post',
                title: p.title || p.type,
                description: p.description,
                createdAt: new Date(),
              }));
            
            return {
              originalText: rawInput,
              tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
              summary: parsed.summary || rawInput.substring(0, 100),
              isSpark: parsed.isSpark === true,
              potentials: parsed.isSpark ? potentials : [],
            };
          }
        }
      }
    } catch (error) {
      console.error('Error processing thought with AI:', error);
    }
  }
  
  // Fallback: basic heuristics
  const lowerText = rawInput.toLowerCase();
  const isRecurring = /\b(always|often|usually|every time|pattern|habit|routine)\b/i.test(rawInput);
  const hasProblem = /\b(problem|issue|challenge|difficulty|struggle|need to fix)\b/i.test(rawInput);
  const hasOpinion = /\b(think|believe|opinion|should|must|important|critical)\b/i.test(rawInput);
  const hasClarity = /\b(realized|learned|discovered|insight|understand|clear|obvious)\b/i.test(rawInput);
  const isSpark = isRecurring || hasProblem || (hasOpinion && hasClarity);
  
  // Basic potential suggestions for sparks
  const potentials: Potential[] = isSpark ? [
    {
      id: crypto.randomUUID(),
      type: 'Post',
      title: 'Share as post',
      createdAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      type: 'Explore Further',
      title: 'Explore this idea',
      createdAt: new Date(),
    },
  ] : [];
  
  return {
    originalText: rawInput,
    tags: [],
    summary: rawInput.substring(0, 100),
    isSpark,
    potentials,
  };
}

