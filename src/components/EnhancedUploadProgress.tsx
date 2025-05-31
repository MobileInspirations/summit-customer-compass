
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface EnhancedUploadProgressProps {
  progress: number;
  phase?: string;
  details?: string;
}

export const EnhancedUploadProgress = ({ 
  progress, 
  phase = "Processing...",
  details 
}: EnhancedUploadProgressProps) => {
  const displayProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">{phase}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{displayProgress}%</span>
        </div>
        <Progress value={displayProgress} className="w-full" />
      </div>
      
      {details && (
        <div className="text-xs text-gray-600">
          {details}
        </div>
      )}
    </div>
  );
};
