
import { supabase } from "@/integrations/supabase/client";
import { type MainBucketId } from "../bucketCategorizationService";

export const assignContactsToBucketChunked = async (
  contactEmails: string[],
  bucketId: MainBucketId
): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Assigning ${contactEmails.length} contacts to bucket: ${bucketId}`);

  // First, get the bucket category ID
  const { MAIN_BUCKETS } = await import("../bucketCategorizationService");
  const bucket = MAIN_BUCKETS[bucketId];
  const { data: category, error: categoryError } = await supabase
    .from('customer_categories')
    .select('id')
    .eq('name', bucket.name)
    .single();

  if (categoryError || !category) {
    console.error('Error finding bucket category:', categoryError);
    throw new Error(`Could not find bucket: ${bucket.name}`);
  }

  // Get contact IDs in chunks to avoid URL length limits
  const chunkSize = 50;
  const allContactIds: string[] = [];
  
  for (let i = 0; i < contactEmails.length; i += chunkSize) {
    const chunk = contactEmails.slice(i, i + chunkSize);
    console.log(`Fetching contact IDs for chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(contactEmails.length / chunkSize)}`);
    
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .in('email', chunk);

    if (contactsError) {
      console.error('Error fetching contact IDs:', contactsError);
      throw contactsError;
    }

    if (contacts && contacts.length > 0) {
      allContactIds.push(...contacts.map(c => c.id));
    }
  }

  if (allContactIds.length > 0) {
    // Create contact-category relationships in chunks
    const relationshipChunkSize = 1000;
    
    for (let i = 0; i < allContactIds.length; i += relationshipChunkSize) {
      const chunk = allContactIds.slice(i, i + relationshipChunkSize);
      const contactCategoryRecords = chunk.map(contactId => ({
        contact_id: contactId,
        category_id: category.id
      }));

      const { error: assignError } = await supabase
        .from('contact_categories')
        .upsert(contactCategoryRecords, { 
          onConflict: 'contact_id,category_id',
          ignoreDuplicates: true 
        });

      if (assignError) {
        console.error('Error assigning contacts to bucket:', assignError);
        throw assignError;
      }
      
      console.log(`Assigned chunk of ${chunk.length} contacts to ${bucket.name}`);
    }

    console.log(`Successfully assigned ${allContactIds.length} contacts to ${bucket.name}`);
  }
};
