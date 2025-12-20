import { Entry } from '../types';
import { fetchWithRetry } from './api-utils';

// NOTE: This file was partially overwritten. Some functions may need to be restored.
// The following are minimal implementations to prevent app crashes.

// Optimized: Combined categorization and AI analysis in single API call
export async function processThought(
  rawInput: string, 
  _entryType?: 'thought' | 'journal', 
  captureType?: 'todo' | 'insight' | 'journal'
): Promise<Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Try OpenAI API first if available
  if (apiKey) {
    try {
      // Combined call: categorization + AI hint/score in one request
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
              content: `Categorize and analyze the input. Return ONLY a JSON object:
{
  "type": "todo" | "insight" | "journal",
  "tags": ["work" | "soccer" | "family" | "spirituality" | "business" | "tech" | "health" | "other"],
  "summary": "one short sentence summarizing the thought",
  "nextStep": "one short action item (only if type is todo, otherwise null)",
  "aiHint": "subtle AI hint (1-2 sentences, reflective not prescriptive)",
  "postingScore": number (0-100, higher for shareable insights/learnings)
}`
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
            const type = (parsed.type === 'todo' || parsed.type === 'insight' || parsed.type === 'journal') 
              ? parsed.type 
              : (captureType || 'insight');
            
            const postingScore = typeof parsed.postingScore === 'number' ? parsed.postingScore : 0;
            const aiHint = parsed.aiHint || 'Observation';
            
            return {
              type,
              originalText: rawInput,
              tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
              summary: parsed.summary || rawInput.substring(0, 100),
              nextStep: type === 'todo' ? (parsed.nextStep || null) : undefined,
              postRecommendation: false,
              aiHint,
              postingScore,
              inShareIt: postingScore >= 60,
            };
          }
        }
      }
    } catch (error) {
      console.error('Error processing thought with AI:', error);
    }
  }
  
  // Fallback: basic entry structure (no API call)
  const fallbackType = captureType || 'insight';
  
  return {
    type: fallbackType,
    originalText: rawInput,
    tags: [],
    summary: rawInput.substring(0, 100),
    postRecommendation: false,
    aiHint: 'Observation',
    postingScore: 0,
    inShareIt: false,
  };
}

export async function generateNextStep(text: string, summary?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return 'Consider next steps';
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
            content: 'Generate a specific, actionable next step based on the thought. Keep it to one short sentence. Be practical and direct.'
          },
          {
            role: 'user',
            content: `Thought: ${text}\n${summary ? `Summary: ${summary}` : ''}\n\nGenerate a specific next step:`
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    }, { maxRetries: 1, baseDelay: 1000 });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      if (content) {
        return content;
      }
    }
  } catch (error) {
    console.error('Error generating next step:', error);
  }

  return 'Consider next steps';
}

export async function generateAIHintAndScore(text: string, type: string, summary?: string): Promise<{ aiHint: string; postingScore: number }> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      aiHint: 'Observation',
      postingScore: 0,
    };
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
            content: `Generate a single, subtle AI hint (1-2 sentences) and a posting score (0-100) for this thought.
            
For hints: Be reflective, not prescriptive. Examples: "This topic keeps coming up.", "Might be worth sharing.", "Personal reflection.", "No action needed."
For scores: Higher if the thought has sharing potential (insights, learnings, observations). Lower for personal todos or private thoughts.

Return JSON: {"aiHint": "hint text", "postingScore": number}`
          },
          {
            role: 'user',
            content: `Type: ${type}\nThought: ${text}\n${summary ? `Summary: ${summary}` : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    }, { maxRetries: 1, baseDelay: 1000 });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            aiHint: parsed.aiHint || 'Observation',
            postingScore: parsed.postingScore || 0,
          };
        }
      }
    }
  } catch (error) {
    console.error('Error generating AI hint and score:', error);
  }

  return {
    aiHint: 'Observation',
    postingScore: 0,
  };
}

export async function findNextPostWorthyInsight(_entries: Entry[], _existingPostEntryIds: Set<string>): Promise<any> {
  return null;
}

export async function analyzeEntryForPost(entry: Entry, options?: any, forceGeneration?: boolean): Promise<any> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      shouldPost: false,
      viralityScore: 0,
      draftContent: '',
      twitterContent: '',
      instagramContent: '',
      instagramImagePrompt: '',
      instagramImageUrl: '',
    };
  }

  // If no options provided, generate everything. Otherwise respect the options.
  const generateLinkedIn = options === undefined ? true : (options.generateLinkedIn !== false);
  const generateTwitter = options === undefined ? true : (options.generateTwitter !== false);
  const generateInstagram = options === undefined ? true : (options.generateInstagram !== false);

  try {
    // Generate LinkedIn draft (main post content)
    let draftContent = '';
    let viralityScore = 0;
    
    if (generateLinkedIn || !options) {
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
              content: `You are a LinkedIn content creator. Transform this thought into a compelling LinkedIn post.

Rules:
- Write in first person, authentic voice
- Start with a hook or insight
- Include the core idea clearly
- Add value or actionable takeaway
- Keep it engaging and professional
- Length: 200-400 words
- Return ONLY the post content, no JSON, no explanations`
            },
            {
              role: 'user',
              content: `Thought: ${entry.originalText}\n${entry.summary ? `Summary: ${entry.summary}` : ''}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      }, { maxRetries: 2, baseDelay: 1000 });

      if (response.ok) {
        const data = await response.json();
        draftContent = data.choices[0]?.message?.content?.trim() || '';
        
        // Calculate virality score (0-100) based on content characteristics
        viralityScore = Math.min(100, Math.max(0, 
          (draftContent.length > 200 ? 20 : 0) +
          (entry.postingScore || 0) * 0.6 +
          (draftContent.includes('?') ? 10 : 0) +
          (draftContent.includes('!') ? 10 : 0) +
          (entry.tags?.length || 0) * 5
        ));
      }
    }

    // Generate Twitter/X content
    let twitterContent = '';
    if (generateTwitter) {
      const twitterResponse = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
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
              content: 'Transform this into a Twitter/X post. Keep it under 280 characters. Be punchy and engaging. Return ONLY the tweet text, no JSON.'
            },
            {
              role: 'user',
              content: draftContent || entry.originalText
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      }, { maxRetries: 1, baseDelay: 1000 });

      if (twitterResponse.ok) {
        const twitterData = await twitterResponse.json();
        twitterContent = twitterData.choices[0]?.message?.content?.trim() || '';
      }
    }

    // Generate Instagram content
    let instagramContent = '';
    let instagramImagePrompt = '';
    if (generateInstagram) {
      try {
        const instagramResponse = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
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
                content: `Generate Instagram post content and image prompt. Return ONLY valid JSON:
{
  "caption": "Instagram caption (engaging, 100-200 words)",
  "imagePrompt": "DALL-E image generation prompt (vivid, visual, descriptive)"
}`
              },
              {
                role: 'user',
                content: draftContent || entry.originalText
              }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        }, { maxRetries: 2, baseDelay: 1000 });

        if (instagramResponse.ok) {
          const instagramData = await instagramResponse.json();
          const instagramText = instagramData.choices[0]?.message?.content?.trim() || '';
          
          // Try to extract JSON from response
          const jsonMatch = instagramText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              instagramContent = parsed.caption || parsed.Caption || '';
              instagramImagePrompt = parsed.imagePrompt || parsed.ImagePrompt || '';
            } catch (parseError) {
              console.error('Error parsing Instagram JSON:', parseError, 'Response:', instagramText);
              // Fallback: use the text as caption if JSON parsing fails
              instagramContent = instagramText.substring(0, 500);
            }
          } else {
            // If no JSON found, use the response as caption
            console.warn('No JSON found in Instagram response, using text as caption');
            instagramContent = instagramText.substring(0, 500);
          }
        } else {
          const errorData = await instagramResponse.json().catch(() => ({}));
          console.error('Instagram API error:', instagramResponse.status, errorData);
        }
      } catch (error) {
        console.error('Error generating Instagram content:', error);
        // Continue without Instagram content rather than failing completely
      }
    }

    return {
      shouldPost: viralityScore >= 50,
      viralityScore,
      draftContent,
      twitterContent,
      instagramContent,
      instagramImagePrompt,
      instagramImageUrl: '', // Would be generated separately if needed
    };
  } catch (error) {
    console.error('Error analyzing entry for post:', error);
    return {
      shouldPost: false,
      viralityScore: 0,
      draftContent: '',
      twitterContent: '',
      instagramContent: '',
      instagramImagePrompt: '',
      instagramImageUrl: '',
    };
  }
}

export async function generateTwitterPost(_content: string): Promise<string> {
  return '';
}

export async function generateInstagramPost(_content: string): Promise<string> {
  return '';
}

export async function generateInstagramImagePrompt(_content: string): Promise<string> {
  return '';
}

export async function generateInstagramImage(_prompt: string): Promise<string> {
  return '';
}

// Generate reflective observations for Companion view
export async function generateCompanionObservations(entries: Entry[]): Promise<string[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || entries.length === 0) {
    return [];
  }

  try {
    // Prepare entry summaries for analysis
    const entrySummaries = entries.slice(0, 50).map(entry => ({
      text: entry.originalText.substring(0, 200),
      type: entry.type,
      createdAt: entry.createdAt.toISOString().split('T')[0],
      tags: entry.tags,
      summary: entry.summary
    }));

    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a quiet observer. Analyze the user's thoughts over time and generate up to 5 short, reflective observations.

Rules:
- Observations are REFLECTIVE, not prescriptive
- NO advice, commands, or suggestions
- NO scores, metrics, or AI mentions
- NO "you should" or "consider" language
- Keep each observation to 1-2 sentences
- Focus on patterns, themes, and quiet insights
- Write in third person or neutral voice
- Be calm, gentle, and non-intrusive

Return ONLY a JSON array of observation strings, like:
["observation 1", "observation 2", ...]

Maximum 5 observations.`
          },
          {
            role: 'user',
            content: `Here are the user's thoughts over time:\n\n${JSON.stringify(entrySummaries, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    }, { maxRetries: 1, baseDelay: 1000 });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) {
        // Try to parse JSON array
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const observations = JSON.parse(jsonMatch[0]);
          return Array.isArray(observations) ? observations.slice(0, 5) : [];
        }
      }
    }
  } catch (error) {
    console.error('Error generating companion observations:', error);
  }

  return [];
}
