
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileArchive } from "lucide-react";
import { processZipUpload } from "@/services/zipUploadService";
import { useToast } from "@/components/ui/use-toast";

interface ZipUploadDialogProps {
  onUploadComplete?: () => void;
}

const ZipUploadDialog = ({ onUploadComplete }: ZipUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a ZIP file",
        variant: "destructive"
      });
      event.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);

    try {
      await processZipUpload(selectedFile, setProgress);
      
      toast({
        title: "Upload successful",
        description: "Contacts have been processed and categorized",
      });

      setIsOpen(false);
      setSelectedFile(null);
      setProgress(0);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setProgress(0);
    setIsUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileArchive className="w-4 h-4" />
          Upload ZIP File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Structured ZIP File</DialogTitle>
          <DialogDescription>
            Upload a ZIP file containing contacts organized by buckets (Biz/Health/Survivalist), 
            summits, and engagement levels (H/L/M/U).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="zip-file" className="text-sm font-medium">
              Select ZIP File
            </label>
            <Input
              id="zip-file"
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload & Process
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Expected structure:</strong></p>
          <p>• Main folders: Biz, Health, Survivalist</p>
          <p>• Summit folders inside each main folder</p>
          <p>• CSV files named with engagement prefix (H-, L-, M-, U-)</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZipUploadDialog;
