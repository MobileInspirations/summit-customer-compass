
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
    .from('categories')
    .select(`
      id,
      name,
      description,
      color,
      contact_categories!inner(count)
    `);

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  // Transform the data to include counts
  const categoriesWithCounts = categories?.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    color: category.color,
    count: category.contact_categories?.length || 0
  })) || [];

  console.log(`Fetched ${categoriesWithCounts.length} categories`);
  return categoriesWithCounts;
};
