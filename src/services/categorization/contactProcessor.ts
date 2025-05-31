
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { categorizeContactMandatoryBuckets, type ContactForRuleCategorization } from "../ruleBasedCategorizationService";

export const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: CategoryData[]
): Promise<void> => {
  console.log(`=== Categorizing contact: ${contact.email} ===`);
  
  const assignedCategories: string[] = [];

  try {
    // Use the mandatory bucket categorization system
    const contactForRules: ContactForRuleCategorization = {
      id: contact.id,
      tags: contact.tags || contact.summit_history || []
    };

    const mandatoryResult = categorizeContactMandatoryBuckets(contactForRules);
    console.log(`Mandatory categorization for ${contact.email}: Main=${mandatoryResult.mainBucket}, Personality=${mandatoryResult.personalityBucket}`);

    // Find matching categories for the mandatory buckets
    const mainBucketCategory = categories.find(cat => 
      cat.name === mandatoryResult.mainBucket && cat.category_type === 'customer'
    );
    const personalityBucketCategory = categories.find(cat => 
      cat.name === mandatoryResult.personalityBucket && cat.category_type === 'personality'
    );

    if (mainBucketCategory) {
      assignedCategories.push(mainBucketCategory.id);
      console.log(`Assigned to main bucket: ${mainBucketCategory.name}`);
    } else {
      console.warn(`Main bucket category not found: ${mandatoryResult.mainBucket}`);
    }

    if (personalityBucketCategory) {
      assignedCategories.push(personalityBucketCategory.id);
      console.log(`Assigned to personality bucket: ${personalityBucketCategory.name}`);
    } else {
      console.warn(`Personality bucket category not found: ${mandatoryResult.personalityBucket}`);
    }

    // If we still don't have categories, assign to "Cannot Place"
    if (assignedCategories.length === 0) {
      const cannotPlaceCategory = categories.find(cat => cat.name === 'Cannot Place');
      if (cannotPlaceCategory) {
        assignedCategories.push(cannotPlaceCategory.id);
        console.log(`Assigned contact ${contact.email} to "Cannot Place" category as fallback`);
      }
    }

    // Insert contact-category relationships
    if (assignedCategories.length > 0) {
      console.log(`Inserting ${assignedCategories.length} contact-category relationships for ${contact.email}`);
      
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
      console.error(`No categories could be assigned for contact: ${contact.email}`);
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
