
import { supabase } from "@/integrations/supabase/client";
import { runCategorizationWorkflow } from "../workflows/categorizationWorkflow";

export const categorizeNewContacts = async (contactEmails: string[]): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Getting contact IDs for ${contactEmails.length} emails...`);
  
  // For very large datasets, limit categorization to prevent timeouts
  if (contactEmails.length > 100000) {
    console.log(`Dataset too large (${contactEmails.length}), limiting categorization to first 50000 contacts`);
    contactEmails = contactEmails.slice(0, 50000);
  }
  
  // Fetch contact IDs in smaller chunks for large datasets
  const chunkSize = Math.min(50, contactEmails.length > 10000 ? 25 : 100);
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
      // Continue with other chunks even if one fails
      continue;
    }
  }

  console.log(`Successfully fetched ${allContactIds.length} contact IDs for categorization`);

  if (allContactIds.length > 0) {
    // Use fast mode for newly uploaded contacts with timeout protection
    console.log('Starting fast categorization for newly uploaded contacts...');
    try {
      await Promise.race([
        runCategorizationWorkflow(allContactIds, undefined, undefined, undefined, true),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Categorization timeout')), 300000) // 5 minute timeout
        )
      ]);
    } catch (error) {
      if (error.message === 'Categorization timeout') {
        console.log('Categorization timed out, but upload was successful');
      } else {
        throw error;
      }
    }
  }
};
