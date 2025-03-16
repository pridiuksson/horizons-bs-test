import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { uploadImage, getImageUrl } from '@/lib/storage';
import { addDebugLog } from '@/lib/debug';

/**
 * Hook for handling image upload functionality
 * Manages upload process, error handling, and state updates
 */
export const useImageUpload = (setImages, setIsLoading) => {
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (index, event) => {
    const file = event.target.files[0];
    
    if (!file) {
      addDebugLog('No file selected for upload', 'warning');
      return;
    }

    if (!file.type.startsWith("image/")) {
      addDebugLog('Invalid file type selected', 'error', { fileType: file.type });
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const filePath = `slot-${index + 1}`;

      // Upload image
      const { error: uploadError } = await uploadImage(filePath, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const { url, error: urlError } = await getImageUrl(filePath);
      if (urlError) throw urlError;

      // Update images state
      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = url;
        return newImages;
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      addDebugLog('Upload process failed', 'error', {
        error: error.message,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [setImages, setIsLoading, toast]);

  return handleImageUpload;
};