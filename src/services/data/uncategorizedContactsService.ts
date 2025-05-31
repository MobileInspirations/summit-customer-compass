
import { supabase } from "@/integrations/supabase/client";

export const fetchUncategorizedContacts = async (contactLimit?: number) => {
  console.log(`Fetching uncategorized contacts with limit: ${contactLimit}`);
  
  // If we have a specific limit under 1000, use it in the query for efficiency
  if (contactLimit && contactLimit < 1000) {
    console.log(`Using SQL limit for efficient query: ${contactLimit}`);
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id, 
        email, 
        full_name, 
        company, 
        tags, 
        summit_history
      `)
      .limit(contactLimit);

    if (error) {
      console.error('Error fetching limited contacts:', error);
      throw error;
    }

    console.log(`Successfully fetched ${contacts?.length || 0} contacts with SQL limit`);
    return contacts || [];
  }

  // For larger limits or unlimited, fetch all and then slice if needed
  console.log('Fetching all contacts and applying limit in memory');
  
  let allContacts: any[] = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id, 
        email, 
        full_name, 
        company, 
        tags, 
        summit_history
      `)
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching contacts batch:', error);
      throw error;
    }

    if (!contacts || contacts.length === 0) {
      break;
    }

    allContacts = allContacts.concat(contacts);
    console.log(`Fetched batch: ${contacts.length} contacts (total so far: ${allContacts.length})`);

    // If we have a limit and we've reached it, break early
    if (contactLimit && allContacts.length >= contactLimit) {
      allContacts = allContacts.slice(0, contactLimit);
      console.log(`Reached contact limit, returning ${allContacts.length} contacts`);
      break;
    }

    // If we got less than the batch size, we've reached the end
    if (contacts.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  console.log(`Final result: ${allContacts.length} contacts`);
  return allContacts;
};
