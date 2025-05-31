
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useContacts = () => {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      console.log('=== Fetching all contacts ===');
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contacts:", error);
        throw error;
      }

      console.log('Total contacts fetched:', data?.length);
      console.log('Sample contacts main_bucket values:', data?.slice(0, 5).map(c => ({
        email: c.email,
        main_bucket: c.main_bucket
      })));

      // Normalize main_bucket values for consistency
      const normalizedData = data?.map(contact => ({
        ...contact,
        main_bucket: normalizeBucketName(contact.main_bucket)
      }));

      return normalizedData;
    },
  });
};

// Helper function to normalize bucket names
const normalizeBucketName = (bucketName: string | null): string => {
  if (!bucketName) return 'biz-op'; // Default to biz-op for null values
  
  const normalized = bucketName.toLowerCase().trim();
  
  // Normalize all business operations variants
  if (normalized === 'business operations' || 
      normalized === 'business-operations' ||
      normalized === 'business_operations' ||
      normalized === 'businessoperations' ||
      normalized === 'biz') {
    return 'biz-op';
  }
  
  // Normalize health variants
  if (normalized === 'health and wellness') {
    return 'health';
  }
  
  // Normalize survivalist variants
  if (normalized === 'survival' || normalized === 'emergency preparedness') {
    return 'survivalist';
  }
  
  // Normalize cannot place variants
  if (normalized === 'cannot place' || normalized === 'unassigned') {
    return 'cannot-place';
  }
  
  return normalized; // Return as-is if already normalized
};

export const useContactsCount = () => {
  return useQuery({
    queryKey: ["contacts-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error counting contacts:", error);
        throw error;
      }

      console.log('Total contact count:', count);
      return count || 0;
    },
  });
};
