export type AppView = 'capture' | 'mindbox' | 'shareit' | 'companion';

// Merged category and type into a single type
export type EntryType = 'todo' | 'insight' | 'journal';

export type Tag = 'work' | 'soccer' | 'family' | 'spirituality' | 'business' | 'tech' | 'health' | 'other';

// Legacy types for backward compatibility (can be removed later)
export type Category = 'todo' | 'insight' | 'idea'; // Deprecated - use EntryType instead

export interface Entry {
  id: string;
  type: EntryType; // Merged: 'todo' | 'insight' | 'journal'
  originalText: string;
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
