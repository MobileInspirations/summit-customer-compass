import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useContactsCount } from "@/hooks/useContacts";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import { categorizeContacts } from "@/services/contactCategorizationService";
import { sortContacts } from "@/services/contactSortingService";
import { exportAllTags } from "@/services/tagExportService";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedDashboardHeader } from "@/components/Dashboard/EnhancedDashboardHeader";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { CategoriesSection } from "@/components/Dashboard/CategoriesSection";
import { BucketSelector } from "@/components/BucketSelector";
import { UploadDialog } from "@/components/UploadDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { CategorizationProgress } from "@/components/CategorizationProgress";
import { ExportProgress } from "@/components/ExportProgress";
import { AICategorizationDialog } from "@/components/AICategorizationDialog";
import type { MainBucketId } from "@/services/bucketCategorizationService";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<MainBucketId>('biz-op');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
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
  const [exportProgress, setExportProgress] = useState({
    contactsProcessed: 0,
    totalContacts: 0,
    tagsFound: 0,
    isComplete: false,
    isError: false
  });
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch data from Supabase
  const { data: customerCategories = [], isLoading: customerLoading } = useCategoriesByType("customer");
  const { data: personalityCategories = [], isLoading: personalityLoading } = useCategoriesByType("personality");
  const { data: totalContacts = 0, isLoading: contactsLoading } = useContactsCount();
  const { data: bucketCounts = {}, isLoading: bucketCountsLoading } = useBucketCounts();

  const allCategories = [...customerCategories, ...personalityCategories];
  const isLoading = customerLoading || personalityLoading || contactsLoading || bucketCountsLoading;

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

  const handleAICategorizeAll = async (apiKey: string) => {
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
      }, true, apiKey);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "AI Categorization complete",
        description: "All contacts have been categorized using AI into personality type buckets.",
      });
    } catch (error) {
      console.error('AI Categorization error:', error);
      toast({
        title: "AI Categorization failed",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      setShowAIDialog(false);
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
    setExportProgress({
      contactsProcessed: 0,
      totalContacts: 0,
      tagsFound: 0,
      isComplete: false,
      isError: false
    });

    try {
      const exportedCategories = await exportAllTags((progress) => {
        setExportProgress(prev => ({
          ...prev,
          contactsProcessed: progress.contactsProcessed,
          totalContacts: progress.totalContacts,
          tagsFound: progress.tagsFound
        }));
      });
      
      setExportProgress(prev => ({
        ...prev,
        isComplete: true,
        isError: false
      }));
      
      toast({
        title: "Export complete",
        description: `Successfully exported ${exportedCategories.length} categories/tags to CSV file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportProgress(prev => ({
        ...prev,
        isComplete: true,
        isError: true
      }));
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
      <EnhancedDashboardHeader
        onUploadClick={() => setShowUploadDialog(true)}
        onViewAllContacts={handleViewAllContacts}
        onSortContacts={handleSortContacts}
        onExportAllTags={handleExportAllTags}
        onCategorizeAll={handleCategorizeAll}
        onAICategorizeAll={() => setShowAIDialog(true)}
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

        <BucketSelector
          selectedBucket={selectedBucket}
          onBucketChange={(bucket) => setSelectedBucket(bucket as MainBucketId)}
          bucketCounts={bucketCounts}
        />
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
      <AICategorizationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onCategorize={handleAICategorizeAll}
      />
      <CategorizationProgress
        isVisible={isCategorizing}
        progress={categorizationProgress.progress}
        currentBatch={categorizationProgress.currentBatch}
        totalBatches={categorizationProgress.totalBatches}
        processedCount={categorizationProgress.processedCount}
        totalCount={categorizationProgress.totalCount}
      />
      <ExportProgress
        isVisible={isExporting || exportProgress.isComplete}
        isComplete={exportProgress.isComplete}
        isError={exportProgress.isError}
        contactsProcessed={exportProgress.contactsProcessed}
        totalContacts={exportProgress.totalContacts}
        tagsFound={exportProgress.tagsFound}
      />
    </div>
  );
};

export default Index;
