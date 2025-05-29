
import { supabase } from "@/integrations/supabase/client";

// Main bucket categories
export const MAIN_BUCKETS = {
  'biz-op': {
    id: 'biz-op',
    name: 'Business Operations',
    description: 'Business-focused contacts and operations',
    category_type: 'customer'
  },
  'health': {
    id: 'health',
    name: 'Health',
    description: 'Health and wellness related contacts',
    category_type: 'customer'
  },
  'survivalist': {
    id: 'survivalist',
    name: 'Survivalist',
    description: 'Emergency preparedness and survival contacts',
    category_type: 'customer'
  },
  'cannot-place': {
    id: 'cannot-place',
    name: 'Cannot Place',
    description: 'Contacts that do not match any specific category',
    category_type: 'customer'
  }
} as const;

export type MainBucketId = keyof typeof MAIN_BUCKETS;

export const ensureMainBucketsExist = async (): Promise<void> => {
  console.log('Ensuring main buckets exist...');
  
  for (const bucket of Object.values(MAIN_BUCKETS)) {
    const { data: existing, error: checkError } = await supabase
      .from('customer_categories')
      .select('id')
      .eq('name', bucket.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for bucket:', bucket.name, checkError);
      continue;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from('customer_categories')
        .insert({
          name: bucket.name,
          description: bucket.description,
          category_type: bucket.category_type,
          color: getBucketColor(bucket.id)
        });

      if (insertError) {
        console.error('Error creating bucket:', bucket.name, insertError);
      } else {
        console.log('Created main bucket:', bucket.name);
      }
    }
  }
};

export const assignContactsToBucket = async (
  contactEmails: string[],
  bucketId: MainBucketId
): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Assigning ${contactEmails.length} contacts to bucket: ${bucketId}`);

  // First, get the bucket category ID
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

  // Get contact IDs for the emails
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id')
    .in('email', contactEmails);

  if (contactsError) {
    console.error('Error fetching contact IDs:', contactsError);
    throw contactsError;
  }

  if (contacts && contacts.length > 0) {
    // Create contact-category relationships
    const contactCategoryRecords = contacts.map(contact => ({
      contact_id: contact.id,
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

    console.log(`Successfully assigned ${contacts.length} contacts to ${bucket.name}`);
  }
};

const getBucketColor = (bucketId: MainBucketId): string => {
  switch (bucketId) {
    case 'biz-op':
      return 'bg-blue-500';
    case 'health':
      return 'bg-green-500';
    case 'survivalist':
      return 'bg-orange-500';
    case 'cannot-place':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};
