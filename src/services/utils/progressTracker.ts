
export interface CategorizationProgress {
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export class ProgressTracker {
  private onProgress?: (progress: CategorizationProgress) => void;

  constructor(onProgress?: (progress: CategorizationProgress) => void) {
    this.onProgress = onProgress;
  }

  initialize(totalCount: number): void {
    if (this.onProgress) {
      this.onProgress({
        progress: 0,
        currentBatch: 0,
        totalBatches: 0,
        processedCount: 0,
        totalCount
      });
    }
  }

  updateProgress(processedCount: number, currentBatch: number, totalBatches: number): void {
    if (this.onProgress) {
      const progress = Math.round((processedCount / (totalBatches * 50)) * 100); // Assuming 50 per batch
      this.onProgress({
        progress,
        currentBatch,
        totalBatches,
        processedCount,
        totalCount: totalBatches * 50
      });
    }
  }
}
