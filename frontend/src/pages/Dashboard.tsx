import React, { useState, useEffect } from 'react';
import { ContactUpload } from '../components/ContactUpload';
import { CategorizationProgress } from '../components/CategorizationProgress';
import { ContactsTable } from '../components/ContactsTable';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const handleUploadComplete = () => {
    // Refresh the contacts table
    setShowProgress(false);
  };

  const startCategorization = async () => {
    try {
      const response = await fetch('/api/contacts/categorize/start', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to start categorization');

      const data = await response.json();
      setActiveTaskId(data.task_id);
      setShowProgress(true);
    } catch (error) {
      console.error('Error starting categorization:', error);
      toast.error('Failed to start categorization');
    }
  };

  const handleCategorizationComplete = () => {
    setShowProgress(false);
    setActiveTaskId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Customer Compass Dashboard
          </h1>

          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Contacts</h2>
            <ContactUpload onUploadComplete={handleUploadComplete} />
          </div>

          {/* Categorization Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Categorization</h2>
              <button
                onClick={startCategorization}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={showProgress}
              >
                Start Categorization
              </button>
            </div>
            {showProgress && activeTaskId && (
              <CategorizationProgress
                taskId={activeTaskId}
                onComplete={handleCategorizationComplete}
              />
            )}
          </div>

          {/* Contacts Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Contacts</h2>
            <ContactsTable onRefresh={handleUploadComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}; 