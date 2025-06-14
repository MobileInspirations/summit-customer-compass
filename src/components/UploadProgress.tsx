
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  const displayProgress = Math.max(0, Math.min(100, progress));
  
  // Determine phase based on progress
  let phase = "Initializing...";
  if (progress >= 50 && progress < 80) {
    phase = "Uploading contacts...";
  } else if (progress >= 80 && progress < 95) {
    phase = "Categorizing contacts...";
  } else if (progress >= 95) {
    phase = "Finalizing...";
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium">{phase}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{displayProgress}%</span>
        </div>
        <Progress value={displayProgress} className="w-full" />
      </div>
    </div>
  );
};
