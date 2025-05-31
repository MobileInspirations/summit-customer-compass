
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Target } from "lucide-react";

interface CategoryResult {
  categoryName: string;
  count: number;
  percentage: number;
}

interface CategorizationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: {
    totalProcessed: number;
    customerCategories: CategoryResult[];
    personalityCategories: CategoryResult[];
    isAI: boolean;
  } | null;
}

export const CategorizationResultsDialog = ({ 
  open, 
  onOpenChange, 
  results 
}: CategorizationResultsDialogProps) => {
  if (!results) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Categorization Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Summary</h3>
            </div>
            <p className="text-green-700">
              Successfully processed <span className="font-bold">{results.totalProcessed}</span> contacts
              using {results.isAI ? 'AI-powered' : 'rule-based'} categorization.
            </p>
          </div>

          {/* Customer Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Customer Categories</h3>
            </div>
            <div className="space-y-2">
              {results.customerCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{category.categoryName}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{category.count}</span>
                    <span className="text-sm text-gray-500 ml-2">({category.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Personality Type Buckets</h3>
            </div>
            <div className="space-y-2">
              {results.personalityCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{category.categoryName}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">{category.count}</span>
                    <span className="text-sm text-gray-500 ml-2">({category.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
