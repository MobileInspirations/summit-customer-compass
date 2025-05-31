
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useContactsCount } from "@/hooks/useContacts";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import { useAuth } from "@/hooks/useAuth";
import { useCategorizationState } from "@/hooks/useCategorizationState";
import { useExportState } from "@/hooks/useExportState";
import { useDialogState } from "@/hooks/useDialogState";
import { useCategorizationHandlers } from "@/components/Dashboard/CategorizationHandlers";
import { useExportHandlers } from "@/components/Dashboard/ExportHandlers";
import { EnhancedDashboardHeader } from "@/components/Dashboard/EnhancedDashboardHeader";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { CategoriesSection } from "@/components/Dashboard/CategoriesSection";
import { BucketSelector } from "@/components/BucketSelector";
import { UploadDialog } from "@/components/UploadDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { CategorizationProgress } from "@/components/CategorizationProgress";
import { ExportProgress } from "@/components/ExportProgress";
import { AICategorizationDialog } from "@/components/AICategorizationDialog";
import { ContactLimitDialog } from "@/components/ContactLimitDialog";
import { EmailCleaningProgress } from "@/components/EmailCleaningProgress";
import { CategorizationResultsDialog } from "@/components/CategorizationResultsDialog";
import type { MainBucketId } from "@/services/bucketCategorizationService";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<MainBucketId>('biz-op');
  const [isSorting, setIsSorting] = useState(false);
  
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Custom hooks for state management
  const categorizationState = useCategorizationState();
  const exportState = useExportState();
  const dialogState = useDialogState();

  // Fetch data from Supabase
  const { data: customerCategories = [], isLoading: customerLoading } = useCategoriesByType("customer");
  const { data: personalityCategories = [], isLoading: personalityLoading } = useCategoriesByType("personality");
  const { data: totalContacts = 0, isLoading: contactsLoading } = useContactsCount();
  const { data: bucketCounts = {}, isLoading: bucketCountsLoading } = useBucketCounts();

  const allCategories = [...customerCategories, ...personalityCategories];
  const isLoading = customerLoading || personalityLoading || contactsLoading || bucketCountsLoading;

  // Event handlers
  const categorizationHandlers = useCategorizationHandlers({
    setIsCategorizing: categorizationState.setIsCategorizing,
    setCategorizationProgress: categorizationState.setCategorizationProgress,
    setCategorizationResults: categorizationState.setCategorizationResults,
    setShowResultsDialog: categorizationState.setShowResultsDialog,
    cancellationTokenRef: categorizationState.cancellationTokenRef,
    resetProgress: categorizationState.resetProgress
  });

  const exportHandlers = useExportHandlers({
    setIsExporting: exportState.setIsExporting,
    setExportProgress: exportState.setExportProgress,
    selectedCategories,
    allCategories
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = () => {
    const canExport = exportHandlers.handleExport();
    if (canExport) {
      dialogState.setShowExportDialog(true);
    }
  };

  const handleViewAllContacts = () => {
    navigate("/contacts");
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const selectedCount = allCategories
    .filter(cat => selectedCategories.includes(cat.id))
    .reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedDashboardHeader
        onUploadClick={() => dialogState.setShowUploadDialog(true)}
        onViewAllContacts={handleViewAllContacts}
        onSortContacts={exportHandlers.handleSortContacts}
        onExportAllTags={exportHandlers.handleExportAllTags}
        onCategorizeAll={() => dialogState.setShowContactLimitDialog(true)}
        onAICategorizeAll={() => dialogState.setShowAICategorizationDialog(true)}
        onExport={handleExport}
        onSignOut={handleSignOut}
        selectedCategoriesCount={selectedCategories.length}
        isSorting={isSorting}
        isExporting={exportState.isExporting}
        isCategorizing={categorizationState.isCategorizing}
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

      {/* Dialogs */}
      <UploadDialog 
        open={dialogState.showUploadDialog} 
        onOpenChange={dialogState.setShowUploadDialog} 
      />
      <ExportDialog 
        open={dialogState.showExportDialog} 
        onOpenChange={dialogState.setShowExportDialog}
        selectedCategories={selectedCategories.map(id => 
          allCategories.find(cat => cat.id === id)!
        ).filter(Boolean)}
        onEmailCleaningProgress={exportState.handleEmailCleaningProgress}
      />
      <AICategorizationDialog
        open={dialogState.showAICategorizationDialog}
        onOpenChange={dialogState.setShowAICategorizationDialog}
        onCategorize={categorizationHandlers.handleAICategorizeAll}
      />
      <ContactLimitDialog
        open={dialogState.showContactLimitDialog}
        onOpenChange={dialogState.setShowContactLimitDialog}
        onCategorize={categorizationHandlers.handleContactLimitCategorization}
        title="Auto Categorization"
        description="Select how many contacts to categorize using rule-based logic."
      />
      <CategorizationResultsDialog
        open={categorizationState.showResultsDialog}
        onOpenChange={categorizationState.setShowResultsDialog}
        results={categorizationState.categorizationResults}
      />

      {/* Progress Components */}
      <CategorizationProgress
        isVisible={categorizationState.isCategorizing}
        progress={categorizationState.categorizationProgress.progress}
        currentBatch={categorizationState.categorizationProgress.currentBatch}
        totalBatches={categorizationState.categorizationProgress.totalBatches}
        processedCount={categorizationState.categorizationProgress.processedCount}
        totalCount={categorizationState.categorizationProgress.totalCount}
        onStop={categorizationState.isCategorizing ? categorizationHandlers.handleStopCategorization : undefined}
      />
      <ExportProgress
        isVisible={exportState.isExporting || exportState.exportProgress.isComplete}
        isComplete={exportState.exportProgress.isComplete}
        isError={exportState.exportProgress.isError}
        contactsProcessed={exportState.exportProgress.contactsProcessed}
        totalContacts={exportState.exportProgress.totalContacts}
        tagsFound={exportState.exportProgress.tagsFound}
      />
      <EmailCleaningProgress
        isVisible={exportState.emailCleaningProgress.isActive}
        isComplete={exportState.emailCleaningProgress.isComplete}
        isError={exportState.emailCleaningProgress.isError}
        processed={exportState.emailCleaningProgress.processed}
        total={exportState.emailCleaningProgress.total}
        validEmails={exportState.emailCleaningProgress.validEmails}
      />
    </div>
  );
};

export default Index;
