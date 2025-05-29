
import { supabase } from "@/integrations/supabase/client";

interface ContactForCategorization {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  summit_history?: string[];
}

export const categorizeContacts = async (contactIds?: string[]): Promise<void> => {
  console.log('Starting contact categorization...');

  // Get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('customer_categories')
    .select('*');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw categoriesError;
  }

  // Get contacts to categorize
  let contactsQuery = supabase.from('contacts').select('id, email, full_name, company, summit_history');
  
  if (contactIds && contactIds.length > 0) {
    contactsQuery = contactsQuery.in('id', contactIds);
  }

  const { data: contacts, error: contactsError } = await contactsQuery;

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
    throw contactsError;
  }

  if (!contacts || contacts.length === 0) {
    console.log('No contacts to categorize');
    return;
  }

  console.log(`Categorizing ${contacts.length} contacts into ${categories.length} categories...`);

  // Categorize each contact
  const categorizationPromises = contacts.map(contact => 
    categorizeContact(contact as ContactForCategorization, categories)
  );

  await Promise.all(categorizationPromises);
  console.log('Contact categorization completed');
};

const categorizeContact = async (
  contact: ContactForCategorization, 
  categories: any[]
): Promise<void> => {
  const assignedCategories: string[] = [];

  for (const category of categories) {
    if (shouldAssignToCategory(contact, category)) {
      assignedCategories.push(category.id);
    }
  }

  // Insert contact-category relationships
  if (assignedCategories.length > 0) {
    const contactCategoryRecords = assignedCategories.map(categoryId => ({
      contact_id: contact.id,
      category_id: categoryId
    }));

    const { error } = await supabase
      .from('contact_categories')
      .upsert(contactCategoryRecords, { 
        onConflict: 'contact_id,category_id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error(`Error categorizing contact ${contact.email}:`, error);
    } else {
      console.log(`Assigned contact ${contact.email} to ${assignedCategories.length} categories`);
    }
  }
};

const shouldAssignToCategory = (contact: ContactForCategorization, category: any): boolean => {
  const categoryName = category.name.toLowerCase();
  const categoryDescription = category.description?.toLowerCase() || '';
  const summitHistory = contact.summit_history || [];
  const company = contact.company?.toLowerCase() || '';
  const email = contact.email.toLowerCase();

  // Customer type categorization
  if (category.category_type === 'customer') {
    // High-value customers
    if (categoryName.includes('vip') || categoryName.includes('premium')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('vip') || 
        event.toLowerCase().includes('premium') ||
        event.toLowerCase().includes('platinum')
      );
    }

    // Summit attendees
    if (categoryName.includes('summit') || categoryName.includes('attendee')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('summit') ||
        event.toLowerCase().includes('registration')
      );
    }

    // Webinar participants
    if (categoryName.includes('webinar') || categoryName.includes('training')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('webinar') ||
        event.toLowerCase().includes('training') ||
        event.toLowerCase().includes('masterclass')
      );
    }

    // Buyers/customers
    if (categoryName.includes('buyer') || categoryName.includes('customer')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('buyer') ||
        event.toLowerCase().includes('purchase') ||
        event.toLowerCase().includes('member')
      );
    }

    // Subscribers
    if (categoryName.includes('subscriber') || categoryName.includes('email')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('subscriber') ||
        event.toLowerCase().includes('email') ||
        event.toLowerCase().includes('opt')
      );
    }

    // Business/Enterprise
    if (categoryName.includes('business') || categoryName.includes('enterprise')) {
      return company !== '' || email.includes('@company') || email.includes('@corp');
    }

    // Based on specific topics
    if (categoryName.includes('survival') || categoryName.includes('preparedness')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('survival') ||
        event.toLowerCase().includes('preparedness') ||
        event.toLowerCase().includes('emergency')
      );
    }

    if (categoryName.includes('tax') || categoryName.includes('financial')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('tax') ||
        event.toLowerCase().includes('financial') ||
        event.toLowerCase().includes('investment')
      );
    }

    if (categoryName.includes('health') || categoryName.includes('medical')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('health') ||
        event.toLowerCase().includes('medical') ||
        event.toLowerCase().includes('wellness')
      );
    }
  }

  // Personality type categorization
  if (category.category_type === 'personality') {
    // You can implement personality-based categorization here
    // This could be based on engagement patterns, email domains, etc.
    
    // Example: Categorize based on email domain patterns
    if (categoryName.includes('professional')) {
      return !email.includes('gmail') && !email.includes('yahoo') && !email.includes('hotmail');
    }

    if (categoryName.includes('engaged')) {
      return summitHistory.length >= 3; // Multiple engagements
    }

    if (categoryName.includes('new')) {
      return summitHistory.length <= 1; // New or low engagement
    }
  }

  return false;
};

// Helper function to run categorization on newly uploaded contacts
export const categorizeNewContacts = async (contactEmails: string[]): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Getting contact IDs for ${contactEmails.length} emails...`);
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id')
    .in('email', contactEmails);

  if (error) {
    console.error('Error fetching contact IDs:', error);
    throw error;
  }

  if (contacts && contacts.length > 0) {
    const contactIds = contacts.map(c => c.id);
    await categorizeContacts(contactIds);
  }
};
