
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FileUploadInput } from "@/components/FileUploadInput";
import { BucketSelector } from "@/components/BucketSelector";
import type { MainBucketId } from "@/services/bucketCategorizationService";

interface FileUploadSectionProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  selectedBucket: MainBucketId;
  onBucketChange: (bucket: MainBucketId) => void;
  bucketCounts: Record<string, number>;
  uploading: boolean;
}

export const FileUploadSection = ({
  file,
  onFileChange,
  selectedBucket,
  onBucketChange,
  bucketCounts,
  uploading
}: FileUploadSectionProps) => {
  const isZipFile = file && (file.name.endsWith('.zip') || file.type === 'application/zip');

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isZipFile ? (
            "ZIP files can contain multiple CSV files organized in folders. All contacts will be added to the selected bucket below."
          ) : (
            "CSV files should include an 'Email' column. Supported columns: First Name, Email, Contact Tags, Company."
          )}
        </AlertDescription>
      </Alert>

      <FileUploadInput
        file={file}
        onFileChange={onFileChange}
        disabled={uploading}
        acceptedTypes="both"
      />

      {file && !uploading && (
        <BucketSelector
          selectedBucket={selectedBucket}
          onBucketChange={(bucket) => onBucketChange(bucket as MainBucketId)}
          bucketCounts={bucketCounts}
        />
      )}
    </div>
  );
};
