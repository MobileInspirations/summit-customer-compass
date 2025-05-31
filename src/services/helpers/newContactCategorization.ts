
import { supabase } from "@/integrations/supabase/client";
import { runCategorizationWorkflow } from "../workflows/categorizationWorkflow";

export const categorizeNewContacts = async (contactEmails: string[]): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Getting contact IDs for ${contactEmails.length} emails...`);
  
  // Fetch contact IDs in chunks to avoid URL length limits
  const chunkSize = 50; // Safe chunk size for URL length
  const allContactIds: string[] = [];
  
  for (let i = 0; i < contactEmails.length; i += chunkSize) {
    const chunk = contactEmails.slice(i, i + chunkSize);
    console.log(`Fetching contact IDs for chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(contactEmails.length / chunkSize)}`);
    
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id')
        .in('email', chunk);

      if (error) {
        console.error('Error fetching contact IDs chunk:', error);
        throw error;
      }

      if (contacts && contacts.length > 0) {
        allContactIds.push(...contacts.map(c => c.id));
      }
    } catch (error) {
      console.error(`Error fetching contacts chunk ${i}-${i + chunkSize}:`, error);
      throw error;
    }
  }

  console.log(`Successfully fetched ${allContactIds.length} contact IDs for categorization`);

  if (allContactIds.length > 0) {
    await runCategorizationWorkflow(allContactIds);
  }
};
