
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorLogViewer } from "../ErrorLogViewer";

export const ErrorLogButton = () => {
  const [showErrorLogs, setShowErrorLogs] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowErrorLogs(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Error Logs
        </Button>
      </div>

      <ErrorLogViewer
        open={showErrorLogs}
        onOpenChange={setShowErrorLogs}
      />
    </>
  );
};
