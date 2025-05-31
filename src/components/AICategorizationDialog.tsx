
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactLimitSelector } from "./ContactLimitSelector";

interface AICategorizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorize: (apiKey: string, contactLimit?: number) => void;
}

export const AICategorizationDialog = ({ open, onOpenChange, onCategorize }: AICategorizationDialogProps) => {
  const [apiKey, setApiKey] = useState("");
  const [contactLimit, setContactLimit] = useState(25);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      const limit = contactLimit === -1 ? undefined : contactLimit;
      await onCategorize(apiKey.trim(), limit);
      setApiKey("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Categorization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              Your API key is used only for this session and is not stored.
            </p>
          </div>
          
          <ContactLimitSelector
            value={contactLimit}
            onChange={setContactLimit}
          />
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!apiKey.trim()}>
              Start AI Categorization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
