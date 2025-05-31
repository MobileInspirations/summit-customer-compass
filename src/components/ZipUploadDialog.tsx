
import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { processZipUpload } from "@/services/zipUploadService";
import { UploadProgress } from "@/components/UploadProgress";
import { FileUploadInput } from "@/components/FileUploadInput";
import { BucketSelector } from "@/components/BucketSelector";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import type { MainBucketId } from "@/services/bucketCategorizationService";

interface ZipUploadDialogProps {
  onUploadComplete: () => void;
}

const ZipUploadDialog = ({ onUploadComplete }: ZipUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<MainBucketId>('biz-op');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bucketCounts = {} } = useBucketCounts();

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      toast({
        title: "Invalid file",
        description: "Please select a ZIP file.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFile.name.endsWith('.zip') && selectedFile.type !== 'application/zip') {
      toast({
        title: "Invalid file type",
        description: "Please select a ZIP file.",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      await processZipUpload(file, selectedBucket, setProgress);
      
      toast({
        title: "ZIP upload successful",
        description: `All contacts from the ZIP file have been added to the ${selectedBucket} bucket.`,
      });
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      onUploadComplete();
      
      // Reset state and close dialog
      setTimeout(() => {
        setFile(null);
        setUploading(false);
        setProgress(0);
        setOpen(false);
      }, 1000);

    } catch (error) {
      console.error('ZIP upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      });
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload ZIP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload ZIP File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <FileUploadInput
            file={file}
            onFileChange={handleFileChange}
            disabled={uploading}
            acceptedTypes="zip"
          />

          {file && !uploading && (
            <BucketSelector
              selectedBucket={selectedBucket}
              onBucketChange={(bucket) => setSelectedBucket(bucket as MainBucketId)}
              bucketCounts={bucketCounts}
            />
          )}

          {uploading && <UploadProgress progress={progress} />}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Processing..." : "Upload & Process"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZipUploadDialog;
