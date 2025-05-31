import { supabase } from "@/integrations/supabase/client";
import { assignContactsToBucket, type MainBucketId } from "../bucketCategorizationService";
import { categorizeNewContacts } from "../helpers/newContactCategorization";
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

  // Phase 1: Upload and merge contacts (50-85% of progress)
  const uploadPhaseStart = 50;
  const uploadPhaseEnd = 85; // Reduced to give more time for categorization
  const uploadPhaseRange = uploadPhaseEnd - uploadPhaseStart;

  for (const bucket of allBuckets) {
    const contacts = contactsByBucket[bucket];
    if (contacts.length === 0) {
      console.log(`Skipping empty bucket: ${bucket}`);
      continue;
    }

    console.log(`=== Processing ${contacts.length} contacts for ${bucket} bucket ===`);
    onProgress(uploadPhaseStart + Math.round((totalProcessed / totalContacts) * uploadPhaseRange));

    // Merge contacts by email, combining data from multiple entries
    console.log('Merging contacts by email...');
    const mergedContacts = mergeContactsByEmail(contacts);
    const contactsToUpload = Object.values(mergedContacts);
    console.log(`After merging: ${contactsToUpload.length} unique contacts`);

    // Use larger batches for faster processing
    const batchSize = 250; // Increased batch size significantly
    const uploadedEmails: string[] = [];

    console.log(`Starting batch upload with batch size: ${batchSize}`);
    for (let i = 0; i < contactsToUpload.length; i += batchSize) {
      const batch = contactsToUpload.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(contactsToUpload.length / batchSize);
      
      console.log(`Processing batch ${batchNumber} of ${totalBatches} (${batch.length} contacts)`);
      
      try {
        await upsertContactBatch(batch);
        uploadedEmails.push(...batch.map(c => c.email));
        totalProcessed += batch.length;

        // Update progress less frequently for better performance
        if (batchNumber % 2 === 0 || batchNumber === totalBatches) { // Every 2nd batch or last batch
          const currentProgress = uploadPhaseStart + Math.round((totalProcessed / totalContacts) * uploadPhaseRange);
          onProgress(currentProgress);
          console.log(`Progress: ${currentProgress}% (${totalProcessed}/${totalContacts} contacts)`);
        }
        
      } catch (error) {
        console.error(`Error upserting batch ${batchNumber}:`, error);
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
      }

      console.log(`Completed batch ${batchNumber}, total processed: ${totalProcessed}`);
    }

    // Assign contacts to their respective buckets with chunked approach
    console.log(`=== Assigning ${uploadedEmails.length} contacts to ${bucket} bucket ===`);
    try {
      await assignContactsToBucketChunked(uploadedEmails, bucket);
      console.log(`Successfully assigned ${uploadedEmails.length} contacts to ${bucket} bucket`);
    } catch (error) {
      console.error(`Error assigning contacts to ${bucket} bucket:`, error);
    }
  }

  // Phase 2: Fast Categorization (85-100% of progress)
  console.log('=== Starting fast categorization phase ===');
  onProgress(90);
  try {
    const allUploadedEmails = Object.values(contactsByBucket)
      .flat()
      .map(contact => contact.email);
    console.log(`Starting fast categorization for ${allUploadedEmails.length} contacts`);
    await categorizeNewContacts(allUploadedEmails);
    console.log('Fast categorization completed successfully');
    onProgress(100);
  } catch (error) {
    console.error('Error during categorization:', error);
    onProgress(95); // Still show progress even if categorization fails
  }
  
  console.log('=== uploadContactsInBatches completed ===');
};

const upsertContactBatch = async (contacts: ProcessedContact[]): Promise<void> => {
  console.log(`Batch upserting ${contacts.length} contacts...`);
  
  // Fetch existing contacts in chunks to avoid URL length limits
  const emails = contacts.map(c => c.email);
  const existingContacts = await fetchContactsInChunks(emails);
  
  const existingContactsMap = new Map(
    existingContacts.map(contact => [contact.email, contact])
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

const fetchContactsInChunks = async (emails: string[]): Promise<any[]> => {
  const chunkSize = 50; // Safe chunk size for URL length
  const allContacts: any[] = [];
  
  console.log(`Fetching ${emails.length} contacts in chunks of ${chunkSize}`);
  
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    console.log(`Fetching chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(emails.length / chunkSize)}`);
    
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .in('email', chunk);

      if (error) {
        console.error('Error fetching contact chunk:', error);
        throw error;
      }

      if (contacts) {
        allContacts.push(...contacts);
      }
    } catch (error) {
      console.error(`Error fetching contacts chunk ${i}-${i + chunkSize}:`, error);
      throw error;
    }
  }
  
  console.log(`Successfully fetched ${allContacts.length} existing contacts`);
  return allContacts;
};

const assignContactsToBucketChunked = async (
  contactEmails: string[],
  bucketId: MainBucketId
): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Assigning ${contactEmails.length} contacts to bucket: ${bucketId}`);

  // First, get the bucket category ID
  const { MAIN_BUCKETS } = await import("../bucketCategorizationService");
  const bucket = MAIN_BUCKETS[bucketId];
  const { data: category, error: categoryError } = await supabase
    .from('customer_categories')
    .select('id')
    .eq('name', bucket.name)
    .single();

  if (categoryError || !category) {
    console.error('Error finding bucket category:', categoryError);
    throw new Error(`Could not find bucket: ${bucket.name}`);
  }

  // Get contact IDs in chunks to avoid URL length limits
  const chunkSize = 50;
  const allContactIds: string[] = [];
  
  for (let i = 0; i < contactEmails.length; i += chunkSize) {
    const chunk = contactEmails.slice(i, i + chunkSize);
    console.log(`Fetching contact IDs for chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(contactEmails.length / chunkSize)}`);
    
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .in('email', chunk);

    if (contactsError) {
      console.error('Error fetching contact IDs:', contactsError);
      throw contactsError;
    }

    if (contacts && contacts.length > 0) {
      allContactIds.push(...contacts.map(c => c.id));
    }
  }

  if (allContactIds.length > 0) {
    // Create contact-category relationships in chunks
    const relationshipChunkSize = 1000;
    
    for (let i = 0; i < allContactIds.length; i += relationshipChunkSize) {
      const chunk = allContactIds.slice(i, i + relationshipChunkSize);
      const contactCategoryRecords = chunk.map(contactId => ({
        contact_id: contactId,
        category_id: category.id
      }));

      const { error: assignError } = await supabase
        .from('contact_categories')
        .upsert(contactCategoryRecords, { 
          onConflict: 'contact_id,category_id',
          ignoreDuplicates: true 
        });

      if (assignError) {
        console.error('Error assigning contacts to bucket:', assignError);
        throw assignError;
      }
      
      console.log(`Assigned chunk of ${chunk.length} contacts to ${bucket.name}`);
    }

    console.log(`Successfully assigned ${allContactIds.length} contacts to ${bucket.name}`);
  }
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
