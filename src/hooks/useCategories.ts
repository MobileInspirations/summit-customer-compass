
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

      // Get contact counts for each category with pagination
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          let totalCount = 0;
          let from = 0;
          const batchSize = 1000;

          while (true) {
            const { count, error: countError } = await supabase
              .from("contact_categories")
              .select("*", { count: "exact", head: true })
              .eq("category_id", category.id)
              .range(from, from + batchSize - 1);

            if (countError) {
              console.error("Error counting contacts for category:", category.id, countError);
              break;
            }

            if (!count || count === 0) {
              break;
            }

            totalCount += count;

            // If we got less than the batch size, we've reached the end
            if (count < batchSize) {
              break;
            }

            from += batchSize;
          }

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
