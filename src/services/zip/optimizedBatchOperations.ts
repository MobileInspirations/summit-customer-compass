
import { supabase } from "@/integrations/supabase/client";
import { type ProcessedContact } from "./csvProcessor";
import { LargeScaleContactService } from "../optimized/largeScaleContactService";

export const upsertContactBatchOptimized = async (contacts: ProcessedContact[]): Promise<void> => {
  console.log(`Optimized batch upserting ${contacts.length} contacts...`);
  
  // Fetch existing contacts using optimized service
  const emails = contacts.map(c => c.email);
  const existingContacts = await LargeScaleContactService.fetchContactsInChunks(emails);
  
  const existingContactsMap = new Map(
    existingContacts.map(contact => [contact.email, contact])
  );

  // Prepare contacts for upsert with proper merging
  const contactsToUpsert = contacts.map(contact => {
    const existingContact = existingContactsMap.get(contact.email);
    
    if (existingContact) {
      const existingSummitHistory = existingContact.summit_history || [];
      
      return {
        email: contact.email,
        full_name: contact.name || existingContact.full_name,
        company: contact.company || existingContact.company,
        summit_history: [...new Set([...existingSummitHistory, ...contact.summit_history])],
        engagement_level: contact.engagement_level || existingContact.engagement_level,
        main_bucket: contact.bucket
      };
    } else {
      return {
        email: contact.email,
        full_name: contact.name || null,
        company: contact.company || null,
        summit_history: contact.summit_history,
        engagement_level: contact.engagement_level,
        main_bucket: contact.bucket
      };
    }
  });

  // Use optimized batch upsert
  await LargeScaleContactService.upsertContactsInBatches(contactsToUpsert);
  
  console.log(`Successfully optimized batch upserted ${contactsToUpsert.length} contacts`);
};
