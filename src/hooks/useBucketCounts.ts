
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_BUCKETS } from "@/services/bucketCategorizationService";

export const useBucketCounts = () => {
  return useQuery({
    queryKey: ["bucket-counts"],
    queryFn: async () => {
      const bucketCounts: Record<string, number> = {};

      // Get counts for each main bucket using unique contacts
      for (const bucket of Object.values(MAIN_BUCKETS)) {
        // Use the bucket ID directly to find the category (this matches how assignContactsToBucket works)
        const { data: category, error: categoryError } = await supabase
          .from('customer_categories')
          .select('id')
          .eq('name', bucket.name) // This should match the actual category name in the database
          .single();

        if (categoryError || !category) {
          console.error('Error finding bucket category:', bucket.name, categoryError);
          
          // Try to find by the bucket ID pattern instead
          const { data: categoryById, error: categoryByIdError } = await supabase
            .from('customer_categories')
            .select('id')
            .ilike('name', `%${bucket.id}%`)
            .single();
            
          if (categoryByIdError || !categoryById) {
            console.error('Error finding bucket category by ID pattern:', bucket.id, categoryByIdError);
            bucketCounts[bucket.id] = 0;
            continue;
          }
          
          // Count unique contacts in this category
          const { data: uniqueContacts, error: countError } = await supabase
            .from('contact_categories')
            .select('contact_id', { count: 'exact' })
            .eq('category_id', categoryById.id);

          if (countError) {
            console.error('Error counting contacts for bucket:', bucket.id, countError);
            bucketCounts[bucket.id] = 0;
          } else {
            // Count unique contact IDs
            const uniqueContactIds = new Set(uniqueContacts?.map(cc => cc.contact_id) || []);
            bucketCounts[bucket.id] = uniqueContactIds.size;
          }
          continue;
        }

        // Count unique contacts in this category
        const { data: uniqueContacts, error: countError } = await supabase
          .from('contact_categories')
          .select('contact_id', { count: 'exact' })
          .eq('category_id', category.id);

        if (countError) {
          console.error('Error counting contacts for bucket:', bucket.name, countError);
          bucketCounts[bucket.id] = 0;
        } else {
          // Count unique contact IDs
          const uniqueContactIds = new Set(uniqueContacts?.map(cc => cc.contact_id) || []);
          bucketCounts[bucket.id] = uniqueContactIds.size;
        }
      }

      console.log('Unique bucket counts calculated:', bucketCounts);
      return bucketCounts;
    },
  });
};
