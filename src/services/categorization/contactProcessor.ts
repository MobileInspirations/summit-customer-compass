
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { shouldAssignToCategory } from "./categorizationLogic";

export const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: CategoryData[]
): Promise<void> => {
  const assignedCategories: string[] = [];

  // First, try to assign to main buckets (Business Operations, Health, Survivalist)
  const mainBuckets = categories.filter(cat => 
    cat.name === 'Business Operations' || 
    cat.name === 'Health' || 
    cat.name === 'Survivalist'
  );

  for (const category of mainBuckets) {
    if (shouldAssignToCategory(contact, category)) {
      assignedCategories.push(category.id);
    }
  }

  // If assigned to main buckets, also check for other customer categories
  if (assignedCategories.length > 0) {
    const otherCategories = categories.filter(cat => 
      cat.name !== 'Business Operations' && 
      cat.name !== 'Health' && 
      cat.name !== 'Survivalist' &&
      cat.name !== 'Cannot Place'
    );

    for (const category of otherCategories) {
      if (shouldAssignToCategory(contact, category)) {
        assignedCategories.push(category.id);
      }
    }
  } else {
    // If no main bucket matched, try all other categories except "Cannot Place"
    const otherCategories = categories.filter(cat => 
      cat.name !== 'Business Operations' && 
      cat.name !== 'Health' && 
      cat.name !== 'Survivalist' &&
      cat.name !== 'Cannot Place'
    );

    for (const category of otherCategories) {
      if (shouldAssignToCategory(contact, category)) {
        assignedCategories.push(category.id);
      }
    }

    // If still no categories matched, assign to "Cannot Place" category
    if (assignedCategories.length === 0) {
      const cannotPlaceCategory = categories.find(cat => cat.name === 'Cannot Place');
      if (cannotPlaceCategory) {
        assignedCategories.push(cannotPlaceCategory.id);
        console.log(`Assigned contact ${contact.email} to "Cannot Place" category`);
      } else {
        console.log(`No categories matched for contact: ${contact.email} and no "Cannot Place" category found`);
      }
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
    // This should rarely happen now since we have the "Cannot Place" fallback
    console.log(`No categories matched for contact: ${contact.email}`);
  }
};
