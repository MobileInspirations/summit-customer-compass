
import { FileSpreadsheet, FileArchive } from "lucide-react";

interface FileUploadInputProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  acceptedTypes?: 'csv' | 'zip' | 'both';
}

export const FileUploadInput = ({ 
  file, 
  onFileChange, 
  disabled, 
  acceptedTypes = 'csv' 
}: FileUploadInputProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) {
      onFileChange(null);
      return;
    }

    // Check file type based on acceptedTypes prop
    const isValidFile = (() => {
      switch (acceptedTypes) {
        case 'csv':
          return selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv');
        case 'zip':
          return selectedFile.type === "application/zip" || selectedFile.name.endsWith('.zip');
        case 'both':
          return (
            selectedFile.type === "text/csv" || 
            selectedFile.name.endsWith('.csv') ||
            selectedFile.type === "application/zip" || 
            selectedFile.name.endsWith('.zip')
          );
        default:
          return false;
      }
    })();

    if (isValidFile) {
      onFileChange(selectedFile);
    } else {
      onFileChange(null);
    }
  };

  const getAcceptAttribute = () => {
    switch (acceptedTypes) {
      case 'csv':
        return '.csv';
      case 'zip':
        return '.zip';
      case 'both':
        return '.csv,.zip';
      default:
        return '.csv';
    }
  };

  const getDisplayText = () => {
    if (file) return file.name;
    
    switch (acceptedTypes) {
      case 'csv':
        return 'Choose CSV file';
      case 'zip':
        return 'Choose ZIP file';
      case 'both':
        return 'Choose CSV or ZIP file';
      default:
        return 'Choose file';
    }
  };

  const getIcon = () => {
    if (file) {
      return file.name.endsWith('.zip') ? FileArchive : FileSpreadsheet;
    }
    return acceptedTypes === 'zip' ? FileArchive : FileSpreadsheet;
  };

  const IconComponent = getIcon();

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        type="file"
        accept={getAcceptAttribute()}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={disabled}
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center space-y-2"
      >
        <IconComponent className="w-12 h-12 text-gray-400" />
        <span className="text-sm font-medium">
          {getDisplayText()}
        </span>
        <span className="text-xs text-gray-500">
          Maximum file size: 50MB
        </span>
      </label>
    </div>
  );
};
