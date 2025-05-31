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

  // Phase 1: Upload and merge contacts (50-80% of progress)
  const uploadPhaseStart = 50;
  const uploadPhaseEnd = 80;
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

    // Use smaller batches for more frequent progress updates
    const batchSize = 100; // Reduced from 1000 for more frequent updates
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

        // Update progress more frequently
        const currentProgress = uploadPhaseStart + Math.round((totalProcessed / totalContacts) * uploadPhaseRange);
        onProgress(currentProgress);
        console.log(`Progress: ${currentProgress}% (${totalProcessed}/${totalContacts} contacts)`);
        
        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Error upserting batch ${batchNumber}:`, error);
        // Try individual fallback for this batch
        console.log('Falling back to individual processing for this batch...');
        for (const contact of batch) {
          try {
            await upsertContactWithProperMerging(contact);
            uploadedEmails.push(contact.email);
            totalProcessed++;
            
            // Update progress even during fallback
            if (totalProcessed % 10 === 0) { // Every 10 contacts
              const currentProgress = uploadPhaseStart + Math.round((totalProcessed / totalContacts) * uploadPhaseRange);
              onProgress(currentProgress);
            }
          } catch (individualError) {
            console.error(`Error upserting contact ${contact.email}:`, individualError);
          }
        }
      }

      console.log(`Completed batch ${batchNumber}, total processed: ${totalProcessed}`);
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

  // Phase 2: Categorization (80-100% of progress)
  console.log('=== Starting categorization phase ===');
  onProgress(85);
  try {
    const allUploadedEmails = Object.values(contactsByBucket)
      .flat()
      .map(contact => contact.email);
    console.log(`Starting categorization for ${allUploadedEmails.length} contacts`);
    await categorizeNewContacts(allUploadedEmails);
    console.log('Categorization completed successfully');
    onProgress(100);
  } catch (error) {
    console.error('Error during categorization:', error);
    onProgress(95); // Still show progress even if categorization fails
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
