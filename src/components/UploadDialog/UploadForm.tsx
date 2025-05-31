
import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { uploadContacts } from "@/services/contactUploadService";
import { processZipUpload } from "@/services/zipUploadService";
import { UploadProgress } from "@/components/UploadProgress";
import { FileUploadSection } from "./FileUploadSection";
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

  const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('first'));
  const companyIndex = headers.findIndex(h => h.includes('company') || h.includes('organization'));
  const summitHistoryIndex = headers.findIndex(h => h.includes('summit') || h.includes('tag') || h.includes('history'));

  const contacts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const email = values[emailIndex];
    
    if (email && email.includes('@')) {
      // Extract summit history from CSV if available
      let summitHistory: string[] = [];
      if (summitHistoryIndex !== -1 && values[summitHistoryIndex]) {
        // Split by semicolon or comma to support multiple summits
        summitHistory = values[summitHistoryIndex]
          .split(/[;,]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }

      contacts.push({
        email,
        name: nameIndex !== -1 ? values[nameIndex] : '',
        company: companyIndex !== -1 ? values[companyIndex] : '',
        summit_history: summitHistory.length > 0 ? summitHistory.join(';') : undefined
      });
    }
  }
  
  return contacts;
};

interface UploadFormProps {
  onClose: () => void;
  onUploadComplete: () => void;
  bucketCounts: Record<string, number>;
}

export const UploadForm = ({ onClose, onUploadComplete, bucketCounts }: UploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<MainBucketId>('biz-op');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      console.log('Selected bucket:', selectedBucket);
      
      // Check if it's a ZIP file
      if (file.name.endsWith('.zip') || file.type === 'application/zip') {
        console.log('Processing ZIP file...');
        
        // Use ZIP upload service with selected bucket
        await processZipUpload(file, selectedBucket, setProgress);
        
        toast({
          title: "ZIP upload successful",
          description: `All contacts from the ZIP file have been added to the ${selectedBucket} bucket.`,
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
        onUploadComplete();
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

  return (
    <div className="space-y-4">
      <FileUploadSection
        file={file}
        onFileChange={handleFileChange}
        selectedBucket={selectedBucket}
        onBucketChange={setSelectedBucket}
        bucketCounts={bucketCounts}
        uploading={uploading}
      />

      {uploading && <UploadProgress progress={progress} />}

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onClose}
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
  );
};
