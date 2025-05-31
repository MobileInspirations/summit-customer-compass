
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

      return data;
    },
  });
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
