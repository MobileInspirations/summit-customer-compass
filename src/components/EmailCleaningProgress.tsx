
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Mail } from "lucide-react";

interface EmailCleaningProgressProps {
  isVisible: boolean;
  isComplete: boolean;
  isError: boolean;
  processed: number;
  total: number;
  validEmails: number;
}

export const EmailCleaningProgress = ({
  isVisible,
  isComplete,
  isError,
  processed,
  total,
  validEmails
}: EmailCleaningProgressProps) => {
  if (!isVisible) return null;

  const progress = total > 0 ? (processed / total) * 100 : 0;
  const invalidEmails = processed - validEmails;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Cleaning in Progress
          </CardTitle>
          <CardDescription>
            Validating email addresses using TrueList.io
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isComplete && !isError && (
            <>
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processed: {processed.toLocaleString()}</span>
                <span>Total: {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Valid: {validEmails.toLocaleString()}
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Invalid: {invalidEmails.toLocaleString()}
                </span>
              </div>
            </>
          )}

          {isComplete && !isError && (
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-green-600 font-medium">Email cleaning completed!</p>
              <div className="text-sm text-gray-600">
                <p>{validEmails.toLocaleString()} valid emails out of {total.toLocaleString()} processed</p>
                <p>Proceeding with export...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="text-center space-y-2">
              <XCircle className="w-12 h-12 text-red-600 mx-auto" />
              <p className="text-red-600 font-medium">Email cleaning failed</p>
              <p className="text-sm text-gray-600">Proceeding with uncleaned data...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
