
export const parseCSVLine = (line: string): string[] => {
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

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseCSVContent = (
  content: string, 
  summitName: string, 
  engagementLevel: 'H' | 'L' | 'M' | 'U',
  bucket: import("../bucketCategorizationService").MainBucketId,
  folderPath: string[]
): import("./csvProcessor").ProcessedContact[] => {
  console.log(`Parsing CSV content for summit: ${summitName}, engagement: ${engagementLevel}, bucket: ${bucket}`);
  
  const lines = content.split('\n').filter(line => line.trim());
  console.log(`CSV has ${lines.length} lines`);
  
  if (lines.length <= 1) {
    console.log('No data rows found in CSV');
    return [];
  }

  const contacts: import("./csvProcessor").ProcessedContact[] = [];
  
  // Create comprehensive tags from folder structure and metadata
  const folderTags = folderPath.filter(folder => folder.trim() !== '');
  const engagementTag = `${engagementLevel}-Engagement`;
  const bucketTag = `${bucket}-bucket`;
  
  // Skip header row and process data
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Parse CSV line (assuming email is first column, name second, company third)
      const columns = parseCSVLine(line);
      if (columns.length === 0 || !columns[0]) continue;

      const email = columns[0].trim();
      if (!email || !isValidEmail(email)) {
        console.log(`Invalid email found: ${email}`);
        continue;
      }

      // Comprehensive tagging from folder structure and metadata
      const allTags = [
        summitName,
        engagementTag,
        bucketTag,
        ...folderTags
      ].filter(tag => tag && tag.trim() !== '');

      contacts.push({
        email,
        name: columns[1]?.trim() || undefined,
        company: columns[2]?.trim() || undefined,
        summit_history: [summitName],
        engagement_level: engagementLevel,
        tags: allTags,
        bucket,
        folder_path: folderPath
      });
    } catch (error) {
      console.error(`Error parsing line ${i}: ${line}`, error);
    }
  }

  console.log(`Parsed ${contacts.length} valid contacts from CSV`);
  return contacts;
};
