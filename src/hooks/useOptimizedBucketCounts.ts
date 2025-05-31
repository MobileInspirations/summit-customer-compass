
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the expected RPC return type
interface BucketCountResult {
  bucket: string;
  count: number;
}

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Initialize with explicit object
      const result = {
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
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_bucket_counts') as { data: BucketCountResult[] | null; error: any };

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        console.log('Using RPC function for bucket counts');
        
        for (const item of rpcData) {
          if (item && item.bucket && typeof item.count === 'number') {
            const bucket = item.bucket.toString();
            if (bucket === 'biz-op') result['biz-op'] = item.count;
            else if (bucket === 'health') result['health'] = item.count;
            else if (bucket === 'survivalist') result['survivalist'] = item.count;
            else if (bucket === 'cannot-place') result['cannot-place'] = item.count;
          }
        }

        console.log('RPC bucket counts:', result);
        return result;
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
          result['biz-op']++;
        } else if (normalizedBucket === 'health' || normalizedBucket === 'health and wellness') {
          result['health']++;
        } else if (normalizedBucket === 'survivalist' || normalizedBucket === 'survival' || normalizedBucket === 'emergency preparedness') {
          result['survivalist']++;
        } else if (normalizedBucket === 'cannot-place' || normalizedBucket === 'cannot place' || normalizedBucket === 'unassigned') {
          result['cannot-place']++;
        } else {
          console.log('Unknown bucket value:', bucket, '- assigning to biz-op');
          result['biz-op']++;
        }
      }

      console.log('Final optimized bucket counts:', result);
      console.log('Total counted contacts:', Object.values(result).reduce((sum, count) => sum + count, 0));
      
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
