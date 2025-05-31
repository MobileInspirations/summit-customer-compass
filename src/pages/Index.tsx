import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useContactsCount } from "@/hooks/useContacts";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import { categorizeContacts, CancellationToken } from "@/services/contactCategorizationService";
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
import { ContactLimitDialog } from "@/components/ContactLimitDialog";
import type { MainBucketId } from "@/services/bucketCategorizationService";
import { EmailCleaningProgress } from "@/components/EmailCleaningProgress";
import { CategorizationResultsDialog } from "@/components/CategorizationResultsDialog";
import type { CategorizationResults } from "@/services/contactCategorizationService";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<MainBucketId>('biz-op');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showContactLimitDialog, setShowContactLimitDialog] = useState(false);
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
  const [emailCleaningProgress, setEmailCleaningProgress] = useState({
    processed: 0,
    total: 0,
    validEmails: 0,
    isActive: false,
    isComplete: false,
    isError: false
  });
  const cancellationTokenRef = useRef<CancellationToken | null>(null);
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

  const handleStopCategorization = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.cancel();
      setIsCategorizing(false);
      toast({
        title: "Categorization stopped",
        description: "The categorization process has been cancelled.",
        variant: "default",
      });
    }
  };

  const handleViewAllContacts = () => {
    navigate("/contacts");
  };

  const selectedCount = allCategories
    .filter(cat => selectedCategories.includes(cat.id))
    .reduce((sum, cat) => sum + cat.count, 0);

  const handleEmailCleaningProgress = (processed: number, total: number, validEmails: number) => {
    setEmailCleaningProgress({
      processed,
      total,
      validEmails,
      isActive: true,
      isComplete: false,
      isError: false
    });
  };

  const [showAICategorizationDialog, setShowAICategorizationDialog] = useState(false);
  
  const [categorizationResults, setCategorizationResults] = useState<CategorizationResults | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  // Regular rule-based categorization (NO AI, NO API KEY REQUIRED)
  const handleCategorizeAll = () => {
    setShowContactLimitDialog(true);
  };

  const handleContactLimitCategorization = async (contactLimit?: number) => {
    setIsCategorizing(true);
    setCategorizationProgress({
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: 0
    });

    // Create a new cancellation token
    cancellationTokenRef.current = new CancellationToken();

    try {
      // Call categorizeContacts with useAI = false and no API key
      const results = await categorizeContacts(
        undefined, // contactIds
        (progress) => {
          setCategorizationProgress(progress);
        }, 
        false, // useAI = false for regular categorization
        undefined, // no API key needed
        cancellationTokenRef.current,
        contactLimit // pass the contact limit
      );
      
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      // Store results and show dialog
      setCategorizationResults(results);
      setShowResultsDialog(true);
      
      toast({
        title: "Categorization complete",
        description: `Contacts have been automatically categorized into appropriate buckets${contactLimit ? ` (limited to ${contactLimit} contacts)` : ''}.`,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation was cancelled') {
        // Don't show error toast for user-initiated cancellation
        return;
      }
      console.error('Categorization error:', error);
      toast({
        title: "Categorization failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      cancellationTokenRef.current = null;
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

  // AI-based categorization (USES STORED API KEY FROM SUPABASE)
  const handleAICategorizeAll = async (contactLimit?: number) => {
    setIsCategorizing(true);
    setCategorizationProgress({
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: 0
    });

    // Create a new cancellation token
    cancellationTokenRef.current = new CancellationToken();

    try {
      // Call categorizeContacts with useAI = true (API key will be retrieved from Supabase)
      const results = await categorizeContacts(
        undefined, // contactIds
        (progress) => {
          setCategorizationProgress(progress);
        }, 
        true, // useAI = true for AI categorization
        undefined, // API key will be retrieved from Supabase secrets
        cancellationTokenRef.current,
        contactLimit // pass the contact limit
      );
      
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      // Store results and show dialog
      setCategorizationResults(results);
      setShowResultsDialog(true);
      
      toast({
        title: "AI Categorization complete",
        description: `Contacts have been categorized using AI into personality type buckets${contactLimit ? ` (limited to ${contactLimit} contacts)` : ''}.`,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation was cancelled') {
        // Don't show error toast for user-initiated cancellation
        return;
      }
      console.error('AI Categorization error:', error);
      toast({
        title: "AI Categorization failed",
        description: "Please check your API key configuration in Supabase and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      cancellationTokenRef.current = null;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedDashboardHeader
        onUploadClick={() => setShowUploadDialog(true)}
        onViewAllContacts={handleViewAllContacts}
        onSortContacts={handleSortContacts}
        onExportAllTags={handleExportAllTags}
        onCategorizeAll={handleCategorizeAll}
        onAICategorizeAll={() => setShowAICategorizationDialog(true)}
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
        onEmailCleaningProgress={handleEmailCleaningProgress}
      />
      <AICategorizationDialog
        open={showAICategorizationDialog}
        onOpenChange={setShowAICategorizationDialog}
        onCategorize={handleAICategorizeAll}
      />
      <ContactLimitDialog
        open={showContactLimitDialog}
        onOpenChange={setShowContactLimitDialog}
        onCategorize={handleContactLimitCategorization}
        title="Auto Categorization"
        description="Select how many contacts to categorize using rule-based logic."
      />
      <CategorizationProgress
        isVisible={isCategorizing}
        progress={categorizationProgress.progress}
        currentBatch={categorizationProgress.currentBatch}
        totalBatches={categorizationProgress.totalBatches}
        processedCount={categorizationProgress.processedCount}
        totalCount={categorizationProgress.totalCount}
        onStop={isCategorizing ? handleStopCategorization : undefined}
      />
      <ExportProgress
        isVisible={isExporting || exportProgress.isComplete}
        isComplete={exportProgress.isComplete}
        isError={exportProgress.isError}
        contactsProcessed={exportProgress.contactsProcessed}
        totalContacts={exportProgress.totalContacts}
        tagsFound={exportProgress.tagsFound}
      />
      <EmailCleaningProgress
        isVisible={emailCleaningProgress.isActive}
        isComplete={emailCleaningProgress.isComplete}
        isError={emailCleaningProgress.isError}
        processed={emailCleaningProgress.processed}
        total={emailCleaningProgress.total}
        validEmails={emailCleaningProgress.validEmails}
      />
      
      <CategorizationResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        results={categorizationResults}
      />
      
    </div>
  );
};

export default Index;
