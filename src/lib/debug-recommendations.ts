/**
 * Debug utility to check recommendation status
 * Run this in browser console to see which thoughts have recommendations
 */
export function debugRecommendations(thoughts: any[]) {
  const withRecs = thoughts.filter(t => t.exploreRecommendations && t.exploreRecommendations.length > 0);
  const withoutRecs = thoughts.filter(t => !t.exploreRecommendations || t.exploreRecommendations.length === 0);
  
  console.log('=== Recommendation Debug ===');
  console.log(`Total thoughts: ${thoughts.length}`);
  console.log(`With recommendations: ${withRecs.length}`);
  console.log(`Without recommendations: ${withoutRecs.length}`);
  
  if (withRecs.length > 0) {
    console.log('\nThoughts WITH recommendations:');
    withRecs.forEach(t => {
      console.log(`  - ${t.id.substring(0, 8)}... (${t.exploreRecommendations.length} recs):`, 
        t.exploreRecommendations.map((r: any) => r.type).join(', '));
    });
  }
  
  if (withoutRecs.length > 0) {
    console.log('\nThoughts WITHOUT recommendations:');
    withoutRecs.slice(0, 10).forEach(t => {
      console.log(`  - ${t.id.substring(0, 8)}...: "${t.originalText.substring(0, 50)}..."`);
    });
    if (withoutRecs.length > 10) {
      console.log(`  ... and ${withoutRecs.length - 10} more`);
    }
  }
  
  return { withRecs, withoutRecs };
}

