
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContactLimitSelector } from "./ContactLimitSelector";

interface AICategorizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorize: (contactLimit?: number) => void;
}

export const AICategorizationDialog = ({ open, onOpenChange, onCategorize }: AICategorizationDialogProps) => {
  const [contactLimit, setContactLimit] = useState(25);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = contactLimit === -1 ? undefined : contactLimit;
    await onCategorize(limit);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Categorization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            AI categorization will use the OpenAI API key stored in Supabase secrets to automatically categorize contacts into personality type buckets.
          </p>
          
          <ContactLimitSelector
            value={contactLimit}
            onChange={setContactLimit}
          />
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Start AI Categorization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
