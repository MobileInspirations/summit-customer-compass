
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { categorizeContactMandatoryBuckets, type ContactForRuleCategorization } from "../ruleBasedCategorizationService";

export const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: CategoryData[]
): Promise<void> => {
  console.log(`=== Categorizing contact: ${contact.email} ===`);
  console.log(`Contact summit_history:`, contact.summit_history);
  console.log(`Raw contact data:`, contact);
  
  const assignedCategories: string[] = [];

  try {
    // IMPORTANT: Never assign to main buckets during categorization
    // Main buckets (Business Operations, Health, Survivalist) are set during upload and should never be changed
    
    // Use the mandatory bucket categorization system with summit history for personality buckets only
    const allTags = contact.summit_history || [];

    const contactForRules: ContactForRuleCategorization = {
      id: contact.id,
      tags: allTags.length > 0 ? allTags : null
    };

    console.log(`Prepared contact for rules:`, contactForRules);
    console.log(`Summit history tags array length:`, contactForRules.tags?.length);
    console.log(`Summit history tags:`, contactForRules.tags);

    const mandatoryResult = categorizeContactMandatoryBuckets(contactForRules);
    console.log(`Mandatory categorization for ${contact.email}: Main=${mandatoryResult.mainBucket}, Personality=${mandatoryResult.personalityBucket}`);

    // ONLY assign to personality bucket categories - NEVER main bucket categories
    const personalityBucketCategory = categories.find(cat => 
      cat.name === mandatoryResult.personalityBucket && cat.category_type === 'personality'
    );

    console.log(`Available categories:`, categories.map(c => `${c.name} (${c.category_type})`));
    console.log(`Looking for personality bucket: "${mandatoryResult.personalityBucket}" with type "personality"`);
    console.log(`Found personality bucket category:`, personalityBucketCategory);

    // DO NOT assign to main bucket categories - they are already set during upload
    console.log(`Skipping main bucket assignment - main bucket was set during upload and should not be changed`);

    if (personalityBucketCategory) {
      assignedCategories.push(personalityBucketCategory.id);
      console.log(`Assigned to personality bucket: ${personalityBucketCategory.name}`);
    } else {
      console.warn(`Personality bucket category not found: ${mandatoryResult.personalityBucket}`);
      // Try to find a default personality category - use the first one available
      const defaultPersonalityCategory = categories.find(cat => 
        cat.category_type === 'personality'
      );
      if (defaultPersonalityCategory) {
        assignedCategories.push(defaultPersonalityCategory.id);
        console.log(`Assigned to first available personality category: ${defaultPersonalityCategory.name}`);
      }
    }

    // Insert contact-category relationships ONLY for personality categories
    if (assignedCategories.length > 0) {
      console.log(`Inserting ${assignedCategories.length} contact-category relationships for ${contact.email} (personality categories only)`);
      
      // First, remove any existing categorizations for this contact (only personality categories)
      const { error: deleteError } = await supabase
        .from('contact_categories')
        .delete()
        .eq('contact_id', contact.id);

      if (deleteError) {
        console.error(`Error removing existing categories for ${contact.email}:`, deleteError);
      }

      // Then insert the new categorizations (only personality categories)
      const contactCategoryRecords = assignedCategories.map(categoryId => ({
        contact_id: contact.id,
        category_id: categoryId
      }));

      console.log(`About to insert:`, contactCategoryRecords);

      const { error } = await supabase
        .from('contact_categories')
        .insert(contactCategoryRecords);

      if (error) {
        console.error(`Error categorizing contact ${contact.email}:`, error);
        throw error;
      } else {
        console.log(`Successfully assigned contact ${contact.email} to ${assignedCategories.length} personality categories (main bucket unchanged)`);
      }
    } else {
      console.log(`No personality categories could be assigned for contact: ${contact.email} (main bucket remains unchanged)`);
    }
  } catch (error) {
    console.error(`Error in categorizeContact for ${contact.email}:`, error);
    throw error;
  }
};

export const categorizeContactBatch = async (
  contacts: ContactForCategorization[], 
  categories: CategoryData[]
): Promise<void> => {
  console.log(`Processing batch of ${contacts.length} contacts`);
  
  for (const contact of contacts) {
    await categorizeContact(contact, categories);
  }
  
  console.log(`Completed batch of ${contacts.length} contacts`);
};
