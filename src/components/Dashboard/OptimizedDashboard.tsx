import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchContactsCount } from "@/services/data/contactDataService";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedCategoriesByType } from "@/hooks/useOptimizedCategories";
import { useOptimizedBucketCounts } from "@/hooks/useOptimizedBucketCounts";
import { useTotalUniqueContactsOptimized } from "@/hooks/useTotalUniqueContactsOptimized";

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

export const OptimizedDashboard = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('biz-op');
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const dialogState = useDialogState();
  const exportState = useExportState();
  const categorizationState = useCategorizationState();

  const { data: contactsCount, refetch: refetchContactsCount } = useQuery({
    queryKey: ["contacts-count"],
    queryFn: fetchContactsCount,
  });

  const { data: totalUniqueContacts = 0, refetch: refetchUniqueContacts } = useTotalUniqueContactsOptimized();

  const { data: allCategories = [] } = useOptimizedCategoriesByType("customer");
  const { data: customerCategories = [] } = useOptimizedCategoriesByType("customer");
  const { data: personalityCategories = [] } = useOptimizedCategoriesByType("personality");
  const { data: bucketCounts = {}, refetch: refetchBucketCounts } = useOptimizedBucketCounts();

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
    // Placeholder for export logic
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedDashboardHeader
        onUploadClick={() => dialogState.setShowUploadDialog(true)}
        onViewAllContacts={() => navigate("/contacts")}
        onSortContacts={() => {}}
        onExportAllTags={() => {}}
        onCategorizeAll={() => dialogState.setShowContactLimitDialog(true)}
        onAICategorizeAll={() => dialogState.setShowAICategorizationDialog(true)}
        onExport={() => {}}
        onSignOut={async () => {
          await signOut();
          navigate("/auth");
        }}
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
          onBucketChange={(bucket) => {
            setSelectedBucket(bucket);
            setSelectedCategories([]);
          }}
          bucketCounts={bucketCounts}
        />

        <CategoriesSection
          title="Customer Categories"
          categories={customerCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={(categoryId) => {
            setSelectedCategories(prev => 
              prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
            );
          }}
        />

        <CategoriesSection
          title="Personality Categories"
          categories={personalityCategories}
          selectedCategories={selectedCategories}
          onCategorySelect={(categoryId) => {
            setSelectedCategories(prev => 
              prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
            );
          }}
        />
      </div>
    </div>
  );
};
