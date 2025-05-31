import { supabase } from "@/integrations/supabase/client";
import { ensureMainBucketsExist, type MainBucketId } from "./bucketCategorizationService";

interface CSVContact {
  email: string;
  name?: string;
  company?: string;
  summit_history: string[];
}

export const uploadContacts = async (
  contacts: CSVContact[],
  selectedBucket: MainBucketId,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log(`Processing ${contacts.length} contacts for bucket: ${selectedBucket}...`);

  // Ensure main buckets exist (now just a placeholder since buckets are in contact table)
  await ensureMainBucketsExist();

  // First, deduplicate contacts by email (keep the last occurrence)
  const deduplicatedContacts = contacts.reduce((acc, contact) => {
    const existingContact = acc[contact.email];
    if (existingContact) {
      // Merge summit history when deduplicating
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

  // Process contacts in batches of 1000 for better performance with summit history
  const batchSize = 1000;
  let processed = 0;
  
  for (let i = 0; i < uniqueContacts.length; i += batchSize) {
    const batch = uniqueContacts.slice(i, i + batchSize);
    
    // Get emails for this batch to check existing contacts
    const batchEmails = batch.map(c => c.email);
    
    // Fetch existing contacts for this batch
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .in('email', batchEmails);

    if (fetchError) {
      console.error('Error fetching existing contacts:', fetchError);
      throw fetchError;
    }

    // Create a map of existing contacts
    const existingContactsMap = new Map(
      (existingContacts || []).map(contact => [contact.email, contact])
    );

    // Prepare data for insertion with proper summit history merging
    const contactsToInsert = batch.map(contact => {
      const existingContact = existingContactsMap.get(contact.email);
      
      if (existingContact) {
        // Merge summit history with existing contact
        const existingSummitHistory = existingContact.summit_history || [];
        const mergedSummitHistory = [...new Set([...existingSummitHistory, ...contact.summit_history])];
        
        console.log(`Merging summit history for ${contact.email}:`, {
          existing: existingSummitHistory.length,
          new: contact.summit_history.length,
          merged: mergedSummitHistory.length
        });
        
        return {
          email: contact.email,
          full_name: contact.name || existingContact.full_name,
          company: contact.company || existingContact.company,
          summit_history: mergedSummitHistory,
          main_bucket: selectedBucket,
          engagement_level: existingContact.engagement_level // Preserve existing engagement level
        };
      } else {
        // New contact
        return {
          email: contact.email,
          full_name: contact.name || null,
          company: contact.company || null,
          summit_history: contact.summit_history,
          main_bucket: selectedBucket
        };
      }
    });

    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}:`, contactsToInsert.length, 'contacts');
    console.log('Sample contact with summit history:', contactsToInsert[0]);

    // Insert batch with upsert to handle duplicates
    const { error } = await supabase
      .from('contacts')
      .upsert(contactsToInsert, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error inserting batch:', error);
      throw error;
    }

    processed += batch.length;
    onProgress(15 + (processed / uniqueContacts.length) * 85); // 15-100% for upload
  }

  onProgress(100);
  console.log('CSV upload completed - contacts assigned to selected bucket:', selectedBucket);
  console.log('Summit history has been properly merged for existing contacts');
};
