import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchContactsCount } from "@/services/data/contactDataService";
import { fetchAllCategories } from "@/services/data/categoryDataService";
import { useAuth } from "@/hooks/useAuth";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useBucketCounts } from "@/hooks/useBucketCounts";

import { EnhancedDashboardHeader } from "@/components/Dashboard/EnhancedDashboardHeader";
import { BucketSelector } from "@/components/BucketSelector";
import { CategoriesSection } from "@/components/Dashboard/CategoriesSection";
import { UploadDialog } from "@/components/UploadDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { AICategorizationDialog } from "@/components/AICategorizationDialog";
import { ContactLimitDialog } from "@/components/ContactLimitDialog";
import { CategorizationResultsDialog } from "@/components/CategorizationResultsDialog";
import { useDialogState } from "@/hooks/useDialogState";
import { useExportState } from "@/hooks/useExportState";
import { useCategorizationState } from "@/hooks/useCategorizationState";
import { useExportHandlers } from "@/components/Dashboard/ExportHandlers";
import { useCategorizationHandlers } from "@/components/Dashboard/CategorizationHandlers";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorLogViewer } from "@/components/ErrorLogViewer";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('biz-op');
  const [isSorting, setIsSorting] = useState(false);
  const [showErrorLogs, setShowErrorLogs] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dialogState = useDialogState();
  const exportState = useExportState();
  const categorizationState = useCategorizationState();

  const { data: contactsCount } = useQuery({
    queryKey: ["contacts-count"],
    queryFn: fetchContactsCount,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchAllCategories,
  });

  const { data: customerCategories = [] } = useCategoriesByType("customer");
  const { data: personalityCategories = [] } = useCategoriesByType("personality");
  const { data: bucketCounts = {} } = useBucketCounts();

  const exportHandlers = useExportHandlers({
    setIsExporting: exportState.setIsExporting,
    setExportProgress: exportState.setExportProgress,
    selectedCategories: selectedCategories,
    allCategories: allCategories
  });

  const categorizationHandlers = useCategorizationHandlers({
    setIsCategorizing: categorizationState.setIsCategorizing,
    setCategorizationProgress: categorizationState.setCategorizationProgress,
    setCategorizationResults: categorizationState.setCategorizationResults,
    setShowResultsDialog: categorizationState.setShowResultsDialog,
    cancellationTokenRef: categorizationState.cancellationTokenRef,
    resetProgress: categorizationState.resetProgress
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleViewAllContacts = () => {
    navigate("/contacts");
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBucketChange = (bucket: string) => {
    setSelectedBucket(bucket);
    setSelectedCategories([]);
  };

  const handleExport = () => {
    const canExport = exportHandlers.handleExport();
    if (canExport) {
      dialogState.setShowExportDialog(true);
    }
  };

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
        contactsCount={contactsCount || 0}
        categoriesCount={allCategories.length}
      />

      {/* Error Logs Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowErrorLogs(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Error Logs
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8 py-8">
        {/* Bucket Selector */}
        <BucketSelector 
          selectedBucket={selectedBucket}
          onBucketChange={handleBucketChange}
          bucketCounts={bucketCounts}
        />

        {/* Customer Categories */}
        <CategoriesSection
          title="Customer Categories"
          categories={customerCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={handleCategorySelect}
        />

        {/* Personality Categories */}
        <CategoriesSection
          title="Personality Categories"
          categories={personalityCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={handleCategorySelect}
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
          allCategories.find((cat: any) => cat.id === id)
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
      <ErrorLogViewer
        open={showErrorLogs}
        onOpenChange={setShowErrorLogs}
      />

      {exportState.isExporting && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500">
            Exporting contacts... {exportState.exportProgress.contactsProcessed} / {exportState.exportProgress.totalContacts} contacts processed.
            {exportState.exportProgress.isComplete && !exportState.exportProgress.isError && (
              <span className="text-green-500"> Export complete!</span>
            )}
            {exportState.exportProgress.isError && (
              <span className="text-red-500"> Export failed. Please try again.</span>
            )}
          </p>
        </div>
      )}

      {categorizationState.isCategorizing && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500">
            Categorizing contacts... {categorizationState.categorizationProgress.processedCount} / {categorizationState.categorizationProgress.totalCount} contacts processed.
            (Batch {categorizationState.categorizationProgress.currentBatch} of {categorizationState.categorizationProgress.totalBatches})
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
