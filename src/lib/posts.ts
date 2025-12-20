import { supabase } from './supabase';
import { Post, PostStatus } from '../types';
import { fetchEntries } from './db';

// Convert database post to app Post format
export function dbPostToPost(dbPost: any): Post {
  return {
    id: dbPost.id,
    entryId: dbPost.entry_id,
    viralityScore: dbPost.virality_score,
    draftContent: dbPost.draft_content,
    twitterContent: dbPost.twitter_content || undefined,
    instagramContent: dbPost.instagram_content || undefined,
    instagramImagePrompt: dbPost.instagram_image_prompt || undefined,
    instagramImageUrl: dbPost.instagram_image_url || undefined,
    status: dbPost.status as PostStatus,
    createdAt: new Date(dbPost.created_at),
    updatedAt: new Date(dbPost.updated_at),
  };
}

// Convert app Post to database format
export function postToDbPost(post: Post): any {
  return {
    id: post.id,
    entry_id: post.entryId,
    virality_score: post.viralityScore,
    draft_content: post.draftContent,
    twitter_content: post.twitterContent || null,
    instagram_content: post.instagramContent || null,
    instagram_image_prompt: post.instagramImagePrompt || null,
    status: post.status,
  };
}

// Fetch all posts for the current user
export async function fetchPosts(): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('virality_score', { ascending: false });

  if (error) {
    throw new Error(`Error fetching posts: ${error.message}`);
  }

  return (data || []).map(dbPostToPost);
}

// Generate ONE new post from entries (only if there's a new insight worth posting)
export async function generateNextPost(): Promise<Post | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch all entries
  const entries = await fetchEntries();
  
  // Get existing posts to know which entries already have posts
  const existingPosts = await fetchPosts();
  const existingPostEntryIds = new Set(existingPosts.map(p => p.entryId));
  
  // Find the next best insight worth posting about
  const { findNextPostWorthyInsight } = await import('./ai');
  const nextInsight = await findNextPostWorthyInsight(entries, existingPostEntryIds);
  
  if (!nextInsight) {
    return null; // No new insights found
  }
  
  // Create new post in database
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      entry_id: nextInsight.entryId,
      virality_score: nextInsight.viralityScore,
      draft_content: nextInsight.draftContent,
      twitter_content: nextInsight.twitterContent || null,
      instagram_content: nextInsight.instagramContent || null,
      instagram_image_prompt: nextInsight.instagramImagePrompt || null,
      instagram_image_url: nextInsight.instagramImageUrl || null,
      status: 'draft',
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating post: ${error.message}`);
  }
  
  return dbPostToPost(data);
}

// Update post status
export async function updatePostStatus(postId: string, status: PostStatus): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Error updating post: ${error.message}`);
  }
}

// Update post draft content
export async function updatePostDraft(
  postId: string, 
  draftContent: string, 
  twitterContent?: string, 
  instagramContent?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const updates: any = {
    draft_content: draftContent,
    updated_at: new Date().toISOString()
  };

  if (twitterContent !== undefined) {
    updates.twitter_content = twitterContent;
  }
  if (instagramContent !== undefined) {
    updates.instagram_content = instagramContent;
  }

  const { error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Error updating post draft: ${error.message}`);
  }
}

// Generate post drafts for a specific entry
export async function generatePostForEntry(entryId: string, forceGeneration: boolean = false): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get the entry
  const entries = await fetchEntries();
  const entry = entries.find(e => e.id === entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  // Check if post already exists
  const existingPosts = await fetchPosts();
  const existingPost = existingPosts.find(p => p.entryId === entryId);

  // Generate only missing content (cost-efficient)
  const { analyzeEntryForPost } = await import('./ai');
  
  if (existingPost) {
    // Check what's missing
    const missingLinkedIn = !existingPost.draftContent;
    const missingTwitter = !existingPost.twitterContent;
    const missingInstagram = !existingPost.instagramContent; // Only check content, not image (image is optional)
    
    // If everything exists, return it
    if (!missingLinkedIn && !missingTwitter && !missingInstagram) {
      return existingPost;
    }
    
    // Only generate what's missing (cost-efficient)
    const analysis = await analyzeEntryForPost(entry, {
      generateLinkedIn: missingLinkedIn,
      generateTwitter: missingTwitter,
      generateInstagram: missingInstagram,
    }, forceGeneration);
    
    // Update existing post with missing content
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Only update fields that were missing
    if (missingLinkedIn && analysis.draftContent) updateData.draft_content = analysis.draftContent;
    if (missingTwitter && analysis.twitterContent) updateData.twitter_content = analysis.twitterContent;
    if (missingInstagram) {
      if (analysis.instagramContent) updateData.instagram_content = analysis.instagramContent;
      if (analysis.instagramImagePrompt) updateData.instagram_image_prompt = analysis.instagramImagePrompt;
      if (analysis.instagramImageUrl) updateData.instagram_image_url = analysis.instagramImageUrl;
    }
    
    // Update virality score if we regenerated
    if (analysis.viralityScore !== undefined) {
      updateData.virality_score = analysis.viralityScore;
    }
    
    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', existingPost.id)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Error updating post: ${updateError.message}`);
    }

    // Fetch updated post
    const { data: updatedData, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', existingPost.id)
      .single();

    if (fetchError || !updatedData) {
      throw new Error(`Error fetching updated post: ${fetchError?.message || 'No data returned'}`);
    }

    return dbPostToPost(updatedData);
  }
  
  // No existing post - generate everything
  const analysis = await analyzeEntryForPost(entry, undefined, forceGeneration);

  // Create new post
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      entry_id: entryId,
      virality_score: analysis.viralityScore,
      draft_content: analysis.draftContent,
      twitter_content: analysis.twitterContent || null,
      instagram_content: analysis.instagramContent || null,
      instagram_image_prompt: analysis.instagramImagePrompt || null,
      instagram_image_url: analysis.instagramImageUrl || null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating post: ${error.message}`);
  }

  return dbPostToPost(data);
}

// Delete post (by entry ID or post ID)
export async function deletePost(postIdOrEntryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Try to find by entry_id first, then by id
  const existingPosts = await fetchPosts();
  const post = existingPosts.find(p => p.entryId === postIdOrEntryId || p.id === postIdOrEntryId);
  
  if (!post) {
    // Post might not exist, that's okay
    return;
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', post.id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Error deleting post: ${error.message}`);
  }
}

// Regenerate Twitter/X and Instagram content for a post that's missing it
export async function regenerateSocialContent(postId: string): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get the post with its entry
  const { data: postData, error: fetchError } = await supabase
    .from('posts')
    .select('*, entries!inner(*)')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !postData) {
    throw new Error(`Error fetching post: ${fetchError?.message || 'Post not found'}`);
  }

  // Get the entry (it's in the entries array from the join)
  const entryData = Array.isArray(postData.entries) ? postData.entries[0] : postData.entries;
  if (!entryData) {
    throw new Error('Entry not found for this post');
  }

  // Import the conversion function
  const { dbEntryToEntry } = await import('./db');
  
  // Convert to Entry format
  const entryObj = dbEntryToEntry(entryData);

  // Generate Twitter/X and Instagram content
  const { generateTwitterPost, generateInstagramPost, generateInstagramImagePrompt, generateInstagramImage } = await import('./ai');
  
  const [twitterContent, instagramContent, instagramImagePrompt] = await Promise.all([
    generateTwitterPost(entryObj),
    generateInstagramPost(entryObj),
    generateInstagramImagePrompt(entryObj)
  ]);

  // Generate the actual image if we have a prompt
  let instagramImageUrl = null;
  if (instagramImagePrompt) {
    instagramImageUrl = await generateInstagramImage(instagramImagePrompt);
  }

  // Update the post with new content
  const { data: updatedData, error: updateError } = await supabase
    .from('posts')
    .update({
      twitter_content: twitterContent,
      instagram_content: instagramContent,
      instagram_image_prompt: instagramImagePrompt,
      instagram_image_url: instagramImageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Error updating post: ${updateError.message}`);
  }

  return dbPostToPost(updatedData);
}

// Regenerate social content for all posts that are missing it
export async function regenerateAllMissingSocialContent(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all posts that are missing Twitter or Instagram content
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, twitter_content, instagram_content')
    .eq('user_id', user.id)
    .or('twitter_content.is.null,instagram_content.is.null');

  if (error) {
    throw new Error(`Error fetching posts: ${error.message}`);
  }

  if (!posts || posts.length === 0) {
    return 0;
  }

  let regenerated = 0;
  for (const post of posts) {
    try {
      await regenerateSocialContent(post.id);
      regenerated++;
    } catch (error) {
      console.error(`Error regenerating content for post ${post.id}:`, error);
    }
  }

  return regenerated;
}

