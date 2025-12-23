import { supabase } from './supabase';
import { Entry, TrainingData, UserProfile } from '../types';

// Convert database entry to app Entry format
// Handles both new (type) and old (category + entry_type) formats for backward compatibility
export function dbEntryToEntry(dbEntry: any): Entry {
  // Determine type: prefer new 'type' field, fallback to deriving from old fields
  let entryType: 'todo' | 'insight' | 'journal';
  if (dbEntry.type) {
    entryType = dbEntry.type;
  } else {
    // Derive from old fields for backward compatibility
    if (dbEntry.category === 'todo') {
      entryType = 'todo';
    } else if (dbEntry.entry_type === 'journal') {
      entryType = 'journal';
    } else {
      entryType = 'insight'; // insight or idea -> insight
    }
  }

  return {
    id: dbEntry.id,
    type: entryType,
    originalText: dbEntry.original_text,
    tags: dbEntry.tags || [],
    summary: dbEntry.summary,
    nextStep: dbEntry.next_step || undefined,
    completed: dbEntry.completed || false,
    postRecommendation: dbEntry.post_recommendation || false,
    createdAt: new Date(dbEntry.created_at),
    updatedAt: new Date(dbEntry.updated_at),
    // New fields for Mindbox
    aiHint: dbEntry.ai_hint || undefined,
    badgeOverride: dbEntry.badge_override || undefined,
    postingScore: dbEntry.posting_score || undefined,
    inShareIt: dbEntry.in_share_it || false,
    // Metadata
    metadata: dbEntry.metadata ? {
      actionable: dbEntry.metadata.actionable || false,
      shareable: dbEntry.metadata.shareable || false,
      recurring: dbEntry.metadata.recurring || false,
      thematic: dbEntry.metadata.thematic || false,
      hasDate: dbEntry.metadata.hasDate || false,
      hasMultipleActions: dbEntry.metadata.hasMultipleActions || false,
      sentiment: dbEntry.metadata.sentiment || 'neutral',
    } : undefined,
    // Legacy fields for backward compatibility
    entryType: dbEntry.entry_type || (entryType === 'journal' ? 'journal' : 'thought'),
    category: dbEntry.category || (entryType === 'todo' ? 'todo' : entryType === 'insight' ? 'insight' : 'idea'),
  };
}

// Convert app Entry to database format
// Writes both new (type) and old (category + entry_type) fields for backward compatibility
export function entryToDbEntry(entry: Entry): any {
  const type = entry.type || (entry.category === 'todo' ? 'todo' : entry.entryType === 'journal' ? 'journal' : 'insight');
  
  return {
    id: entry.id,
    type: type, // New field
    original_text: entry.originalText,
    tags: entry.tags,
    summary: entry.summary,
    next_step: entry.nextStep || null,
    completed: entry.completed || false,
    post_recommendation: entry.postRecommendation,
    // New fields for Mindbox
    ai_hint: entry.aiHint || null,
    badge_override: entry.badgeOverride || null,
    posting_score: entry.postingScore || null,
    in_share_it: entry.inShareIt || false,
    // Metadata (stored as JSONB in Supabase) - only include if it exists and is not null
    ...(entry.metadata ? { metadata: entry.metadata } : {}),
    // Legacy fields for backward compatibility
    entry_type: entry.entryType || (type === 'journal' ? 'journal' : 'thought'),
    category: entry.category || (type === 'todo' ? 'todo' : type === 'insight' ? 'insight' : 'idea'),
  };
}

// Fetch all entries for current user
export async function fetchEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false }) as any;

  if (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }

  return (data || []).map(dbEntryToEntry);
}

// Insert a new entry
export async function insertEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbEntry = entryToDbEntry({
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Entry);

  const dbEntryWithUserId = {
    ...dbEntry,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('entries')
    .insert(dbEntryWithUserId as any)
    .select()
    .single();

  if (error) {
    console.error('Error inserting entry:', error);
    throw error;
  }

  return dbEntryToEntry(data);
}

// Update an entry
export async function updateEntry(id: string, updates: Partial<Entry>): Promise<Entry> {
  const updateData: any = {};
  
  // New fields
  if (updates.type !== undefined) {
    updateData.type = updates.type;
    // Also update legacy fields for backward compatibility
    updateData.category = updates.type === 'todo' ? 'todo' : updates.type === 'insight' ? 'insight' : 'idea';
    updateData.entry_type = updates.type === 'journal' ? 'journal' : 'thought';
  }
  if (updates.completed !== undefined) updateData.completed = updates.completed;
  
  // Legacy field updates (also update new type field)
  if (updates.entryType !== undefined) {
    updateData.entry_type = updates.entryType;
    if (updates.entryType === 'journal') updateData.type = 'journal';
    else if (!updateData.type) updateData.type = 'insight';
  }
  if (updates.category !== undefined) {
    updateData.category = updates.category;
    if (updates.category === 'todo') updateData.type = 'todo';
    else if (!updateData.type) updateData.type = 'insight';
  }
  
  // Other fields
  if (updates.originalText !== undefined) updateData.original_text = updates.originalText;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.summary !== undefined) updateData.summary = updates.summary;
  if (updates.nextStep !== undefined) updateData.next_step = updates.nextStep || null;
  if (updates.postRecommendation !== undefined) updateData.post_recommendation = updates.postRecommendation;
  
  // Mindbox fields
  if (updates.badgeOverride !== undefined) updateData.badge_override = updates.badgeOverride || null;
  if (updates.inShareIt !== undefined) updateData.in_share_it = updates.inShareIt;
  if (updates.aiHint !== undefined) updateData.ai_hint = updates.aiHint || null;
  if (updates.postingScore !== undefined) updateData.posting_score = updates.postingScore || null;
  if (updates.metadata !== undefined) {
    // Only include metadata if it's not null/undefined
    if (updates.metadata) {
      updateData.metadata = updates.metadata;
    } else {
      updateData.metadata = null;
    }
  }

  const { data, error } = await (supabase as any)
    .from('entries')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating entry:', error);
    throw error;
  }

  return dbEntryToEntry(data);
}

// Delete an entry
export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}

// Training data functions
export async function saveTrainingData(content: string, contentType: 'text' | 'file', fileName?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('training_data')
    .insert({
      user_id: user.id,
      content,
      content_type: contentType,
      file_name: fileName || null,
    } as any);

  if (error) {
    console.error('Error saving training data:', error);
    throw error;
  }
}

export async function fetchTrainingData(): Promise<TrainingData[]> {
  const { data, error } = await supabase
    .from('training_data')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching training data:', error);
    throw error;
  }

  return (data || []).map((td: any) => ({
    id: td.id,
    content: td.content,
    contentType: td.content_type,
    fileName: td.file_name,
    createdAt: new Date(td.created_at),
  }));
}

// User Profile functions
export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as any;

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found, return null
      return null;
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name || undefined,
    role: data.role || undefined,
    industry: data.industry || undefined,
    location: data.location || undefined,
    interests: data.interests || undefined,
    domains: data.domains || undefined,
    goals: data.goals || undefined,
    priorities: data.priorities || undefined,
    communicationStyle: data.communication_style || undefined,
    preferredTone: data.preferred_tone || undefined,
    workStyle: data.work_style || undefined,
    timeManagement: data.time_management || undefined,
    context: data.context || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if profile exists
  const existing = await fetchUserProfile();
  
  const profileData: any = {
    user_id: user.id,
    name: profile.name || null,
    role: profile.role || null,
    industry: profile.industry || null,
    location: profile.location || null,
    interests: profile.interests || null,
    domains: profile.domains || null,
    goals: profile.goals || null,
    priorities: profile.priorities || null,
    communication_style: profile.communicationStyle || null,
    preferred_tone: profile.preferredTone || null,
    work_style: profile.workStyle || null,
    time_management: profile.timeManagement || null,
    context: profile.context || null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing profile
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .update(profileData as any)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    const updateData = data as any;
    return {
      id: updateData.id,
      userId: updateData.user_id,
      name: updateData.name || undefined,
      role: updateData.role || undefined,
      industry: updateData.industry || undefined,
      location: updateData.location || undefined,
      interests: updateData.interests || undefined,
      domains: updateData.domains || undefined,
      goals: updateData.goals || undefined,
      priorities: updateData.priorities || undefined,
      communicationStyle: updateData.communication_style || undefined,
      preferredTone: updateData.preferred_tone || undefined,
      workStyle: updateData.work_style || undefined,
      timeManagement: updateData.time_management || undefined,
      context: updateData.context || undefined,
      createdAt: new Date(updateData.created_at),
      updatedAt: new Date(updateData.updated_at),
    };
  } else {
    // Create new profile
    profileData.created_at = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .insert(profileData as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    const createdProfileData = data as any;
    return {
      id: createdProfileData.id,
      userId: createdProfileData.user_id,
      name: createdProfileData.name || undefined,
      role: createdProfileData.role || undefined,
      industry: createdProfileData.industry || undefined,
      location: createdProfileData.location || undefined,
      interests: createdProfileData.interests || undefined,
      domains: createdProfileData.domains || undefined,
      goals: createdProfileData.goals || undefined,
      priorities: createdProfileData.priorities || undefined,
      communicationStyle: createdProfileData.communication_style || undefined,
      preferredTone: createdProfileData.preferred_tone || undefined,
      workStyle: createdProfileData.work_style || undefined,
      timeManagement: createdProfileData.time_management || undefined,
      context: createdProfileData.context || undefined,
      createdAt: new Date(createdProfileData.created_at),
      updatedAt: new Date(createdProfileData.updated_at),
    };
  }
}
