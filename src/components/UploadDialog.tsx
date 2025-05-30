
import { useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { uploadContacts } from "@/services/contactUploadService";
import { processZipUpload } from "@/services/zipUploadService";
import { FileUploadInput } from "@/components/FileUploadInput";
import { UploadProgress } from "@/components/UploadProgress";
import { BucketSelector } from "@/components/BucketSelector";
import { useBucketCounts } from "@/hooks/useBucketCounts";
import type { MainBucketId } from "@/services/bucketCategorizationService";

// Simple CSV parser function for single file uploads
const parseCSV = (csvContent: string) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const emailIndex = headers.findIndex(h => h.includes('email'));
  
  if (emailIndex === -1) {
    throw new Error("CSV must contain an 'Email' column");
  }

  const contacts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const email = values[emailIndex];
    
    if (email && email.includes('@')) {
      contacts.push({
        email,
        full_name: values[headers.findIndex(h => h.includes('name'))] || '',
        company: values[headers.findIndex(h => h.includes('company'))] || ''
      });
    }
  }
  
  return contacts;
};

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadDialog = ({ open, onOpenChange }: UploadDialogProps) => {
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
        title: "Invalid file type",
        description: "Please select a CSV or ZIP file.",
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
      console.log('Processing file:', file.name, 'Type:', file.type);
      
      // Check if it's a ZIP file
      if (file.name.endsWith('.zip') || file.type === 'application/zip') {
        console.log('Processing ZIP file...');
        
        // Use ZIP upload service
        await processZipUpload(file, setProgress);
        
        toast({
          title: "ZIP upload successful",
          description: "All contacts from the ZIP file have been processed and categorized.",
        });
      } else {
        // Process as CSV file
        console.log('Processing CSV file...');
        const text = await file.text();
        console.log('File content length:', text.length);
        console.log('First 200 characters:', text.substring(0, 200));
        
        const contacts = parseCSV(text);
        
        if (contacts.length === 0) {
          throw new Error("No valid contacts found in CSV file. Please ensure your CSV has an 'Email' column with valid email addresses.");
        }

        setProgress(10);
        
        await uploadContacts(contacts, selectedBucket, setProgress);

        setProgress(100);
        
        toast({
          title: "CSV upload successful",
          description: `${contacts.length} contacts have been processed and added to the ${selectedBucket} bucket.`,
        });
      }
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      setTimeout(() => {
        onOpenChange(false);
        setFile(null);
        setUploading(false);
        setProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      });
      setUploading(false);
      setProgress(0);
    }
  };

  const isZipFile = file && (file.name.endsWith('.zip') || file.type === 'application/zip');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Customer Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file or ZIP file containing customer contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isZipFile ? (
                "ZIP files should be organized by buckets (Biz/Health/Survivalist), summits, and engagement levels (H-/L-/M-/U-)."
              ) : (
                "CSV files should include an 'Email' column. Supported columns: First Name, Email, Contact Tags, Company."
              )}
            </AlertDescription>
          </Alert>

          <FileUploadInput
            file={file}
            onFileChange={handleFileChange}
            disabled={uploading}
            acceptedTypes="both"
          />

          {file && !uploading && !isZipFile && (
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
              onClick={() => onOpenChange(false)}
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
