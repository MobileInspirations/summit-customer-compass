
import { supabase } from "@/integrations/supabase/client";
import { categorizeNewContacts } from "./contactCategorizationService";
import { ensureMainBucketsExist, assignContactsToBucket, type MainBucketId } from "./bucketCategorizationService";

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

  // Ensure main buckets exist
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
  const uploadedEmails: string[] = [];
  
  for (let i = 0; i < uniqueContacts.length; i += batchSize) {
    const batch = uniqueContacts.slice(i, i + batchSize);
    
    // Prepare data for insertion
    const contactsToInsert = batch.map(contact => ({
      email: contact.email,
      full_name: contact.name || null,
      company: contact.company || null,
      summit_history: contact.summit_history ? contact.summit_history.split(';').filter(Boolean) : []
    }));

    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}:`, contactsToInsert);

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

    // Track uploaded emails for categorization
    uploadedEmails.push(...batch.map(c => c.email));

    processed += batch.length;
    onProgress(15 + (processed / uniqueContacts.length) * 35); // 15-50% for upload
  }

  console.log('Assigning contacts to main bucket...');
  onProgress(50);

  try {
    // Assign contacts to the selected main bucket
    await assignContactsToBucket(uploadedEmails, selectedBucket);
    console.log('Main bucket assignment completed');
  } catch (error) {
    console.error('Error during bucket assignment:', error);
    // Don't fail the entire upload if bucket assignment fails
  }

  onProgress(70);

  console.log('Starting automatic categorization...');

  try {
    // Automatically categorize the uploaded contacts
    await categorizeNewContacts(uploadedEmails);
    console.log('Automatic categorization completed');
  } catch (error) {
    console.error('Error during categorization:', error);
    // Don't fail the entire upload if categorization fails
  }

  onProgress(100);
};
