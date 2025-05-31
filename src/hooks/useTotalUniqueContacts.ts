
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTotalUniqueContacts = () => {
  return useQuery({
    queryKey: ["total-unique-contacts"],
    queryFn: async () => {
      // Get count of unique contact IDs that are assigned to any category using count()
      const { count, error } = await supabase
        .from('contact_categories')
        .select('contact_id', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting categorized contacts:', error);
        return 0;
      }

      console.log('Total categorized contact records:', count || 0);
      
      // Now get unique contact count by selecting distinct contact_ids
      const { data: uniqueContacts, error: uniqueError } = await supabase
        .rpc('count_unique_categorized_contacts');

      if (uniqueError) {
        console.error('Error counting unique contacts, falling back to manual count:', uniqueError);
        
        // Fallback: get all contact_ids and count unique ones in JS
        const { data: allContactCategories, error: fallbackError } = await supabase
          .from('contact_categories')
          .select('contact_id')
          .not('contact_id', 'is', null);

        if (fallbackError) {
          console.error('Fallback error:', fallbackError);
          return 0;
        }

        const uniqueContactIds = new Set(allContactCategories?.map(cc => cc.contact_id) || []);
        const totalUniqueContacts = uniqueContactIds.size;
        
        console.log('Fallback - Total unique categorized contacts:', totalUniqueContacts);
        return totalUniqueContacts;
      }

      const totalUniqueContacts = uniqueContacts || 0;
      console.log('Total unique categorized contacts:', totalUniqueContacts);
      return totalUniqueContacts;
    },
  });
};
