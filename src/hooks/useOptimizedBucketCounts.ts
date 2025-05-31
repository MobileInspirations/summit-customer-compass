
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the expected RPC return type
interface BucketCountResult {
  bucket: string;
  count: number;
}

type BucketKey = 'biz-op' | 'health' | 'survivalist' | 'cannot-place';

// Type guard to check if a string is a valid bucket key
const isBucketKey = (key: string): key is BucketKey => {
  return ['biz-op', 'health', 'survivalist', 'cannot-place'].includes(key);
};

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async (): Promise<Record<BucketKey, number>> => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Initialize bucket counts with explicit typing
      const bucketCounts = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      } as Record<BucketKey, number>;

      // Get total count first for verification
      const { count: totalCount, error: countError } = await supabase
        .from("contacts")
        .select("*", { count: 'exact', head: true });

      if (countError) {
        console.error("Error getting total count:", countError);
        throw countError;
      }

      console.log('Total contacts in database:', totalCount);

      // Try to use RPC function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_bucket_counts');

      if (!rpcError && rpcData) {
        // Process RPC results with explicit typing
        console.log('Using RPC function for bucket counts');
        
        // Type the RPC data properly
        const bucketStats = rpcData as BucketCountResult[];
        
        if (Array.isArray(bucketStats)) {
          for (const stat of bucketStats) {
            if (stat && typeof stat.bucket === 'string' && typeof stat.count === 'number') {
              if (isBucketKey(stat.bucket)) {
                bucketCounts[stat.bucket] = stat.count;
              }
            }
          }
        }

        console.log('RPC bucket counts:', bucketCounts);
        return bucketCounts;
      }

      // Fallback: Manual counting
      console.warn("RPC function not available, falling back to manual counting:", rpcError);
      
      // Fetch all main_bucket values in batches
      const allBuckets: string[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
        const { data: batch, error: fetchError } = await supabase
          .from("contacts")
          .select("main_bucket")
          .range(from, from + batchSize - 1);

        if (fetchError) {
          console.error("Error fetching bucket batch:", fetchError);
          throw fetchError;
        }

        if (!batch || batch.length === 0) {
          break;
        }

        // Filter out null/undefined values and add to allBuckets
        const validBuckets = batch
          .map(contact => contact.main_bucket)
          .filter((bucket): bucket is string => bucket !== null && bucket !== undefined);
        
        allBuckets.push(...validBuckets);
        console.log(`Fetched bucket batch: ${batch.length} (total: ${allBuckets.length})`);

        if (batch.length < batchSize) {
          break;
        }

        from += batchSize;
      }

      // Count buckets manually
      for (const bucket of allBuckets) {
        if (!bucket) continue;
        
        const normalizedBucket = bucket.toLowerCase().trim();
        
        if (normalizedBucket === 'biz-op' || 
            normalizedBucket === 'biz' || 
            normalizedBucket === 'business operations' || 
            normalizedBucket === 'business-operations' ||
            normalizedBucket === 'business_operations' ||
            normalizedBucket === 'businessoperations') {
          bucketCounts['biz-op']++;
        } else if (normalizedBucket === 'health' || normalizedBucket === 'health and wellness') {
          bucketCounts['health']++;
        } else if (normalizedBucket === 'survivalist' || normalizedBucket === 'survival' || normalizedBucket === 'emergency preparedness') {
          bucketCounts['survivalist']++;
        } else if (normalizedBucket === 'cannot-place' || normalizedBucket === 'cannot place' || normalizedBucket === 'unassigned') {
          bucketCounts['cannot-place']++;
        } else {
          console.log('Unknown bucket value:', bucket, '- assigning to biz-op');
          bucketCounts['biz-op']++;
        }
      }

      console.log('Final optimized bucket counts:', bucketCounts);
      console.log('Total counted contacts:', Object.values(bucketCounts).reduce((sum, count) => sum + count, 0));
      
      return bucketCounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
