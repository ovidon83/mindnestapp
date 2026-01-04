import { Thought } from '../types';

/**
 * Calculate a "powerful" score for a thought based on:
 * - Recency (more recent = higher score)
 * - Repetition (if similar thoughts exist)
 * - Emotional language (detected in text)
 * - Past Share/Do behavior (if thought has been shared or acted upon)
 */
export function calculatePowerfulScore(thought: Thought, allThoughts: Thought[]): number {
  let score = 0;
  
  // 1. Recency (0-30 points)
  // More recent thoughts get higher scores
  const now = new Date();
  const thoughtDate = new Date(thought.createdAt);
  const daysSinceCreation = (now.getTime() - thoughtDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation <= 1) {
    score += 30; // Very recent (last 24 hours)
  } else if (daysSinceCreation <= 7) {
    score += 20; // This week
  } else if (daysSinceCreation <= 30) {
    score += 10; // This month
  } else {
    score += 5; // Older
  }
  
  // 2. Repetition (0-25 points)
  // Check if similar thoughts exist (similar tags or text)
  const similarThoughts = allThoughts.filter(t => {
    if (t.id === thought.id) return false;
    
    // Check tag overlap
    const commonTags = thought.tags.filter(tag => t.tags.includes(tag));
    if (commonTags.length > 0) return true;
    
    // Check text similarity (simple word overlap)
    const thoughtWords = new Set(thought.originalText.toLowerCase().split(/\s+/));
    const otherWords = new Set(t.originalText.toLowerCase().split(/\s+/));
    const commonWords = Array.from(thoughtWords).filter(w => otherWords.has(w) && w.length > 3);
    return commonWords.length >= 3;
  });
  
  if (similarThoughts.length >= 3) {
    score += 25; // High repetition
  } else if (similarThoughts.length >= 2) {
    score += 15; // Moderate repetition
  } else if (similarThoughts.length >= 1) {
    score += 8; // Some repetition
  }
  
  // 3. Emotional language (0-25 points)
  const text = thought.originalText.toLowerCase();
  const emotionalWords = [
    // Strong positive
    'love', 'amazing', 'incredible', 'fantastic', 'brilliant', 'excellent', 'wonderful', 'perfect',
    // Strong negative
    'hate', 'terrible', 'awful', 'horrible', 'disaster', 'crisis', 'urgent', 'critical',
    // Intensity markers
    'very', 'extremely', 'absolutely', 'completely', 'totally', 'really', 'truly',
    // Action/commitment
    'must', 'need', 'essential', 'crucial', 'important', 'vital', 'key', 'priority'
  ];
  
  const emotionalWordCount = emotionalWords.filter(word => text.includes(word)).length;
  if (emotionalWordCount >= 5) {
    score += 25;
  } else if (emotionalWordCount >= 3) {
    score += 15;
  } else if (emotionalWordCount >= 1) {
    score += 8;
  }
  
  // 4. Past Share/Do behavior (0-20 points)
  // If thought has been shared or has active todo
  if (thought.sharePosts?.shared) {
    const sharedPlatforms = Object.values(thought.sharePosts.shared).filter(Boolean).length;
    score += Math.min(sharedPlatforms * 7, 15); // Up to 15 points for sharing
  }
  
  if (thought.potential === 'Share' || thought.bestPotential === 'Share') {
    score += 5; // Marked for sharing
  }
  
  if (thought.potential === 'To-Do' || thought.bestPotential === 'To-Do') {
    if (thought.todoData?.completed) {
      score += 10; // Completed todo
    } else {
      score += 5; // Active todo
    }
  }
  
  // 5. Spark bonus (0-10 points)
  if (thought.isSpark) {
    score += 10;
  }
  
  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Get the top 1-3 powerful thoughts for "What Matters" section
 */
export function getPowerfulThoughts(thoughts: Thought[], maxCount: number = 3): Thought[] {
  // Calculate scores for all thoughts
  const thoughtsWithScores = thoughts
    .filter(t => !t.isParked) // Exclude parked thoughts
    .map(thought => ({
      thought,
      score: thought.powerfulScore ?? calculatePowerfulScore(thought, thoughts),
      isManual: thought.isPowerful
    }));
  
  // Sort by: manual first, then by score, then by recency
  thoughtsWithScores.sort((a, b) => {
    // Manual selections first
    if (a.isManual && !b.isManual) return -1;
    if (!a.isManual && b.isManual) return 1;
    
    // Then by score
    if (a.score !== b.score) return b.score - a.score;
    
    // Then by recency
    return new Date(b.thought.createdAt).getTime() - new Date(a.thought.createdAt).getTime();
  });
  
  // Return top thoughts
  return thoughtsWithScores.slice(0, maxCount).map(item => item.thought);
}

