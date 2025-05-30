
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
    if (pathParts.length < 2) continue;

    // Extract bucket from first level folder (Biz, Health, Survivalist)
    const bucketName = pathParts[0];
    let bucket: MainBucketId;
    
    switch (bucketName.toLowerCase()) {
      case 'biz':
        bucket = 'biz-op';
        break;
      case 'health':
        bucket = 'health';
        break;
      case 'survivalist':
        bucket = 'survivalist';
        break;
      default:
        console.warn(`Unknown bucket: ${bucketName}, skipping file ${file.name}`);
        continue;
    }

    // Extract summit name from second level folder
    const summitName = pathParts[1];

    // Extract engagement level from filename (H-, L-, M-, U-)
    const filename = file.name;
    const engagementMatch = filename.match(/^([HLMU])-/);
    if (!engagementMatch) {
      console.warn(`No engagement level found in filename: ${filename}`);
      continue;
    }
    const engagementLevel = engagementMatch[1] as 'H' | 'L' | 'M' | 'U';

    // Parse CSV content
    const csvContacts = parseCSVContent(file.content, summitName, engagementLevel, bucket);
    contacts.push(...csvContacts);
    
    console.log(`Processed ${csvContacts.length} contacts from ${file.name} (${summitName}, ${engagementLevel})`);
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
