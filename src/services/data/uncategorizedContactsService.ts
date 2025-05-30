
import { supabase } from "@/integrations/supabase/client";

export const fetchUncategorizedContacts = async (contactIds?: string[], limit?: number) => {
  console.log(`Fetching uncategorized contacts${limit ? ` with limit: ${limit}` : ' (no limit)'}`);
  
  // If specific contact IDs are provided, filter by them
  if (contactIds && contactIds.length > 0) {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id, 
        email, 
        full_name, 
        company, 
        summit_history
      `)
      .in('id', contactIds);

    if (error) {
      console.error('Error fetching specific contacts:', error);
      throw error;
    }

    console.log(`Found ${contacts?.length || 0} specific contacts`);
    return contacts || [];
  }

  // For large datasets, we need to fetch in batches due to Supabase limitations
  let allUncategorizedContacts: any[] = [];
  let hasMore = true;
  let offset = 0;
  const batchSize = 1000; // Supabase's effective limit

  while (hasMore && (!limit || allUncategorizedContacts.length < limit)) {
    console.log(`Fetching batch starting at offset ${offset}, total fetched so far: ${allUncategorizedContacts.length}`);
    
    // Use a LEFT JOIN approach to find uncategorized contacts more efficiently
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id, 
        email, 
        full_name, 
        company, 
        summit_history,
        contact_categories!left (contact_id)
      `)
      .is('contact_categories.contact_id', null)
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: true }); // Add consistent ordering

    if (error) {
      console.error('Error fetching uncategorized contacts batch:', error);
      throw error;
    }

    if (!contacts || contacts.length === 0) {
      console.log('No more contacts found, stopping fetch');
      hasMore = false;
      break;
    }

    // Transform the data to remove the join column
    const batchUncategorizedContacts = contacts.map(contact => ({
      id: contact.id,
      email: contact.email,
      full_name: contact.full_name,
      company: contact.company,
      summit_history: contact.summit_history
    }));

    allUncategorizedContacts = allUncategorizedContacts.concat(batchUncategorizedContacts);
    console.log(`Fetched batch of ${contacts.length} contacts. Total so far: ${allUncategorizedContacts.length}`);

    // If we got less than the batch size, we've reached the end
    if (contacts.length < batchSize) {
      console.log(`Got ${contacts.length} contacts (less than batch size ${batchSize}), stopping fetch`);
      hasMore = false;
    }

    // If we have a limit and we've reached it, stop
    if (limit && allUncategorizedContacts.length >= limit) {
      allUncategorizedContacts = allUncategorizedContacts.slice(0, limit);
      hasMore = false;
    }

    offset += batchSize;

    // Add a small delay to avoid overwhelming Supabase
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log(`Finished fetching. Total uncategorized contacts: ${allUncategorizedContacts.length}${limit ? ` (limit was ${limit})` : ' (no limit)'}`);
  return allUncategorizedContacts;
};
