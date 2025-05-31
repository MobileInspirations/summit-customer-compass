
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTotalUniqueContacts = () => {
  return useQuery({
    queryKey: ["total-unique-contacts"],
    queryFn: async () => {
      // Get all unique contact IDs that are assigned to any category
      const { data: categorizedContacts, error } = await supabase
        .from('contact_categories')
        .select('contact_id');

      if (error) {
        console.error('Error fetching categorized contacts:', error);
        return 0;
      }

      // Count unique contact IDs
      const uniqueContactIds = new Set(categorizedContacts?.map(cc => cc.contact_id) || []);
      const totalUniqueContacts = uniqueContactIds.size;
      
      console.log('Total unique categorized contacts:', totalUniqueContacts);
      return totalUniqueContacts;
    },
  });
};
