
import { supabase } from "@/integrations/supabase/client";
import { assignContactsToBucket, type MainBucketId } from "../bucketCategorizationService";
import { categorizeNewContacts } from "../contactCategorizationService";
import { type ProcessedContact } from "./csvProcessor";
import { mergeContactsByEmail } from "./contactMerger";

export const uploadContactsInBatches = async (
  contactsByBucket: Record<MainBucketId, ProcessedContact[]>,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log('=== Starting uploadContactsInBatches ===');
  const allBuckets = Object.keys(contactsByBucket) as MainBucketId[];
  let totalProcessed = 0;
  const totalContacts = Object.values(contactsByBucket).reduce((sum, contacts) => sum + contacts.length, 0);
  
  console.log(`Total contacts to process: ${totalContacts}`);
  console.log('Contacts by bucket:', Object.keys(contactsByBucket).map(bucket => 
    `${bucket}: ${contactsByBucket[bucket as keyof typeof contactsByBucket].length}`
  ));

  for (const bucket of allBuckets) {
    const contacts = contactsByBucket[bucket];
    if (contacts.length === 0) {
      console.log(`Skipping empty bucket: ${bucket}`);
      continue;
    }

    console.log(`=== Processing ${contacts.length} contacts for ${bucket} bucket ===`);

    // Merge contacts by email, combining data from multiple entries
    console.log('Merging contacts by email...');
    const mergedContacts = mergeContactsByEmail(contacts);
    const contactsToUpload = Object.values(mergedContacts);
    console.log(`After merging: ${contactsToUpload.length} unique contacts`);

    // Upload in batches of 100 (reduced from 1000 for better progress tracking)
    const batchSize = 100;
    const uploadedEmails: string[] = [];

    console.log(`Starting batch upload with batch size: ${batchSize}`);
    for (let i = 0; i < contactsToUpload.length; i += batchSize) {
      const batch = contactsToUpload.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(contactsToUpload.length / batchSize)} (${batch.length} contacts)`);
      
      // Process each contact individually to handle updates properly
      for (let j = 0; j < batch.length; j++) {
        const contact = batch[j];
        try {
          console.log(`Upserting contact ${j + 1}/${batch.length}: ${contact.email}`);
          await upsertContactWithMerging(contact);
          uploadedEmails.push(contact.email);
          totalProcessed++;

          // Update progress more frequently
          const progress = 50 + (totalProcessed / totalContacts) * 30;
          onProgress(Math.round(progress));
          console.log(`Progress: ${Math.round(progress)}% (${totalProcessed}/${totalContacts})`);
        } catch (error) {
          console.error(`Error upserting contact ${contact.email}:`, error);
          // Continue with other contacts even if one fails
        }
      }

      console.log(`Completed batch ${Math.floor(i / batchSize) + 1}, total processed: ${totalProcessed}`);
    }

    // Assign contacts to their respective buckets
    console.log(`=== Assigning ${uploadedEmails.length} contacts to ${bucket} bucket ===`);
    try {
      await assignContactsToBucket(uploadedEmails, bucket);
      console.log(`Successfully assigned ${uploadedEmails.length} contacts to ${bucket} bucket`);
    } catch (error) {
      console.error(`Error assigning contacts to ${bucket} bucket:`, error);
    }
  }

  // Start categorization for all uploaded contacts
  console.log('=== Starting categorization phase ===');
  onProgress(85);
  try {
    const allUploadedEmails = Object.values(contactsByBucket)
      .flat()
      .map(contact => contact.email);
    console.log(`Starting categorization for ${allUploadedEmails.length} contacts`);
    await categorizeNewContacts(allUploadedEmails);
    console.log('Categorization completed successfully');
  } catch (error) {
    console.error('Error during categorization:', error);
  }
  
  console.log('=== uploadContactsInBatches completed ===');
};

const upsertContactWithMerging = async (contact: ProcessedContact): Promise<void> => {
  // First, check if contact exists
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', contact.email)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching existing contact:', fetchError);
    throw fetchError;
  }

  let finalContact;

  if (existingContact) {
    // Merge with existing data
    finalContact = {
      email: contact.email,
      full_name: contact.name || existingContact.full_name,
      company: contact.company || existingContact.company,
      summit_history: [...new Set([
        ...(existingContact.summit_history || []),
        ...contact.summit_history
      ])],
      engagement_level: contact.engagement_level || existingContact.engagement_level,
      tags: [...new Set([
        ...(existingContact.tags || []),
        ...contact.tags
      ])]
    };
    
    console.log(`Updating existing contact: ${contact.email}`);
  } else {
    // New contact
    finalContact = {
      email: contact.email,
      full_name: contact.name || null,
      company: contact.company || null,
      summit_history: contact.summit_history,
      engagement_level: contact.engagement_level,
      tags: contact.tags
    };
    
    console.log(`Creating new contact: ${contact.email}`);
  }

  // Upsert the contact
  const { error } = await supabase
    .from('contacts')
    .upsert(finalContact, { 
      onConflict: 'email',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error upserting contact:', error);
    throw error;
  }
};
