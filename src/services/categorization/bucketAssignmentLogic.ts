
// --- Helper function to calculate scores and assign to the best bucket ---
export function assignToBestBucket(
  contactTagsLower: string[],
  bucketKeywordsMap: Record<string, string[]>,
  availableBucketNames: Readonly<string[]>,
  defaultBucket: string,
  priorityList?: string[]
): string {
  const scores: Record<string, number> = {};
  let totalMatches = 0;

  for (const bucketName of availableBucketNames) {
    scores[bucketName] = 0;
    const keywords = bucketKeywordsMap[bucketName] || [];
    for (const keyword of keywords) {
      if (contactTagsLower.some(tag => tag.includes(keyword))) {
        scores[bucketName]++;
        totalMatches++;
      }
    }
  }

  // If no keywords matched any bucket at all, assign to the predefined default
  if (totalMatches === 0) {
    return defaultBucket;
  }

  let maxScore = 0;
  let bestBuckets: string[] = [];

  // Find max score among the available buckets
  for (const bucketName of availableBucketNames) {
    const score = scores[bucketName] || 0;
    if (score > maxScore) {
      maxScore = score;
      bestBuckets = [bucketName];
    } else if (score === maxScore && maxScore > 0) {
      bestBuckets.push(bucketName);
    }
  }
  
  if (maxScore === 0) {
      return defaultBucket;
  }

  if (bestBuckets.length === 1) {
    return bestBuckets[0];
  }

  // Tie-breaking for multiple buckets with the same maxScore
  if (priorityList) {
    for (const priorityBucket of priorityList) {
      if (bestBuckets.includes(priorityBucket)) {
        return priorityBucket;
      }
    }
  }
  
  return bestBuckets.sort()[0]; 
}
