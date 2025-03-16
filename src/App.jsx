import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  supabase, 
  STORAGE_BUCKET, 
  initializeStorage, 
  ensureDefaultUser,
  uploadImageWithPermissions 
} from "@/lib/supabase";

// Global debug state management
let globalDebugLogs = [];
const addGlobalDebugLog = (message, type = 'info', details = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    type,
    details: details ? JSON.stringify(details, null, 2) : null
  };
  
  globalDebugLogs = [logEntry, ...globalDebugLogs].slice(0, 1000);
  console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  
  // Notify any subscribers
  if (window.debugSubscribers) {
    window.debugSubscribers.forEach(callback => callback(globalDebugLogs));
  }
};

// Initialize global debug system
if (typeof window !== 'undefined') {
  window.debugSubscribers = new Set();
  window.addDebugLog = addGlobalDebugLog;
}

// Debug Console Component - Independent of authentication
const DebugConsole = () => {
  const [logs, setLogs] = useState(globalDebugLogs);

  useEffect(() => {
    const updateLogs = (newLogs) => setLogs([...newLogs]);
    window.debugSubscribers.add(updateLogs);
    return () => window.debugSubscribers.delete(updateLogs);
  }, []);

  const clearDebugLogs = () => {
    globalDebugLogs = [];
    window.addDebugLog('Debug logs cleared', 'info');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Debug Information</h2>
        <Button
          variant="outline"
          onClick={clearDebugLogs}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear Logs
        </Button>
      </div>
      <div className="p-4">
        <div className="max-h-[600px] overflow-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg text-sm ${
                log.type === 'error' ? 'bg-red-50 text-red-700' :
                log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                log.type === 'success' ? 'bg-green-50 text-green-700' :
                'bg-blue-50 text-blue-700'
              }`}
            >
              <div className="font-mono text-xs opacity-75 mb-1">
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div className="font-medium mb-1">{log.message}</div>
              {log.details && (
                <pre className="mt-2 p-2 bg-black/5 rounded overflow-x-auto">
                  <code>{log.details}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Application Component
function App() {
  const [images, setImages] = useState(Array(9).fill(null));
  const [description, setDescription] = useState(() => {
    const saved = localStorage.getItem("gridDescription");
    return saved || "";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("grid");

  const { toast } = useToast();

  // Log initial application load
  useEffect(() => {
    window.addDebugLog('Application component mounted', 'info');
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        window.addDebugLog('Application initialization started', 'info');

        // Ensure default user exists and is logged in
        const { user, error: userError } = await ensureDefaultUser(window.addDebugLog);
        
        if (userError) {
          window.addDebugLog('Failed to initialize default user', 'error', {
            error: userError.message,
            fullError: JSON.stringify(userError, Object.getOwnPropertyNames(userError), 2)
          });
          throw userError;
        }

        if (user) {
          window.addDebugLog('Default user authenticated successfully', 'success', {
            userId: user.id,
            email: user.email
          });

          // Initialize storage and load images
          await initializeStorage(window.addDebugLog);
          await loadImages();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        window.addDebugLog('Application initialization failed', 'error', {
          error: error.message,
          stack: error.stack,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        toast({
          title: "Error",
          description: "Failed to initialize application. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const loadImages = async () => {
    try {
      window.addDebugLog('Starting image load process', 'info');
      const newImages = Array(9).fill(null);
      
      const { data: files, error: listError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();

      if (listError) {
        window.addDebugLog('Error listing files in bucket', 'error', {
          error: listError.message,
          fullError: JSON.stringify(listError, Object.getOwnPropertyNames(listError), 2)
        });
        throw listError;
      }

      window.addDebugLog('Retrieved file list from bucket', 'info', {
        fileCount: files?.length || 0
      });

      if (!files || files.length === 0) {
        window.addDebugLog('No images found in bucket - showing empty state', 'info');
        setImages(newImages);
        return;
      }

      for (let i = 0; i < 9; i++) {
        const slotFile = files.find(f => f.name === `slot-${i + 1}`);
        
        if (slotFile) {
          const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`slot-${i + 1}`);
            
          if (error) {
            window.addDebugLog(`Error getting URL for slot ${i + 1}`, 'error', {
              error: error.message,
              fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
            });
            continue;
          }
          
          if (data?.publicUrl) {
            newImages[i] = data.publicUrl;
            window.addDebugLog(`Loaded image for slot ${i + 1}`, 'success');
          }
        }
      }
      
      setImages(newImages);
      window.addDebugLog('Image load process completed', 'success', {
        loadedImages: newImages.filter(Boolean).length
      });
    } catch (error) {
      console.error('Error loading images:', error);
      window.addDebugLog('Image load process failed', 'error', {
        error: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      setImages(Array(9).fill(null));
      toast({
        title: "Error",
        description: "Failed to load images. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (index, event) => {
    const file = event.target.files[0];
    if (!file) {
      window.addDebugLog('No file selected for upload', 'warning');
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.addDebugLog('Invalid file type selected', 'error', {
        fileType: file.type
      });
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      window.addDebugLog('Starting file upload process with permissions', 'info', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        slot: index + 1
      });

      // Use the new uploadImageWithPermissions function
      const { data, error: uploadError } = await uploadImageWithPermissions(
        STORAGE_BUCKET,
        `slot-${index + 1}`,
        file,
        window.addDebugLog
      );

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL after successful upload
      const { data: urlData, error: urlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`slot-${index + 1}`);

      if (urlError) {
        window.addDebugLog('Error getting public URL', 'error', {
          error: urlError.message,
          fullError: JSON.stringify(urlError, Object.getOwnPropertyNames(urlError), 2)
        });
        throw urlError;
      }

      const newImages = [...images];
      newImages[index] = urlData.publicUrl;
      setImages(newImages);

      window.addDebugLog('File upload successful with permissions', 'success', {
        slot: index + 1,
        publicUrl: urlData.publicUrl
      });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      window.addDebugLog('Upload process failed with permissions', 'error', {
        error: error.message,
        name: error.name,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status,
        statusText: error.statusText,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = async (index) => {
    try {
      setIsLoading(true);
      window.addDebugLog(`Removing image from slot ${index + 1}`, 'info');

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([`slot-${index + 1}`]);

      if (error) {
        window.addDebugLog('Error removing image', 'error', {
          error: error.message,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        throw error;
      }

      const newImages = [...images];
      newImages[index] = null;
      setImages(newImages);

      window.addDebugLog('Image removed successfully', 'success', {
        slot: index + 1
      });
      
      toast({
        title: "Success",
        description: "Image removed successfully"
      });
    } catch (error) {
      console.error('Error removing image:', error);
      window.addDebugLog('Image removal failed', 'error', {
        error: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      toast({
        title: "Error",
        description: `Failed to remove image: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageInteraction = (index, event) => {
    event.preventDefault();
    if (event.type === 'mousedown' || event.type === 'touchstart') {
      setZoomedImageIndex(index);
    }
  };

  // Always render the debug tab, even during initialization
  const renderContent = () => {
    if (!isInitialized) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 text-center mb-8"
            >
              Initializing application...
            </motion.div>
            <DebugConsole />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-8 text-gray-800"
          >
            Nine Picture Grid
          </motion.h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="grid" className="flex-1">Grid</TabsTrigger>
              <TabsTrigger value="debug" className="flex-1">Debug</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid" className="mt-6">
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-3 gap-4 mb-8"
                >
                  {images.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white"
                    >
                      {image ? (
                        <div className="relative h-full group">
                          <img
                            src={image}
                            alt={`Grid item ${index + 1}`}
                            className="w-full h-full object-cover cursor-zoom-in"
                            onMouseDown={(e) => handleImageInteraction(index, e)}
                            onTouchStart={(e) => handleImageInteraction(index, e)}
                            draggable="false"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
                          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Add Image</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e)}
                            disabled={isLoading}
                          />
                        </label>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                <AnimatePresence>
                  {zoomedImageIndex !== null && images[zoomedImageIndex] && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 flex items-center justify-center"
                      style={{ zIndex: 50 }}
                      onMouseUp={() => setZoomedImageIndex(null)}
                      onTouchEnd={() => setZoomedImageIndex(null)}
                    >
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${images[zoomedImageIndex]})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add your description here..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="debug" className="mt-6">
              <DebugConsole />
            </TabsContent>
          </Tabs>
        </div>
        <Toaster />
      </div>
    );
  };

  return renderContent();
}

export default App;