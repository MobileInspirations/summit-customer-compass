
import { supabase } from "@/integrations/supabase/client";
import { ensureMainBucketsExist, type MainBucketId } from "../bucketCategorizationService";
import { LargeScaleContactService } from "./largeScaleContactService";

interface CSVContact {
  email: string;
  name?: string;
  company?: string;
  summit_history: string[];
}

export const uploadContactsOptimized = async (
  contacts: CSVContact[],
  selectedBucket: MainBucketId,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log(`Processing ${contacts.length} contacts for bucket: ${selectedBucket}...`);

  await ensureMainBucketsExist();

  // Deduplicate contacts by email
  const deduplicatedContacts = contacts.reduce((acc, contact) => {
    const existingContact = acc[contact.email];
    if (existingContact) {
      const mergedSummitHistory = [...new Set([...existingContact.summit_history, ...contact.summit_history])];
      acc[contact.email] = {
        ...contact,
        summit_history: mergedSummitHistory
      };
    } else {
      acc[contact.email] = contact;
    }
    return acc;
  }, {} as Record<string, CSVContact>);

  const uniqueContacts = Object.values(deduplicatedContacts);
  console.log(`After deduplication: ${uniqueContacts.length} unique contacts`);

  onProgress(10);

  // Get emails in chunks to check existing contacts
  const emails = uniqueContacts.map(c => c.email);
  const existingContacts = await LargeScaleContactService.fetchContactsInChunks(emails);
  
  console.log(`Found ${existingContacts.length} existing contacts`);
  onProgress(30);

  // Create a map of existing contacts
  const existingContactsMap = new Map(
    existingContacts.map(contact => [contact.email, contact])
  );

  // Prepare data for insertion with proper summit history merging
  const contactsToInsert = uniqueContacts.map(contact => {
    const existingContact = existingContactsMap.get(contact.email);
    
    if (existingContact) {
      const existingSummitHistory = existingContact.summit_history || [];
      const mergedSummitHistory = [...new Set([...existingSummitHistory, ...contact.summit_history])];
      
      return {
        email: contact.email,
        full_name: contact.name || existingContact.full_name,
        company: contact.company || existingContact.company,
        summit_history: mergedSummitHistory,
        main_bucket: selectedBucket,
        engagement_level: existingContact.engagement_level
      };
    } else {
      return {
        email: contact.email,
        full_name: contact.name || null,
        company: contact.company || null,
        summit_history: contact.summit_history,
        main_bucket: selectedBucket
      };
    }
  });

  onProgress(50);

  // Use optimized batch upsert
  await LargeScaleContactService.upsertContactsInBatches(
    contactsToInsert,
    {
      onProgress: (processed, total) => {
        const progressPercent = 50 + Math.round((processed / total) * 50);
        onProgress(progressPercent);
      }
    }
  );

  onProgress(100);
  console.log('Optimized CSV upload completed');
};
