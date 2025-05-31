
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { sortContacts } from "@/services/contactSortingService";
import { exportAllTags } from "@/services/tagExportService";
import type { ExportProgress } from "@/hooks/useExportState";

interface ExportHandlersProps {
  setIsExporting: (value: boolean) => void;
  setExportProgress: (progress: ExportProgress) => void;
  selectedCategories: string[];
  allCategories: any[];
}

export const useExportHandlers = ({
  setIsExporting,
  setExportProgress,
  selectedCategories,
  allCategories
}: ExportHandlersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleExport = () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "No categories selected",
        description: "Please select at least one category to export.",
        variant: "destructive",
      });
      return;
    }
    return true; // Allow export dialog to open
  };

  const handleSortContacts = async () => {
    try {
      await sortContacts('name', 'asc');
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
      toast({
        title: "Contacts sorted",
        description: "All contacts have been sorted alphabetically by name.",
      });
    } catch (error) {
      console.error('Sorting error:', error);
      toast({
        title: "Sorting failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleExportAllTags = async () => {
    setIsExporting(true);
    setExportProgress({
      contactsProcessed: 0,
      totalContacts: 0,
      tagsFound: 0,
      isComplete: false,
      isError: false
    });

    try {
      const exportedCategories = await exportAllTags((progress) => {
        setExportProgress({
          contactsProcessed: progress.contactsProcessed,
          totalContacts: progress.totalContacts,
          tagsFound: progress.tagsFound,
          isComplete: false,
          isError: false
        });
      });
      
      setExportProgress({
        contactsProcessed: 0,
        totalContacts: 0,
        tagsFound: exportedCategories.length,
        isComplete: true,
        isError: false
      });
      
      toast({
        title: "Export complete",
        description: `Successfully exported ${exportedCategories.length} categories/tags to CSV file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportProgress({
        contactsProcessed: 0,
        totalContacts: 0,
        tagsFound: 0,
        isComplete: true,
        isError: true
      });
      toast({
        title: "Export failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress({
          contactsProcessed: 0,
          totalContacts: 0,
          tagsFound: 0,
          isComplete: false,
          isError: false
        });
      }, 3000);
    }
  };

  return {
    handleExport,
    handleSortContacts,
    handleExportAllTags
  };
};
