
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBucketCounts = () => {
  return useQuery({
    queryKey: ["bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting bucket counts calculation ===');
      
      // Get all contacts with their main_bucket values
      const { data: allContacts, error } = await supabase
        .from("contacts")
        .select("main_bucket");

      if (error) {
        console.error("Error fetching contacts for bucket counts:", error);
        throw error;
      }

      console.log('Total contacts fetched for bucket counting:', allContacts?.length);
      console.log('Sample contact main_bucket values:', allContacts?.slice(0, 10).map(c => c.main_bucket));

      // Count contacts by main_bucket
      const bucketCounts: Record<string, number> = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      };

      allContacts?.forEach(contact => {
        const bucket = contact.main_bucket;
        console.log('Processing contact with bucket:', bucket);
        
        if (bucket === 'biz-op' || bucket === 'Business Operations') {
          bucketCounts['biz-op']++;
        } else if (bucket === 'health' || bucket === 'Health') {
          bucketCounts['health']++;
        } else if (bucket === 'survivalist' || bucket === 'Survivalist') {
          bucketCounts['survivalist']++;
        } else if (bucket === 'cannot-place' || bucket === 'Cannot Place') {
          bucketCounts['cannot-place']++;
        } else {
          console.warn('Unknown bucket value found:', bucket);
        }
      });

      console.log('Final bucket counts calculated:', bucketCounts);
      return bucketCounts;
    },
  });
};
