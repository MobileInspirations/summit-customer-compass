import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";
import { shouldAssignToCategory } from "./categorizationLogic";
import { categorizeContactMandatoryBuckets, type ContactForRuleCategorization } from "../ruleBasedCategorizationService";

export const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: CategoryData[]
): Promise<void> => {
  const assignedCategories: string[] = [];

  // First, apply rule-based mandatory bucket categorization
  const contactForRules: ContactForRuleCategorization = {
    id: contact.id,
    tags: contact.summit_history || contact.tags || []
  };

  const mandatoryResult = categorizeContactMandatoryBuckets(contactForRules);
  console.log(`Rule-based categorization for ${contact.email}: Main=${mandatoryResult.mainBucket}, Personality=${mandatoryResult.personalityBucket}`);

  // Find matching categories for the mandatory buckets
  const mainBucketCategory = categories.find(cat => cat.name === mandatoryResult.mainBucket);
  const personalityBucketCategory = categories.find(cat => cat.name === mandatoryResult.personalityBucket);

  if (mainBucketCategory) {
    assignedCategories.push(mainBucketCategory.id);
  }
  if (personalityBucketCategory) {
    assignedCategories.push(personalityBucketCategory.id);
  }

  // Then apply the existing logic-based categorization for additional categories
  for (const category of categories) {
    // Skip if already assigned via mandatory categorization
    if (assignedCategories.includes(category.id)) {
      continue;
    }

    if (shouldAssignToCategory(contact, category)) {
      assignedCategories.push(category.id);
    }
  }

  // If no categories were assigned at all, assign to "Cannot Place" category
  if (assignedCategories.length === 0) {
    const cannotPlaceCategory = categories.find(cat => cat.name === 'Cannot Place');
    if (cannotPlaceCategory) {
      assignedCategories.push(cannotPlaceCategory.id);
      console.log(`Assigned contact ${contact.email} to "Cannot Place" category`);
    } else {
      console.log(`No categories matched for contact: ${contact.email} and no "Cannot Place" category found`);
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
