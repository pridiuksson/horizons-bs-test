import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { removeImage } from '@/lib/storage';
import { addDebugLog } from '@/lib/debug';

/**
 * Hook for handling image removal functionality
 * Manages removal process, error handling, and state updates
 */
export const useImageRemoval = (setImages, setIsLoading) => {
  const { toast } = useToast();

  const handleImageRemoval = useCallback(async (index) => {
    try {
      setIsLoading(true);
      const filePath = `slot-${index + 1}`;

      const { error } = await removeImage(filePath);
      if (error) throw error;

      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = null;
        return newImages;
      });

      toast({
        title: "Success",
        description: "Image removed successfully"
      });
    } catch (error) {
      console.error('Error removing image:', error);
      addDebugLog('Image removal failed', 'error', {
        error: error.message,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: `Failed to remove image: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [setImages, setIsLoading, toast]);

  return handleImageRemoval;
};