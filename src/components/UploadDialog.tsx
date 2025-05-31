
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import { UploadForm } from "./UploadDialog/UploadForm";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

export const UploadDialog = ({ open, onOpenChange, onUploadComplete }: UploadDialogProps) => {
  const { data: bucketCounts = {} } = useBucketCounts();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleUploadComplete = () => {
    if (onUploadComplete) {
      onUploadComplete();
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Customer Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file or ZIP file containing customer contacts.
          </DialogDescription>
        </DialogHeader>

        <UploadForm 
          onClose={handleClose}
          onUploadComplete={handleUploadComplete}
          bucketCounts={bucketCounts}
        />
      </DialogContent>
    </Dialog>
  );
};
