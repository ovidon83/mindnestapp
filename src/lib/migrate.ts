import { supabase } from './supabase';
import { generateNextStep, generateAIHintAndScore } from './ai';
import { dbEntryToEntry } from './db';
import { Entry } from '../types';
import { generatePostForEntry } from './posts';

// Migration function to update existing entries with new AI hints and posting scores
export async function migrateExistingEntries(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch all entries
  const { data: entries, error: fetchError } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id);

  if (fetchError) {
    throw new Error(`Error fetching entries: ${fetchError.message}`);
  }

  if (!entries || entries.length === 0) {
    console.log('No entries to migrate');
    return;
  }

  console.log(`Migrating ${entries.length} entries...`);

  // Update each entry
  for (const entry of entries) {
    const updates: any = {};
    const dbEntry = dbEntryToEntry(entry);
    
    // Determine type
    const type = dbEntry.type || (entry.category === 'todo' ? 'todo' : entry.entry_type === 'journal' ? 'journal' : 'insight');

    // Set entry_type for existing entries (default to 'thought' if not set)
    if (!entry.entry_type) {
      updates.entry_type = 'thought';
    }

    // Regenerate next step for todos with improved logic
    if (type === 'todo') {
      // Always remove post recommendation for todos
      updates.post_recommendation = false;

      // Regenerate next step with improved logic using summary for context
      const newNextStep = await generateNextStep(entry.original_text, entry.summary);
      updates.next_step = newNextStep;
    }

    // Regenerate AI hint and posting score for all entries
    const { aiHint, postingScore } = await generateAIHintAndScore(
      entry.original_text,
      type,
      entry.summary || entry.original_text.substring(0, 100)
    );

    // For todos, use nextStep as AI hint instead
    if (type === 'todo' && updates.next_step) {
      updates.ai_hint = updates.next_step;
    } else {
      updates.ai_hint = aiHint;
    }
    
    updates.posting_score = postingScore;
    
    // Auto-add to Share it if posting score is high enough
    if (postingScore >= 60) {
      updates.in_share_it = true;
    }

    // Update the entry
    const { error: updateError } = await supabase
      .from('entries')
      .update(updates)
      .eq('id', entry.id);

    if (updateError) {
      console.error(`Error updating entry ${entry.id}:`, updateError);
    } else {
      console.log(`Updated entry: ${entry.id} - type: ${type}, ai_hint: ${updates.ai_hint?.substring(0, 30)}..., posting_score: ${postingScore}`);
      
      // If entry should be in Share it, generate post drafts
      if (postingScore >= 60) {
        try {
          await generatePostForEntry(entry.id);
          console.log(`Generated post drafts for entry ${entry.id}`);
        } catch (postError) {
          console.error(`Error generating post for entry ${entry.id}:`, postError);
        }
      }
    }
  }

  console.log('Migration complete!');
}

