
interface CSVContact {
  email: string;
  name?: string;
  company?: string;
  summit_history?: string;
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const parseCSV = (csvText: string): CSVContact[] => {
  console.log('Starting CSV parsing...');
  
  // Split by lines and filter out empty lines
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  console.log(`Found ${lines.length} lines in CSV`);
  
  if (lines.length < 2) {
    console.log('CSV has less than 2 lines');
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  console.log('Headers found:', headers);
  
  const contacts: CSVContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    console.log(`Row ${i}:`, values);
    
    const contact: CSVContact = { email: '' };

    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      
      // Updated header matching for your specific CSV format
      if (header === 'email' || header.includes('email')) {
        contact.email = value;
      } else if (header === 'first name' || header === 'name' || header.includes('first') || header.includes('name')) {
        contact.name = value;
      } else if (header.includes('company') || header.includes('organization') || header.includes('business')) {
        contact.company = value;
      } else if (header === 'contact tags' || header.includes('tags') || header.includes('summit') || header.includes('history')) {
        // Handle contact tags which might be comma-separated
        if (value) {
          contact.summit_history = value.replace(/,/g, ';'); // Convert commas to semicolons for our format
        }
      }
    });

    console.log(`Parsed contact:`, contact);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contact.email && emailRegex.test(contact.email)) {
      contacts.push(contact);
      console.log(`Valid contact added: ${contact.email}`);
    } else {
      console.log(`Skipping invalid contact - email: "${contact.email}"`);
    }
  }

  console.log(`Total valid contacts found: ${contacts.length}`);
  return contacts;
};
