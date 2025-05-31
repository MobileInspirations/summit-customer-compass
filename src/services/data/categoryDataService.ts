
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  count: number;
}

export const fetchAllCategories = async (): Promise<Category[]> => {
  console.log('Fetching all categories...');
  
  const { data: categories, error } = await supabase
    .from('customer_categories')
    .select(`
      id,
      name,
      description,
      color
    `);

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  // Get contact counts for each category
  const categoriesWithCounts = await Promise.all(
    (categories || []).map(async (category) => {
      const { count, error: countError } = await supabase
        .from('contact_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (countError) {
        console.error('Error counting contacts for category:', category.id, countError);
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          count: 0
        };
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        count: count || 0
      };
    })
  );

  console.log(`Fetched ${categoriesWithCounts.length} categories`);
  return categoriesWithCounts;
};
