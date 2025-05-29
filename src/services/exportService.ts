
import { supabase } from "@/integrations/supabase/client";

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
  totalCount: number
): Promise<number> => {
  console.log(`Exporting contacts for category: ${categoryName} (${totalCount} contacts)`);
  
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
          full_name,
          email,
          company,
          created_at
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

    // Create CSV content for contacts in this batch
    const csvHeaders = "Name,Email,Company,Created Date,Category\n";
    const csvRows = contactsInCategory.map(item => 
      `"${item.contacts.full_name || ''}","${item.contacts.email}","${item.contacts.company || ''}","${item.contacts.created_at}","${item.customer_categories.name}"`
    ).join("\n");
    
    const csvContent = csvHeaders + csvRows;
    
    // Generate filename with file number if multiple files
    let filename;
    if (numberOfFiles > 1) {
      filename = `contacts_${categoryName}_part${fileIndex + 1}_of_${numberOfFiles}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      filename = `contacts_${categoryName}_${new Date().toISOString().split('T')[0]}.csv`;
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
