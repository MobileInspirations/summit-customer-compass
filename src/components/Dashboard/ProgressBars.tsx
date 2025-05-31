
interface ProgressBarsProps {
  exportState: {
    isExporting: boolean;
    exportProgress: {
      contactsProcessed: number;
      totalContacts: number;
      isComplete: boolean;
      isError: boolean;
    };
  };
  categorizationState: {
    isCategorizing: boolean;
    categorizationProgress: {
      processedCount: number;
      totalCount: number;
      currentBatch: number;
      totalBatches: number;
    };
  };
}

export const ProgressBars = ({ exportState, categorizationState }: ProgressBarsProps) => {
  return (
    <>
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
    </>
  );
};
