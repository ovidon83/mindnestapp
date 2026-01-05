import { Thought, UserProfile } from '../types';
import { fetchUserProfile } from './db';
import { fetchThoughts } from './thoughts-db';
import { generateInstagramImage } from './ai';
import { validateDallePrompt } from './api-utils';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface PostDrafts {
  linkedin: string;
  twitter: string;
  instagram: string;
}

export async function generatePostDrafts(
  thought: Thought,
  userProfile?: UserProfile | null,
  previousThoughts?: Thought[],
  userFeedback?: string
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

FORMATTING REQUIREMENTS (CRITICAL - MUST FOLLOW):
- Use line breaks (\\n) to separate paragraphs - NEVER write as one continuous block of text
- Each section (Hook, Insight, Takeaway) should be separated by a blank line (\\n\\n)
- Keep paragraphs short (2-4 sentences max per paragraph)
- Use line breaks for readability - break up long thoughts into digestible chunks
- Hashtags should be on their own line at the end, separated by a blank line

QUALITY REQUIREMENTS:
- Be sharp, honest, and real - no fluff or corporate speak
- Use specific examples, not vague statements
- Write in the user's authentic voice (match their communication style)
- Make it shareable - people should want to save or share this
- Add value beyond the original thought - expand, deepen, or reframe it

PLATFORM SPECIFICS:
- LinkedIn: 200-400 words. Professional but human. MUST use line breaks between paragraphs (\\n\\n). Each paragraph should be 2-4 sentences. Include relevant hashtags (2-3 max) on a separate line at the end.
- Twitter/X: Under 280 characters. Punchy, conversational. Can use 1-2 emojis. Make every word count. Use line breaks if needed for readability.
- Instagram: 100-200 words. Authentic, personal, visually descriptive. Can be more casual and emotional. MUST use line breaks between paragraphs (\\n\\n). Each paragraph should be 2-4 sentences. Include 3-5 relevant hashtags on a separate line at the end.

IMPORTANT: Format your response with proper line breaks. Use \\n\\n to separate paragraphs. Do NOT write as one continuous block of text.

Return ONLY a JSON object with this exact structure:
{
  "linkedin": "Post content with proper line breaks (\\n\\n) between paragraphs",
  "twitter": "Post content (under 280 chars) with line breaks if needed",
  "instagram": "Post content with proper line breaks (\\n\\n) between paragraphs"
}

Example format for LinkedIn/Instagram:
"First paragraph with hook.\\n\\nSecond paragraph with insight.\\n\\nThird paragraph with takeaway.\\n\\n#hashtag1 #hashtag2"
`,
          },
          {
            role: 'user',
            content: `Raw Thought: "${thought.originalText}"\n\nSummary: ${thought.summary}\n\nTags: ${thought.tags.join(', ')}${userFeedback ? `\n\nUser Feedback: ${userFeedback}` : ''}`,
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

// Generate image prompt for LinkedIn post
export async function generateLinkedInImagePrompt(
  postContent: string,
  thoughtText: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('AI image generation requires API key configuration.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate a DALL-E 3 image prompt for a LinkedIn post. The image should be professional, visually engaging, and complement the post content.

Requirements:
- Professional and appropriate for LinkedIn (business/professional context)
- Visually striking and shareable
- Relevant to the post's main message
- Avoid text overlays (DALL-E doesn't render text well)
- Focus on concepts, metaphors, or visual representations
- Keep it descriptive and vivid
- Maximum 4000 characters

Return ONLY the image prompt text, no JSON, no explanations.`
          },
          {
            role: 'user',
            content: `Post Content:\n${postContent}\n\nOriginal Thought: ${thoughtText}\n\nGenerate a professional, visually engaging image prompt for this LinkedIn post:`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const prompt = data.choices[0]?.message?.content?.trim();
    
    if (!prompt) {
      throw new Error('Failed to generate image prompt');
    }

    // Validate the prompt
    const validation = validateDallePrompt(prompt);
    if (!validation.valid) {
      throw new Error(`Invalid prompt: ${validation.error}`);
    }

    return prompt;
  } catch (error) {
    console.error('Error generating LinkedIn image prompt:', error);
    throw error;
  }
}

// Generate image prompt for Instagram post
export async function generateInstagramImagePrompt(
  postContent: string,
  thoughtText: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('AI image generation requires API key configuration.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate a DALL-E 3 image prompt for an Instagram post. The image should be visually striking, authentic, and engaging.

Requirements:
- Visually striking and shareable
- Authentic and personal feel
- Relevant to the post's main message
- Avoid text overlays (DALL-E doesn't render text well)
- Focus on concepts, metaphors, or visual representations
- Can be more creative and artistic than LinkedIn
- Keep it descriptive and vivid
- Maximum 4000 characters

Return ONLY the image prompt text, no JSON, no explanations.`
          },
          {
            role: 'user',
            content: `Post Content:\n${postContent}\n\nOriginal Thought: ${thoughtText}\n\nGenerate a visually engaging image prompt for this Instagram post:`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const prompt = data.choices[0]?.message?.content?.trim();
    
    if (!prompt) {
      throw new Error('Failed to generate image prompt');
    }

    // Validate the prompt
    const validation = validateDallePrompt(prompt);
    if (!validation.valid) {
      throw new Error(`Invalid prompt: ${validation.error}`);
    }

    return prompt;
  } catch (error) {
    console.error('Error generating Instagram image prompt:', error);
    throw error;
  }
}

// Generate image for a platform (LinkedIn or Instagram)
export async function generatePostImage(
  platform: 'linkedin' | 'instagram',
  postContent: string,
  thoughtText: string
): Promise<{ imageUrl: string; imagePrompt: string }> {
  if (!OPENAI_API_KEY) {
    throw new Error('AI image generation requires API key configuration.');
  }

  // Generate the image prompt
  const imagePrompt = platform === 'linkedin'
    ? await generateLinkedInImagePrompt(postContent, thoughtText)
    : await generateInstagramImagePrompt(postContent, thoughtText);

  // Generate the image using DALL-E 3
  const imageUrl = await generateInstagramImage(imagePrompt);

  return {
    imageUrl,
    imagePrompt,
  };
}
