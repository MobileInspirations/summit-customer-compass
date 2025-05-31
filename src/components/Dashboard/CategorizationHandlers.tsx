
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { categorizeContacts, CancellationToken } from "@/services/contactCategorizationService";
import type { CategorizationResults } from "@/services/contactCategorizationService";

interface CategorizationHandlersProps {
  setIsCategorizing: (value: boolean) => void;
  setCategorizationProgress: (progress: any) => void;
  setCategorizationResults: (results: CategorizationResults | null) => void;
  setShowResultsDialog: (value: boolean) => void;
  cancellationTokenRef: React.MutableRefObject<CancellationToken | null>;
  resetProgress: () => void;
}

export const useCategorizationHandlers = ({
  setIsCategorizing,
  setCategorizationProgress,
  setCategorizationResults,
  setShowResultsDialog,
  cancellationTokenRef,
  resetProgress
}: CategorizationHandlersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStopCategorization = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.cancel();
      setIsCategorizing(false);
      toast({
        title: "Categorization stopped",
        description: "The categorization process has been cancelled.",
        variant: "default",
      });
    }
  };

  const handleContactLimitCategorization = async (contactLimit?: number) => {
    setIsCategorizing(true);
    resetProgress();

    cancellationTokenRef.current = new CancellationToken();

    try {
      const results = await categorizeContacts(
        undefined,
        (progress) => {
          setCategorizationProgress(progress);
        }, 
        false,
        undefined,
        cancellationTokenRef.current,
        contactLimit
      );
      
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      setCategorizationResults(results);
      setShowResultsDialog(true);
      
      toast({
        title: "Categorization complete",
        description: `Contacts have been automatically categorized into appropriate buckets${contactLimit ? ` (limited to ${contactLimit} contacts)` : ''}.`,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation was cancelled') {
        return;
      }
      console.error('Categorization error:', error);
      toast({
        title: "Categorization failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      cancellationTokenRef.current = null;
      setTimeout(() => {
        resetProgress();
      }, 2000);
    }
  };

  const handleAICategorizeAll = async (contactLimit?: number) => {
    setIsCategorizing(true);
    resetProgress();

    cancellationTokenRef.current = new CancellationToken();

    try {
      const results = await categorizeContacts(
        undefined,
        (progress) => {
          setCategorizationProgress(progress);
        }, 
        true,
        undefined,
        cancellationTokenRef.current,
        contactLimit
      );
      
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      setCategorizationResults(results);
      setShowResultsDialog(true);
      
      toast({
        title: "AI Categorization complete",
        description: `Contacts have been categorized using AI into personality type buckets${contactLimit ? ` (limited to ${contactLimit} contacts)` : ''}.`,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation was cancelled') {
        return;
      }
      console.error('AI Categorization error:', error);
      toast({
        title: "AI Categorization failed",
        description: "Please check your API key configuration in Supabase and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      cancellationTokenRef.current = null;
      setTimeout(() => {
        resetProgress();
      }, 2000);
    }
  };

  return {
    handleStopCategorization,
    handleContactLimitCategorization,
    handleAICategorizeAll
  };
};
