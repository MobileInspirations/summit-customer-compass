
import { useState } from "react";

export const useDialogState = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showContactLimitDialog, setShowContactLimitDialog] = useState(false);
  const [showAICategorizationDialog, setShowAICategorizationDialog] = useState(false);

  return {
    showUploadDialog,
    setShowUploadDialog,
    showExportDialog,
    setShowExportDialog,
    showContactLimitDialog,
    setShowContactLimitDialog,
    showAICategorizationDialog,
    setShowAICategorizationDialog
  };
};
