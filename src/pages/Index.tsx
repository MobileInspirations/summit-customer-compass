import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useContactsCount } from "@/hooks/useContacts";
import { categorizeContacts } from "@/services/contactCategorizationService";
import { sortContacts } from "@/services/contactSortingService";
import { exportAllTags } from "@/services/tagExportService";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { CategoriesSection } from "@/components/Dashboard/CategoriesSection";
import { QuickActions } from "@/components/Dashboard/QuickActions";
import { UploadDialog } from "@/components/UploadDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { CategorizationProgress } from "@/components/CategorizationProgress";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [categorizationProgress, setCategorizationProgress] = useState({
    progress: 0,
    currentBatch: 0,
    totalBatches: 0,
    processedCount: 0,
    totalCount: 0
  });
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch data from Supabase
  const { data: customerCategories = [], isLoading: customerLoading } = useCategoriesByType("customer");
  const { data: personalityCategories = [], isLoading: personalityLoading } = useCategoriesByType("personality");
  const { data: totalContacts = 0, isLoading: contactsLoading } = useContactsCount();

  const allCategories = [...customerCategories, ...personalityCategories];
  const isLoading = customerLoading || personalityLoading || contactsLoading;

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "No categories selected",
        description: "Please select at least one category to export.",
        variant: "destructive",
      });
      return;
    }
    setShowExportDialog(true);
  };

  const handleCategorizeAll = async () => {
    setIsCategorizing(true);
    setCategorizationProgress({
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: 0
    });

    try {
      await categorizeContacts(undefined, (progress) => {
        setCategorizationProgress(progress);
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Categorization complete",
        description: "All contacts have been automatically categorized into appropriate buckets.",
      });
    } catch (error) {
      console.error('Categorization error:', error);
      toast({
        title: "Categorization failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      setTimeout(() => {
        setCategorizationProgress({
          progress: 0,
          currentBatch: 0,
          totalBatches: 0,
          processedCount: 0,
          totalCount: 0
        });
      }, 2000);
    }
  };

  const handleSortContacts = async () => {
    setIsSorting(true);
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
    } finally {
      setIsSorting(false);
    }
  };

  const handleExportAllTags = async () => {
    setIsExporting(true);
    try {
      const exportedCategories = await exportAllTags();
      toast({
        title: "Export complete",
        description: `Successfully exported ${exportedCategories.length} categories/tags to CSV file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleViewAllContacts = () => {
    navigate("/contacts");
  };

  const selectedCount = allCategories
    .filter(cat => selectedCategories.includes(cat.id))
    .reduce((sum, cat) => sum + cat.count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        onUploadClick={() => setShowUploadDialog(true)}
        onViewAllContacts={handleViewAllContacts}
        onSortContacts={handleSortContacts}
        onExportAllTags={handleExportAllTags}
        onCategorizeAll={handleCategorizeAll}
        onExport={handleExport}
        onSignOut={handleSignOut}
        selectedCategoriesCount={selectedCategories.length}
        isSorting={isSorting}
        isExporting={isExporting}
        isCategorizing={isCategorizing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards 
          totalContacts={totalContacts}
          categoriesCount={allCategories.length}
          selectedCount={selectedCount}
        />

        <CategoriesSection
          title="Customer Categories"
          categories={customerCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={handleCategorySelect}
        />

        <CategoriesSection
          title="Personality Type Buckets"
          categories={personalityCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={handleCategorySelect}
        />

        <QuickActions />
      </div>

      <UploadDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog} 
      />
      <ExportDialog 
        open={showExportDialog} 
        onOpenChange={setShowExportDialog}
        selectedCategories={selectedCategories.map(id => 
          allCategories.find(cat => cat.id === id)!
        ).filter(Boolean)}
      />
      <CategorizationProgress
        isVisible={isCategorizing}
        progress={categorizationProgress.progress}
        currentBatch={categorizationProgress.currentBatch}
        totalBatches={categorizationProgress.totalBatches}
        processedCount={categorizationProgress.processedCount}
        totalCount={categorizationProgress.totalCount}
      />
    </div>
  );
};

export default Index;
