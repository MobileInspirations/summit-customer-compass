
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

    // Upload in larger batches of 1000 for better performance
    const batchSize = 1000;
    const uploadedEmails: string[] = [];

    console.log(`Starting batch upload with batch size: ${batchSize}`);
    for (let i = 0; i < contactsToUpload.length; i += batchSize) {
      const batch = contactsToUpload.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(contactsToUpload.length / batchSize)} (${batch.length} contacts)`);
      
      try {
        await upsertContactBatch(batch);
        uploadedEmails.push(...batch.map(c => c.email));
        totalProcessed += batch.length;

        // Update progress
        const progress = 50 + (totalProcessed / totalContacts) * 30;
        onProgress(Math.round(progress));
        console.log(`Progress: ${Math.round(progress)}% (${totalProcessed}/${totalContacts})`);
      } catch (error) {
        console.error(`Error upserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Try individual fallback for this batch
        console.log('Falling back to individual processing for this batch...');
        for (const contact of batch) {
          try {
            await upsertContactWithProperMerging(contact);
            uploadedEmails.push(contact.email);
            totalProcessed++;
          } catch (individualError) {
            console.error(`Error upserting contact ${contact.email}:`, individualError);
          }
        }
        
        const progress = 50 + (totalProcessed / totalContacts) * 30;
        onProgress(Math.round(progress));
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

const upsertContactBatch = async (contacts: ProcessedContact[]): Promise<void> => {
  console.log(`Batch upserting ${contacts.length} contacts...`);
  
  // First, fetch existing contacts to determine merge strategy
  const emails = contacts.map(c => c.email);
  const { data: existingContacts, error: fetchError } = await supabase
    .from('contacts')
    .select('*')
    .in('email', emails);

  if (fetchError) {
    console.error('Error fetching existing contacts:', fetchError);
    throw fetchError;
  }

  const existingContactsMap = new Map(
    (existingContacts || []).map(contact => [contact.email, contact])
  );

  // Prepare contacts for upsert with proper merging
  const contactsToUpsert = contacts.map(contact => {
    const existingContact = existingContactsMap.get(contact.email);
    
    if (existingContact) {
      // Merge with existing data
      const existingSummitHistory = existingContact.summit_history || [];
      const existingTags = existingContact.tags || [];
      
      return {
        email: contact.email,
        full_name: contact.name || existingContact.full_name,
        company: contact.company || existingContact.company,
        summit_history: [...new Set([...existingSummitHistory, ...contact.summit_history])],
        engagement_level: contact.engagement_level || existingContact.engagement_level,
        tags: [...new Set([...existingTags, ...contact.tags])]
      };
    } else {
      // New contact
      return {
        email: contact.email,
        full_name: contact.name || null,
        company: contact.company || null,
        summit_history: contact.summit_history,
        engagement_level: contact.engagement_level,
        tags: contact.tags
      };
    }
  });

  console.log(`Upserting ${contactsToUpsert.length} contacts in batch...`);

  // Perform batch upsert
  const { error } = await supabase
    .from('contacts')
    .upsert(contactsToUpsert, { 
      onConflict: 'email',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error in batch upsert:', error);
    throw error;
  }

  console.log(`Successfully batch upserted ${contactsToUpsert.length} contacts`);
};

const upsertContactWithProperMerging = async (contact: ProcessedContact): Promise<void> => {
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
    // Merge with existing data - UPDATE scenario
    console.log(`Updating existing contact: ${contact.email}`);
    
    // Merge summit history and tags intelligently
    const existingSummitHistory = existingContact.summit_history || [];
    const existingTags = existingContact.tags || [];
    
    finalContact = {
      email: contact.email,
      full_name: contact.name || existingContact.full_name,
      company: contact.company || existingContact.company,
      summit_history: [...new Set([...existingSummitHistory, ...contact.summit_history])],
      engagement_level: contact.engagement_level || existingContact.engagement_level,
      tags: [...new Set([...existingTags, ...contact.tags])]
    };
    
    console.log(`Merging data for ${contact.email}:`, {
      existingSummitHistory: existingSummitHistory.length,
      newSummitHistory: contact.summit_history.length,
      finalSummitHistory: finalContact.summit_history.length,
      existingTags: existingTags.length,
      newTags: contact.tags.length,
      finalTags: finalContact.tags.length
    });
  } else {
    // New contact - CREATE scenario
    console.log(`Creating new contact: ${contact.email}`);
    finalContact = {
      email: contact.email,
      full_name: contact.name || null,
      company: contact.company || null,
      summit_history: contact.summit_history,
      engagement_level: contact.engagement_level,
      tags: contact.tags
    };
    
    console.log(`New contact data for ${contact.email}:`, {
      summitHistory: finalContact.summit_history.length,
      tags: finalContact.tags.length,
      engagementLevel: finalContact.engagement_level
    });
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

  console.log(`Successfully ${existingContact ? 'updated' : 'created'} contact: ${contact.email}`);
};
