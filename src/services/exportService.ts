
import { supabase } from "@/integrations/supabase/client";
import { validateEmailsBatch } from "./emailCleaningService";

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportContactsByCategory = async (
  categoryId: string, 
  categoryName: string, 
  totalCount: number,
  cleanEmails: boolean = false,
  onEmailCleaningProgress?: (processed: number, total: number, validEmails: number) => void
): Promise<number> => {
  console.log(`Exporting contacts for category: ${categoryName} (${totalCount} contacts, cleanEmails: ${cleanEmails})`);
  
  const maxContactsPerFile = 25000;
  const numberOfFiles = Math.ceil(totalCount / maxContactsPerFile);
  let filesGenerated = 0;

  for (let fileIndex = 0; fileIndex < numberOfFiles; fileIndex++) {
    const from = fileIndex * maxContactsPerFile;
    const to = Math.min(from + maxContactsPerFile - 1, totalCount - 1);
    
    console.log(`Generating file ${fileIndex + 1}/${numberOfFiles} for ${categoryName}`);
    
    const { data: contactsInCategory, error } = await supabase
      .from("contact_categories")
      .select(`
        contacts!inner(
          id,
          full_name,
          email,
          company,
          engagement_level,
          tags,
          summit_history,
          created_at,
          updated_at
        ),
        customer_categories!inner(
          name
        )
      `)
      .eq("category_id", categoryId)
      .range(from, to);

    if (error) {
      console.error("Error fetching contacts for category:", error);
      throw new Error(`Failed to fetch contacts for category: ${categoryName}`);
    }

    if (!contactsInCategory || contactsInCategory.length === 0) {
      console.log(`No contacts found for this range in category: ${categoryName}`);
      continue;
    }

    let processedContacts = contactsInCategory;

    // Clean emails if requested
    if (cleanEmails && onEmailCleaningProgress) {
      console.log(`Cleaning emails for ${contactsInCategory.length} contacts...`);
      
      const emails = contactsInCategory.map(item => item.contacts.email);
      const validEmails = await validateEmailsBatch(emails, onEmailCleaningProgress);
      
      // Filter contacts to only include those with valid emails
      processedContacts = contactsInCategory.filter(item => 
        validEmails.includes(item.contacts.email)
      );
      
      console.log(`Email cleaning complete: ${processedContacts.length}/${contactsInCategory.length} contacts retained`);
    }

    // Create CSV content for contacts in this batch with all available data
    const csvHeaders = "ID,Name,Email,Company,Engagement Level,Tags,Summit History,Category,Created Date,Updated Date\n";
    const csvRows = processedContacts.map(item => {
      const contact = item.contacts;
      const tagsString = contact.tags ? contact.tags.join(';') : '';
      const summitHistoryString = contact.summit_history ? contact.summit_history.join(';') : '';
      
      return `"${contact.id}","${contact.full_name || ''}","${contact.email}","${contact.company || ''}","${contact.engagement_level || ''}","${tagsString}","${summitHistoryString}","${item.customer_categories.name}","${contact.created_at}","${contact.updated_at}"`;
    }).join("\n");
    
    const csvContent = csvHeaders + csvRows;
    
    // Generate filename with file number if multiple files
    let filename;
    const cleanSuffix = cleanEmails ? '_cleaned' : '';
    if (numberOfFiles > 1) {
      filename = `contacts_${categoryName}_part${fileIndex + 1}_of_${numberOfFiles}${cleanSuffix}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      filename = `contacts_${categoryName}${cleanSuffix}_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    // Download the file
    downloadCSV(csvContent, filename);
    filesGenerated++;
    
    // Add a small delay between downloads to prevent browser issues
    if (fileIndex < numberOfFiles - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`Generated ${filesGenerated} files for category: ${categoryName}`);
  return filesGenerated;
};
