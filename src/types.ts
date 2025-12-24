export type AppView = 'capture' | 'thoughts' | 'actions' | 'profile';

export type Tag = 'work' | 'soccer' | 'family' | 'spirituality' | 'business' | 'tech' | 'health' | 'other';

export type PotentialType = 'Post' | 'Conversation' | 'Explore Further' | 'Email' | 'Article' | 'Project';

export interface Potential {
  id: string;
  type: PotentialType;
  title: string;
  description?: string;
  draft?: string; // Draft content for this potential
  createdAt: Date;
}

// Core Thought entity - single top-level entity
export interface Thought {
  id: string;
  originalText: string; // Source of truth - raw text as captured, editable
  tags: Tag[];
  summary: string; // AI-generated summary
  isSpark: boolean; // Whether this thought is marked as a Spark (by AI or user)
  potentials: Potential[]; // Max 2-3 potentials per thought (only if isSpark is true)
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields for backward compatibility during migration
  type?: 'todo' | 'insight' | 'journal';
  entryType?: 'thought' | 'journal';
  category?: 'todo' | 'insight' | 'idea';
}

// Action - separate entity, always linked to a Thought
export interface Action {
  id: string;
  thoughtId: string; // Always linked to original thought
  type: 'post' | 'email' | 'conversation' | 'exploration' | 'article' | 'project';
  title: string;
  content: string; // Draft content (post draft, email draft, etc.)
  completed: boolean; // Whether user marked this action as completed
  createdAt: Date;
  updatedAt: Date;
}

// Legacy Entry type for backward compatibility during migration
export interface Entry {
  id: string;
  type: 'todo' | 'insight' | 'journal';
  originalText: string;
  tags: Tag[];
  summary: string;
  nextStep?: string;
  completed?: boolean;
  postRecommendation: boolean;
  createdAt: Date;
  updatedAt: Date;
  entryType?: 'thought' | 'journal';
  category?: 'todo' | 'insight' | 'idea';
}

export interface TrainingData {
  id: string;
  content: string;
  contentType: 'text' | 'file';
  fileName?: string;
  createdAt: Date;
}

export type PostStatus = 'draft' | 'ready' | 'posted' | 'archived';

export interface Post {
  id: string;
  entryId: string;
  viralityScore: number; // 0-100 (hidden from UI, kept for internal logic)
  draftContent: string; // LinkedIn post
  twitterContent?: string; // Twitter/X post (280 chars max)
  instagramContent?: string; // Instagram caption
  instagramImagePrompt?: string; // Image description/prompt for Instagram
  instagramImageUrl?: string; // DALL-E generated image URL
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  shared?: boolean; // Whether user marked as shared
}

export interface UserProfile {
  id: string;
  userId: string;
  // Personal info
  name?: string;
  role?: string; // Job title, profession
  industry?: string;
  location?: string;
  
  // Interests & domains
  interests?: string[]; // Array of interest tags
  domains?: string[]; // Areas of expertise/knowledge
  
  // Goals & priorities
  goals?: string[]; // Short-term and long-term goals
  priorities?: string; // What matters most to the user
  
  // Communication & style preferences
  communicationStyle?: 'concise' | 'detailed' | 'balanced';
  preferredTone?: 'professional' | 'casual' | 'friendly' | 'analytical';
  
  // Work & productivity
  workStyle?: 'structured' | 'flexible' | 'hybrid';
  timeManagement?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  
  // Context for AI
  context?: string; // Free-form text about user's situation, background, etc.
  
  createdAt: Date;
  updatedAt: Date;
}
