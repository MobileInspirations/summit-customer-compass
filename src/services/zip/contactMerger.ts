
import { type ProcessedContact } from "./csvProcessor";
import { type MainBucketId } from "../bucketCategorizationService";

export const groupContactsByBucket = (contacts: ProcessedContact[]): Record<MainBucketId, ProcessedContact[]> => {
  const grouped: Record<MainBucketId, ProcessedContact[]> = {
    'biz-op': [],
    health: [],
    survivalist: [],
    'cannot-place': []
  };

  contacts.forEach(contact => {
    grouped[contact.bucket].push(contact);
  });

  return grouped;
};

export const mergeContactsByEmail = (contacts: ProcessedContact[]): Record<string, ProcessedContact> => {
  const merged: Record<string, ProcessedContact> = {};

  contacts.forEach(contact => {
    const existing = merged[contact.email];
    
    if (!existing) {
      merged[contact.email] = { ...contact };
    } else {
      // Merge the data, combining arrays and preferring non-empty values
      merged[contact.email] = {
        email: contact.email,
        name: contact.name || existing.name,
        company: contact.company || existing.company,
        summit_history: [...new Set([...existing.summit_history, ...contact.summit_history])],
        engagement_level: contact.engagement_level || existing.engagement_level,
        tags: [...new Set([...existing.tags, ...contact.tags])],
        bucket: contact.bucket // Use the most recent bucket assignment
      };
    }
  });

  return merged;
};
