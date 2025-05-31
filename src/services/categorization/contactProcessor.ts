
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { categorizeContactMandatoryBuckets, type ContactForRuleCategorization } from "../ruleBasedCategorizationService";

export const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: CategoryData[]
): Promise<void> => {
  console.log(`=== Categorizing contact: ${contact.email} ===`);
  console.log(`Contact tags:`, contact.tags);
  console.log(`Contact summit_history:`, contact.summit_history);
  console.log(`Raw contact data:`, contact);
  
  const assignedCategories: string[] = [];

  try {
    // Use the mandatory bucket categorization system
    const contactForRules: ContactForRuleCategorization = {
      id: contact.id,
      tags: contact.tags || contact.summit_history || []
    };

    console.log(`Prepared contact for rules:`, contactForRules);
    console.log(`Tags array length:`, contactForRules.tags?.length);
    console.log(`Individual tags:`, contactForRules.tags);

    const mandatoryResult = categorizeContactMandatoryBuckets(contactForRules);
    console.log(`Mandatory categorization for ${contact.email}: Main=${mandatoryResult.mainBucket}, Personality=${mandatoryResult.personalityBucket}`);

    // Find matching categories for the mandatory buckets
    const mainBucketCategory = categories.find(cat => 
      cat.name === mandatoryResult.mainBucket && cat.category_type === 'customer'
    );
    const personalityBucketCategory = categories.find(cat => 
      cat.name === mandatoryResult.personalityBucket && cat.category_type === 'personality'
    );

    console.log(`Available categories:`, categories.map(c => `${c.name} (${c.category_type})`));
    console.log(`Looking for main bucket: "${mandatoryResult.mainBucket}" with type "customer"`);
    console.log(`Looking for personality bucket: "${mandatoryResult.personalityBucket}" with type "personality"`);
    console.log(`Found main bucket category:`, mainBucketCategory);
    console.log(`Found personality bucket category:`, personalityBucketCategory);

    if (mainBucketCategory) {
      assignedCategories.push(mainBucketCategory.id);
      console.log(`Assigned to main bucket: ${mainBucketCategory.name}`);
    } else {
      console.warn(`Main bucket category not found: ${mandatoryResult.mainBucket}`);
      // Try to find "Cannot Place" as fallback
      const cannotPlaceCategory = categories.find(cat => 
        cat.name === 'Cannot Place' && cat.category_type === 'customer'
      );
      if (cannotPlaceCategory) {
        assignedCategories.push(cannotPlaceCategory.id);
        console.log(`Assigned to Cannot Place fallback`);
      }
    }

    if (personalityBucketCategory) {
      assignedCategories.push(personalityBucketCategory.id);
      console.log(`Assigned to personality bucket: ${personalityBucketCategory.name}`);
    } else {
      console.warn(`Personality bucket category not found: ${mandatoryResult.personalityBucket}`);
      // Try to find a default personality category
      const defaultPersonalityCategory = categories.find(cat => 
        cat.name === 'Entrepreneurship & Business Development' && cat.category_type === 'personality'
      );
      if (defaultPersonalityCategory) {
        assignedCategories.push(defaultPersonalityCategory.id);
        console.log(`Assigned to default personality category`);
      }
    }

    // Insert contact-category relationships
    if (assignedCategories.length > 0) {
      console.log(`Inserting ${assignedCategories.length} contact-category relationships for ${contact.email}`);
      
      // First, remove any existing categorizations for this contact
      const { error: deleteError } = await supabase
        .from('contact_categories')
        .delete()
        .eq('contact_id', contact.id);

      if (deleteError) {
        console.error(`Error removing existing categories for ${contact.email}:`, deleteError);
      }

      // Then insert the new categorizations
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
