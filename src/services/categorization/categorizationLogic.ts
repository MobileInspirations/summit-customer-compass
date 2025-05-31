
import type { ContactForCategorization, CategoryData } from "../types/contactTypes";

export const shouldAssignToCategory = (contact: ContactForCategorization, category: CategoryData): boolean => {
  const categoryName = category.name.toLowerCase();
  const categoryDescription = category.description?.toLowerCase() || '';
  const summitHistory = contact.summit_history || [];
  const company = contact.company?.toLowerCase() || '';
  const email = contact.email.toLowerCase();

  // IMPORTANT: Main bucket categorization should ONLY happen during upload, never during categorization
  // Main buckets are: Business Operations, Health, Survivalist, Cannot Place
  // This function should not assign to main buckets during categorization

  // Customer type categorization (excluding main buckets)
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

    // Subscribers - make this more inclusive for general subscribers
    if (categoryName.includes('subscriber') || categoryName.includes('email') || categoryName.includes('list')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('subscriber') ||
        event.toLowerCase().includes('email') ||
        event.toLowerCase().includes('opt') ||
        event.toLowerCase().includes('list')
      ) || summitHistory.length === 0; // Include contacts with no history as potential subscribers
    }

    // Based on specific topics
    if (categoryName.includes('tax') || categoryName.includes('financial')) {
      return summitHistory.some(event => 
        event.toLowerCase().includes('tax') ||
        event.toLowerCase().includes('financial') ||
        event.toLowerCase().includes('investment')
      );
    }

    // General subscriber catch-all - if no other categories match and it's a basic subscriber category
    if (categoryName.includes('general') || categoryName.includes('basic') || categoryName === 'subscribers') {
      return true; // All contacts can be general subscribers
    }
  }

  // Personality type categorization
  if (category.category_type === 'personality') {
    // Categorize based on email domain patterns
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
