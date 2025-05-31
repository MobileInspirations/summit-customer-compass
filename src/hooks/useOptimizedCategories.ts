
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type OptimizedCategory = Tables<"customer_categories"> & {
  count: number;
};

const BATCH_SIZE = 2000; // Increased batch size for efficiency

export const useOptimizedCategories = () => {
  return useQuery({
    queryKey: ["optimized-categories"],
    queryFn: async () => {
      console.log('=== Starting optimized category fetch ===');
      
      // First, get all categories
      const { data: categories, error } = await supabase
        .from("customer_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      if (!categories || categories.length === 0) {
        return [];
      }

      // Get all contact-category relationships in batches
      let allRelationships: { category_id: string; contact_id: string }[] = [];
      let from = 0;

      while (true) {
        const { data: batch, error: fetchError } = await supabase
          .from("contact_categories")
          .select("category_id, contact_id")
          .range(from, from + BATCH_SIZE - 1);

        if (fetchError) {
          console.error("Error fetching contact relationships:", fetchError);
          break;
        }

        if (!batch || batch.length === 0) {
          break;
        }

        allRelationships = allRelationships.concat(batch);
        console.log(`Fetched relationship batch: ${batch.length} (total: ${allRelationships.length})`);

        if (batch.length < BATCH_SIZE) {
          break;
        }

        from += BATCH_SIZE;
      }

      // Count relationships by category_id
      const categoryCountMap = new Map<string, number>();
      
      allRelationships.forEach(rel => {
        const currentCount = categoryCountMap.get(rel.category_id) || 0;
        categoryCountMap.set(rel.category_id, currentCount + 1);
      });

      // Combine categories with their counts
      const categoriesWithCounts = categories.map(category => ({
        ...category,
        count: categoryCountMap.get(category.id) || 0
      }));

      console.log(`Processed ${categories.length} categories with relationship counts`);
      return categoriesWithCounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useOptimizedCategoriesByType = (type: "customer" | "personality") => {
  const { data: categories, isLoading, error } = useOptimizedCategories();
  
  const filteredCategories = categories?.filter(cat => cat.category_type === type) || [];
  
  return {
    data: filteredCategories,
    isLoading,
    error
  };
};
