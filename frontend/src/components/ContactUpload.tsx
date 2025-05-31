import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface ContactUploadProps {
  onUploadComplete: () => void;
}

export const ContactUpload: React.FC<ContactUploadProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast.success(data.message);
      onUploadComplete();
    } catch (error) {
      toast.error('Failed to upload contacts');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-2">
              {isDragActive
                ? 'Drop the CSV file here'
                : 'Drag and drop a CSV file here, or click to select'}
            </p>
            <p className="text-sm text-gray-500">
              Only CSV files are accepted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 