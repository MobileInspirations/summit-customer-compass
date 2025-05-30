
import { supabase } from "@/integrations/supabase/client";
import { assignContactsToBucket, type MainBucketId } from "../bucketCategorizationService";
import { categorizeNewContacts } from "../contactCategorizationService";
import { type ProcessedContact } from "./csvProcessor";
import { mergeContactsByEmail } from "./contactMerger";

export const uploadContactsInBatches = async (
  contactsByBucket: Record<MainBucketId, ProcessedContact[]>,
  onProgress: (progress: number) => void
): Promise<void> => {
  const allBuckets = Object.keys(contactsByBucket) as MainBucketId[];
  let totalProcessed = 0;
  const totalContacts = Object.values(contactsByBucket).reduce((sum, contacts) => sum + contacts.length, 0);

  for (const bucket of allBuckets) {
    const contacts = contactsByBucket[bucket];
    if (contacts.length === 0) continue;

    console.log(`Processing ${contacts.length} contacts for ${bucket} bucket`);

    // Merge contacts by email, combining data from multiple entries
    const mergedContacts = mergeContactsByEmail(contacts);
    const contactsToUpload = Object.values(mergedContacts);

    // Upload in batches of 1000
    const batchSize = 1000;
    const uploadedEmails: string[] = [];

    for (let i = 0; i < contactsToUpload.length; i += batchSize) {
      const batch = contactsToUpload.slice(i, i + batchSize);
      
      // Process each contact individually to handle updates properly
      for (const contact of batch) {
        await upsertContactWithMerging(contact);
        uploadedEmails.push(contact.email);
      }

      totalProcessed += batch.length;

      // Update progress
      const progress = 50 + (totalProcessed / totalContacts) * 30;
      onProgress(Math.round(progress));
    }

    // Assign contacts to their respective buckets
    try {
      await assignContactsToBucket(uploadedEmails, bucket);
      console.log(`Assigned ${uploadedEmails.length} contacts to ${bucket} bucket`);
    } catch (error) {
      console.error(`Error assigning contacts to ${bucket} bucket:`, error);
    }
  }

  // Start categorization for all uploaded contacts
  onProgress(85);
  try {
    const allUploadedEmails = Object.values(contactsByBucket)
      .flat()
      .map(contact => contact.email);
    await categorizeNewContacts(allUploadedEmails);
    console.log('Categorization completed');
  } catch (error) {
    console.error('Error during categorization:', error);
  }
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
