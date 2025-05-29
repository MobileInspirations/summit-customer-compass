
import { supabase } from "@/integrations/supabase/client";

export const fetchUncategorizedContacts = async (contactIds?: string[], limit: number = 5000) => {
  console.log(`Fetching uncategorized contacts with limit: ${limit}`);
  
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
      .in('id', contactIds)
      .limit(limit);

    if (error) {
      console.error('Error fetching specific contacts:', error);
      throw error;
    }

    console.log(`Found ${contacts?.length || 0} specific contacts`);
    return contacts || [];
  }

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
    .limit(limit);

  if (error) {
    console.error('Error fetching uncategorized contacts:', error);
    throw error;
  }

  // Transform the data to remove the join column
  const uncategorizedContacts = contacts?.map(contact => ({
    id: contact.id,
    email: contact.email,
    full_name: contact.full_name,
    company: contact.company,
    summit_history: contact.summit_history
  })) || [];

  console.log(`Fetched ${uncategorizedContacts.length} uncategorized contacts (limit was ${limit})`);
  return uncategorizedContacts;
};
