import { supabase } from './supabase';
import { Thought, Action, PotentialType, SharePosts, TodoData, InsightData } from '../types';

// Convert database thought to app Thought format
export function dbThoughtToThought(dbThought: any): Thought {
  // Handle backward compatibility - migrate old action fields to new potential system
  let potential: PotentialType | null = null;
  let bestPotential: PotentialType | null = null;
  
  if (dbThought.potential) {
    potential = dbThought.potential;
  } else if (dbThought.selected_action) {
    // Migrate old selectedAction to new potential
    const actionMap: Record<string, PotentialType> = {
      'Share': 'Share',
      'To-Do': 'To-Do',
      'ToDo': 'To-Do',
      'Conversation': 'Insight', // Conversation becomes Insight
    };
    potential = actionMap[dbThought.selected_action] || null;
  } else if (dbThought.best_action) {
    const actionMap: Record<string, PotentialType> = {
      'Share': 'Share',
      'To-Do': 'To-Do',
      'ToDo': 'To-Do',
      'Conversation': 'Insight',
    };
    potential = actionMap[dbThought.best_action] || null;
  }
  
  if (dbThought.best_potential) {
    bestPotential = dbThought.best_potential;
  } else if (dbThought.best_action) {
    const actionMap: Record<string, PotentialType> = {
      'Share': 'Share',
      'To-Do': 'To-Do',
      'ToDo': 'To-Do',
      'Conversation': 'Insight',
    };
    bestPotential = actionMap[dbThought.best_action] || null;
  }
  
  // Default to "Just a thought" if no potential is set
  if (!potential && !bestPotential) {
    potential = 'Just a thought';
    bestPotential = 'Just a thought';
  } else if (!potential && bestPotential) {
    // If bestPotential exists but potential doesn't, use bestPotential as potential
    potential = bestPotential;
  } else if (potential && !bestPotential) {
    // If potential exists but bestPotential doesn't, use potential as bestPotential
    bestPotential = potential;
  }
  
  // Parse potential-specific data
  let sharePosts: SharePosts | undefined;
  let todoData: TodoData | undefined;
  let insightData: InsightData | undefined;
  
  if (dbThought.share_posts) {
    try {
      const posts = typeof dbThought.share_posts === 'string' 
        ? JSON.parse(dbThought.share_posts) 
        : dbThought.share_posts;
      sharePosts = {
        linkedin: posts.linkedin,
        twitter: posts.twitter,
        instagram: posts.instagram,
        generatedAt: posts.generatedAt ? new Date(posts.generatedAt) : undefined,
        shared: posts.shared ? {
          linkedin: posts.shared.linkedin || false,
          twitter: posts.shared.twitter || false,
          instagram: posts.shared.instagram || false,
          sharedAt: posts.shared.sharedAt ? new Date(posts.shared.sharedAt) : undefined,
        } : undefined,
      };
    } catch (e) {
      console.error('Error parsing share_posts:', e);
    }
  }
  
  if (dbThought.todo_data) {
    try {
      const todo = typeof dbThought.todo_data === 'string'
        ? JSON.parse(dbThought.todo_data)
        : dbThought.todo_data;
      todoData = {
        completed: todo.completed || false,
        completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
        notes: todo.notes,
      };
    } catch (e) {
      console.error('Error parsing todo_data:', e);
    }
  }
  
  if (dbThought.insight_data) {
    try {
      const insight = typeof dbThought.insight_data === 'string'
        ? JSON.parse(dbThought.insight_data)
        : dbThought.insight_data;
      insightData = {
        content: insight.content || '',
        format: insight.format || 'short',
        updatedAt: insight.updatedAt ? new Date(insight.updatedAt) : undefined,
      };
    } catch (e) {
      console.error('Error parsing insight_data:', e);
    }
  }
  
  return {
    id: dbThought.id,
    originalText: dbThought.original_text,
    tags: dbThought.tags || [],
    summary: dbThought.summary,
    isSpark: dbThought.is_spark || false,
    isParked: dbThought.is_parked || false,
    potential: potential || 'Just a thought',
    bestPotential: bestPotential || 'Just a thought',
    sharePosts,
    todoData,
    insightData,
    createdAt: new Date(dbThought.created_at),
    updatedAt: new Date(dbThought.updated_at),
  };
}

// Convert app Thought to database format
export function thoughtToDbThought(thought: Thought): any {
  const dbThought: any = {
    id: thought.id,
    original_text: thought.originalText,
    tags: thought.tags,
    summary: thought.summary,
    is_spark: thought.isSpark,
    is_parked: thought.isParked || false,
  };
  
  // New potential system - ensure "Just a thought" is saved as string, not null
  dbThought.potential = thought.potential === null || thought.potential === undefined 
    ? 'Just a thought' 
    : thought.potential;
  dbThought.best_potential = thought.bestPotential === null || thought.bestPotential === undefined
    ? null  // bestPotential can be null
    : thought.bestPotential;
  
  // Potential-specific data
  if (thought.sharePosts) {
    dbThought.share_posts = {
      linkedin: thought.sharePosts.linkedin,
      twitter: thought.sharePosts.twitter,
      instagram: thought.sharePosts.instagram,
      generatedAt: thought.sharePosts.generatedAt?.toISOString(),
      shared: thought.sharePosts.shared ? {
        linkedin: thought.sharePosts.shared.linkedin || false,
        twitter: thought.sharePosts.shared.twitter || false,
        instagram: thought.sharePosts.shared.instagram || false,
        sharedAt: thought.sharePosts.shared.sharedAt?.toISOString(),
      } : undefined,
    };
  }
  
  if (thought.todoData) {
    dbThought.todo_data = {
      completed: thought.todoData.completed,
      completedAt: thought.todoData.completedAt?.toISOString(),
      notes: thought.todoData.notes,
    };
  }
  
  if (thought.insightData) {
    dbThought.insight_data = {
      content: thought.insightData.content,
      format: thought.insightData.format || 'short',
      updatedAt: thought.insightData.updatedAt?.toISOString(),
    };
  }
  
  return dbThought;
}

// Convert database action to app Action format (kept for backward compatibility)
export function dbActionToAction(dbAction: any): Action {
  return {
    id: dbAction.id,
    thoughtId: dbAction.thought_id,
    type: dbAction.type,
    title: dbAction.title,
    content: dbAction.content,
    completed: dbAction.completed || false,
    createdAt: new Date(dbAction.created_at),
    updatedAt: new Date(dbAction.updated_at),
  };
}

// Fetch all thoughts for current user
export async function fetchThoughts(): Promise<Thought[]> {
  const { data, error } = await supabase
    .from('thoughts')
    .select('*')
    .order('created_at', { ascending: false }) as any;

  if (error) {
    console.error('Error fetching thoughts:', error);
    throw error;
  }

  return (data || []).map(dbThoughtToThought);
}

// Insert a new thought
export async function insertThought(thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thought> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbThought = thoughtToDbThought({
    ...thought,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Thought);

  const dbThoughtWithUserId = {
    ...dbThought,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('thoughts')
    .insert(dbThoughtWithUserId as any)
    .select()
    .single();

  if (error) {
    console.error('Error inserting thought:', error);
    throw error;
  }

  return dbThoughtToThought(data);
}

// Update a thought
export async function updateThought(id: string, updates: Partial<Thought>): Promise<Thought | null> {
  // Try to fetch current thought to get existing potential (but don't fail if it doesn't exist)
  let currentPotential: string | null = null;
  try {
    const { data: currentThought } = await supabase
      .from('thoughts')
      .select('potential')
      .eq('id', id)
      .single();
    currentPotential = currentThought?.potential || null;
  } catch (error) {
    // If fetch fails, we'll use default - that's okay
    console.warn('Could not fetch current potential, using default:', error);
  }
  
  const updateData: any = {};
  
  if (updates.originalText !== undefined) updateData.original_text = updates.originalText;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.summary !== undefined) updateData.summary = updates.summary;
  if (updates.isSpark !== undefined) updateData.is_spark = updates.isSpark;
  if (updates.isParked !== undefined) updateData.is_parked = updates.isParked;
  
  // CRITICAL: Always set potential to a valid value to prevent constraint violations
  // Determine the potential value to use
  let potentialValue: string = 'Just a thought'; // Default fallback
  
  if (updates.potential !== undefined) {
    // User is explicitly setting potential
    const userPotential = updates.potential === null || updates.potential === undefined 
      ? 'Just a thought' 
      : updates.potential;
    // Validate it's one of the allowed values
    if (['Share', 'To-Do', 'Insight', 'Just a thought'].includes(userPotential)) {
      potentialValue = userPotential;
    }
  } else if (currentPotential && ['Share', 'To-Do', 'Insight', 'Just a thought'].includes(currentPotential)) {
    // Not explicitly updating potential - use current value if valid
    potentialValue = currentPotential;
  }
  // Otherwise use default 'Just a thought'
  
  // Always set potential in updateData - this is CRITICAL to prevent constraint violations
  updateData.potential = potentialValue;
  
  if (updates.bestPotential !== undefined) {
    updateData.best_potential = updates.bestPotential === null || updates.bestPotential === undefined
      ? null  // bestPotential can be null
      : updates.bestPotential;
  }
  
  // Potential-specific data
  if (updates.sharePosts !== undefined) {
    updateData.share_posts = updates.sharePosts ? {
      linkedin: updates.sharePosts.linkedin,
      twitter: updates.sharePosts.twitter,
      instagram: updates.sharePosts.instagram,
      generatedAt: updates.sharePosts.generatedAt?.toISOString(),
    } : null;
  }
  
  if (updates.todoData !== undefined) {
    updateData.todo_data = updates.todoData ? {
      completed: updates.todoData.completed,
      completedAt: updates.todoData.completedAt?.toISOString(),
      notes: updates.todoData.notes,
    } : null;
  }
  
  if (updates.insightData !== undefined) {
    updateData.insight_data = updates.insightData ? {
      content: updates.insightData.content,
      format: updates.insightData.format || 'short',
      updatedAt: updates.insightData.updatedAt?.toISOString(),
    } : null;
  }
  
  // Always update updated_at
  updateData.updated_at = new Date().toISOString();

  // Build safe update object - ALWAYS include potential
  const safeUpdateData: any = {
    updated_at: updateData.updated_at,
    potential: updateData.potential, // ALWAYS include potential
  };
  
  if (updateData.original_text !== undefined) safeUpdateData.original_text = updateData.original_text;
  if (updateData.tags !== undefined) safeUpdateData.tags = updateData.tags;
  if (updateData.summary !== undefined) safeUpdateData.summary = updateData.summary;
  if (updateData.is_spark !== undefined) safeUpdateData.is_spark = updateData.is_spark;
  if (updateData.is_parked !== undefined) safeUpdateData.is_parked = updateData.is_parked;
  if (updateData.best_potential !== undefined) safeUpdateData.best_potential = updateData.best_potential;
  if (updateData.share_posts !== undefined) safeUpdateData.share_posts = updateData.share_posts;
  if (updateData.todo_data !== undefined) safeUpdateData.todo_data = updateData.todo_data;
  if (updateData.insight_data !== undefined) safeUpdateData.insight_data = updateData.insight_data;

  const { data, error } = await (supabase as any)
    .from('thoughts')
    .update(safeUpdateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // Handle 406 (Not Acceptable) gracefully - might mean row doesn't exist
    if (error.code === 'PGRST116' || error.status === 406 || error.message?.includes('406')) {
      console.warn('Thought update returned 406, row may not exist:', id);
      return null;
    }
    console.error('Error updating thought:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return dbThoughtToThought(data);
}

// Delete a thought
export async function deleteThought(id: string): Promise<void> {
  const { error } = await supabase
    .from('thoughts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting thought:', error);
    throw error;
  }
}

// Fetch all actions for current user (kept for backward compatibility)
export async function fetchActions(): Promise<Action[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false }) as any;

  if (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }

  return (data || []).map(dbActionToAction);
}

// Insert a new action (kept for backward compatibility)
export async function insertAction(action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>): Promise<Action> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbAction = {
    thought_id: action.thoughtId,
    type: action.type,
    title: action.title,
    content: action.content,
    completed: action.completed || false,
  };

  const dbActionWithUserId = {
    ...dbAction,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('actions')
    .insert(dbActionWithUserId as any)
    .select()
    .single();

  if (error) {
    console.error('Error inserting action:', error);
    throw error;
  }

  return dbActionToAction(data);
}

// Update an action (kept for backward compatibility)
export async function updateAction(id: string, updates: Partial<Action>): Promise<Action> {
  const updateData: any = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.completed !== undefined) updateData.completed = updates.completed;

  const { data, error } = await (supabase as any)
    .from('actions')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating action:', error);
    throw error;
  }

  return dbActionToAction(data);
}

// Delete an action (kept for backward compatibility)
export async function deleteAction(id: string): Promise<void> {
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
}
