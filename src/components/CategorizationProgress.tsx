
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, X } from "lucide-react";

interface CategorizationProgressProps {
  isVisible: boolean;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
  onStop?: () => void;
}

export const CategorizationProgress = ({
  isVisible,
  progress,
  currentBatch,
  totalBatches,
  processedCount,
  totalCount,
  onStop
}: CategorizationProgressProps) => {
  if (!isVisible) return null;

  const displayProgress = Math.max(0, Math.min(100, progress));
  const displayCurrentBatch = Math.max(1, currentBatch);
  const displayTotalBatches = Math.max(1, totalBatches);
  const isComplete = displayProgress === 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            )}
            <h3 className="text-lg font-semibold">Categorizing Contacts</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{displayProgress}%</span>
            </div>
            <Progress value={displayProgress} className="w-full" />
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            {totalCount > 0 ? (
              <>
                <div>Batch {displayCurrentBatch} of {displayTotalBatches}</div>
                <div>Processed {processedCount.toLocaleString()} of {totalCount.toLocaleString()} contacts</div>
              </>
            ) : (
              <div>Initializing categorization...</div>
            )}
          </div>

          {isComplete ? (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Categorization Complete!</span>
            </div>
          ) : (
            onStop && (
              <Button
                onClick={onStop}
                variant="outline"
                className="mt-4 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Stop Categorization
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
