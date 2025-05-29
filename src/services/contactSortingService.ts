
import { supabase } from "@/integrations/supabase/client";

export const sortContacts = async (sortBy: 'name' | 'email' | 'company' | 'created_at' = 'name', order: 'asc' | 'desc' = 'asc') => {
  console.log(`Sorting contacts by ${sortBy} in ${order} order`);
  
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .order(sortBy, { ascending: order === 'asc' });

  if (error) {
    console.error("Error sorting contacts:", error);
    throw new Error("Failed to sort contacts");
  }

  console.log(`Successfully sorted ${contacts.length} contacts`);
  return contacts;
};

export const getContactsSortedByCategory = async () => {
  console.log("Getting contacts sorted by category");
  
  const { data: contactsWithCategories, error } = await supabase
    .from("contact_categories")
    .select(`
      contact_id,
      contacts!inner(
        id,
        full_name,
        email,
        company,
        created_at
      ),
      customer_categories!inner(
        id,
        name,
        category_type
      )
    `);

  if (error) {
    console.error("Error getting contacts by category:", error);
    throw new Error("Failed to get contacts by category");
  }

  return contactsWithCategories;
};
