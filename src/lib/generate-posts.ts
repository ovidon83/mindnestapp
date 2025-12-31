import { Thought } from '../types';
import { fetchUserProfile, UserProfile } from './db';
import { fetchThoughts } from './thoughts-db';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface PostDrafts {
  linkedin: string;
  twitter: string;
  instagram: string;
}

export async function generatePostDrafts(
  thought: Thought,
  userProfile?: UserProfile | null,
  previousThoughts?: Thought[]
): Promise<PostDrafts> {
  if (!OPENAI_API_KEY) {
    return {
      linkedin: 'AI post generation requires API key configuration.',
      twitter: 'AI post generation requires API key configuration.',
      instagram: 'AI post generation requires API key configuration.',
    };
  }

  try {
    // Build context about user
    let userContext = '';
    if (userProfile) {
      userContext = `User Profile:
- Name: ${userProfile.name || 'Not specified'}
- Role: ${userProfile.role || 'Not specified'}
- Industry: ${userProfile.industry || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'None'}
- Expertise: ${userProfile.domains?.join(', ') || 'None'}
- Goals: ${userProfile.goals?.join(', ') || 'None'}
- Communication Style: ${userProfile.communicationStyle || 'Not specified'}
- Preferred Tone: ${userProfile.preferredTone || 'Not specified'}
- Priorities: ${userProfile.priorities || 'Not specified'}
- Additional Context: ${userProfile.context || 'None'}
`;
    }

    // Build context from previous thoughts (last 10)
    let thoughtsContext = '';
    if (previousThoughts && previousThoughts.length > 0) {
      thoughtsContext = `Previous thoughts (to understand user's voice and interests):\n${previousThoughts
        .slice(0, 10)
        .map((t, i) => `${i + 1}. ${t.originalText}`)
        .join('\n')}\n`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert social media content creator. Generate viral, authentic posts based on the user's raw thought.

${userContext ? `User Context:\n${userContext}\n` : ''}
${thoughtsContext ? `User's Previous Thoughts:\n${thoughtsContext}\n` : ''}

CRITICAL POST STRUCTURE (follow this exactly):
1. **Sharp/Honest/Real Hook** - First 1-2 lines that grab attention, challenge assumptions, or state a bold truth
2. **Real Insight (Earned, Not Generic)** - The core insight from the thought, backed by experience or observation. Must be specific, not generic wisdom.
3. **Human Takeaway That Invites Recognition, Not Reaction** - A conclusion that makes readers think "yes, I've felt that" or "that's exactly right" - something that creates connection, not debate.

QUALITY REQUIREMENTS:
- Be sharp, honest, and real - no fluff or corporate speak
- Use specific examples, not vague statements
- Write in the user's authentic voice (match their communication style)
- Make it shareable - people should want to save or share this
- Add value beyond the original thought - expand, deepen, or reframe it
- Use platform-appropriate formatting (line breaks, emojis sparingly)

PLATFORM SPECIFICS:
- LinkedIn: 200-400 words. Professional but human. Can use line breaks for readability. Include relevant hashtags (2-3 max).
- Twitter/X: Under 280 characters. Punchy, conversational. Can use 1-2 emojis. Make every word count.
- Instagram: 100-200 words. Authentic, personal, visually descriptive. Can be more casual and emotional. Use line breaks. Include 3-5 relevant hashtags at the end.

Return ONLY a JSON object with this exact structure:
{
  "linkedin": "Post content following the 3-part structure above",
  "twitter": "Post content following the 3-part structure above (under 280 chars)",
  "instagram": "Post content following the 3-part structure above"
}`,
          },
          {
            role: 'user',
            content: `Raw Thought: "${thought.originalText}"\n\nSummary: ${thought.summary}\n\nTags: ${thought.tags.join(', ')}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Parse JSON - handle newlines properly
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          return {
            linkedin: parsed.linkedin || 'Failed to generate LinkedIn post.',
            twitter: parsed.twitter || 'Failed to generate Twitter post.',
            instagram: parsed.instagram || 'Failed to generate Instagram post.',
          };
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Try to extract posts manually from the content
          const linkedinMatch = content.match(/linkedin["\s:]+"([^"]+)"/i) || content.match(/LinkedIn[:\s]+([^\n]+)/i);
          const twitterMatch = content.match(/twitter["\s:]+"([^"]+)"/i) || content.match(/Twitter[:\s]+([^\n]+)/i);
          const instagramMatch = content.match(/instagram["\s:]+"([^"]+)"/i) || content.match(/Instagram[:\s]+([^\n]+)/i);
          
          return {
            linkedin: linkedinMatch ? linkedinMatch[1] : 'Failed to generate LinkedIn post.',
            twitter: twitterMatch ? twitterMatch[1] : 'Failed to generate Twitter post.',
            instagram: instagramMatch ? instagramMatch[1] : 'Failed to generate Instagram post.',
          };
        }
      }
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('Error generating post drafts:', error);
    return {
      linkedin: `Error generating LinkedIn post: ${error instanceof Error ? error.message : 'Unknown error'}`,
      twitter: `Error generating Twitter post: ${error instanceof Error ? error.message : 'Unknown error'}`,
      instagram: `Error generating Instagram post: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
