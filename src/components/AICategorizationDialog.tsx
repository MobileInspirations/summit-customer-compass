
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Lock } from "lucide-react";

interface AICategorizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorize: (apiKey: string) => void;
}

export const AICategorizationDialog = ({ open, onOpenChange, onCategorize }: AICategorizationDialogProps) => {
  const [apiKey, setApiKey] = useState("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");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    try {
      // Close the dialog immediately when starting
      onOpenChange(false);
      await onCategorize(apiKey.trim());
    } catch (error) {
      console.error('AI categorization error:', error);
      // Reopen dialog if there was an error
      onOpenChange(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset submitting state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Contact Categorization
          </DialogTitle>
          <DialogDescription>
            Use OpenAI to intelligently categorize contacts into personality type buckets based on their tags and summit history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              OpenAI API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Your API key is not stored and only used for this categorization session.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900">What AI Categorization Does:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Analyzes contact tags and summit history semantically</li>
              <li>• Assigns contacts to 10 personality type buckets</li>
              <li>• Uses GPT-4o-mini for intelligent classification</li>
              <li>• Processes contacts in smaller batches for accuracy</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!apiKey.trim() || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Starting AI Categorization..." : "Start AI Categorization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
