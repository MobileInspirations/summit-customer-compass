
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBucketCounts = () => {
  return useQuery({
    queryKey: ["bucket-counts"],
    queryFn: async () => {
      console.log('=== Starting bucket counts calculation ===');
      
      // Get all contacts with pagination to handle large datasets
      let allContacts: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: contacts, error } = await supabase
          .from("contacts")
          .select("main_bucket")
          .range(from, from + batchSize - 1);

        if (error) {
          console.error("Error fetching contacts for bucket counts:", error);
          throw error;
        }

        if (!contacts || contacts.length === 0) {
          break; // No more contacts to fetch
        }

        allContacts = allContacts.concat(contacts);
        console.log(`Fetched batch: ${contacts.length} contacts (total so far: ${allContacts.length})`);

        // If we got less than the batch size, we've reached the end
        if (contacts.length < batchSize) {
          break;
        }

        from += batchSize;
      }

      console.log('Total contacts fetched for bucket counting:', allContacts.length);
      console.log('Sample contact main_bucket values:', allContacts.slice(0, 10).map(c => c.main_bucket));

      // Count contacts by main_bucket with comprehensive normalization
      const bucketCounts: Record<string, number> = {
        'biz-op': 0,
        'health': 0,
        'survivalist': 0,
        'cannot-place': 0
      };

      allContacts.forEach(contact => {
        const bucket = contact.main_bucket?.toLowerCase() || '';
        console.log('Processing contact with bucket:', bucket);
        
        // Comprehensive normalization for all business operations variants
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
          // For any unknown non-empty bucket, log it and count as biz-op since most uploads are business operations
          console.warn('Unknown bucket value found:', bucket, '- assigning to biz-op');
          bucketCounts['biz-op']++;
        }
      });

      console.log('Final bucket counts calculated:', bucketCounts);
      return bucketCounts;
    },
  });
};
