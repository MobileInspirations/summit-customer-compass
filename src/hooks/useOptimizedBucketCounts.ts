
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Get total count first for verification
      const { count: totalCount, error: countError } = await supabase
        .from("contacts")
        .select("*", { count: 'exact', head: true });

      if (countError) {
        console.error("Error getting total count:", countError);
        throw countError;
      }

      console.log('Total contacts in database:', totalCount);

      // Use database aggregation with proper SQL
      const { data: bucketStats, error } = await supabase
        .rpc('get_bucket_counts');

      if (error) {
        console.warn("RPC function not available, falling back to manual counting:", error);
        
        // Fallback: Fetch all main_bucket values in batches
        let allBuckets: string[] = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
          const { data: batch, error: fetchError } = await supabase
            .from("contacts")
            .select("main_bucket")
            .not('main_bucket', 'is', null)
            .range(from, from + batchSize - 1);

          if (fetchError) {
            console.error("Error fetching bucket batch:", fetchError);
            throw fetchError;
          }

          if (!batch || batch.length === 0) {
            break;
          }

          allBuckets = allBuckets.concat(batch.map(contact => contact.main_bucket));
          console.log(`Fetched bucket batch: ${batch.length} (total: ${allBuckets.length})`);

          if (batch.length < batchSize) {
            break;
          }

          from += batchSize;
        }

        // Count buckets manually
        const bucketCounts: Record<string, number> = {
          'biz-op': 0,
          'health': 0,
          'survivalist': 0,
          'cannot-place': 0
        };

        allBuckets.forEach(bucket => {
          if (!bucket) return;
          
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
        });

        console.log('Final optimized bucket counts:', bucketCounts);
        console.log('Total counted contacts:', Object.values(bucketCounts).reduce((sum, count) => sum + count, 0));
        
        return bucketCounts;
      }

      // If RPC function exists, use its result
      const bucketCounts: Record<string, number> = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      };

      bucketStats?.forEach((stat: any) => {
        bucketCounts[stat.bucket] = stat.count;
      });

      console.log('RPC bucket counts:', bucketCounts);
      return bucketCounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
