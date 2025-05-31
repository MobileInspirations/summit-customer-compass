
import { type MainBucketId } from "../bucketCategorizationService";
import { type ZipFileEntry } from "./zipExtractor";
import { processZipFileEntry } from "./contactProcessor";

export interface ProcessedContact {
  email: string;
  name?: string;
  company?: string;
  summit_history: string[];
  engagement_level: 'H' | 'L' | 'M' | 'U';
  bucket: MainBucketId;
  folder_path: string[]; // Store the full folder path for additional context
}

export const processZipStructure = async (files: ZipFileEntry[]): Promise<ProcessedContact[]> => {
  console.log(`Starting to process ${files.length} files from ZIP`);
  const contacts: ProcessedContact[] = [];

  for (const file of files) {
    const fileContacts = processZipFileEntry(file);
    contacts.push(...fileContacts);
  }

  console.log(`Total contacts processed: ${contacts.length}`);
  return contacts;
};
