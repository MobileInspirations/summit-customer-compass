
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [contactsPerSecond, setContactsPerSecond] = useState<number>(0);

  useEffect(() => {
    if (isVisible && !startTime && processedCount > 0) {
      setStartTime(Date.now());
    }
  }, [isVisible, processedCount, startTime]);

  useEffect(() => {
    if (startTime && processedCount > 0) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsedSeconds;
      setContactsPerSecond(Math.round(rate));
    }
  }, [processedCount, startTime]);

  if (!isVisible) return null;

  const displayProgress = Math.max(0, Math.min(100, progress));
  const displayCurrentBatch = Math.max(1, currentBatch);
  const displayTotalBatches = Math.max(1, totalBatches);
  const isComplete = displayProgress === 100;
  const isFastEnough = contactsPerSecond >= 50;

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

          <div className="space-y-2 text-sm">
            {totalCount > 0 ? (
              <>
                <div className="text-gray-600">Batch {displayCurrentBatch} of {displayTotalBatches}</div>
                <div className="font-semibold text-lg text-blue-600">
                  {processedCount.toLocaleString()} / {totalCount.toLocaleString()} contacts
                </div>
                {processedCount > 0 && (
                  <div className={`font-medium ${isFastEnough ? 'text-green-600' : 'text-orange-600'}`}>
                    {contactsPerSecond} contacts/second
                    {contactsPerSecond < 50 && (
                      <span className="text-red-500 block text-xs">
                        (Below 50/sec minimum)
                      </span>
                    )}
                    {contactsPerSecond >= 50 && (
                      <span className="text-green-500 block text-xs">
                        ✓ Meeting speed requirements
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>Initializing categorization...</div>
            )}
          </div>

          {isComplete ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Categorization Complete!</span>
              </div>
              {processedCount > 0 && (
                <div className="text-sm text-gray-600">
                  Final rate: {contactsPerSecond} contacts/second
                </div>
              )}
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
