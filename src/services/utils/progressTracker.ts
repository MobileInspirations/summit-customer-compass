
export interface CategorizationProgress {
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export const createProgressUpdate = (
  processedCount: number,
  totalCount: number,
  currentBatch: number,
  totalBatches: number
): CategorizationProgress => {
  const progress = Math.round((processedCount / totalCount) * 100);
  
  return {
    progress,
    currentBatch,
    totalBatches,
    processedCount,
    totalCount
  };
};

export const createInitialProgress = (): CategorizationProgress => ({
  progress: 0,
  currentBatch: 0,
  totalBatches: 0,
  processedCount: 0,
  totalCount: 0
});
