
import { UploadDialog } from "../UploadDialog";
import { ExportDialog } from "../ExportDialog";
import { AICategorizationDialog } from "../AICategorizationDialog";
import { ContactLimitDialog } from "../ContactLimitDialog";
import { CategorizationResultsDialog } from "../CategorizationResultsDialog";

interface DialogsContainerProps {
  dialogState: {
    showUploadDialog: boolean;
    setShowUploadDialog: (show: boolean) => void;
    showExportDialog: boolean;
    setShowExportDialog: (show: boolean) => void;
    showContactLimitDialog: boolean;
    setShowContactLimitDialog: (show: boolean) => void;
    showAICategorizationDialog: boolean;
    setShowAICategorizationDialog: (show: boolean) => void;
  };
  selectedCategories: string[];
  allCategories: any[];
  exportState?: {
    handleEmailCleaningProgress?: (processed: number, total: number, validEmails: number) => void;
  };
  categorizationState?: {
    showResultsDialog?: boolean;
    setShowResultsDialog?: (show: boolean) => void;
    categorizationResults?: any;
  };
  categorizationHandlers?: {
    handleAICategorizeAll?: (contactLimit?: number) => void;
    handleContactLimitCategorization?: (contactLimit?: number) => void;
  };
  onUploadComplete: () => void;
}

export const DialogsContainer = ({
  dialogState,
  selectedCategories,
  allCategories,
  exportState,
  categorizationState,
  categorizationHandlers,
  onUploadComplete
}: DialogsContainerProps) => {
  return (
    <>
      <UploadDialog 
        open={dialogState.showUploadDialog} 
        onOpenChange={dialogState.setShowUploadDialog}
        onUploadComplete={onUploadComplete}
      />
      {dialogState.showExportDialog && (
        <ExportDialog 
          open={dialogState.showExportDialog} 
          onOpenChange={dialogState.setShowExportDialog}
          selectedCategories={selectedCategories.map(id => 
            allCategories.find((cat: any) => cat.id === id)
          ).filter(Boolean)}
          onEmailCleaningProgress={exportState?.handleEmailCleaningProgress || (() => {})}
        />
      )}
      {dialogState.showAICategorizationDialog && categorizationHandlers?.handleAICategorizeAll && (
        <AICategorizationDialog
          open={dialogState.showAICategorizationDialog}
          onOpenChange={dialogState.setShowAICategorizationDialog}
          onCategorize={categorizationHandlers.handleAICategorizeAll}
        />
      )}
      {dialogState.showContactLimitDialog && categorizationHandlers?.handleContactLimitCategorization && (
        <ContactLimitDialog
          open={dialogState.showContactLimitDialog}
          onOpenChange={dialogState.setShowContactLimitDialog}
          onCategorize={categorizationHandlers.handleContactLimitCategorization}
          title="Auto Categorization"
          description="Select how many contacts to categorize using rule-based logic."
        />
      )}
      {categorizationState?.showResultsDialog && (
        <CategorizationResultsDialog
          open={categorizationState.showResultsDialog}
          onOpenChange={categorizationState.setShowResultsDialog || (() => {})}
          results={categorizationState.categorizationResults}
        />
      )}
    </>
  );
};
