
import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CSVContact {
  email: string;
  name?: string;
  company?: string;
  summit_history?: string;
}

export const UploadDialog = ({ open, onOpenChange }: UploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvText: string): CSVContact[] => {
    console.log('Starting CSV parsing...');
    
    // Split by lines and filter out empty lines
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    console.log(`Found ${lines.length} lines in CSV`);
    
    if (lines.length < 2) {
      console.log('CSV has less than 2 lines');
      return [];
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    console.log('Headers found:', headers);
    
    const contacts: CSVContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      console.log(`Row ${i}:`, values);
      
      const contact: CSVContact = { email: '' };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        // More flexible header matching
        if (header.includes('email') || header.includes('e-mail') || header.includes('mail')) {
          contact.email = value;
        } else if (header.includes('name') || header.includes('full_name') || header.includes('full name') || header.includes('first') || header.includes('last')) {
          contact.name = value;
        } else if (header.includes('company') || header.includes('organization') || header.includes('business')) {
          contact.company = value;
        } else if (header.includes('summit') || header.includes('history') || header.includes('event')) {
          contact.summit_history = value;
        }
      });

      console.log(`Parsed contact:`, contact);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (contact.email && emailRegex.test(contact.email)) {
        contacts.push(contact);
        console.log(`Valid contact added: ${contact.email}`);
      } else {
        console.log(`Skipping invalid contact - email: "${contact.email}"`);
      }
    }

    console.log(`Total valid contacts found: ${contacts.length}`);
    return contacts;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      console.log('Reading file...');
      const text = await file.text();
      console.log('File content length:', text.length);
      console.log('First 200 characters:', text.substring(0, 200));
      
      const contacts = parseCSV(text);
      
      if (contacts.length === 0) {
        throw new Error("No valid contacts found in CSV file. Please ensure your CSV has an 'email' column with valid email addresses.");
      }

      setProgress(20);
      console.log(`Processing ${contacts.length} contacts...`);

      // Process contacts in batches
      const batchSize = 50;
      let processed = 0;
      
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        
        // Prepare data for insertion
        const contactsToInsert = batch.map(contact => ({
          email: contact.email,
          full_name: contact.name || null,
          company: contact.company || null,
          summit_history: contact.summit_history ? contact.summit_history.split(';').filter(Boolean) : []
        }));

        console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}:`, contactsToInsert);

        // Insert batch with upsert to handle duplicates
        const { error } = await supabase
          .from('contacts')
          .upsert(contactsToInsert, { 
            onConflict: 'email',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Error inserting batch:', error);
          throw error;
        }

        processed += batch.length;
        setProgress(20 + (processed / contacts.length) * 70);
      }

      setProgress(100);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
      
      toast({
        title: "Upload successful",
        description: `${contacts.length} contacts have been processed and added to the database.`,
      });
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Customer Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your customer data for automatic categorization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ensure your CSV includes an 'email' column. Optional columns: name, company, summit_history.
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <FileSpreadsheet className="w-12 h-12 text-gray-400" />
              <span className="text-sm font-medium">
                {file ? file.name : "Choose CSV file"}
              </span>
              <span className="text-xs text-gray-500">
                Maximum file size: 50MB
              </span>
            </label>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

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
              {uploading ? "Uploading..." : "Upload & Process"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
