
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchContactsCount } from "@/services/data/contactDataService";
import { fetchAllCategories } from "@/services/data/categoryDataService";
import { useAuth } from "@/hooks/useAuth";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import { useTotalUniqueContacts } from "@/hooks/useTotalUniqueContacts";

import { EnhancedDashboardHeader } from "./EnhancedDashboardHeader";
import { BucketSelector } from "../BucketSelector";
import { CategoriesSection } from "./CategoriesSection";
import { StatsCards } from "./StatsCards";
import { useDialogState } from "@/hooks/useDialogState";
import { useExportState } from "@/hooks/useExportState";
import { useCategorizationState } from "@/hooks/useCategorizationState";
import { useExportHandlers } from "./ExportHandlers";
import { useCategorizationHandlers } from "./CategorizationHandlers";
import { DialogsContainer } from "./DialogsContainer";
import { ProgressBars } from "./ProgressBars";
import { ErrorLogButton } from "./ErrorLogButton";

export const Dashboard = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('biz-op');
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const dialogState = useDialogState();
  const exportState = useExportState();
  const categorizationState = useCategorizationState();

  const { data: contactsCount } = useQuery({
    queryKey: ["contacts-count"],
    queryFn: fetchContactsCount,
  });

  const { data: totalUniqueContacts = 0 } = useTotalUniqueContacts();

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
        isSorting={false}
        isExporting={exportState.isExporting}
        isCategorizing={categorizationState.isCategorizing}
        contactsCount={contactsCount || 0}
        categoriesCount={allCategories.length}
      />

      <ErrorLogButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8 py-8">
        <StatsCards
          totalContacts={contactsCount || 0}
          totalUniqueContacts={totalUniqueContacts}
          categoriesCount={allCategories.length}
          selectedCount={selectedCategories.length}
        />

        <BucketSelector 
          selectedBucket={selectedBucket}
          onBucketChange={handleBucketChange}
          bucketCounts={bucketCounts}
        />

        <CategoriesSection
          title="Customer Categories"
          categories={customerCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={handleCategorySelect}
        />

        <CategoriesSection
          title="Personality Categories"
          categories={personalityCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={handleCategorySelect}
        />
      </div>

      <DialogsContainer
        dialogState={dialogState}
        selectedCategories={selectedCategories}
        allCategories={allCategories}
        exportState={exportState}
        categorizationState={categorizationState}
        categorizationHandlers={categorizationHandlers}
      />

      <ProgressBars
        exportState={exportState}
        categorizationState={categorizationState}
      />
    </div>
  );
};
