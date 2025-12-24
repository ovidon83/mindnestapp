import { supabase } from './supabase';
import { Thought, Action, Potential } from '../types';

// Convert database thought to app Thought format
export function dbThoughtToThought(dbThought: any): Thought {
  return {
    id: dbThought.id,
    originalText: dbThought.original_text,
    tags: dbThought.tags || [],
    summary: dbThought.summary,
    isSpark: dbThought.is_spark || false,
    potentials: (dbThought.potentials || []).map((p: any) => ({
      id: p.id || crypto.randomUUID(),
      type: p.type,
      title: p.title,
      description: p.description,
      draft: p.draft,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    })),
    createdAt: new Date(dbThought.created_at),
    updatedAt: new Date(dbThought.updated_at),
  };
}

// Convert app Thought to database format
export function thoughtToDbThought(thought: Thought): any {
  return {
    id: thought.id,
    original_text: thought.originalText,
    tags: thought.tags,
    summary: thought.summary,
    is_spark: thought.isSpark,
    potentials: thought.potentials.map(p => ({
      id: p.id,
      type: p.type,
      title: p.title,
      description: p.description,
      draft: p.draft,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

// Convert database action to app Action format
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
export async function updateThought(id: string, updates: Partial<Thought>): Promise<Thought> {
  const updateData: any = {};
  
  if (updates.originalText !== undefined) updateData.original_text = updates.originalText;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.summary !== undefined) updateData.summary = updates.summary;
  if (updates.isSpark !== undefined) updateData.is_spark = updates.isSpark;
  if (updates.potentials !== undefined) {
    updateData.potentials = updates.potentials.map(p => ({
      id: p.id,
      type: p.type,
      title: p.title,
      description: p.description,
      draft: p.draft,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  const { data, error } = await (supabase as any)
    .from('thoughts')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating thought:', error);
    throw error;
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

// Fetch all actions for current user
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

// Insert a new action
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

// Update an action
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

// Delete an action
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

