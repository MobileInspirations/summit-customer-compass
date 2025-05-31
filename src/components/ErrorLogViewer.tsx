
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { errorLogger, type ErrorLog } from "@/services/utils/errorLogger";
import { AlertTriangle, Clock, Info } from "lucide-react";

interface ErrorLogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ErrorLogViewer = ({ open, onOpenChange }: ErrorLogViewerProps) => {
  const [logs] = useState<ErrorLog[]>(() => errorLogger.getLogs());

  const handleClearLogs = () => {
    errorLogger.clearLogs();
    onOpenChange(false);
  };

  const formatError = (error: Error | string): string => {
    if (typeof error === 'string') return error;
    return error.message || 'Unknown error';
  };

  const getOperationBadgeColor = (operation: string) => {
    if (operation.includes('categorization')) return 'destructive';
    if (operation.includes('fetch')) return 'secondary';
    if (operation.includes('export')) return 'outline';
    return 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error & Performance Logs
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {logs.length} recent logs
            </p>
            <Button variant="outline" size="sm" onClick={handleClearLogs}>
              Clear Logs
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {logs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    No error logs found
                  </CardContent>
                </Card>
              ) : (
                logs.map((log, index) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant={getOperationBadgeColor(log.operation)}>
                            {log.operation}
                          </Badge>
                          {log.duration && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.duration}ms
                            </Badge>
                          )}
                        </CardTitle>
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-red-600">Error:</p>
                          <p className="text-sm bg-red-50 p-2 rounded border">
                            {formatError(log.error)}
                          </p>
                        </div>
                        
                        {log.context && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Context:</p>
                            <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
