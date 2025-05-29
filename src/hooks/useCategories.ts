
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

      // Get contact counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const { count, error: countError } = await supabase
            .from("contact_categories")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id);

          if (countError) {
            console.error("Error counting contacts for category:", category.id, countError);
            return { ...category, count: 0 };
          }

          return { ...category, count: count || 0 };
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
