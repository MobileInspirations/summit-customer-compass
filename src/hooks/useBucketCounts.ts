
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_BUCKETS } from "@/services/bucketCategorizationService";

export const useBucketCounts = () => {
  return useQuery({
    queryKey: ["bucket-counts"],
    queryFn: async () => {
      const bucketCounts: Record<string, number> = {};

      // Get counts for each main bucket using the bucket ID to find the category
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
          
          // Use the category found by ID pattern
          const { count, error: countError } = await supabase
            .from('contact_categories')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryById.id);

          if (countError) {
            console.error('Error counting contacts for bucket:', bucket.id, countError);
            bucketCounts[bucket.id] = 0;
          } else {
            bucketCounts[bucket.id] = count || 0;
          }
          continue;
        }

        // Count contacts in this category
        const { count, error: countError } = await supabase
          .from('contact_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        if (countError) {
          console.error('Error counting contacts for bucket:', bucket.name, countError);
          bucketCounts[bucket.id] = 0;
        } else {
          bucketCounts[bucket.id] = count || 0;
        }
      }

      console.log('Bucket counts calculated:', bucketCounts);
      return bucketCounts;
    },
  });
};
