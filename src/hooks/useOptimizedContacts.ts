
import { useQuery } from "@tanstack/react-query";
import { LargeScaleContactService } from "@/services/optimized/largeScaleContactService";

export const useOptimizedContacts = () => {
  return useQuery({
    queryKey: ["optimized-contacts"],
    queryFn: async () => {
      console.log('=== Fetching all contacts with optimized pagination ===');
      
      const contacts = await LargeScaleContactService.getAllContactsWithPagination();
      
      console.log('Total contacts fetched:', contacts?.length);
      console.log('Sample contacts main_bucket values:', contacts?.slice(0, 5).map(c => ({
        email: c.email,
        main_bucket: c.main_bucket
      })));

      // Normalize main_bucket values for consistency
      const normalizedData = contacts?.map(contact => ({
        ...contact,
        main_bucket: normalizeBucketName(contact.main_bucket)
      }));

      return normalizedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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

export const useOptimizedContactsCount = () => {
  return useQuery({
    queryKey: ["optimized-contacts-count"],
    queryFn: async () => {
      // Use a more efficient count query
      const contacts = await LargeScaleContactService.getAllContactsWithPagination();
      const count = contacts?.length || 0;
      
      console.log('Optimized contact count:', count);
      return count;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
