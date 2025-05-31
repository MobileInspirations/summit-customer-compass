
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Simple interface for the expected response
interface BucketCount {
  bucket: string;
  count: number;
}

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Create a simple object to hold counts
      const counts = {
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

      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_bucket_counts');

      if (!rpcError && rpcData) {
        console.log('Using RPC function for bucket counts');
        console.log('RPC Data:', rpcData);
        
        // Process RPC data safely
        if (Array.isArray(rpcData)) {
          rpcData.forEach((item: any) => {
            if (item?.bucket && typeof item?.count === 'number') {
              const bucketName = String(item.bucket).toLowerCase();
              if (bucketName === 'biz-op') counts['biz-op'] = item.count;
              else if (bucketName === 'health') counts['health'] = item.count;
              else if (bucketName === 'survivalist') counts['survivalist'] = item.count;
              else if (bucketName === 'cannot-place') counts['cannot-place'] = item.count;
            }
          });
        }

        console.log('RPC bucket counts:', counts);
        return counts;
      }

      // Fallback: Manual counting
      console.warn("RPC function not available, falling back to manual counting:", rpcError);
      
      // Get all bucket values in one query
      const { data: allContacts, error: fetchError } = await supabase
        .from("contacts")
        .select("main_bucket");

      if (fetchError) {
        console.error("Error fetching contacts:", fetchError);
        throw fetchError;
      }

      // Count each bucket manually
      if (allContacts) {
        allContacts.forEach(contact => {
          if (contact.main_bucket) {
            const bucket = contact.main_bucket.toLowerCase().trim();
            
            if (bucket === 'biz-op' || bucket === 'biz' || bucket === 'business operations') {
              counts['biz-op']++;
            } else if (bucket === 'health' || bucket === 'health and wellness') {
              counts['health']++;
            } else if (bucket === 'survivalist' || bucket === 'survival') {
              counts['survivalist']++;
            } else if (bucket === 'cannot-place' || bucket === 'cannot place') {
              counts['cannot-place']++;
            } else {
              counts['biz-op']++; // Default unknown to biz-op
            }
          }
        });
      }

      console.log('Final bucket counts:', counts);
      return counts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
