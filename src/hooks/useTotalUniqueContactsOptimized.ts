
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTotalUniqueContactsOptimized = () => {
  return useQuery({
    queryKey: ["total-unique-contacts-optimized"],
    queryFn: async () => {
      // Use database aggregation for better performance
      const { data: uniqueContacts, error } = await supabase
        .from('contact_categories')
        .select('contact_id')
        .not('contact_id', 'is', null);

      if (error) {
        console.error('Error fetching contact categories:', error);
        return 0;
      }

      // Count unique contact_ids efficiently
      const uniqueContactIds = new Set(uniqueContacts?.map(cc => cc.contact_id) || []);
      const totalUniqueContacts = uniqueContactIds.size;
      
      console.log('Total unique categorized contacts (optimized):', totalUniqueContacts);
      return totalUniqueContacts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
