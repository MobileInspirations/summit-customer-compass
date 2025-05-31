
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

  // Get contact counts for each category by actually fetching all relationship records
  const categoriesWithCounts = await Promise.all(
    (categories || []).map(async (category) => {
      console.log(`Counting contacts for category: ${category.name} (${category.id})`);
      
      // Fetch all contact_categories records for this category in batches
      let allRelationships: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
        const { data: batch, error: fetchError } = await supabase
          .from('contact_categories')
          .select('contact_id')
          .eq('category_id', category.id)
          .range(from, from + batchSize - 1);

        if (fetchError) {
          console.error('Error fetching contact relationships for category:', category.id, fetchError);
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
