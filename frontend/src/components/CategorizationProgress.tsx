import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProgressData {
  total_contacts: number;
  processed_contacts: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  start_time: string | null;
  end_time: string | null;
  error: string | null;
}

interface CategorizationProgressProps {
  taskId: string;
  onComplete: () => void;
}

export const CategorizationProgress: React.FC<CategorizationProgressProps> = ({
  taskId,
  onComplete,
}) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/contacts/categorize/status/${taskId}`);
        if (!response.ok) throw new Error('Failed to fetch progress');
        
        const data = await response.json();
        setProgress(data);

        if (data.status === 'completed') {
          toast.success('Categorization completed successfully');
          onComplete();
        } else if (data.status === 'error') {
          toast.error(`Categorization failed: ${data.error}`);
          onComplete();
        } else if (data.status === 'running') {
          // Continue polling
          setTimeout(checkProgress, 1000);
        }
      } catch (error) {
        console.error('Error checking progress:', error);
        toast.error('Failed to check categorization progress');
      }
    };

    checkProgress();
  }, [taskId, onComplete]);

  if (!progress) return null;

  const percentage = progress.total_contacts
    ? Math.round((progress.processed_contacts / progress.total_contacts) * 100)
    : 0;

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Categorization Progress</h3>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>Processed: {progress.processed_contacts} / {progress.total_contacts} contacts</p>
          <p>Status: {progress.status}</p>
          {progress.error && (
            <p className="text-red-500 mt-2">Error: {progress.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}; 