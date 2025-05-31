
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
        try {
          // First, try to find the category by exact name match
          let { data: category, error: categoryError } = await supabase
            .from('customer_categories')
            .select('id')
            .eq('name', bucket.name)
            .maybeSingle();

          // If not found by name, try finding by bucket ID pattern
          if (!category) {
            const { data: categoryById, error: categoryByIdError } = await supabase
              .from('customer_categories')
              .select('id')
              .ilike('name', `%${bucket.id}%`)
              .maybeSingle();
            
            if (categoryById) {
              category = categoryById;
            }
          }

          if (!category) {
            console.log(`No category found for bucket: ${bucket.name} (${bucket.id})`);
            bucketCounts[bucket.id] = 0;
            continue;
          }

          // Get all contact_category records for this category
          const { data: contactCategories, error: countError } = await supabase
            .from('contact_categories')
            .select('contact_id')
            .eq('category_id', category.id);

          if (countError) {
            console.error('Error counting contacts for bucket:', bucket.id, countError);
            bucketCounts[bucket.id] = 0;
          } else {
            // Count unique contact IDs
            const uniqueContactIds = new Set(contactCategories?.map(cc => cc.contact_id) || []);
            bucketCounts[bucket.id] = uniqueContactIds.size;
            console.log(`Bucket ${bucket.id}: ${contactCategories?.length || 0} total records, ${uniqueContactIds.size} unique contacts`);
          }
        } catch (error) {
          console.error(`Error processing bucket ${bucket.id}:`, error);
          bucketCounts[bucket.id] = 0;
        }
      }

      console.log('Final unique bucket counts calculated:', bucketCounts);
      return bucketCounts;
    },
  });
};
