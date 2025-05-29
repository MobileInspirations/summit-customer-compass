
import { supabase } from "@/integrations/supabase/client";

export const exportAllTags = async () => {
  console.log("Exporting all tags/categories");
  
  // Get all categories with their contact counts
  const { data: categories, error: categoriesError } = await supabase
    .from("customer_categories")
    .select("*")
    .order("name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
    throw new Error("Failed to fetch categories");
  }

  // Get contact counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { count, error: countError } = await supabase
        .from("contact_categories")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id);

      if (countError) {
        console.error("Error counting contacts for category:", category.id, countError);
        return { ...category, count: 0 };
      }

      return { ...category, count: count || 0 };
    })
  );

  // Create CSV content
  const csvHeaders = "Category Name,Type,Description,Contact Count,Color\n";
  const csvRows = categoriesWithCounts.map(category => 
    `"${category.name}","${category.category_type}","${category.description || ''}",${category.count},"${category.color}"`
  ).join("\n");
  
  const csvContent = csvHeaders + csvRows;
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `all_tags_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`Exported ${categoriesWithCounts.length} categories/tags`);
  return categoriesWithCounts;
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
