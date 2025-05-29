
import { supabase } from "@/integrations/supabase/client";

export const fetchAllContacts = async (contactIds?: string[]) => {
  // Get contacts to categorize with pagination to handle large datasets
  let allContacts: any[] = [];
  let from = 0;
  const batchSize = 5000; // Increased from 1000 to 5000
  
  while (true) {
    let contactsQuery = supabase
      .from('contacts')
      .select('id, email, full_name, company, summit_history')
      .range(from, from + batchSize - 1);
    
    if (contactIds && contactIds.length > 0) {
      contactsQuery = contactsQuery.in('id', contactIds);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      break; // No more contacts to fetch
    }

    allContacts = allContacts.concat(contacts);
    console.log(`Fetched batch: ${contacts.length} contacts (total so far: ${allContacts.length})`);

    // If we got less than the batch size, we've reached the end
    if (contacts.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  return allContacts;
};

export const getContactsCount = async (): Promise<number> => {
  const { count: totalContacts, error: countError } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting contacts:', countError);
    throw countError;
  }

  return totalContacts || 0;
};

export const clearExistingCategorizations = async (): Promise<void> => {
  console.log('Clearing existing categorizations...');
  const { error: clearError } = await supabase
    .from('contact_categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

  if (clearError) {
    console.warn('Warning: Could not clear existing categorizations:', clearError);
  }
};

export const fetchCategories = async () => {
  const { data: categories, error: categoriesError } = await supabase
    .from('customer_categories')
    .select('*');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw categoriesError;
  }

  return categories;
};
