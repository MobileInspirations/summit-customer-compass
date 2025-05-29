
import { useState } from "react";
import { Download, FileText, AlertTriangle, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { exportContactsByCategory } from "@/services/exportService";
import { validateEmailsBatch } from "@/services/emailCleaningService";
import type { Category } from "@/hooks/useCategories";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: Category[];
  onEmailCleaningProgress?: (processed: number, total: number, validEmails: number) => void;
}

export const ExportDialog = ({ 
  open, 
  onOpenChange, 
  selectedCategories,
  onEmailCleaningProgress 
}: ExportDialogProps) => {
  const [exporting, setExporting] = useState(false);
  const [cleanEmails, setCleanEmails] = useState(false);
  const { toast } = useToast();

  const totalContacts = selectedCategories.reduce((sum, cat) => sum + cat.count, 0);
  const totalFiles = selectedCategories.reduce((sum, cat) => sum + Math.ceil(cat.count / 25000), 0);
  const largeCategories = selectedCategories.filter(cat => cat.count > 25000);

  const handleExport = async () => {
    setExporting(true);

    try {
      let totalFilesGenerated = 0;
      
      for (const category of selectedCategories) {
        const filesForCategory = await exportContactsByCategory(
          category.id, 
          category.name, 
          category.count,
          cleanEmails,
          onEmailCleaningProgress
        );
        totalFilesGenerated += filesForCategory;
      }
      
      toast({
        title: "Export completed",
        description: `Successfully generated ${totalFilesGenerated} CSV file(s) with ${totalContacts.toLocaleString()} contacts${cleanEmails ? ' (emails cleaned)' : ''}.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Customer Data</DialogTitle>
          <DialogDescription>
            Download selected categories as CSV files (max 25,000 contacts per file).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Contacts:</span>
              <Badge className="bg-blue-100 text-blue-800">
                {totalContacts.toLocaleString()}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">CSV Files:</span>
              <Badge className="bg-green-100 text-green-800">
                {totalFiles}
              </Badge>
            </div>
          </div>

          {/* Email Cleaning Option */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="cleanEmails"
                checked={cleanEmails}
                onCheckedChange={(checked) => setCleanEmails(checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-2">
                <label htmlFor="cleanEmails" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Clean email addresses before export
                </label>
                <p className="text-xs text-blue-700">
                  Uses TrueList.io to validate and remove invalid email addresses. This may take longer but improves data quality.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Selected Categories */}
          <div>
            <h4 className="font-medium mb-3">Selected Categories</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {category.count.toLocaleString()}
                    </Badge>
                    {category.count > 25000 && (
                      <Badge variant="outline" className="text-xs">
                        {Math.ceil(category.count / 25000)} files
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {largeCategories.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {largeCategories.length} categor{largeCategories.length === 1 ? 'y' : 'ies'} will be split into multiple files due to the 25,000 contact limit per file.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export CSV Files"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
