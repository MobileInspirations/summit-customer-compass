
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { shouldAssignToCategory } from "./categorizationLogic";
import { categorizeContactWithAI } from "../ai/openaiCategorizationService";

export const categorizeContactEnhanced = async (
  contact: ContactForCategorization, 
  categories: CategoryData[],
  useAI: boolean = false
): Promise<void> => {
  console.log(`=== Categorizing contact: ${contact.email} (AI: ${useAI}) ===`);
  
  const assignedCategories: string[] = [];

  try {
    // IMPORTANT: NEVER assign to main buckets during categorization - only during upload
    // Main buckets (Business Operations, Health, Survivalist) are set during upload and should NEVER be changed
    
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
        // Use summit history for AI categorization
        const contactSummitHistory = contact.summit_history || [];
        
        console.log('Sending to AI:', { contactSummitHistory });
        
        const aiCategoryName = await categorizeContactWithAI(contactSummitHistory, []);
        
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
      console.log(`Inserting ${assignedCategories.length} contact-category relationships (excluding main buckets - they remain unchanged)`);
      
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
        console.log(`Successfully assigned contact ${contact.email} to ${assignedCategories.length} non-main-bucket categories (main bucket unchanged)`);
      }
    } else {
      console.log(`No non-main-bucket categories matched for contact: ${contact.email} (main bucket remains unchanged)`);
    }

    // Mark contact as categorized
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        is_categorized: true,
        categorized_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error(`Error marking contact as categorized: ${contact.email}`, updateError);
    } else {
      console.log(`Marked contact ${contact.email} as categorized`);
    }

  } catch (error) {
    console.error(`Error in categorizeContactEnhanced for ${contact.email}:`, error);
    throw error;
  }
};
