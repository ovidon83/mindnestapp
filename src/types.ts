export type AppView = 'capture' | 'mindbox' | 'shareit' | 'companion' | 'profile';

// Merged category and type into a single type
export type EntryType = 'todo' | 'insight' | 'journal';

export type Tag = 'work' | 'soccer' | 'family' | 'spirituality' | 'business' | 'tech' | 'health' | 'other';

// Legacy types for backward compatibility (can be removed later)
export type Category = 'todo' | 'insight' | 'idea'; // Deprecated - use EntryType instead

// Metadata describing thought potential - allows same thought to surface as action, insight, etc.
export interface ThoughtMetadata {
  actionable: boolean; // Contains clear actions or tasks
  shareable: boolean; // Insight/learning worth sharing with others
  recurring: boolean; // Mentions patterns, habits, or recurring themes
  thematic: boolean; // Part of a larger theme or ongoing topic
  hasDate: boolean; // Contains dates or time references
  hasMultipleActions: boolean; // Contains 2+ distinct actions
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Entry {
  id: string;
  type: EntryType; // Merged: 'todo' | 'insight' | 'journal'
  originalText: string; // Source of truth - raw text as captured
  tags: Tag[];
  summary: string;
  nextStep?: string; // Only for todos
  completed?: boolean; // Only for todos - marks if todo is done
  postRecommendation: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // New fields for Mindbox
  aiHint?: string; // Single AI hint line (e.g., "Possible next step: ...", "Might be worth sharing.")
  badgeOverride?: EntryType; // User override for badge type
  postingScore?: number; // Internal posting potential score (0-100, hidden from UI)
  inShareIt?: boolean; // Whether this entry is in Share it
  metadata?: ThoughtMetadata; // AI-generated metadata describing thought potential
  
  // Legacy fields for backward compatibility (will be removed after migration)
  entryType?: 'thought' | 'journal'; // Deprecated
  category?: Category; // Deprecated
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
