
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  category_type: string;
  created_at: string;
  updated_at: string;
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
      color,
      category_type,
      created_at,
      updated_at
    `);

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  // Get contact counts for each category with pagination
  const categoriesWithCounts = await Promise.all(
    (categories || []).map(async (category) => {
      let totalCount = 0;
      let from = 0;
      const batchSize = 1000;

      while (true) {
        const { count, error: countError } = await supabase
          .from('contact_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .range(from, from + batchSize - 1);

        if (countError) {
          console.error('Error counting contacts for category:', category.id, countError);
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

      return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        color: category.color,
        category_type: category.category_type,
        created_at: category.created_at,
        updated_at: category.updated_at,
        count: totalCount
      };
    })
  );

  console.log(`Fetched ${categoriesWithCounts.length} categories with counts`);
  return categoriesWithCounts;
};
