
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileSpreadsheet, Check, X } from "lucide-react";

interface ExportProgressProps {
  isVisible: boolean;
  isComplete: boolean;
  isError: boolean;
  contactsProcessed: number;
  totalContacts: number;
  tagsFound: number;
}

export const ExportProgress = ({
  isVisible,
  isComplete,
  isError,
  contactsProcessed,
  totalContacts,
  tagsFound
}: ExportProgressProps) => {
  if (!isVisible) return null;

  const progress = totalContacts > 0 ? (contactsProcessed / totalContacts) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 mx-4">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            {isComplete && !isError ? (
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            ) : isError ? (
              <div className="bg-red-100 p-2 rounded-full">
                <X className="w-6 h-6 text-red-600" />
              </div>
            ) : (
              <div className="bg-blue-100 p-2 rounded-full">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {isComplete && !isError
                  ? "Export Complete"
                  : isError
                  ? "Export Failed"
                  : "Exporting Tags"}
              </h3>
              <p className="text-sm text-gray-600">
                {isComplete && !isError
                  ? `Found ${tagsFound} unique tags`
                  : isError
                  ? "An error occurred during export"
                  : "Processing contacts and extracting tags..."}
              </p>
            </div>
          </div>

          {!isComplete && !isError && (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Contacts Processed</div>
                  <div className="font-semibold">
                    {contactsProcessed.toLocaleString()} / {totalContacts.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Tags Found</div>
                  <div className="font-semibold">{tagsFound.toLocaleString()}</div>
                </div>
              </div>
            </>
          )}

          {(isComplete || isError) && (
            <div className="mt-4 text-center text-sm text-gray-600">
              This dialog will close automatically in a few seconds...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
