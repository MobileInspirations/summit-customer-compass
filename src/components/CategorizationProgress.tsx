
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";

interface CategorizationProgressProps {
  isVisible: boolean;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export const CategorizationProgress = ({
  isVisible,
  progress,
  currentBatch,
  totalBatches,
  processedCount,
  totalCount
}: CategorizationProgressProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold">Categorizing Contacts</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div>Batch {currentBatch} of {totalBatches}</div>
            <div>Processed {processedCount.toLocaleString()} of {totalCount.toLocaleString()} contacts</div>
          </div>

          {progress === 100 && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Categorization Complete!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
