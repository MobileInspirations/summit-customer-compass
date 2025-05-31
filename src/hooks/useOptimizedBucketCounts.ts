
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the expected RPC return type
interface BucketCountResult {
  bucket: string;
  count: number;
}

type BucketKey = 'biz-op' | 'health' | 'survivalist' | 'cannot-place';

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async (): Promise<Record<BucketKey, number>> => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Initialize bucket counts
      const bucketCounts: Record<BucketKey, number> = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      };

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
      const { data: bucketStats, error: rpcError } = await supabase
        .rpc('get_bucket_counts');

      if (!rpcError && bucketStats) {
        // Process RPC results
        console.log('Using RPC function for bucket counts');
        
        if (Array.isArray(bucketStats)) {
          bucketStats.forEach((stat: any) => {
            if (stat && typeof stat.bucket === 'string' && typeof stat.count === 'number') {
              const bucketKey = stat.bucket as BucketKey;
              if (bucketKey in bucketCounts) {
                bucketCounts[bucketKey] = stat.count;
              }
            }
          });
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
