
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { shouldAssignToCategory } from "./categorizationLogic";
import { categorizeContactWithAI } from "../ai/openaiCategorizationService";
import { deduplicateTags } from "../utils/tagUtils";

export const categorizeContactEnhanced = async (
  contact: ContactForCategorization, 
  categories: CategoryData[],
  useAI: boolean = false
): Promise<void> => {
  console.log(`=== Categorizing contact: ${contact.email} (AI: ${useAI}) ===`);
  
  const assignedCategories: string[] = [];

  try {
    // First, assign to main buckets (Business Operations, Health, Survivalist) using existing logic
    const mainBuckets = categories.filter(cat => 
      cat.name === 'Business Operations' || 
      cat.name === 'Health' || 
      cat.name === 'Survivalist'
    );

    console.log(`Found ${mainBuckets.length} main buckets`);

    for (const category of mainBuckets) {
      if (shouldAssignToCategory(contact, category)) {
        assignedCategories.push(category.id);
        console.log(`Assigned to main bucket: ${category.name}`);
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

      console.log(`Checking ${otherCategories.length} other customer categories`);

      for (const category of otherCategories) {
        if (shouldAssignToCategory(contact, category)) {
          assignedCategories.push(category.id);
          console.log(`Also assigned to customer category: ${category.name}`);
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

      console.log(`No main bucket matched, checking ${otherCategories.length} other categories`);

      for (const category of otherCategories) {
        if (shouldAssignToCategory(contact, category)) {
          assignedCategories.push(category.id);
          console.log(`Assigned to other category: ${category.name}`);
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
      console.log('Starting AI personality categorization...');
      try {
        // Use deduplicated tags for AI categorization
        const contactTags = deduplicateTags(contact.tags, contact.summit_history);
        
        console.log('Sending to AI:', { contactTags });
        
        const aiCategoryName = await categorizeContactWithAI(contactTags, []);
        
        const aiCategory = categories.find(cat => 
          cat.name === aiCategoryName && cat.category_type === 'personality'
        );
        
        if (aiCategory) {
          assignedCategories.push(aiCategory.id);
          console.log(`AI assigned contact ${contact.email} to personality bucket: ${aiCategoryName}`);
        } else {
          console.warn(`AI returned category "${aiCategoryName}" but it was not found in personality categories`);
        }
      } catch (error) {
        console.error(`Error with AI categorization for ${contact.email}:`, error);
        // Fallback to existing personality categorization logic
        console.log('Falling back to rule-based personality categorization');
        const personalityCategories = categories.filter(cat => cat.category_type === 'personality');
        for (const category of personalityCategories) {
          if (shouldAssignToCategory(contact, category)) {
            assignedCategories.push(category.id);
            console.log(`Fallback assigned to personality category: ${category.name}`);
            break; // Only assign to one personality bucket
          }
        }
      }
    } else {
      // Use existing personality categorization logic
      console.log('Using rule-based personality categorization');
      const personalityCategories = categories.filter(cat => cat.category_type === 'personality');
      for (const category of personalityCategories) {
        if (shouldAssignToCategory(contact, category)) {
          assignedCategories.push(category.id);
          console.log(`Rule-based assigned to personality category: ${category.name}`);
          break; // Only assign to one personality bucket
        }
      }
    }

    // Insert contact-category relationships
    if (assignedCategories.length > 0) {
      console.log(`Inserting ${assignedCategories.length} contact-category relationships`);
      
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
        throw error;
      } else {
        console.log(`Successfully assigned contact ${contact.email} to ${assignedCategories.length} categories`);
      }
    } else {
      console.log(`No categories matched for contact: ${contact.email}`);
    }
  } catch (error) {
    console.error(`Error in categorizeContactEnhanced for ${contact.email}:`, error);
    throw error;
  }
};
