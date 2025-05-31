
import { type ProcessedContact } from "./csvProcessor";
import { type MainBucketId } from "../bucketCategorizationService";

export const parseCSVContent = (
  csvContent: string,
  summitName: string,
  engagementLevel: 'H' | 'L' | 'M' | 'U',
  bucket: MainBucketId,
  folderPath: string[]
): ProcessedContact[] => {
  console.log(`Parsing CSV content for summit: ${summitName}, engagement: ${engagementLevel}, bucket: ${bucket}`);
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length <= 1) {
    console.log('No data rows found in CSV');
    return [];
  }

  // Parse header to find column indices
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const emailIndex = headers.findIndex(h => h.includes('email'));
  
  if (emailIndex === -1) {
    console.error('No email column found in CSV headers:', headers);
    return [];
  }

  const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('first'));
  const companyIndex = headers.findIndex(h => h.includes('company') || h.includes('organization'));

  const contacts: ProcessedContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const email = values[emailIndex]?.trim();
    
    if (email && email.includes('@')) {
      contacts.push({
        email,
        name: nameIndex !== -1 ? values[nameIndex] : undefined,
        company: companyIndex !== -1 ? values[companyIndex] : undefined,
        summit_history: [summitName],
        engagement_level: engagementLevel,
        bucket,
        folder_path: folderPath
      });
    }
  }

  console.log(`Parsed ${contacts.length} valid contacts from CSV`);
  return contacts;
};
