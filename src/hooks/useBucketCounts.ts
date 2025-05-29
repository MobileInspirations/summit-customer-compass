
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_BUCKETS } from "@/services/bucketCategorizationService";

export const useBucketCounts = () => {
  return useQuery({
    queryKey: ["bucket-counts"],
    queryFn: async () => {
      const bucketCounts: Record<string, number> = {};

      // Get counts for each main bucket
      for (const bucket of Object.values(MAIN_BUCKETS)) {
        // First get the category ID for this bucket
        const { data: category, error: categoryError } = await supabase
          .from('customer_categories')
          .select('id')
          .eq('name', bucket.name)
          .single();

        if (categoryError || !category) {
          console.error('Error finding bucket category:', bucket.name, categoryError);
          bucketCounts[bucket.id] = 0;
          continue;
        }

        // Then count contacts in this category
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

      return bucketCounts;
    },
  });
};
