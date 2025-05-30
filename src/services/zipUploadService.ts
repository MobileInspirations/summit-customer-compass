
import { supabase } from "@/integrations/supabase/client";
import { ensureMainBucketsExist, assignContactsToBucket, type MainBucketId } from "./bucketCategorizationService";
import { categorizeNewContacts } from "./contactCategorizationService";
import JSZip from "jszip";

interface ProcessedContact {
  email: string;
  name?: string;
  company?: string;
  summit_history: string[];
  engagement_level: 'H' | 'L' | 'M' | 'U';
  tags: string[];
  bucket: MainBucketId;
}

interface ZipFileEntry {
  name: string;
  content: string;
  path: string[];
}

export const processZipUpload = async (
  zipFile: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log('Starting zip file processing...');
  onProgress(5);

  // Ensure main buckets exist
  await ensureMainBucketsExist();
  onProgress(10);

  // Extract and process zip file
  const files = await extractZipFiles(zipFile);
  onProgress(20);

  // Process all CSV files and organize contacts
  const allContacts = await processZipStructure(files);
  onProgress(40);

  if (allContacts.length === 0) {
    console.log('No contacts found in zip file');
    onProgress(100);
    return;
  }

  console.log(`Processing ${allContacts.length} contacts from zip file`);

  // Group contacts by bucket for efficient processing
  const contactsByBucket = groupContactsByBucket(allContacts);
  onProgress(50);

  // Upload contacts in batches
  await uploadContactsInBatches(contactsByBucket, onProgress);
  onProgress(100);

  console.log('Zip file processing completed');
};

const extractZipFiles = async (zipFile: File): Promise<ZipFileEntry[]> => {
  console.log('Extracting files from zip...');
  
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(zipFile);
  const files: ZipFileEntry[] = [];

  for (const [path, file] of Object.entries(zipContent.files)) {
    if (file.dir || !path.endsWith('.csv')) continue;

    try {
      const content = await file.async('text');
      const pathParts = path.split('/').filter(part => part !== '');
      
      files.push({
        name: pathParts[pathParts.length - 1],
        content,
        path: pathParts.slice(0, -1) // Remove filename from path
      });
    } catch (error) {
      console.warn(`Failed to read file ${path}:`, error);
    }
  }

  console.log(`Extracted ${files.length} CSV files from zip`);
  return files;
};

const processZipStructure = async (files: ZipFileEntry[]): Promise<ProcessedContact[]> => {
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

const groupContactsByBucket = (contacts: ProcessedContact[]): Record<MainBucketId, ProcessedContact[]> => {
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

const uploadContactsInBatches = async (
  contactsByBucket: Record<MainBucketId, ProcessedContact[]>,
  onProgress: (progress: number) => void
): Promise<void> => {
  const allBuckets = Object.keys(contactsByBucket) as MainBucketId[];
  let totalProcessed = 0;
  const totalContacts = Object.values(contactsByBucket).reduce((sum, contacts) => sum + contacts.length, 0);

  for (const bucket of allBuckets) {
    const contacts = contactsByBucket[bucket];
    if (contacts.length === 0) continue;

    console.log(`Processing ${contacts.length} contacts for ${bucket} bucket`);

    // Deduplicate by email
    const uniqueContacts = contacts.reduce((acc, contact) => {
      acc[contact.email] = contact;
      return acc;
    }, {} as Record<string, ProcessedContact>);

    const contactsToUpload = Object.values(uniqueContacts);

    // Upload in batches of 1000
    const batchSize = 1000;
    const uploadedEmails: string[] = [];

    for (let i = 0; i < contactsToUpload.length; i += batchSize) {
      const batch = contactsToUpload.slice(i, i + batchSize);
      
      const contactsForInsert = batch.map(contact => ({
        email: contact.email,
        full_name: contact.name || null,
        company: contact.company || null,
        summit_history: contact.summit_history,
        engagement_level: contact.engagement_level,
        tags: contact.tags
      }));

      const { error } = await supabase
        .from('contacts')
        .upsert(contactsForInsert, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }

      uploadedEmails.push(...batch.map(c => c.email));
      totalProcessed += batch.length;

      // Update progress
      const progress = 50 + (totalProcessed / totalContacts) * 30;
      onProgress(Math.round(progress));
    }

    // Assign contacts to their respective buckets
    try {
      await assignContactsToBucket(uploadedEmails, bucket);
      console.log(`Assigned ${uploadedEmails.length} contacts to ${bucket} bucket`);
    } catch (error) {
      console.error(`Error assigning contacts to ${bucket} bucket:`, error);
    }
  }

  // Start categorization for all uploaded contacts
  onProgress(85);
  try {
    const allUploadedEmails = Object.values(contactsByBucket)
      .flat()
      .map(contact => contact.email);
    await categorizeNewContacts(allUploadedEmails);
    console.log('Categorization completed');
  } catch (error) {
    console.error('Error during categorization:', error);
  }
};
