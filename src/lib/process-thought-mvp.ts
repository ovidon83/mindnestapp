import { Thought, PotentialType } from '../types';
import { fetchWithRetry } from './api-utils';
import { generateExploreRecommendations } from './generate-explore-recommendations';

// Process a raw thought and detect if it's a Spark, suggest Potential
// Spark = interesting/valuable thought (can be Share, To-Do, or Insight)
// Non-Spark = regular thought (can be To-Do or Insight, but NOT Share)
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
              content: `Analyze the thought and determine:
1. If it's a Spark (interesting, valuable, insightful, or worth sharing)
2. The best Potential (Share, To-Do, Insight, or Just a thought)

Return ONLY a JSON object:
{
  "isSpark": boolean (true if interesting, valuable, insightful, or worth sharing),
  "summary": "one short sentence summarizing the thought",
  "tags": ["work" | "soccer" | "family" | "spirituality" | "business" | "tech" | "health" | "other"],
  "bestPotential": "Share" | "To-Do" | "Insight" | "Just a thought" | null
}

Rules:
- Spark = interesting, valuable, insightful, shareable, or has strong opinions/learnings
- Non-Spark = simple tasks, reminders, basic notes
- If Spark: can be Share, To-Do, Insight, or Just a thought
- If Non-Spark: can be To-Do, Insight, or Just a thought (NOT Share)
- "Share" = insight, learning, observation worth sharing publicly (only for Sparks)
- "To-Do" = contains clear action items, tasks, or things to do
- "Insight" = reflection, question, discussion topic, or needs exploration
- "Just a thought" = simple note, observation, or thought that doesn't fit other categories (default if unclear)

Determine bestPotential based on the thought:
- If Spark and shareable/insightful → "Share"
- If has action items/tasks → "To-Do"
- If question/reflection/discussion → "Insight"
- If none of the above or unclear → "Just a thought"`
            },
            {
              role: 'user',
              content: rawInput
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      }, { maxRetries: 2, baseDelay: 1000 });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Map bestPotential from AI response
            const bestPotentialMap: Record<string, PotentialType> = {
              'Share': 'Share',
              'To-Do': 'Do',
              'ToDo': 'Do',
              'Insight': 'Just a thought',
              'Just a thought': 'Just a thought',
              'Just a Thought': 'Just a thought',
            };
            let bestPotential: PotentialType | null = null;
            
            if (parsed.bestPotential) {
              bestPotential = bestPotentialMap[parsed.bestPotential] || null;
            }
            
            // Enforce rule: Non-Spark cannot be Share
            if (!parsed.isSpark && bestPotential === 'Share') {
              // Convert Share to "Just a thought" for non-sparks
              bestPotential = 'Just a thought';
            }
            
            // Fallback: use heuristics if AI didn't provide potential
            if (!bestPotential && parsed.isSpark) {
              const lowerText = rawInput.toLowerCase();
              const hasActionWords = /\b(need to|should|must|do|create|build|make|call|meet|schedule|plan)\b/i.test(rawInput);
              const hasQuestion = /\?/.test(rawInput) || /\b(how|what|why|when|where|who)\b/i.test(rawInput);
              const hasInsight = /\b(learned|realized|discovered|insight|understand|think|believe)\b/i.test(rawInput);
              
              if (hasActionWords && !hasQuestion) {
                bestPotential = 'Do';
              } else if (hasQuestion || /\b(discuss|talk|explore|wonder|reflect|journal)\b/i.test(rawInput)) {
                bestPotential = 'Just a thought';
              } else if (hasInsight) {
                bestPotential = 'Share';
              }
            }
            
            // Default to "Just a thought" if no potential determined
            if (!bestPotential) {
              bestPotential = 'Just a thought';
            }
            
            const processedThought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'> = {
              originalText: rawInput,
              tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
              summary: parsed.summary || rawInput.substring(0, 100),
              isSpark: parsed.isSpark === true,
              isParked: false,
              isPowerful: false,
              bestPotential: bestPotential,
              potential: bestPotential, // Also set potential to the same value by default
            };

            // Generate explore recommendations asynchronously (don't block saving)
            // This will be saved with the thought
            try {
              console.log('Generating explore recommendations for thought...');
              const recommendations = await generateExploreRecommendations(processedThought as Thought);
              console.log('Generated recommendations:', recommendations);
              if (recommendations.length > 0) {
                processedThought.exploreRecommendations = recommendations;
                console.log('Added recommendations to thought:', processedThought.exploreRecommendations);
              } else {
                console.log('No recommendations generated');
              }
            } catch (error) {
              console.error('Error generating explore recommendations:', error);
              // Don't fail the whole operation if recommendations fail
            }

            return processedThought;
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
  const hasInsight = /\b(learned|realized|discovered|insight|understand|think|believe|wonder|reflect)\b/i.test(rawInput);
  const isSpark = isRecurring || hasProblem || (hasOpinion && hasClarity) || hasInsight;
  
  // Determine best potential from heuristics
  const hasActionWords = /\b(need to|should|must|do|create|build|make|call|meet|schedule|plan)\b/i.test(rawInput);
  const hasQuestion = /\?/.test(rawInput) || /\b(how|what|why|when|where|who)\b/i.test(rawInput);
  
  let bestPotential: PotentialType | null = null;
  if (isSpark) {
    if (hasActionWords && !hasQuestion) {
      bestPotential = 'Do';
    } else if (hasQuestion || /\b(discuss|talk|explore|wonder|reflect|journal)\b/i.test(rawInput)) {
      bestPotential = 'Just a thought';
    } else if (hasInsight) {
      bestPotential = 'Share';
    }
  } else {
    // Non-spark: can only be Do, Just a thought
    if (hasActionWords && !hasQuestion) {
      bestPotential = 'Do';
    } else if (hasQuestion || /\b(discuss|talk|explore|wonder|reflect|journal)\b/i.test(rawInput)) {
      bestPotential = 'Just a thought';
    }
  }
  
  // Default to "Just a thought" if no potential determined
  if (!bestPotential) {
    bestPotential = 'Just a thought';
  }
  
  const fallbackThought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'> = {
    originalText: rawInput,
    tags: [],
    summary: rawInput.substring(0, 100),
    isSpark,
    isParked: false,
    isPowerful: false,
    bestPotential: bestPotential,
    potential: bestPotential, // Also set potential to the same value by default
  };

  // Generate explore recommendations asynchronously (don't block saving)
  // This will be saved with the thought
  try {
    console.log('Generating explore recommendations for fallback thought...');
    const recommendations = await generateExploreRecommendations(fallbackThought as Thought);
    console.log('Generated recommendations (fallback):', recommendations);
    if (recommendations.length > 0) {
      fallbackThought.exploreRecommendations = recommendations;
      console.log('Added recommendations to fallback thought:', fallbackThought.exploreRecommendations);
    } else {
      console.log('No recommendations generated (fallback)');
    }
  } catch (error) {
    console.error('Error generating explore recommendations (fallback):', error);
    // Don't fail the whole operation if recommendations fail
  }

  return fallbackThought;
}
