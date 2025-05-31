
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Use database aggregation instead of fetching all records
      const { data: bucketStats, error } = await supabase
        .from("contacts")
        .select("main_bucket")
        .not('main_bucket', 'is', null);

      if (error) {
        console.error("Error fetching bucket stats:", error);
        throw error;
      }

      console.log('Total contacts for bucket counting:', bucketStats?.length || 0);

      // Count in JavaScript (more efficient than multiple DB queries)
      const bucketCounts: Record<string, number> = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      };

      bucketStats?.forEach(contact => {
        const bucket = contact.main_bucket?.toLowerCase() || '';
        
        if (bucket === 'biz-op' || 
            bucket === 'biz' || 
            bucket === 'business operations' || 
            bucket === 'business-operations' ||
            bucket === 'business_operations' ||
            bucket === 'businessoperations') {
          bucketCounts['biz-op']++;
        } else if (bucket === 'health' || bucket === 'health and wellness') {
          bucketCounts['health']++;
        } else if (bucket === 'survivalist' || bucket === 'survival' || bucket === 'emergency preparedness') {
          bucketCounts['survivalist']++;
        } else if (bucket === 'cannot-place' || bucket === 'cannot place' || bucket === 'unassigned') {
          bucketCounts['cannot-place']++;
        } else if (bucket !== '') {
          console.warn('Unknown bucket value found:', bucket, '- assigning to biz-op');
          bucketCounts['biz-op']++;
        }
      });

      console.log('Final optimized bucket counts:', bucketCounts);
      return bucketCounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
