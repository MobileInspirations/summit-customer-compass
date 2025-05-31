
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTotalUniqueContactsOptimized = () => {
  return useQuery({
    queryKey: ["total-unique-contacts-optimized"],
    queryFn: async () => {
      console.log('=== Calculating total unique categorized contacts ===');
      
      // Count distinct contacts that have category relationships
      const { data, error } = await supabase
        .from("contact_categories")
        .select("contact_id");

      if (error) {
        console.error("Error fetching contact relationships:", error);
        throw error;
      }

      if (!data) {
        console.log('No contact relationships found');
        return 0;
      }

      // Get unique contact IDs
      const uniqueContactIds = new Set(data.map(rel => rel.contact_id));
      const uniqueCount = uniqueContactIds.size;
      
      console.log(`Total relationship records: ${data.length}`);
      console.log(`Unique categorized contacts: ${uniqueCount}`);
      
      return uniqueCount;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
