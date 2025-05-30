
import { type MainBucketId } from "../bucketCategorizationService";
import { type ZipFileEntry } from "./zipExtractor";

export interface ProcessedContact {
  email: string;
  name?: string;
  company?: string;
  summit_history: string[];
  engagement_level: 'H' | 'L' | 'M' | 'U';
  tags: string[];
  bucket: MainBucketId;
}

export const processZipStructure = async (files: ZipFileEntry[]): Promise<ProcessedContact[]> => {
  const contacts: ProcessedContact[] = [];

  for (const file of files) {
    if (!file.name.endsWith('.csv')) continue;

    const pathParts = file.path;
    if (pathParts.length < 1) continue;

    // Check if this is from the "Aweber lists" main folder
    const mainFolder = pathParts[0];
    let bucket: MainBucketId;
    let summitName: string;

    if (mainFolder.toLowerCase().includes('aweber')) {
      // This is from Aweber lists - default to biz-op bucket
      bucket = 'biz-op';
      
      // If there's a subfolder, use it as the summit name
      if (pathParts.length >= 2) {
        summitName = pathParts[1];
      } else {
        // Extract summit name from filename by removing engagement prefix
        const filename = file.name.replace(/\.(csv|CSV)$/, '');
        summitName = filename.replace(/^[HLMU]-/i, '').trim();
      }
    } else {
      // Handle other bucket structures with flexible mapping
      const lowerBucketName = mainFolder.toLowerCase();
      if (lowerBucketName.includes('biz') || lowerBucketName.includes('business')) {
        bucket = 'biz-op';
      } else if (lowerBucketName.includes('health') || lowerBucketName.includes('medical') || lowerBucketName.includes('wellness')) {
        bucket = 'health';
      } else if (lowerBucketName.includes('survivalist') || lowerBucketName.includes('survival') || lowerBucketName.includes('prepper')) {
        bucket = 'survivalist';
      } else {
        // Default to biz-op for unknown folders
        console.warn(`Unknown bucket: ${mainFolder}, defaulting to biz-op bucket for file ${file.name}`);
        bucket = 'biz-op';
      }

      // Extract summit name - if there's a second level folder, use it, otherwise use the filename without engagement prefix
      if (pathParts.length >= 2) {
        summitName = pathParts[1];
      } else {
        // Extract summit name from filename by removing engagement prefix
        const filename = file.name.replace(/\.(csv|CSV)$/, '');
        summitName = filename.replace(/^[HLMU]-/i, '').trim();
      }
    }

    // Extract engagement level from filename (H-, L-, M-, U-)
    const filename = file.name;
    const engagementMatch = filename.match(/^([HLMU])-/i);
    if (!engagementMatch) {
      console.warn(`No engagement level found in filename: ${filename}, defaulting to M`);
      // Default to M (Medium) if no engagement level found
      const csvContacts = parseCSVContent(file.content, summitName, 'M', bucket);
      contacts.push(...csvContacts);
      continue;
    }
    const engagementLevel = engagementMatch[1].toUpperCase() as 'H' | 'L' | 'M' | 'U';

    // Parse CSV content
    const csvContacts = parseCSVContent(file.content, summitName, engagementLevel, bucket);
    contacts.push(...csvContacts);
    
    console.log(`Processed ${csvContacts.length} contacts from ${file.name} (${summitName}, ${engagementLevel}, ${bucket})`);
  }

  return contacts;
};

const parseCSVContent = (
  content: string, 
  summitName: string, 
  engagementLevel: 'H' | 'L' | 'M' | 'U',
  bucket: MainBucketId
): ProcessedContact[] => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length <= 1) return []; // No data or only header

  const contacts: ProcessedContact[] = [];
  
  // Skip header row and process data
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (assuming email is first column, name second, company third)
    const columns = parseCSVLine(line);
    if (columns.length === 0 || !columns[0]) continue;

    const email = columns[0].trim();
    if (!email || !isValidEmail(email)) continue;

    contacts.push({
      email,
      name: columns[1]?.trim() || undefined,
      company: columns[2]?.trim() || undefined,
      summit_history: [summitName],
      engagement_level: engagementLevel,
      tags: [summitName],
      bucket
    });
  }

  return contacts;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
