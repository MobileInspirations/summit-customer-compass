
import { supabase } from "@/integrations/supabase/client";

export const exportAllTags = async () => {
  console.log("Exporting all tags from all contacts summit_history");
  
  // Get ALL contacts with their summit_history tags (including null ones)
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, email, full_name, company, summit_history");

  if (contactsError) {
    console.error("Error fetching contacts:", contactsError);
    throw new Error("Failed to fetch contacts");
  }

  if (!contacts || contacts.length === 0) {
    console.log("No contacts found");
    return [];
  }

  console.log(`Processing ${contacts.length} total contacts`);

  // Extract all unique tags from summit_history arrays
  const allTags = new Set<string>();
  const tagUsageMap = new Map<string, number>();
  let contactsWithTags = 0;
  let totalTagOccurrences = 0;

  contacts.forEach(contact => {
    if (contact.summit_history && Array.isArray(contact.summit_history)) {
      contactsWithTags++;
      contact.summit_history.forEach(tag => {
        if (tag && typeof tag === 'string' && tag.trim()) {
          const cleanTag = tag.trim();
          allTags.add(cleanTag);
          tagUsageMap.set(cleanTag, (tagUsageMap.get(cleanTag) || 0) + 1);
          totalTagOccurrences++;
        }
      });
    }
  });

  console.log(`Found ${contactsWithTags} contacts with tags out of ${contacts.length} total contacts`);
  console.log(`Total tag occurrences: ${totalTagOccurrences}`);
  console.log(`Unique tags: ${allTags.size}`);

  // Convert to array and sort by usage count (most used first)
  const sortedTags = Array.from(allTags).map(tag => ({
    tag,
    usageCount: tagUsageMap.get(tag) || 0
  })).sort((a, b) => b.usageCount - a.usageCount);

  // Create CSV content with additional statistics
  const csvHeaders = "Tag,Usage Count,Type\n";
  const csvRows = sortedTags.map(item => 
    `"${item.tag}",${item.usageCount},"User Tag"`
  ).join("\n");
  
  // Add summary row at the top
  const summaryRow = `"SUMMARY: ${sortedTags.length} unique tags, ${totalTagOccurrences} total occurrences across ${contactsWithTags} contacts out of ${contacts.length} total contacts","","Summary"\n`;
  
  const csvContent = csvHeaders + summaryRow + csvRows;
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `all_user_tags_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`Exported ${sortedTags.length} unique tags from ${contactsWithTags} contacts with tags (out of ${contacts.length} total contacts)`);
  return sortedTags;
};

export const exportContactsByTag = async (categoryId: string) => {
  console.log(`Exporting contacts for category: ${categoryId}`);
  
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
    .eq("category_id", categoryId);

  if (error) {
    console.error("Error fetching contacts for category:", error);
    throw new Error("Failed to fetch contacts for category");
  }

  if (!contactsInCategory || contactsInCategory.length === 0) {
    console.log("No contacts found for this category");
    return [];
  }

  // Get the category name from the first item
  const categoryName = contactsInCategory[0].customer_categories.name;

  // Create CSV content for contacts in this category
  const csvHeaders = "Name,Email,Company,Created Date,Category\n";
  const csvRows = contactsInCategory.map(item => 
    `"${item.contacts.full_name || ''}","${item.contacts.email}","${item.contacts.company || ''}","${item.contacts.created_at}","${item.customer_categories.name}"`
  ).join("\n");
  
  const csvContent = csvHeaders + csvRows;
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `contacts_${categoryName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return contactsInCategory;
};
