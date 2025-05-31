
import { supabase } from "@/integrations/supabase/client";
import type { ContactForCategorization } from "../types/contactTypes";

export const fetchUncategorizedContacts = async (contactLimit?: number): Promise<ContactForCategorization[]> => {
  console.log(`Fetching uncategorized contacts with limit: ${contactLimit || 'no limit'}`);
  
  let query = supabase
    .from('contacts')
    .select(`
      id,
      email,
      full_name,
      company,
      tags,
      summit_history,
      engagement_level
    `)
    .order('created_at', { ascending: false });

  // Apply the contact limit if specified
  if (contactLimit && contactLimit > 0) {
    query = query.limit(contactLimit);
    console.log(`Applied limit of ${contactLimit} contacts`);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error('Error fetching uncategorized contacts:', error);
    throw error;
  }

  console.log(`Successfully fetched ${contacts?.length || 0} contacts for categorization`);
  
  return contacts?.map(contact => ({
    id: contact.id,
    email: contact.email,
    full_name: contact.full_name,
    company: contact.company,
    tags: contact.tags || [],
    summit_history: contact.summit_history || [],
    engagement_level: contact.engagement_level
  })) || [];
};
