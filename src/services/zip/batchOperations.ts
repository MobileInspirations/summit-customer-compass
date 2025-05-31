
import { supabase } from "@/integrations/supabase/client";
import { type ProcessedContact } from "./csvProcessor";

export const upsertContactBatch = async (contacts: ProcessedContact[]): Promise<void> => {
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
      
      return {
        email: contact.email,
        full_name: contact.name || existingContact.full_name,
        company: contact.company || existingContact.company,
        summit_history: [...new Set([...existingSummitHistory, ...contact.summit_history])],
        engagement_level: contact.engagement_level || existingContact.engagement_level,
        main_bucket: contact.bucket // Update main bucket
      };
    } else {
      // New contact
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

export const fetchContactsInChunks = async (emails: string[]): Promise<any[]> => {
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

export const upsertContactWithProperMerging = async (contact: ProcessedContact): Promise<void> => {
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
    
    // Merge summit history intelligently
    const existingSummitHistory = existingContact.summit_history || [];
    
    finalContact = {
      email: contact.email,
      full_name: contact.name || existingContact.full_name,
      company: contact.company || existingContact.company,
      summit_history: [...new Set([...existingSummitHistory, ...contact.summit_history])],
      engagement_level: contact.engagement_level || existingContact.engagement_level,
      main_bucket: contact.bucket
    };
    
    console.log(`Merging data for ${contact.email}:`, {
      existingSummitHistory: existingSummitHistory.length,
      newSummitHistory: contact.summit_history.length,
      finalSummitHistory: finalContact.summit_history.length,
      mainBucket: finalContact.main_bucket
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
      main_bucket: contact.bucket
    };
    
    console.log(`New contact data for ${contact.email}:`, {
      summitHistory: finalContact.summit_history.length,
      engagementLevel: finalContact.engagement_level,
      mainBucket: finalContact.main_bucket
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
