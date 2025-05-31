
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization } from "../types/contactTypes";

export const fetchUncategorizedContacts = async (contactLimit?: number): Promise<ContactForCategorization[]> => {
  console.log(`Fetching uncategorized contacts with limit: ${contactLimit || 'no limit'}`);
  
  // If a specific limit is requested, use it directly
  if (contactLimit && contactLimit > 0) {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id,
        email,
        full_name,
        company,
        summit_history,
        engagement_level
      `)
      .order('created_at', { ascending: false })
      .limit(contactLimit);

    if (error) {
      console.error('Error fetching limited uncategorized contacts:', error);
      throw error;
    }

    console.log(`Successfully fetched ${contacts?.length || 0} contacts with limit ${contactLimit}`);
    
    return contacts?.map(contact => ({
      id: contact.id,
      email: contact.email,
      full_name: contact.full_name,
      company: contact.company,
      summit_history: contact.summit_history || [],
    })) || [];
  }

  // For unlimited queries, use pagination to fetch all contacts
  let allContacts: any[] = [];
  let from = 0;
  const batchSize = 1000; // Fetch in batches of 1000
  
  while (true) {
    console.log(`Fetching batch starting from ${from} with size ${batchSize}`);
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id,
        email,
        full_name,
        company,
        summit_history,
        engagement_level
      `)
      .order('created_at', { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching uncategorized contacts batch:', error);
      throw error;
    }

    if (!contacts || contacts.length === 0) {
      console.log('No more contacts to fetch');
      break; // No more contacts to fetch
    }

    allContacts = allContacts.concat(contacts);
    console.log(`Fetched batch: ${contacts.length} contacts (total so far: ${allContacts.length})`);

    // If we got less than the batch size, we've reached the end
    if (contacts.length < batchSize) {
      console.log('Reached end of contacts (partial batch)');
      break;
    }

    from += batchSize;
  }

  console.log(`Successfully fetched ${allContacts.length} total contacts for categorization`);
  
  return allContacts.map(contact => ({
    id: contact.id,
    email: contact.email,
    full_name: contact.full_name,
    company: contact.company,
    summit_history: contact.summit_history || [],
  }));
};
