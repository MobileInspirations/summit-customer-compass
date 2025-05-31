
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
    // NEVER assign to main buckets during categorization - only during upload
    // Main buckets are: Business Operations, Health, Survivalist, Cannot Place
    
    // Only assign to other customer categories (not main buckets)
    const otherCustomerCategories = categories.filter(cat => 
      cat.name !== 'Business Operations' && 
      cat.name !== 'Health' && 
      cat.name !== 'Survivalist' &&
      cat.name !== 'Cannot Place' &&
      cat.category_type === 'customer'
    );

    console.log(`Checking ${otherCustomerCategories.length} non-main-bucket customer categories`);

    for (const category of otherCustomerCategories) {
      if (shouldAssignToCategory(contact, category)) {
        assignedCategories.push(category.id);
        console.log(`Assigned to customer category: ${category.name}`);
      }
    }

    // Handle personality type categorization
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

    // Insert contact-category relationships for non-main-bucket categories only
    if (assignedCategories.length > 0) {
      console.log(`Inserting ${assignedCategories.length} contact-category relationships (excluding main buckets)`);
      
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
        console.log(`Successfully assigned contact ${contact.email} to ${assignedCategories.length} non-main-bucket categories`);
      }
    } else {
      console.log(`No non-main-bucket categories matched for contact: ${contact.email}`);
    }
  } catch (error) {
    console.error(`Error in categorizeContactEnhanced for ${contact.email}:`, error);
    throw error;
  }
};
