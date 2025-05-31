import { supabase } from "@/integrations/supabase/client";
import { ensureMainBucketsExist, type MainBucketId } from "./bucketCategorizationService";

interface CSVContact {
  email: string;
  name?: string;
  company?: string;
  summit_history?: string;
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
    acc[contact.email] = contact;
    return acc;
  }, {} as Record<string, CSVContact>);

  const uniqueContacts = Object.values(deduplicatedContacts);
  console.log(`After deduplication: ${uniqueContacts.length} unique contacts`);

  // Process contacts in batches of 5,000
  const batchSize = 5000;
  let processed = 0;
  
  for (let i = 0; i < uniqueContacts.length; i += batchSize) {
    const batch = uniqueContacts.slice(i, i + batchSize);
    
    // Prepare data for insertion
    const contactsToInsert = batch.map(contact => ({
      email: contact.email,
      full_name: contact.name || null,
      company: contact.company || null,
      summit_history: contact.summit_history ? contact.summit_history.split(';').filter(Boolean) : [],
      main_bucket: selectedBucket
    }));

    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}:`, contactsToInsert.length, 'contacts');

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
};
