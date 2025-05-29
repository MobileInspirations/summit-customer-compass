
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";

export const shouldAssignToCategory = (contact: ContactForCategorization, category: CategoryData): boolean => {
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

    // Subscribers - make this more inclusive
    if (categoryName.includes('subscriber') || categoryName.includes('email') || categoryName.includes('list')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('subscriber') ||
        event.toLowerCase().includes('email') ||
        event.toLowerCase().includes('opt') ||
        event.toLowerCase().includes('list')
      ) || summitHistory.length === 0; // Include contacts with no history as potential subscribers
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

    // General subscriber catch-all - if no other categories match and it's a basic subscriber category
    if (categoryName.includes('general') || categoryName.includes('basic') || categoryName === 'subscribers') {
      return true; // All contacts can be general subscribers
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

    if (categoryName.includes('new') || categoryName.includes('fresh')) {
      return summitHistory.length <= 1; // New or low engagement
    }

    // Default personality assignment for broad categories
    if (categoryName.includes('general') || categoryName.includes('standard')) {
      return true;
    }
  }

  return false;
};
