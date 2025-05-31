
import { useState } from "react";

export interface ExportProgress {
  contactsProcessed: number;
  totalContacts: number;
  tagsFound: number;
  isComplete: boolean;
  isError: boolean;
}

export interface EmailCleaningProgress {
  processed: number;
  total: number;
  validEmails: number;
  isActive: boolean;
  isComplete: boolean;
  isError: boolean;
}

export const useExportState = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    contactsProcessed: 0,
    totalContacts: 0,
    tagsFound: 0,
    isComplete: false,
    isError: false
  });
  const [emailCleaningProgress, setEmailCleaningProgress] = useState<EmailCleaningProgress>({
    processed: 0,
    total: 0,
    validEmails: 0,
    isActive: false,
    isComplete: false,
    isError: false
  });

  const resetExportProgress = () => {
    setExportProgress({
      contactsProcessed: 0,
      totalContacts: 0,
      tagsFound: 0,
      isComplete: false,
      isError: false
    });
  };

  const handleEmailCleaningProgress = (processed: number, total: number, validEmails: number) => {
    setEmailCleaningProgress({
      processed,
      total,
      validEmails,
      isActive: true,
      isComplete: false,
      isError: false
    });
  };

  return {
    isExporting,
    setIsExporting,
    exportProgress,
    setExportProgress,
    emailCleaningProgress,
    setEmailCleaningProgress,
    resetExportProgress,
    handleEmailCleaningProgress
  };
};
