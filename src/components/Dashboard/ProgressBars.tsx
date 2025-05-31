
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
  // Calculate contacts per second for categorization
  const getContactsPerSecond = () => {
    if (!categorizationState.isCategorizing || categorizationState.categorizationProgress.processedCount === 0) {
      return 0;
    }
    // This is a rough estimate - for more accurate timing, we'd need to track start time
    const estimatedSeconds = categorizationState.categorizationProgress.currentBatch * 2; // Rough estimate
    return Math.round(categorizationState.categorizationProgress.processedCount / Math.max(estimatedSeconds, 1));
  };

  const contactsPerSecond = getContactsPerSecond();

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
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              Categorizing contacts... {categorizationState.categorizationProgress.processedCount.toLocaleString()} / {categorizationState.categorizationProgress.totalCount.toLocaleString()} contacts processed.
              (Batch {categorizationState.categorizationProgress.currentBatch} of {categorizationState.categorizationProgress.totalBatches})
            </span>
            {contactsPerSecond > 0 && (
              <span className={`font-medium ${contactsPerSecond >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                {contactsPerSecond} contacts/sec
                {contactsPerSecond < 50 && <span className="text-red-500 ml-1">⚠️</span>}
                {contactsPerSecond >= 50 && <span className="text-green-500 ml-1">✓</span>}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
