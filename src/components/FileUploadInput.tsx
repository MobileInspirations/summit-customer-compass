
import { FileSpreadsheet } from "lucide-react";

interface FileUploadInputProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export const FileUploadInput = ({ file, onFileChange, disabled }: FileUploadInputProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      onFileChange(selectedFile);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={disabled}
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
  );
};
