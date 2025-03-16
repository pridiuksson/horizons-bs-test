import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ImageGrid from "@/components/ImageGrid/ImageGrid";
import DebugConsole from "@/components/Debug/DebugConsole";
import AuthForm from "@/components/AuthForm";
import { useDebug } from "@/contexts/DebugContext";
import { storage } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const App = () => {
  const [images, setImages] = useState(() => {
    const savedImages = storage.get("gridImages", Array(9).fill(null));
    return Array.isArray(savedImages) && savedImages.length === 9 ? savedImages : Array(9).fill(null);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("grid");

  const { toast } = useToast();
  const { addLog } = useDebug();

  // Save images to localStorage whenever they change
  useEffect(() => {
    storage.set("gridImages", images);
  }, [images]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      addLog('Auth state changed', 'info', { event: _event });
    });

    return () => subscription?.unsubscribe();
  }, [addLog]);

  const handleImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Starting image upload for slot ${index + 1}`, 'info');

      // Create a local preview immediately
      const localUrl = URL.createObjectURL(file);
      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = localUrl;
        return newImages;
      });

      // Upload to Supabase if authenticated
      if (session) {
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`slot-${index + 1}`, file, {
            cacheControl: 'max-age=3600',
            upsert: true
          });

        if (error) throw error;

        const { data: urlData } = await supabase.storage
          .from('images')
          .getPublicUrl(`slot-${index + 1}`);

        // Update with Supabase URL
        setImages(prev => {
          const newImages = [...prev];
          newImages[index] = urlData.publicUrl;
          return newImages;
        });
      }

      addLog(`Image uploaded successfully to slot ${index + 1}`, 'success');
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      addLog('Image upload failed', 'error', { error: error.message });
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageRemoval = async (index) => {
    try {
      setIsLoading(true);
      addLog(`Removing image from slot ${index + 1}`, 'info');

      // Remove from Supabase if authenticated
      if (session) {
        const { error } = await supabase.storage
          .from('images')
          .remove([`slot-${index + 1}`]);

        if (error) throw error;
      }

      // Remove from local state
      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = null;
        return newImages;
      });

      addLog(`Image removed successfully from slot ${index + 1}`, 'success');
      toast({
        title: "Success",
        description: "Image removed successfully"
      });
    } catch (error) {
      console.error('Error removing image:', error);
      addLog('Image removal failed', 'error', { error: error.message });
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageInteraction = (index) => {
    if (images[index]) {
      setZoomedImageIndex(index);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <AuthForm onSuccess={({ session }) => setSession(session)} />
          <div className="mt-8">
            <DebugConsole />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-800"
          >
            Nine Picture Grid
          </motion.h1>
          <Button onClick={() => {
            supabase.auth.signOut();
            setSession(null);
          }}>
            Sign Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <ImageGrid
              images={images}
              onUpload={handleImageUpload}
              onRemove={handleImageRemoval}
              onInteraction={handleImageInteraction}
              isLoading={isLoading}
            />

            <AnimatePresence>
              {zoomedImageIndex !== null && images[zoomedImageIndex] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                  onClick={() => setZoomedImageIndex(null)}
                >
                  <motion.img
                    src={images[zoomedImageIndex]}
                    alt={`Zoomed grid item ${zoomedImageIndex + 1}`}
                    className="max-w-[90%] max-h-[90vh] object-contain"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="debug">
            <DebugConsole />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
};

export default App;