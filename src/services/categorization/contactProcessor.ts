
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { shouldAssignToCategory } from "./categorizationLogic";

export const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: CategoryData[]
): Promise<void> => {
  const assignedCategories: string[] = [];

  for (const category of categories) {
    if (shouldAssignToCategory(contact, category)) {
      assignedCategories.push(category.id);
    }
  }

  // Insert contact-category relationships
  if (assignedCategories.length > 0) {
    const contactCategoryRecords = assignedCategories.map(categoryId => ({
      contact_id: contact.id,
      category_id: categoryId
    }));

    const { error } = await supabase
      .from('contact_categories')
      .upsert(contactCategoryRecords, { 
        onConflict: 'contact_id,category_id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error(`Error categorizing contact ${contact.email}:`, error);
    } else {
      console.log(`Assigned contact ${contact.email} to ${assignedCategories.length} categories`);
    }
  } else {
    // Log contacts that don't match any categories for debugging
    console.log(`No categories matched for contact: ${contact.email}`);
  }
};
