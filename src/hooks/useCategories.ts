
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"customer_categories"> & {
  count: number;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data: categories, error } = await supabase
        .from("customer_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      // Get contact counts for each category by actually fetching all relationship records
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          console.log(`Counting contacts for category: ${category.name} (${category.id})`);
          
          // Fetch all contact_categories records for this category in batches
          let allRelationships: any[] = [];
          let from = 0;
          const batchSize = 1000;

          while (true) {
            const { data: batch, error: fetchError } = await supabase
              .from("contact_categories")
              .select("contact_id")
              .eq("category_id", category.id)
              .range(from, from + batchSize - 1);

            if (fetchError) {
              console.error("Error fetching contact relationships for category:", category.id, fetchError);
              break;
            }

            if (!batch || batch.length === 0) {
              break;
            }

            allRelationships = allRelationships.concat(batch);
            console.log(`Fetched batch for ${category.name}: ${batch.length} relationships (total so far: ${allRelationships.length})`);

            // If we got less than the batch size, we've reached the end
            if (batch.length < batchSize) {
              break;
            }

            from += batchSize;
          }

          const totalCount = allRelationships.length;
          console.log(`Category ${category.name}: ${totalCount} contacts`);
          return { ...category, count: totalCount };
        })
      );

      return categoriesWithCounts;
    },
  });
};

export const useCategoriesByType = (type: "customer" | "personality") => {
  const { data: categories, isLoading, error } = useCategories();
  
  const filteredCategories = categories?.filter(cat => cat.category_type === type) || [];
  
  return {
    data: filteredCategories,
    isLoading,
    error
  };
};
