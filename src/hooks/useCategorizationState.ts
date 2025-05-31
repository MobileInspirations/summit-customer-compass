
import { useState, useRef } from "react";
import { CancellationToken } from "@/services/utils/cancellationToken";
import type { CategorizationResults } from "@/services/contactCategorizationService";

export interface CategorizationProgress {
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export const useCategorizationState = () => {
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationProgress, setCategorizationProgress] = useState<CategorizationProgress>({
    progress: 0,
    currentBatch: 0,
    totalBatches: 0,
    processedCount: 0,
    totalCount: 0
  });
  const [categorizationResults, setCategorizationResults] = useState<CategorizationResults | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const cancellationTokenRef = useRef<CancellationToken | null>(null);

  const resetProgress = () => {
    setCategorizationProgress({
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: 0
    });
  };

  return {
    isCategorizing,
    setIsCategorizing,
    categorizationProgress,
    setCategorizationProgress,
    categorizationResults,
    setCategorizationResults,
    showResultsDialog,
    setShowResultsDialog,
    cancellationTokenRef,
    resetProgress
  };
};
