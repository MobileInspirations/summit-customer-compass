
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { shouldAssignToCategory } from "./categorizationLogic";
import { categorizeContactWithAI } from "../ai/openaiCategorizationService";

export const categorizeContactEnhanced = async (
  contact: ContactForCategorization, 
  categories: CategoryData[],
  useAI: boolean = false
): Promise<void> => {
  const assignedCategories: string[] = [];

  // First, assign to main buckets (Business Operations, Health, Survivalist) using existing logic
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
      cat.name !== 'Cannot Place' &&
      cat.category_type === 'customer'
    );

    for (const category of otherCategories) {
      if (shouldAssignToCategory(contact, category)) {
        assignedCategories.push(category.id);
      }
    }
  } else {
    // If no main bucket matched, try all other customer categories except "Cannot Place"
    const otherCategories = categories.filter(cat => 
      cat.name !== 'Business Operations' && 
      cat.name !== 'Health' && 
      cat.name !== 'Survivalist' &&
      cat.name !== 'Cannot Place' &&
      cat.category_type === 'customer'
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
      }
    }
  }

  // Now handle personality type categorization
  if (useAI) {
    try {
      // Extract tags from summit history for AI processing
      const contactTags = contact.summit_history || [];
      const aiCategoryName = await categorizeContactWithAI(contactTags, contactTags);
      
      const aiCategory = categories.find(cat => 
        cat.name === aiCategoryName && cat.category_type === 'personality'
      );
      
      if (aiCategory) {
        assignedCategories.push(aiCategory.id);
        console.log(`AI assigned contact ${contact.email} to personality bucket: ${aiCategoryName}`);
      }
    } catch (error) {
      console.error(`Error with AI categorization for ${contact.email}:`, error);
      // Fallback to existing personality categorization logic
      const personalityCategories = categories.filter(cat => cat.category_type === 'personality');
      for (const category of personalityCategories) {
        if (shouldAssignToCategory(contact, category)) {
          assignedCategories.push(category.id);
          break; // Only assign to one personality bucket
        }
      }
    }
  } else {
    // Use existing personality categorization logic
    const personalityCategories = categories.filter(cat => cat.category_type === 'personality');
    for (const category of personalityCategories) {
      if (shouldAssignToCategory(contact, category)) {
        assignedCategories.push(category.id);
        break; // Only assign to one personality bucket
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
    console.log(`No categories matched for contact: ${contact.email}`);
  }
};
