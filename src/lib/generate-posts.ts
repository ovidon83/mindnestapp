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

// Research-backed best practices for viral social media posts
const PLATFORM_GUIDELINES = `
=== LINKEDIN BEST PRACTICES (Research-Backed) ===

STRUCTURE (The "Hook-Story-Insight" Framework):
1. HOOK (First 2 lines - CRITICAL, this is what shows before "see more"):
   - Start with a bold statement, surprising fact, or contrarian take
   - Use pattern interrupts: "I was wrong about...", "Nobody talks about...", "The real reason..."
   - Create curiosity gap - make them NEED to click "see more"
   - Avoid starting with "I" - start with the insight

2. STORY/CONTEXT (The meat - 3-5 short paragraphs):
   - Share a specific personal experience or observation
   - Use concrete details, numbers, timeframes
   - Show vulnerability - failures teach more than successes
   - Build tension or reveal a transformation
   - Each paragraph: 2-3 sentences MAX

3. INSIGHT/LESSON (The payoff):
   - Distill the key learning into actionable wisdom
   - Make it transferable to the reader's situation
   - Use "You" language to connect directly

4. CTA (Engagement driver):
   - End with a question that invites comments
   - Or a bold restatement of the main point
   - Never beg for engagement ("like if you agree")

FORMAT RULES:
- 1,200-1,900 characters optimal (shows fully in feed)
- Single sentences as paragraphs for emphasis
- Use "↓" or line breaks to create visual rhythm
- 3-5 relevant hashtags at the END (not inline)
- No emojis in professional content (or very sparingly)

VIRAL TRIGGERS:
- Contrarian takes on common beliefs
- Personal failures/lessons learned
- Behind-the-scenes insights
- Data or specific numbers
- "Here's what I learned" frameworks

=== TWITTER/X BEST PRACTICES ===

STRUCTURE:
- Lead with the punchline, not the setup
- Every word must earn its place
- Create "screenshot-worthy" moments
- Hot takes > lukewarm observations

FORMAT RULES:
- Under 280 characters for single tweets
- Use line breaks for rhythm
- 1-2 emojis max (if any)
- No hashtags (they reduce engagement on X)
- End with a twist or reframe

VIRAL TRIGGERS:
- Counterintuitive insights
- Relatable observations
- Strong opinions stated simply
- "Unpopular opinion:" format
- Specific > generic always

=== INSTAGRAM BEST PRACTICES ===

STRUCTURE:
1. HOOK (First line - shows in preview):
   - Emotional or intriguing opening
   - Personal and relatable
   - "The moment I realized..." "What nobody tells you about..."

2. STORY (Body - 150-300 words):
   - More personal/emotional than LinkedIn
   - Conversational, like talking to a friend
   - Share the messy middle, not just the polished result
   - Be vulnerable and authentic

3. CTA + HASHTAGS:
   - Invite engagement naturally
   - 5-10 relevant hashtags (mix of popular and niche)
   - Hashtags on separate line at end

FORMAT RULES:
- Line breaks between paragraphs (crucial for readability)
- Can use emojis to add personality
- 150-300 words optimal
- More casual/conversational than LinkedIn
`;

export async function generatePostDrafts(
  thought: Thought,
  userProfile?: UserProfile | null,
  previousThoughts?: Thought[],
  userFeedback?: string,
  currentDrafts?: { linkedin?: string; twitter?: string; instagram?: string }
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
      userContext = `
USER PROFILE (Write in their voice):
- Name: ${userProfile.name || 'Not specified'}
- Role: ${userProfile.role || 'Not specified'}
- Industry: ${userProfile.industry || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'None'}
- Expertise: ${userProfile.domains?.join(', ') || 'None'}
- Goals: ${userProfile.goals?.join(', ') || 'None'}
- Communication Style: ${userProfile.communicationStyle || 'Not specified'}
- Preferred Tone: ${userProfile.preferredTone || 'Not specified'}
`;
    }

    // Build context from previous thoughts
    let thoughtsContext = '';
    if (previousThoughts && previousThoughts.length > 0) {
      thoughtsContext = `
USER'S VOICE (Match this style and perspective):
${previousThoughts.slice(0, 5).map((t, i) => `${i + 1}. "${t.originalText}"`).join('\n')}
`;
    }

    // Build retry context
    let retryContext = '';
    if (currentDrafts && (currentDrafts.linkedin || currentDrafts.twitter || currentDrafts.instagram)) {
      retryContext = `
=== CURRENT DRAFTS (User may have edited - preserve their direction) ===
LinkedIn: ${currentDrafts.linkedin || 'None'}
Twitter: ${currentDrafts.twitter || 'None'}  
Instagram: ${currentDrafts.instagram || 'None'}

IMPORTANT: If the user edited these drafts, incorporate their changes and style preferences. Build upon what they've written.
`;
    }

    let feedbackContext = '';
    if (userFeedback) {
      feedbackContext = `
=== USER FEEDBACK (PRIORITY - Apply this) ===
"${userFeedback}"

Apply this feedback to improve ALL drafts. This is what the user wants changed.
`;
    }

    const systemPrompt = `You are an elite social media ghostwriter who has written viral posts for thought leaders. Your posts get millions of views because you understand the psychology of shareability.

${PLATFORM_GUIDELINES}

${userContext}
${thoughtsContext}

=== YOUR TASK ===
Transform the user's raw thought into 3 platform-optimized posts that will perform exceptionally well.

CRITICAL RULES:
1. NEVER write generic motivational content
2. ALWAYS use specific details, numbers, or examples
3. The hook MUST create curiosity or challenge assumptions
4. Show, don't tell - use stories over statements
5. Write like a human, not a brand
6. Each post should feel native to its platform
7. LinkedIn: Professional storytelling (1,200-1,900 chars)
8. Twitter: Punchy insight (under 280 chars)
9. Instagram: Personal, relatable story (150-300 words)

FORMAT YOUR RESPONSE AS JSON:
{
  "linkedin": "Full post with \\n\\n between paragraphs",
  "twitter": "Single punchy tweet under 280 chars",
  "instagram": "Personal story with \\n\\n between paragraphs"
}

Use \\n\\n for paragraph breaks. This is CRITICAL for readability.`;

    const userPrompt = `RAW THOUGHT TO TRANSFORM:
"${thought.originalText}"

Summary: ${thought.summary || 'None'}
Tags: ${thought.tags?.join(', ') || 'None'}

${retryContext}
${feedbackContext}

Generate 3 viral-worthy posts. Remember:
- LinkedIn hook must work in 2 lines (before "see more")
- Twitter must be under 280 characters
- Instagram should feel personal and relatable
- Use \\n\\n for paragraph breaks in LinkedIn and Instagram`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 3000,
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
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            linkedin: parsed.linkedin || 'Failed to generate LinkedIn post.',
            twitter: parsed.twitter || 'Failed to generate Twitter post.',
            instagram: parsed.instagram || 'Failed to generate Instagram post.',
          };
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Try to extract posts manually
          const linkedinMatch = content.match(/linkedin["\s:]+"([^"]+)"/i);
          const twitterMatch = content.match(/twitter["\s:]+"([^"]+)"/i);
          const instagramMatch = content.match(/instagram["\s:]+"([^"]+)"/i);
          
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

// Generate a shared image prompt that works well for both LinkedIn and Instagram
export async function generateSharedImagePrompt(
  linkedinContent: string,
  instagramContent: string,
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
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a visual storytelling expert. Create a DALL-E 3 prompt for an image that will make people stop scrolling.

The image should:
- Capture the EMOTION and ESSENCE of the post (not literal illustration)
- Be visually striking with strong composition
- Work for both LinkedIn (professional) and Instagram (personal)
- Use metaphor, symbolism, or abstract representation
- NO text overlays (DALL-E renders text poorly)
- Be shareable and memorable

Style guidelines:
- Cinematic lighting and composition
- Rich, cohesive color palette
- Professional photography or artistic illustration style
- Evocative and thought-provoking

Return ONLY the prompt text (max 400 chars), no explanations.`
          },
          {
            role: 'user',
            content: `Post essence:\nLinkedIn: ${linkedinContent.slice(0, 500)}\nInstagram: ${instagramContent.slice(0, 500)}\n\nCreate an image prompt that captures the emotional core of this message:`
          }
        ],
        temperature: 0.8,
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

    const validation = validateDallePrompt(prompt);
    if (!validation.valid) {
      throw new Error(`Invalid prompt: ${validation.error}`);
    }

    return prompt;
  } catch (error) {
    console.error('Error generating shared image prompt:', error);
    throw error;
  }
}

// Generate a shared image for both LinkedIn and Instagram posts
export async function generatePostImage(
  linkedinContent: string,
  instagramContent: string,
  thoughtText: string
): Promise<{ imageUrl: string; imagePrompt: string }> {
  if (!OPENAI_API_KEY) {
    throw new Error('AI image generation requires API key configuration.');
  }

  const imagePrompt = await generateSharedImagePrompt(linkedinContent, instagramContent, thoughtText);
  const imageUrl = await generateInstagramImage(imagePrompt);

  return {
    imageUrl,
    imagePrompt,
  };
}
