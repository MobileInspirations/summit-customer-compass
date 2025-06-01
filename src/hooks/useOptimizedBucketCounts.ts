
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOptimizedBucketCounts = () => {
  return useQuery({
    queryKey: ["optimized-bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting optimized bucket counts calculation ===');
      
      // Initialize counts
      const counts = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      };

      try {
        // Get all main_bucket values in one query
        const { data: contacts, error } = await supabase
          .from("contacts")
          .select("main_bucket");

        if (error) {
          console.error("Error fetching contacts:", error);
          throw error;
        }

        if (!contacts) {
          console.log('No contacts found');
          return counts;
        }

        console.log(`Processing ${contacts.length} contacts for bucket counting`);

        // Count each bucket
        for (const contact of contacts) {
          if (contact.main_bucket) {
            const bucket = contact.main_bucket.toLowerCase().trim();
            
            if (bucket === 'biz-op') {
              counts['biz-op']++;
            } else if (bucket === 'health') {
              counts['health']++;
            } else if (bucket === 'survivalist') {
              counts['survivalist']++;
            } else if (bucket === 'cannot-place') {
              counts['cannot-place']++;
            } else {
              // Default unknown buckets to biz-op
              counts['biz-op']++;
            }
          }
        }

        console.log('Final bucket counts:', counts);
        return counts;

      } catch (error) {
        console.error('Error in bucket counting:', error);
        // Return zero counts on error
        return counts;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
