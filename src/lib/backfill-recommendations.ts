import { Thought } from '../types';
import { generateExploreRecommendations } from './generate-explore-recommendations';
import { updateThought as updateThoughtDb } from './thoughts-db';

/**
 * Backfill recommendations for all existing thoughts that don't have them
 * This is a one-off utility function to generate recommendations for existing thoughts
 */
export async function backfillRecommendations(
  thoughts: Thought[],
  onProgress?: (current: number, total: number, thoughtId: string) => void
): Promise<{ success: number; failed: number; errors: Array<{ thoughtId: string; error: string }> }> {
  // Include thoughts that need recommendations OR have old types that need conversion
  const thoughtsNeedingRecommendations = thoughts.filter(thought => {
    // No recommendations at all
    if (!thought.exploreRecommendations || thought.exploreRecommendations.length === 0) {
      return true;
    }
    // Has old types that need conversion (Reflection, Learning, Insight, Project, Other)
    const oldTypes = ['Reflection', 'Learning', 'Insight', 'Project', 'Other'];
    const hasOldType = thought.exploreRecommendations.some(rec => oldTypes.includes(rec.type));
    return hasOldType;
  });

  console.log(`Found ${thoughtsNeedingRecommendations.length} thoughts without recommendations out of ${thoughts.length} total thoughts`);

  let success = 0;
  let failed = 0;
  const errors: Array<{ thoughtId: string; error: string }> = [];

  // Process in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < thoughtsNeedingRecommendations.length; i += batchSize) {
    const batch = thoughtsNeedingRecommendations.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.all(
      batch.map(async (thought) => {
        try {
          onProgress?.(i + batch.indexOf(thought) + 1, thoughtsNeedingRecommendations.length, thought.id);
          
          console.log(`Generating recommendations for thought: ${thought.id.substring(0, 8)}...`);
          const recommendations = await generateExploreRecommendations(thought);
          
          console.log(`Generated ${recommendations.length} recommendations for thought ${thought.id.substring(0, 8)}...`, recommendations);
          
          // Always save, even if empty array (to mark as processed)
          await updateThoughtDb(thought.id, {
            exploreRecommendations: recommendations,
          });
          
          if (recommendations.length > 0) {
            success++;
            console.log(`✓ Successfully saved ${recommendations.length} recommendations for thought ${thought.id.substring(0, 8)}...`);
          } else {
            console.log(`⚠ No recommendations generated for thought ${thought.id.substring(0, 8)}... (saved empty array)`);
            success++; // Count as success even if no recommendations
          }
        } catch (error: any) {
          failed++;
          const errorMessage = error?.message || 'Unknown error';
          errors.push({ thoughtId: thought.id, error: errorMessage });
          console.error(`✗ Failed to generate recommendations for thought ${thought.id.substring(0, 8)}...:`, errorMessage);
        }
      })
    );

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < thoughtsNeedingRecommendations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  if (errors.length > 0) {
    console.log(`   Errors:`, errors);
  }

  return { success, failed, errors };
}

