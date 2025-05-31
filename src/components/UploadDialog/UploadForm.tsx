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

// Enhanced CSV parser function that properly handles comma-separated values within columns
const parseCSV = (csvContent: string) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length <= 1) return [];

  // Parse the header row to identify column positions
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  
  console.log('Detected CSV headers:', headers);
  
  const emailIndex = headers.findIndex(h => h.includes('email'));
  const nameIndex = headers.findIndex(h => h.includes('first name') || h.includes('name'));
  const companyIndex = headers.findIndex(h => h.includes('company') || h.includes('organization'));
  const tagsIndex = headers.findIndex(h => h.includes('contact tags') || h.includes('tags'));

  console.log('Column indices:', { emailIndex, nameIndex, companyIndex, tagsIndex });
  
  if (emailIndex === -1) {
    throw new Error("CSV must contain an 'Email' column");
  }

  const contacts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const email = values[emailIndex]?.trim();
    
    if (email && email.includes('@')) {
      // Extract summit history from Contact Tags column
      let summitHistory: string[] = [];
      if (tagsIndex !== -1 && values[tagsIndex]) {
        // Split the tags by comma and clean them up
        summitHistory = values[tagsIndex]
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        
        console.log(`Contact ${email} tags:`, summitHistory);
      }

      contacts.push({
        email,
        name: nameIndex !== -1 ? values[nameIndex]?.trim() || '' : '',
        company: companyIndex !== -1 ? values[companyIndex]?.trim() || '' : '',
        summit_history: summitHistory
      });
    }
  }
  
  console.log(`Parsed ${contacts.length} contacts with summit history`);
  return contacts;
};

// Helper function to properly parse a CSV line, handling quoted fields
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator found outside quotes
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  // Add the last field
  result.push(current);
  
  return result;
};

interface UploadFormProps {
  onClose: () => void;
  onUploadComplete: () => void;
  bucketCounts: Record<string, number>;
}

export const UploadForm = ({ onClose, onUploadComplete, bucketCounts }: UploadFormProps) => {
  // ... keep existing code (state declarations)
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
        console.log('First 500 characters:', text.substring(0, 500));
        
        const contacts = parseCSV(text);
        
        if (contacts.length === 0) {
          throw new Error("No valid contacts found in CSV file. Please ensure your CSV has an 'Email' column with valid email addresses.");
        }

        console.log('Parsed contacts with summit history sample:', contacts.slice(0, 3).map(c => ({ 
          email: c.email, 
          summitHistoryCount: c.summit_history.length,
          summitHistory: c.summit_history 
        })));

        setProgress(10);
        
        await uploadContacts(contacts, selectedBucket, setProgress);

        setProgress(100);
        
        toast({
          title: "CSV upload successful",
          description: `${contacts.length} contacts have been processed and added to the ${selectedBucket} bucket with their complete tag history.`,
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
