
import { type ProcessedContact } from "./csvProcessor";
import { type MainBucketId } from "../bucketCategorizationService";

export const groupContactsByBucket = (contacts: ProcessedContact[]): Record<MainBucketId, ProcessedContact[]> => {
  const grouped: Record<MainBucketId, ProcessedContact[]> = {
    'biz-op': [],
    health: [],
    survivalist: []
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
      // Comprehensive merging - combine all data points
      console.log(`Merging duplicate contact: ${contact.email}`);
      
      merged[contact.email] = {
        email: contact.email,
        name: contact.name || existing.name,
        company: contact.company || existing.company,
        summit_history: [...new Set([...existing.summit_history, ...contact.summit_history])],
        engagement_level: contact.engagement_level || existing.engagement_level,
        bucket: contact.bucket, // Use the most recent bucket assignment
        folder_path: [...new Set([...existing.folder_path, ...contact.folder_path])]
      };
      
      console.log(`Merged contact ${contact.email}:`, {
        summitHistoryCount: merged[contact.email].summit_history.length,
        folderPathCount: merged[contact.email].folder_path.length
      });
    }
  });

  return merged;
};
